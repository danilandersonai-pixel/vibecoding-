import { interpolate, useCurrentFrame } from 'remotion'
import { Agent } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, KeyGlyph, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { BAR, EDITOR_PAD, LH } from '../../kit/screens/layout'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bell } from './parts'

const ID = 's4-audit'
const L1 = S4.layer1
const L2 = S4.layer2
const T = S4.tools
const Q = S4.questions
const ED = S4.editor
const EV = S4.env
const PR = S4.prompt
const RP = S4.report

const KEY = 'sk-live-4f9a2c'
// автоматический слой: четыре вида проверок (рис. 8.5)
const TOOLS = [
  { name: 'SAST', lines: ['читает код,', 'не запуская'] },
  { name: 'SCA', lines: ['проверяет', 'библиотеки'] },
  { name: 'Секреты', lines: ['не пускают', 'ключи в проект'] },
  { name: 'DAST', lines: ['атакует', 'тестовый сайт'] },
]
const QUESTIONS = ['Откуда данные?', 'Кто может вызвать?', 'Что сделает взломщик?']
// запрос ИИ-аудитору своими словами
const PROMPT = ['Проверь безопасность напоминаний как пентестер.', 'По каждой находке: где, как атакуют,', 'насколько опасно и как чинить.', 'Код не трогай — только отчёт.', 'Отдельно напиши, в чём не уверен.']
const SEVERITY = [
  { text: 'высокое', color: theme.risk },
  { text: 'среднее', color: theme.alt },
  { text: 'низкое', color: theme.soft },
]

/** Строка терминала, которая появляется на кадре at (до него — пустая, высота окна не меняется). */
const at = (frame: number, from: number, line: TermLine): TermLine => (frame >= from ? line : { text: '', kind: 'out' })

