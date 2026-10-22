import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Pill } from '../../kit/props'
import { revealCount, stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S3, SIMPLE_H } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { ClientList } from './parts'

const ID = 's3-prompt'
const PR = S3.prompt
const R = S3.reply
const BR = S3.browser
const SI = S3.simple

const FONT = 20
const CHAR = FONT * 0.6 // моноширинный знак
const CPS = 45 // скорость набора запроса, знаков в секунду

// Запрос по шаблону книги; {…} — подставленное своё, <…> — честные упрощения прототипа.
// Группы строк набираются со своей репликой.
const PROMPT: { line: string; group: number }[] = [
  { line: 'Сделай прототип веб-приложения для', group: 0 },
  { line: '{тренера}, чтобы проверить: {видно ли,', group: 0 },
  { line: '{кто из подопечных пропал}.', group: 0 },
  { line: 'Главный сценарий: {открыть список,', group: 0 },
  { line: '{найти пропавшего, увидеть тренировки}.', group: 0 },
  { line: 'Это прототип: <данные в памяти>, <вход', group: 1 },
  { line: '<не нужен>, <вид простой>, но аккуратный.', group: 1 },
  { line: 'Стек: {выбери сам и объясни выбор}.', group: 2 },
  { line: 'В конце перечисли упрощения, которые', group: 3 },
  { line: 'придётся убрать перед запуском.', group: 3 },
]

type Seg = { text: string; kind: 'plain' | 'own' | 'simple' }

// Разбор строки на куски: обычный текст, своё (в фигурных скобках) и упрощения (в угловых).
function segments(line: string): Seg[] {
  const out: Seg[] = []
  let kind: Seg['kind'] = 'plain'
  let text = ''
  for (const ch of line) {
    const next = ch === '{' ? 'own' : ch === '<' ? 'simple' : ch === '}' || ch === '>' ? 'plain' : null
    if (next === null) {
      text += ch
      continue
    }
    if (text !== '') out.push({ text, kind })
    text = ''
    kind = next
  }
  if (text !== '') out.push({ text, kind })
  return out
}

// упрощения прототипа → что понадобится перед продакшеном
const SIMPLE = [
  { now: 'данные в памяти', then: 'настоящая база' },
  { now: 'входа нет', then: 'вход и права' },
  { now: 'подопечные выдуманы', then: 'защита данных' },
  { now: 'тестов нет', then: 'тесты' },
]

