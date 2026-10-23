import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { ChoreIcon, Cursor, type ChoreGlyph } from './parts'

const ID = 's2-tests'
const L = S2.line
const R = S2.req
const T = S2.tests
const K = S2.code
const W = S2.browser
const RS = S2.results

// рутина сопровождения — по слову реплики
const CHORES: { text: string; glyph: ChoreGlyph }[] = [
  { text: 'обновления', glyph: 'update' },
  { text: 'перенос данных', glyph: 'move' },
  { text: 'журналы', glyph: 'logs' },
]
// требования Марины до и после правки (для планки считают секунды)
const REQ1 = ['Подход без повторов', 'не сохранять']
const REQ1B = ['Подход без повторов', 'и без секунд не сохранять']
const REQ2 = ['Вес меньше нуля —', 'ошибка']

// Сцена 2: сопровождение — самая долгая часть жизни программы, рутина — агенту. Тест из требования
// пишется до кода и меняется вместе с требованием. Самовосстанавливающийся сквозной тест (новый вид
// тестов, а не любой сквозной) переживает новую вёрстку, но поднимает тревогу, когда кнопка не сохраняет.
export function S2Tests() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: шкала жизни программы
  const dev = appear(frame, b(0) + 6)
  const flag = appear(frame, b(0) + 24)
  const grow = interpolate(frame, [b(0) + 34, b(0) + 100], [0, 1], CLAMP)
  const longest = appear(frame, b(0) + 110)
  const versions = ['1.1', '1.2', '1.3', '1.4'].map((v, i) => ({ v, x: L.release + 180 + i * 200, at: b(0) + 50 + i * 16 }))
  const choreAt = [b(1) + 24, b(1) + 56, b(1) + 92]
  const doneAt = [b(1) + 130, b(1) + 146, b(1) + 162]
  const bot = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 112, 'working'],
    [b(1) + 166, 'done'],
  ])

  // доска 2: требование → тест до кода → код → зелёные тесты; правка требования → правка теста
  const req = appear(frame, b(2) + 20)
  const changed = frame >= b(3) + 30
  const reqLines = changed ? [REQ1B[0], typed(REQ1B[1], frame, b(3) + 30, 40)] : REQ1.map((l, i) => typed(l, frame, b(2) + 30 + i * 22, 36))
  const req2 = appear(frame, b(2) + 70)
  const toBot = appear(frame, b(2) + 80, 12)
  const tests = appear(frame, b(2) + 96)
  const codeIn = appear(frame, b(2) + 140)
  const green = [frame >= b(2) + 160, frame >= b(2) + 172]
  const toTests = appear(frame, b(2) + 92, 10)
  const order = appear(frame, b(2) + 150)
  // пузырь и подсветка гаснут до окна горячей точки: в окне схема неподвижна
  const ask = appear(frame, b(3) + 4) * (1 - appear(frame, b(3) + 76))
  const hl = appear(frame, b(3) + 26) * (1 - appear(frame, b(3) + 76))
  const t1 = frame >= b(3) + 60 ? typed('без повторов и секунд → отказ', frame, b(3) + 60, 50) : 'без повторов → отказ'
  const t3 = appear(frame, b(3) + 74)
  const loop = appear(frame, b(3) + 40, 16)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(2) + 84, 'working'],
    [b(2) + 120, 'idle'],
    [b(3) + 34, 'working'],
    [b(3) + 76, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 24, ['point', 'neutral']],
    [b(2) + 170, ['stand', 'happy']],
    [b(3), ['point', 'neutral']],
    [b(3) + 84, ['stand', 'happy']],
  ])

  // доска 3: самовосстанавливающийся тест жмёт кнопку; вёрстка меняется — тест находит кнопку; кнопка ломается — тревога
  const relayout = interpolate(frame, [b(4) + 70, b(4) + 86], [0, 1], CLAMP)
  const btn = { x: 40, y: 300 + 30 * relayout, w: 280 + 340 * relayout, h: 52 }
  const cur = trackAt(frame, [
    [b(4) + 20, W.w - 60, 120],
    [b(4) + 50, 300, 322],
    [b(4) + 90, 300, 322],
    [b(4) + 110, 610, 352],
    [b(4) + 150, 610, 352],
    [b(4) + 158, 600, 348],
  ])
  const clicks = [b(4) + 52, b(4) + 112, b(4) + 160]
  const ripple = clicks.map((c) => (frame >= c && frame < c + 16 ? (frame - c) / 16 : 0)).find((r) => r > 0) ?? 0
  const saved = frame >= b(4) + 56 && frame < b(4) + 70 ? 1 : frame >= b(4) + 116 && frame < b(4) + 152 ? 1 : 0
  const broken = frame >= b(4) + 150
  const res1 = appear(frame, b(4) + 124)
  const res2 = appear(frame, b(4) + 172)
  const newLayout = appear(frame, b(4) + 72) * (1 - appear(frame, b(4) + 150))

  return (
    <KitScene chip="2 / 7 · ИИ в тестах и сопровождении" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* шкала: разработка → выпуск → сопровождение */}
      <g opacity={dev}>
        <line x1={L.x0} y1={L.y} x2={L.release} y2={L.y} stroke={theme.line} strokeWidth={14} strokeLinecap="round" />
        <Label x={(L.x0 + L.release) / 2} y={L.y + 50} size={20} color={theme.soft}>
          разработка
        </Label>
      </g>
      <line x1={L.release} y1={L.y} x2={L.release + (L.x1 - L.release) * grow} y2={L.y} stroke={theme.accent} strokeWidth={14} strokeLinecap="round" opacity={grow > 0 ? 1 : 0} />
      <g opacity={flag}>
        <line x1={L.release} y1={L.y} x2={L.release} y2={L.y - 92} stroke={theme.ink} strokeWidth={4} />
        <path d={`M${L.release} ${L.y - 92} l44 14 l-44 14 Z`} fill={theme.ok} />
        <Label x={L.release - 10} y={L.y - 62} anchor="end" size={22} weight={700}>
          выпуск
        </Label>
      </g>
      {versions.map((v) => (
        <g key={v.v} opacity={appear(frame, v.at, 8)}>
          <circle cx={v.x} cy={L.y} r={12} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
          <Label x={v.x} y={L.y - 24} size={18} color={theme.accent} weight={700}>
            {v.v}
          </Label>
        </g>
      ))}
      <g opacity={grow}>
        <Label x={(L.release + L.x1) / 2 + 40} y={L.y + 50} size={22} color={theme.accent} weight={700}>
          сопровождение
        </Label>
      </g>
      <g opacity={longest}>
        <Pill x={(L.release + L.x1) / 2 + 40} y={L.y - 76} w={300} text="самая долгая часть" color={theme.accent} fill={theme.accentTint} />
      </g>

      {/* рутина — работа для агента */}
      {CHORES.map((c, i) => {
        const x = S2.chores.x + i * (S2.chores.w + S2.chores.gap)
        const a = appear(frame, choreAt[i])
        const done = frame >= doneAt[i]
        const y = S2.chores.y
        return (
          <g key={c.text}>
            {/* место будущей карточки — пунктиром, пока о рутине не сказали */}
            <rect x={x} y={y} width={S2.chores.w} height={S2.chores.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(0) + 20) * (1 - a)} />
            <g opacity={a} transform={`translate(0 ${(1 - a) * 16})`}>
              <Card x={x} y={y} w={S2.chores.w} h={S2.chores.h} stroke={done ? theme.ok : theme.line} fill={done ? theme.okTint : theme.paper}>
                <ChoreIcon x={x + S2.chores.w / 2} y={y + 56} glyph={c.glyph} color={done ? theme.ok : theme.accent} />
                <Label x={x + S2.chores.w / 2} y={y + 122} size={22} weight={700}>
                  {c.text}
                </Label>
              </Card>
              {done && <Mark x={x + S2.chores.w - 6} y={y + 4} ok r={15} />}
            </g>
          </g>
        )
      })}
      <Arrow x1={S2.chores.x + 3 * S2.chores.w + 2 * S2.chores.gap + 14} y1={S2.chores.y + 75} x2={S2.agent.x - 70} y2={S2.chores.y + 75} color={theme.accent} draw={appear(frame, b(1) + 104, 12)} />
      {frame >= b(1) + 96 && <Agent x={S2.agent.x} y={S2.agent.y} scale={0.9} enterAt={b(1) + 96} pose={bot} />}

      {/* доска 2: требования, агент, тесты, код */}
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.75} label="Марина" enterAt={b(2)} pose={marina[0]} mood={marina[1]} />
      <g opacity={req}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent}>
          <Label x={R.x + 22} y={R.y + 40} anchor="start" size={22} color={theme.accent} weight={700}>
            Требования
          </Label>
          <rect x={R.x + 12} y={R.y + 58} width={R.w - 24} height={76} rx={8} fill={theme.altTint} opacity={hl} />
          {reqLines.map((l, i) => (
            <Label key={i} x={R.x + 22} y={R.y + 88 + i * 32} anchor="start" size={22} weight={600}>
              {l}
            </Label>
          ))}
          <g opacity={req2}>
            {REQ2.map((l, i) => (
              <Label key={l} x={R.x + 22} y={R.y + 176 + i * 32} anchor="start" size={22} weight={600} color={theme.soft}>
                {l}
              </Label>
            ))}
          </g>
        </Card>
      </g>
      <Arrow x1={R.x + R.w + 8} y1={R.y + 120} x2={S2.bot.x - 50} y2={R.y + 120} color={theme.accent} draw={toBot} />
      <Arrow x1={S2.bot.x + 50} y1={R.y + 120} x2={T.x - 8} y2={R.y + 120} color={theme.accent} draw={toTests} />
      {frame >= b(2) + 60 && <Agent x={S2.bot.x} y={S2.bot.y} scale={0.75} enterAt={b(2) + 60} pose={agent} />}
      <g opacity={tests}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.ok}>
          <Label x={T.x + 22} y={T.y + 40} anchor="start" size={22} color={theme.ok} weight={700}>
            Тесты
          </Label>
          {[
            { text: t1, ok: green[0] },
            { text: 'вес −5 кг → ошибка', ok: green[1] },
          ].map((row, i) => (
            <g key={i}>
              {row.ok ? <Mark x={T.x + 40} y={T.y + 82 + i * 52} ok r={14} /> : <circle cx={T.x + 40} cy={T.y + 82 + i * 52} r={14} fill={theme.paper} stroke={theme.line} strokeWidth={3} strokeDasharray="5 4" />}
              <Label x={T.x + 68} y={T.y + 89 + i * 52} anchor="start" size={20} weight={600} color={row.ok ? theme.ink : theme.soft}>
                {row.text}
              </Label>
            </g>
          ))}
          <g opacity={t3}>
            <Mark x={T.x + 40} y={T.y + 186} ok r={14} />
            <Label x={T.x + 68} y={T.y + 193} anchor="start" size={20} weight={600}>
              планка 60 с → сохранено
            </Label>
          </g>
        </Card>
      </g>
      {/* места тестов и кода — пунктиром, пока их нет */}
      <rect x={T.x} y={T.y} width={T.w} height={T.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(2) + 10) * (1 - tests)} />
      <g opacity={appear(frame, b(2) + 10)}>
        <rect x={K.x} y={K.y} width={K.w} height={K.h} rx={12} fill={theme.codeBg} opacity={codeIn} />
        <rect x={K.x} y={K.y} width={K.w} height={K.h} rx={12} fill="none" stroke={codeIn > 0.5 ? theme.line : theme.grid} strokeWidth={3} strokeDasharray={codeIn > 0.5 ? undefined : '10 8'} />
        <Label x={K.x + K.w / 2} y={K.y + 56} size={22} weight={600} color={theme.soft} opacity={1 - codeIn}>
          кода ещё нет
        </Label>
        <g opacity={codeIn}>
          <Label x={K.x + 24} y={K.y + 40} anchor="start" size={22} weight={700}>
            Код
          </Label>
          {[0, 1].map((i) => (
            <rect key={i} x={K.x + 24} y={K.y + 56 + i * 18} width={(K.w - 120 - i * 80) * codeIn} height={10} rx={5} fill={theme.grid} />
          ))}
        </g>
      </g>
      <g opacity={order}>
        <Pill x={S2.order.x} y={S2.order.y} w={310} text="сначала тест, потом код" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={ask}>
        <Callout x={S2.ask.x} y={S2.ask.y} tx={S2.marina.x + 10} ty={S2.marina.y - 62} text="Для планки — секунды!" color={theme.accent} />
      </g>
      {/* проверка сверяется с требованием: петля над карточками */}
      <g opacity={loop}>
        <path d={`M${T.x + 120} ${T.y - 4} V${S2.loop.y} H${R.x + 200} V${R.y - 10}`} fill="none" stroke={theme.ok} strokeWidth={3} strokeDasharray="8 7" />
        <path d={`M${R.x + 200} ${R.y - 4} l-7 -14 h14 Z`} fill={theme.ok} />
        <Label x={(T.x + R.x + 320) / 2} y={S2.loop.y - 10} size={20} weight={700} color={theme.ok}>
          тест сверяется с намерением
        </Label>
      </g>

      {/* доска 3: самовосстанавливающийся сквозной тест в браузере */}
      <Browser x={W.x} y={W.y} w={W.w} h={W.h} at={b(4) - 10} url="trener.app/log">
        <Label x={40} y={BAR + 50} anchor="start" size={24} weight={700}>
          Журнал · Анна
        </Label>
        {['Присед · 3 × 10 · 50 кг', 'Тяга · 3 × 8 · 60 кг'].map((t, i) => (
          <g key={t} transform={`translate(0 ${relayout * -10})`}>
            <rect x={40} y={BAR + 78 + i * 52} width={W.w - 80} height={42} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
            <Label x={58} y={BAR + 106 + i * 52} anchor="start" size={20} weight={500}>
              {t}
            </Label>
          </g>
        ))}
        <rect x={btn.x} y={btn.y} width={btn.w} height={btn.h} rx={12} fill={broken ? theme.line : theme.alt} />
        <Label x={btn.x + btn.w / 2} y={btn.y + 34} size={22} weight={700} color={theme.white}>
          Сохранить подход
        </Label>
        {saved > 0 && (
          <g>
            <Mark x={btn.x + btn.w - 20} y={btn.y - 24} ok r={16} />
          </g>
        )}
        <g opacity={newLayout}>
          <Pill x={W.w - 150} y={BAR + 40} w={220} text="новая вёрстка" color={theme.alt} fill={theme.altTint} size={20} compact />
        </g>
        {ripple > 0 && <circle cx={cur.x} cy={cur.y} r={8 + ripple * 26} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        <g opacity={appear(frame, b(4) + 14)}>
          <Cursor x={cur.x} y={cur.y} color={theme.accent} />
        </g>
      </Browser>
      <g opacity={appear(frame, b(4) + 14)}>
        <Pill x={W.x + W.w / 2} y={W.y + W.h + 30} w={360} text="самовосстанавливающийся тест" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {/* места итогов прогонов — пунктиром */}
      {[b(4) + 112, b(4) + 160].map((out, i) => (
        <g key={i} opacity={appear(frame, b(4) + 20) * (1 - appear(frame, out, 8))}>
          <rect x={RS.x} y={RS.y + i * (RS.h + RS.gap)} width={RS.w} height={RS.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
          <Label x={RS.x + RS.w / 2} y={RS.y + i * (RS.h + RS.gap) + RS.h / 2 + 8} size={22} weight={600} color={theme.soft}>
            {`прогон ${i + 1}`}
          </Label>
        </g>
      ))}
      <g opacity={res1}>
        <Card x={RS.x} y={RS.y} w={RS.w} h={RS.h} stroke={theme.ok} fill={theme.okTint}>
          <Mark x={RS.x + 40} y={RS.y + 46} ok r={18} />
          <Label x={RS.x + 72} y={RS.y + 54} anchor="start" size={22} weight={700}>
            Вёрстка новая —
          </Label>
          <Label x={RS.x + 72} y={RS.y + 88} anchor="start" size={22} weight={700}>
            тест нашёл кнопку
          </Label>
          <Label x={RS.x + 72} y={RS.y + 122} anchor="start" size={20} weight={500} color={theme.soft}>
            подстроился сам
          </Label>
        </Card>
      </g>
      <g opacity={res2}>
        <Card x={RS.x} y={RS.y + RS.h + RS.gap} w={RS.w} h={RS.h} stroke={theme.risk} fill={theme.riskTint}>
          <Mark x={RS.x + 40} y={RS.y + RS.h + RS.gap + 46} ok={false} r={18} />
          <Label x={RS.x + 72} y={RS.y + RS.h + RS.gap + 54} anchor="start" size={22} weight={700}>
            Кнопка не сохраняет —
          </Label>
          <Label x={RS.x + 72} y={RS.y + RS.h + RS.gap + 88} anchor="start" size={22} weight={700} color={theme.risk}>
            тест поднял тревогу
          </Label>
          <Label x={RS.x + 72} y={RS.y + RS.h + RS.gap + 122} anchor="start" size={20} weight={500} color={theme.soft}>
            поведение изменилось
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