// Сцена 4: аудит в два слоя. Автоматика в CI (SAST, SCA, секреты, DAST); Дима коммитит файл с ключом —
// сканер секретов останавливает коммит, ключ уходит в .env. Человек задаёт вопросы о логике и правах;
// ИИ-аудитор пишет отчёт, ничего не меняя.
export function S4Audit() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: два слоя
  const layer1 = appear(frame, b(0))
  const toolAt = TOOLS.map((_, i) => b(0) + 36 + i * 18)
  const layer2 = appear(frame, b(0) + 100)

  // доска 2: коммит с ключом, сканер, .env
  const editAt = b(1) + 22
  const termAt = b(1) + 56
  const blocked = frame >= b(2) + 16
  const scanner = appear(frame, b(2) + 8)
  const ring = frame >= b(2) + 16 && frame < b(3) + 20 ? (frame - b(2) - 16) / 70 : 0
  const fixed = frame >= b(3) + 44
  const envIn = appear(frame, b(3))
  // ключ уходит из строки вправо и вниз, в обход текста, к карточке .env
  const keyPos = trackAt(frame, [
    [b(3) + 8, ED.x + ED.w - 40, ED.y + BAR + EDITOR_PAD + LH * 1.5],
    [b(3) + 26, ED.x + ED.w - 40, EV.y - 14],
    [b(3) + 44, EV.x + EV.w - 50, EV.y + 76],
  ])
  const keyOn = frame >= b(3) + 8 && frame < b(3) + 46
  const ignore = appear(frame, b(3) + 84)
  const termLines: TermLine[] = [
    { text: 'git commit -m "Напоминания"', kind: 'cmd' },
    at(frame, b(2) + 16, { text: 'ОСТАНОВЛЕНО: найден секрет', kind: 'err' }),
    at(frame, b(2) + 34, { text: 'src/reminders.ts:2 — ключ API', kind: 'out' }),
    at(frame, b(2) + 50, { text: 'Вынесите ключ в .env', kind: 'out' }),
    at(frame, b(3) + 100, { text: '$ git commit -m "Напоминания"', kind: 'out' }),
    at(frame, b(3) + 116, { text: 'Сохранено. Секретов нет', kind: 'ok' }),
  ]
  const badLine = interpolate(frame, [b(2) + 30, b(2) + 40, b(3) + 40, b(3) + 46], [0, 1, 1, 0], CLAMP)

  // доска 1, второй слой: вопрос Марины и вопросы к правке
  const example = appear(frame, b(4) + 26)
  const qAt = QUESTIONS.map((_, i) => b(4) + 60 + i * 14)
  const more = appear(frame, b(4) + 108)

  // поверх: запрос ИИ-аудитору и отчёт
  const overlay = appear(frame, b(5) + 24)
  const promptAt = b(5) + 36
  const report = appear(frame, b(5) + 126)

  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 40, ['point', 'happy']],
    [b(2) + 18, ['surprised', 'worried']],
    [b(3) + 10, ['think', 'neutral']],
    [b(3) + 118, ['cheer', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 26, ['think', 'worried']],
    [b(4) + 60, ['point', 'neutral']],
  ])

  return (
    <KitScene
      chip="4 / 7 · Аудит и сканер секретов"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        overlay > 0 ? (
          <g opacity={overlay}>
            <rect x={0} y={0} width={1280} height={720} fill={theme.ink} opacity={0.62} />
            <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} fill={theme.paper} stroke={theme.accent}>
              <Label x={PR.x + 150} y={PR.y + 46} anchor="start" size={26} weight={700} color={theme.accent}>
                Запрос ИИ-аудитору
              </Label>
              {PROMPT.map((line, i) => (
                <text key={line} x={PR.x + 150} y={PR.y + 96 + i * 40} fill={theme.ink} style={{ font: `500 23px ${theme.font}` }}>
                  {typed(line, frame, promptAt + i * 16, 60)}
                </text>
              ))}
            </Card>
            <Agent x={PR.x + 76} y={PR.y + 150} scale={0.7} pose={frame >= promptAt + 90 ? 'working' : 'idle'} />
            <g opacity={report}>
              <Card x={RP.x} y={RP.y} w={RP.w} h={RP.h} fill={theme.paper} stroke={theme.ok}>
                <Label x={RP.x + 28} y={RP.y + 44} anchor="start" size={24} weight={700}>
                  Отчёт: три находки
                </Label>
                {SEVERITY.map((s, i) => (
                  <Pill key={s.text} x={RP.x + 80 + i * 130} y={RP.y + 86} w={116} text={s.text} color={s.color} fill={theme.paper} compact />
                ))}
                <Label x={RP.x + RP.w - 28} y={RP.y + 72} anchor="end" size={22} weight={600} color={theme.soft}>
                  находки — повод проверить,
                </Label>
                <Label x={RP.x + RP.w - 28} y={RP.y + 100} anchor="end" size={22} weight={600} color={theme.soft}>
                  а не приговор
                </Label>
              </Card>
            </g>
          </g>
        ) : undefined
      }
    >
      {/* доска 1: слой 1 — автоматика */}
      <g opacity={layer1}>
        <Card x={L1.x} y={L1.y} w={L1.w} h={L1.h} fill={theme.accentTint} stroke={theme.accent} />
        <Label x={L1.x + 24} y={L1.y + 36} anchor="start" size={22} weight={700} color={theme.accent}>
          Слой 1 · автоматика в CI — при каждом изменении
        </Label>
      </g>
      {TOOLS.map((tool, i) => {
        const x = T.x + i * (T.w + T.gap)
        const a = appear(frame, toolAt[i], 10)
        return (
          <g key={tool.name} opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
            <Card x={x} y={T.y} w={T.w} h={T.h} />
            <text x={x + 20} y={T.y + 44} fill={theme.accent} style={{ font: `700 26px ${theme.mono}` }}>
              {tool.name}
            </text>
            {tool.lines.map((line, j) => (
              <Label key={line} x={x + 20} y={T.y + 86 + j * 30} anchor="start" size={21} weight={500}>
                {line}
              </Label>
            ))}
          </g>
        )
      })}

      {/* доска 1: слой 2 — человек */}
      <g opacity={layer2}>
        <Card x={L2.x} y={L2.y} w={L2.w} h={L2.h} fill={theme.okTint} stroke={theme.ok} />
        <Label x={L2.x + 24} y={L2.y + 36} anchor="start" size={22} weight={700} color={theme.ok}>
          Слой 2 · человек: смысл, логика и права доступа
        </Label>
      </g>
      {frame >= b(4) && <Coach x={S4.marina.x} y={S4.marina.y} scale={0.75} label="Марина" enterAt={b(4)} pose={marina[0]} mood={marina[1]} />}
      <g opacity={example}>
        <Callout x={S4.example.x} y={L2.y + 68} tx={S4.marina.x + 30} ty={S4.marina.y - 60} text="Видит ли Дима моих подопечных?" color={theme.accent} />
      </g>
      {QUESTIONS.map((q, i) => {
        const x = Q.x + i * (Q.w + Q.gap)
        return (
          <g key={q} opacity={appear(frame, qAt[i], 10)}>
            <rect x={x} y={L2.y + 104} width={Q.w} height={Q.h - 8} rx={10} fill={theme.paper} stroke={theme.ok} strokeWidth={3} />
            <Label x={x + Q.w / 2} y={L2.y + 104 + (Q.h - 8) / 2 + 8} size={21} weight={700}>
              {q}
            </Label>
          </g>
        )
      })}
      <g opacity={more}>
        <Label x={Q.x} y={S4.more.y} anchor="start" size={20} weight={500} color={theme.soft}>
          плюс: пароли в журналах? лишние права? правки сверх задачи?
        </Label>
      </g>

      {/* доска 2: файл с ключом */}
      {frame >= editAt && <Editor x={ED.x} y={ED.y} w={ED.w} at={editAt} file="src/reminders.ts" lines={["import { send } from './mail'", fixed ? 'const KEY = process.env.MAIL_KEY' : `const KEY = '${KEY}'`, "send(KEY, 'Тренировка завтра')"]} highlight={[2]} />}
      <rect x={ED.x + 3} y={ED.y + BAR + EDITOR_PAD + LH} width={ED.w - 6} height={LH} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} opacity={badLine} />
      {keyOn && <KeyGlyph x={keyPos.x} y={keyPos.y} color={theme.alt} scale={1.4} />}
      <g opacity={envIn}>
        <Card x={EV.x} y={EV.y} w={EV.w} h={EV.h} stroke={theme.ok}>
          <Label x={EV.x + 20} y={EV.y + 36} anchor="start" size={21} weight={700}>
            .env — вне репозитория
          </Label>
          <text x={EV.x + 50} y={EV.y + 82} fill={theme.alt} style={{ font: `600 21px ${theme.mono}` }}>
            {typed(`MAIL_KEY=${KEY}`, frame, b(3) + 48, 40)}
          </text>
        </Card>
      </g>
      <g opacity={ignore}>
        <Pill x={EV.x + EV.w / 2} y={EV.y + EV.h - 30} text="в .gitignore — не в истории" color={theme.ok} fill={theme.okTint} compact />
      </g>
      {frame >= termAt && <Terminal x={S4.term.x} y={S4.term.y} w={S4.term.w} at={termAt} lines={termLines} />}
      <g opacity={scanner}>
        <Pill x={S4.scanner.x + 40} y={S4.scanner.y} text="сканер секретов · gitleaks" color={blocked && !fixed ? theme.risk : theme.ok} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={scanner}>
        <Bell x={S4.bell.x} y={S4.bell.y} ring={ring} scale={0.9} />
      </g>
      {frame >= b(1) && <Coach x={S4.dima.x} y={S4.dima.y} scale={0.75} color={theme.alt} label="Дима" enterAt={b(1) + 24} pose={dima[0]} mood={dima[1]} />}
    </KitScene>
  )
}
