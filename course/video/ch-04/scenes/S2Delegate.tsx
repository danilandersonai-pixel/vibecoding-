import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { packRow, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's2-delegate'
const G = S2.grid
const R = S2.rules

type Quarter = { col: number; row: number; title: string; color: string; tint: string; examples: string[][] }
// четверти матрицы (рис. 4.1): ряд 0 — ошибка дорогая, столбец 1 — проверить легко
const QUARTERS: Quarter[] = [
  { col: 0, row: 0, title: 'Решаете вы, ИИ советует', color: theme.risk, tint: theme.riskTint, examples: [['устройство данных'], ['права доступа']] },
  { col: 1, row: 0, title: 'ИИ пишет, вы проверяете', color: theme.alt, tint: theme.altTint, examples: [['платежи под тестами'], ['критичные эндпоинты']] },
  { col: 0, row: 1, title: 'ИИ — черновик, разведка', color: theme.accent, tint: theme.accentTint, examples: [['прототипы'], ['разбор чужого кода']] },
  { col: 1, row: 1, title: 'Отдать агенту в фон', color: theme.ok, tint: theme.okTint, examples: [['тесты', 'документация'], ['мелкие баги']] },
]
const qx = (col: number) => G.x + col * (G.w + G.gap)
const qy = (row: number) => G.y + row * (G.h + G.gap)
const pillW = (t: string) => Math.round(t.length * 18 * 0.56 + 28)

// разделы правил для себя (s24)
const SECTIONS = [
  { title: 'Никогда без проверки', color: theme.risk, tint: theme.riskTint, items: ['деньги', 'пароли', 'личные данные'] },
  { title: 'Отдаю свободно', color: theme.ok, tint: theme.okTint, items: ['тексты', 'оформление'] },
  { title: 'Как проверяю итог', color: theme.accent, tint: theme.accentTint, items: ['тест', 'прогон вручную'] },
]

// Сцена 2: делать самому или поручить ИИ — два вопроса, матрица из четырёх четвертей (рис. 4.1):
// подпись кнопки — смело, хранение паролей — под присмотром. Даже в одиночку вы — команда; правила для себя.
export function S2Delegate() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // оси и два вопроса
  const axes = grow(frame, b(0) + 6, 30)
  const askAt = [b(0) + 56, b(0) + 112]
  const frames = useAppear(b(0) + 150)
  // когда раскрывается каждая четверть: заголовок, затем примеры. Все четыре стоят
  // к началу окна горячей точки «Матрица делегирования» (реплика 4 + 80)
  const quarterAt = [b(4) + 6, b(4) + 30, b(4) + 44, b(3) + 10]
  const exampleAt = [
    [b(4) + 18, b(4) + 30],
    [b(4) + 40, b(4) + 48],
    [b(4) + 54, b(4) + 62],
    [b(3) + 98, b(3) + 112, b(3) + 132],
  ]

  // задачи летят в свои четверти
  const tasks = [
    { text: 'подпись кнопки', at: b(1) + 6, fly: b(1) + 50, to: { x: qx(1) + G.w / 2, y: qy(1) + 163 }, ok: true },
    { text: 'хранение паролей', at: b(2) + 6, fly: b(2) + 56, to: { x: qx(0) + G.w / 2, y: qy(0) + 163 }, ok: false },
  ]
  const toAgent = grow(frame, b(3) + 44, 14)

  // доска 2: команда и правила
  const team = useAppear(b(5) + 8)
  const links = grow(frame, b(5) + 50, 16)
  const card = useAppear(b(5) + 86)
  // заголовки разделов — вместе с карточкой, плашки — по словам реплики
  const titleAt = [b(5) + 96, b(5) + 106, b(5) + 116]
  const sectionAt = [b(6), b(6) + 112, b(6) + 160]

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 50, ['think', 'neutral']],
    [b(1) + 40, ['point', 'happy']],
    [b(1) + 120, ['stand', 'happy']],
    [b(2) + 30, ['think', 'worried']],
    [b(2) + 120, ['stand', 'neutral']],
    [b(4) + 10, ['point', 'neutral']],
    [b(4) + 120, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 56, 'working'],
    [b(3) + 150, 'done'],
    [b(4) + 30, 'idle'],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 40, ['cheer', 'happy']],
    [b(5) + 90, ['point', 'neutral']],
    [b(6) + 150, ['stand', 'happy']],
  ])
  const agents2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 50, 'working'],
    [b(6) + 60, 'done'],
  ])

  const axisTop = G.y - 8
  const axisRight = qx(1) + G.w + 14
  return (
    <KitScene chip="2 / 6 · Что отдать ИИ, а что решить самому" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* оси: цена ошибки вверх, лёгкость проверки вправо */}
      <Arrow x1={S2.axisX} y1={S2.axisY} x2={S2.axisX} y2={axisTop} color={theme.ink} draw={axes} />
      <Arrow x1={S2.axisX} y1={S2.axisY} x2={axisRight} y2={S2.axisY} color={theme.ink} draw={axes} />
      <g opacity={appear(frame, askAt[0])}>
        <g transform={`translate(${S2.axisX - 20} ${G.y + G.h + G.gap / 2}) rotate(-90)`}>
          <Label x={0} y={0} size={20} weight={700}>
            цена ошибки
          </Label>
        </g>
        <g transform={`translate(${S2.axisX - 20} ${G.y + 46}) rotate(-90)`}>
          <Label x={0} y={0} size={18} color={theme.soft}>
            дорого
          </Label>
        </g>
        <g transform={`translate(${S2.axisX - 20} ${qy(1) + G.h - 40}) rotate(-90)`}>
          <Label x={0} y={0} size={18} color={theme.soft}>
            дёшево
          </Label>
        </g>
      </g>
      <g opacity={appear(frame, askAt[1])}>
        <Label x={qx(0) + G.w + G.gap / 2} y={S2.axisY + 30} size={20} weight={700}>
          лёгкость проверки
        </Label>
        <Label x={qx(0) + 50} y={S2.axisY + 30} size={18} color={theme.soft}>
          трудно
        </Label>
        <Label x={qx(1) + G.w - 40} y={S2.axisY + 30} size={18} color={theme.soft}>
          легко
        </Label>
      </g>

      {/* четверти матрицы */}
      {QUARTERS.map((q, i) => {
        const x = qx(q.col)
        const y = qy(q.row)
        const open = appear(frame, quarterAt[i])
        return (
          <g key={q.title} opacity={frames}>
            <rect x={x} y={y} width={G.w} height={G.h} rx={12} fill={open > 0 ? q.tint : theme.paper} fillOpacity={Math.max(open, 0.001)} stroke={open > 0 ? q.color : theme.grid} strokeWidth={open > 0 ? 3 : 2} strokeDasharray={open > 0 ? undefined : '8 6'} />
            <g opacity={open}>
              <Label x={x + G.w / 2} y={y + 34} size={20} color={q.color} weight={700}>
                {q.title}
              </Label>
            </g>
            {q.examples.map((row, r) => {
              const centers = packRow(row.map(pillW), 10, { center: x + G.w / 2 })
              return row.map((t, k) => {
                const n = q.examples.slice(0, r).reduce((s, rr) => s + rr.length, 0) + k
                return (
                  <g key={t} opacity={appear(frame, exampleAt[i][n] ?? quarterAt[i], 10)}>
                    <Pill x={centers[k]} y={y + 76 + r * 40} w={pillW(t)} text={t} color={q.color} size={18} compact />
                  </g>
                )
              })
            })}
          </g>
        )
      })}

      {/* в фон агенту */}
      <Arrow x1={qx(1) + G.w + 6} y1={qy(1) + 100} x2={S2.agent.x - 70} y2={qy(1) + 100} color={theme.ok} draw={toAgent} />
      <g opacity={appear(frame, b(3) + 58)}>
        <Label x={(qx(1) + G.w + S2.agent.x - 64) / 2} y={qy(1) + 88} size={18} color={theme.ok} weight={700}>
          в фон
        </Label>
      </g>

      {/* Марина, агент и два вопроса */}
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.8} enterAt={b(0) + 44} pose={agent} />
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.85} label="Марина" enterAt={b(0) + 30} pose={marina[0]} mood={marina[1]} />
      {['ошибка дорогая?', 'проверить легко?'].map((t, i) => (
        <g key={t} opacity={appear(frame, askAt[i])}>
          <Pill x={S2.asks.x} y={S2.asks.y[i]} text={t} color={theme.accent} fill={theme.white} size={20} />
        </g>
      ))}

      {/* задачи: появляются у Марины и летят в свою четверть */}
      {tasks.map((t) => {
        if (frame < t.at) return null
        const p = trackAt(frame, [
          [t.fly, S2.taskFrom.x, S2.taskFrom.y],
          [t.fly + 40, t.to.x, t.to.y],
        ])
        const landed = frame >= t.fly + 46
        const w = Math.round(t.text.length * 20 * 0.56 + 28)
        return (
          <g key={t.text} opacity={appear(frame, t.at, 10)}>
            <Pill x={p.x} y={p.y} w={w} text={t.text} color={t.ok ? theme.ok : theme.risk} fill={theme.white} size={20} />
            {landed && t.ok && <Mark x={p.x + w / 2 + 4} y={p.y - 18} ok r={13} />}
            {landed && !t.ok && (
              <g>
                <circle cx={p.x + w / 2 + 4} cy={p.y - 18} r={13} fill={theme.altTint} stroke={theme.alt} strokeWidth={3} />
                <Label x={p.x + w / 2 + 4} y={p.y - 11} size={18} color={theme.alt} weight={800}>
                  !
                </Label>
              </g>
            )}
          </g>
        )
      })}

      {/* доска 2: вы и ваши агенты */}
      <g opacity={team}>
        <Pill x={S2.team.x} y={S2.team.y} text="Команда: вы и ваши агенты" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      {S2.agents.map((a) => (
        <line key={a.x} x1={S2.marina2.x + 40} y1={S2.marina2.y - 30} x2={S2.marina2.x + 40 + (a.x - 40 - S2.marina2.x - 40) * links} y2={S2.marina2.y - 30 + (a.y - S2.marina2.y + 30) * links} stroke={theme.accent} strokeWidth={3} strokeDasharray="8 7" opacity={links > 0 ? 1 : 0} />
      ))}
      <Coach x={S2.marina2.x} y={S2.marina2.y} scale={0.9} label="Марина" enterAt={b(5)} pose={marina2[0]} mood={marina2[1]} />
      {S2.agents.map((a, i) => (
        <Agent key={a.x} x={a.x} y={a.y} scale={0.7} enterAt={b(5) + 20 + i * 14} pose={agents2} />
      ))}
      <g opacity={card}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.ink} fill={theme.white}>
          <Label x={R.x + 28} y={R.y + 44} anchor="start" size={24} weight={700}>
            Мои правила
          </Label>
          {SECTIONS.map((s, i) => {
            const top = R.y + 70 + i * 122
            const widths = s.items.map((t) => Math.round(t.length * 22 * 0.56 + 28))
            const centers = packRow(widths, 14, { left: R.x + 28 })
            return (
              <g key={s.title} opacity={appear(frame, titleAt[i], 10)}>
                <line x1={R.x + 20} y1={top} x2={R.x + R.w - 20} y2={top} stroke={theme.grid} strokeWidth={2} />
                <Label x={R.x + 28} y={top + 36} anchor="start" size={22} color={s.color} weight={700}>
                  {s.title}
                </Label>
                {s.items.map((t, k) => (
                  <g key={t} opacity={appear(frame, sectionAt[i] + 12 + k * 12, 10)}>
                    <Pill x={centers[k]} y={top + 82} w={widths[k]} text={t} color={s.color} fill={s.tint} size={22} />
                  </g>
                ))}
              </g>
            )
          })}
        </Card>
      </g>
    </KitScene>
  )
}