// Сцена 3: запрос на вечер по шаблону — для кого, что проверяем, главный сценарий; честная пометка
// «это прототип»; стек на выбор агента; последняя строка — список упрощений, он же план работ.
export function S3Prompt() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // кадр, с которого набирается каждая строка: группа стартует со своей репликой
  const groupAt = [b(0) + 12, b(1) + 10, b(2) + 10, b(3) + 10]
  const lineAt: number[] = []
  PROMPT.forEach((p, i) => {
    const prev = PROMPT[i - 1]
    lineAt.push(prev && prev.group === p.group ? lineAt[i - 1] + Math.ceil((prev.line.length * 30) / CPS) + 4 : groupAt[p.group])
  })
  const started = lineAt.filter((at) => frame >= at).length
  const cardH = 70 + Math.max(5, started) * PR.row + 16
  // упрощения подсвечиваются по одному, когда о них говорит реплика: «в памяти», «вход не нужен», «вид простой»
  const simpleAt = [b(1) + 60, b(1) + 96, b(1) + 96, b(1) + 126]
  const lastOn = appear(frame, b(3) + 34)
  const useful = appear(frame, b(3) + 40)

  // агент читает запрос и отвечает про стек
  const toAgent = interpolate(frame, [b(1) + 30, b(1) + 46], [0, 1], CLAMP)
  const reply = appear(frame, b(2) + 56)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 40, 'working'],
    [b(2) + 50, 'done'],
    [b(2) + 120, 'idle'],
    [b(3) + 20, 'working'],
  ])

  // доска 2: что собрал агент и список упрощений → план работ
  const pageAt = b(3) + 76
  const listShown = revealCount(frame, pageAt + 16, 6, 5)
  const simple = appear(frame, b(3) + 92)
  const rowAt = SIMPLE.map((_, i) => b(3) + 104 + i * 10)
  const toPlan = interpolate(frame, [b(4) + 24, b(4) + 36], [0, 1], CLAMP)
  const ifDevelop = appear(frame, b(4) + 60)

  return (
    <KitScene chip="3 / 7 · Запрос на вечер" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* запрос по шаблону */}
      <Card x={PR.x} y={PR.y} w={PR.w} h={cardH} stroke={theme.accent}>
        <Label x={PR.x + 24} y={PR.y + 40} anchor="start" size={24} weight={700} color={theme.accent}>
          Запрос
        </Label>
      </Card>
      {PROMPT.map((p, i) => {
        if (frame < lineAt[i]) return null
        // номер первого упрощения в этой строке
        const firstSimple = PROMPT.slice(0, i).reduce((n, q) => n + segments(q.line).filter((s) => s.kind === 'simple').length, 0)
        let simpleN = firstSimple
        let left = Math.floor(((frame - lineAt[i]) * CPS) / 30)
        let col = 0
        const y = PR.y + 76 + i * PR.row
        const tail = p.group === 3 ? lastOn : 0
        return (
          <g key={i}>
            {tail > 0 && <rect x={PR.x + 14} y={y - 24} width={PR.w - 28} height={PR.row} fill={theme.altTint} opacity={tail} />}
            {segments(p.line).map((s, j) => {
              const idx = s.kind === 'simple' ? simpleN++ : -1
              const shown = s.text.slice(0, Math.max(0, left))
              left -= s.text.length
              const x = PR.x + 24 + col * CHAR
              col += s.text.length
              if (shown === '') return null
              const back = s.kind === 'own' ? theme.accentTint : s.kind === 'simple' ? theme.okTint : null
              const simpleOn = idx >= 0 ? appear(frame, simpleAt[idx]) : 0
              const backOn = s.kind === 'simple' ? simpleOn : 1
              return (
                <g key={j}>
                  {back && <rect x={x - 2} y={y - 21} width={shown.length * CHAR + 4} height={28} rx={5} fill={back} opacity={backOn} />}
                  <text x={x} y={y} fill={s.kind === 'own' ? theme.accent : s.kind === 'simple' && simpleOn > 0.5 ? theme.ok : theme.ink} style={{ font: `500 ${FONT}px ${theme.mono}`, whiteSpace: 'pre' }}>
                    {shown}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
      <g opacity={useful}>
        <Arrow x1={PR.x + PR.w + 110} y1={PR.y + 76 + 8.5 * PR.row} x2={PR.x + PR.w + 8} y2={PR.y + 76 + 8.5 * PR.row} color={theme.alt} />
        <Pill x={PR.x + PR.w + 200} y={PR.y + 76 + 8.5 * PR.row} text="самая полезная" color={theme.alt} fill={theme.paper} size={20} compact />
      </g>

      {/* агент читает запрос; ответ про стек */}
      <Arrow x1={PR.x + PR.w + 14} y1={250} x2={S3.agent.x - 80} y2={S3.agent.y - 60} color={theme.accent} draw={toAgent} />
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.8} enterAt={b(1) + 10} pose={agent} />
      <g opacity={reply}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent}>
          <Label x={R.x + 22} y={R.y + 32} anchor="start" size={18} weight={600} color={theme.soft}>
            Ответ агента
          </Label>
          <Label x={R.x + 22} y={R.y + 70} anchor="start" size={24} weight={700}>
            Стек выбрал сам. Почему:
          </Label>
          {[0, 1].map((i) => (
            <rect key={i} x={R.x + 22} y={R.y + 92 + i * 24} width={(R.w - 44) * appear(frame, b(2) + 70 + i * 10, 14) - i * 110} height={12} rx={6} fill={theme.grid} />
          ))}
        </Card>
      </g>

      {/* доска 2: прототип и упрощения */}
      {frame >= pageAt && (
        <Browser x={BR.x} y={BR.y} w={BR.w} h={BR.h} at={pageAt} url="прототип">
          <ClientList w={BR.w} shown={listShown} />
        </Browser>
      )}
      <g opacity={simple}>
        <Card x={SI.x} y={SI.y} w={SI.w} h={SIMPLE_H} stroke={toPlan > 0.5 ? theme.accent : theme.alt}>
          <g opacity={1 - toPlan}>
            <Label x={SI.x + 24} y={SI.y + 44} anchor="start" size={26} weight={700} color={theme.alt}>
              Упрощения прототипа
            </Label>
          </g>
          <g opacity={toPlan}>
            <Label x={SI.x + 24} y={SI.y + 44} anchor="start" size={26} weight={700} color={theme.accent}>
              План работ
            </Label>
          </g>
        </Card>
      </g>
      {SIMPLE.map((s, i) => {
        const y = SI.y + 70 + i * SI.row
        const box = appear(frame, b(4) + 40 + i * 8)
        return (
          <g key={s.now} opacity={appear(frame, rowAt[i], 8)}>
            <line x1={SI.x + 16} y1={y} x2={SI.x + SI.w - 16} y2={y} stroke={theme.grid} strokeWidth={2} />
            <g opacity={box}>
              <rect x={SI.x + 20} y={y + 18} width={26} height={26} rx={6} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
            </g>
            <Label x={SI.x + 60} y={y + 39} anchor="start" size={20} weight={500} color={theme.soft}>
              {s.now}
            </Label>
            <Label x={SI.x + 340} y={y + 39} size={22} weight={700} color={theme.line}>
              →
            </Label>
            <Label x={SI.x + 370} y={y + 39} anchor="start" size={22} weight={700} color={theme.accent}>
              {s.then}
            </Label>
          </g>
        )
      })}
      <g opacity={ifDevelop}>
        <Pill x={SI.x + SI.w - 130} y={SI.y + SIMPLE_H + 40} text="если решат развивать" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
    </KitScene>
  )
}
