import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Browser, Mark } from '../../ch-abc/scenes/parts'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Card, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { MODE_POINTS, plotAt, RISK, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { appear, clamp, trackAt } from './motion'
import { Tag } from './parts'

const ID = 's2-cost'
const P = S2.plot
const C = S2.cost
const CW = S2.card.w
const CH = S2.card.h

// корзины: режим, кто проверяет, цена ошибки, цвет
const BUCKETS = [
  { mode: 'Вайб-кодинг', who: 'смотрим поведение', cost: 'ошибка дешёвая', color: theme.ok },
  { mode: 'Делегирование', who: 'смотрим итог', cost: 'задача чёткая', color: theme.alt },
  { mode: 'Разработка с ИИ', who: 'читаем каждое изменение', cost: 'ошибка дорогая', color: theme.risk },
]
// задачи приложения тренера по репликам: в какую корзину
const TASKS = [
  { lines: ['Прототип экрана Анны', 'показать Марине завтра'], bucket: 0 },
  { lines: ['Вход и права тренеров', 'тренер видит только своих'], bucket: 2 },
  { lines: ['Обновить библиотеки', 'и прогнать все тесты'], bucket: 1 },
]
const ISSUES = ['ошибки не продуманы', 'безопасность не продумана', 'необычные случаи не продуманы']

// Карточка задачи; (x, y) — центр.
function TaskCard({ x, y, lines, color }: { x: number; y: number; lines: string[]; color: string }) {
  return (
    <Card x={x - CW / 2} y={y - CH / 2} w={CW} h={CH} stroke={color} fill={theme.paper}>
      <Label x={x} y={y - 6} size={20} weight={700}>
        {lines[0]}
      </Label>
      <Label x={x} y={y + 22} size={18} color={theme.soft} weight={600}>
        {lines[1]}
      </Label>
    </Card>
  )
}

// Сцена 2: главное различие режимов — кто понимает код (рис. 1.1); вайб-кодинг в зоне риска и иллюзия
// готовности; режим выбирают по цене ошибки — три задачи приложения тренера раскладываются по корзинам.
export function S2Cost() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // схема: оси рисуются, точки режимов появляются по одной
  const card = useAppear(b(0))
  const axes = interpolate(frame, [b(0) + 10, b(0) + 40], [0, 1], clamp)
  const axisWords = useAppear(b(0) + 30)
  const dots = MODE_POINTS.map((_, i) => interpolate(frame, [b(0) + 48 + i * 14, b(0) + 60 + i * 14], [0, 1], clamp))
  const r0 = plotAt(RISK.fx0, RISK.fy0)
  const r1 = plotAt(RISK.fx1, RISK.fy1)
  const zone = useAppear(b(1) + 8)
  const zoneWord = useAppear(b(1) + 30)
  const ends = useAppear(b(1) + 80)
  const vibe = plotAt(MODE_POINTS[4].fx, MODE_POINTS[4].fy)
  const pulse = frame >= b(1) + 30 && frame < b(3) ? ((frame - b(1) - 30) % 40) / 40 : -1

  // демо работает, но не продумано
  const demo = useAppear(b(2))
  const works = useAppear(b(2) + 28)
  const issues = ISSUES.map((_, i) => appear(frame, b(2) + 62 + i * 16))
  const illusion = useAppear(b(2) + 125)

  // доска 2: шкала цены ошибки и корзины
  const bar = interpolate(frame, [b(3) + 30, b(3) + 80], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const barWords = useAppear(b(3) + 60)
  const control = useAppear(b(3) + 100)
  const bucketIn = [0, 1, 2].map((i) => appear(frame, b(3) + 84 + i * 10))

  // задачи: появляются посередине → улетают в корзину
  const tasks = TASKS.map((t, i) => {
    const at = b(4 + i)
    const slot = { x: S2.buckets[t.bucket] + S2.bucketW / 2, y: S2.bucketY + 122 }
    return {
      ...t,
      at,
      landAt: at + 105,
      shown: interpolate(frame, [at + 12, at + 24], [0, 1], clamp),
      pos: trackAt(frame, [
        [at + 75, S2.inbox.x, S2.inbox.y],
        [at + 105, slot.x, slot.y],
      ]),
    }
  })
  const landed = (bucket: number) => tasks.some((t) => t.bucket === bucket && frame >= t.landAt)

  // агент берёт обновление библиотек
  const agentIn = b(6) + 105
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [agentIn + 15, 'working'],
    [agentIn + 60, 'done'],
  ])

  return (
    <KitScene chip="2 / 6 · Режим — по цене ошибки" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* схема: сколько кода пишет ИИ × понимание кода человеком */}
      <g opacity={card}>
        <Card x={S2.chart.x} y={S2.chart.y} w={S2.chart.w} h={S2.chart.h} />
        <g opacity={zone}>
          <rect x={r0.x} y={r0.y} width={r1.x - r0.x} height={r1.y - r0.y} rx={10} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} strokeDasharray="8 6" />
        </g>
        <g opacity={zoneWord}>
          <Label x={r0.x + 12} y={r0.y + 24} anchor="start" size={18} color={theme.risk} weight={700}>
            зона риска
          </Label>
        </g>
        <Arrow x1={P.x0} y1={P.y1} x2={P.x0 + (P.x1 + 10 - P.x0) * axes} y2={P.y1} color={theme.soft} progress={1} />
        <Arrow x1={P.x0} y1={P.y1} x2={P.x0} y2={P.y1 - (P.y1 - P.y0 + 6) * axes} color={theme.soft} progress={1} />
        <g opacity={axisWords}>
          <Label x={P.x0 + 14} y={P.y0 - 2} anchor="start" size={20} color={theme.ink} weight={700}>
            понимание кода человеком
          </Label>
          <Label x={P.x0 - 10} y={P.y0 + 24} anchor="end" size={18} color={theme.soft} weight={600}>
            высокое
          </Label>
          <Label x={P.x0 - 10} y={P.y1 - 4} anchor="end" size={18} color={ends > 0 ? theme.risk : theme.soft} weight={ends > 0 ? 700 : 600}>
            низкое
          </Label>
          <Label x={P.x0} y={P.y1 + 28} anchor="start" size={18} color={theme.soft} weight={600}>
            мало
          </Label>
          <Label x={P.x1} y={P.y1 + 28} anchor="end" size={18} color={ends > 0 ? theme.risk : theme.soft} weight={ends > 0 ? 700 : 600}>
            почти весь
          </Label>
          <Label x={(P.x0 + P.x1) / 2} y={P.y1 + 60} size={20} color={theme.ink} weight={700}>
            сколько кода пишет ИИ
          </Label>
        </g>
        {pulse >= 0 && <circle cx={vibe.x} cy={vibe.y} r={10 + pulse * 26} fill="none" stroke={theme.risk} strokeWidth={3} opacity={1 - pulse} />}
        {MODE_POINTS.map((m, i) => {
          const pt = plotAt(m.fx, m.fy)
          const risky = i === 4
          const lx = m.side === 'right' ? pt.x + 16 : m.side === 'left' ? pt.x - 16 : pt.x
          const ly = m.side === 'above' ? pt.y - 18 : m.side === 'below' ? pt.y + 32 : pt.y + 7
          const anchor = m.side === 'right' ? 'start' : m.side === 'left' ? 'end' : 'middle'
          return (
            <g key={m.name} opacity={dots[i]}>
              <circle cx={pt.x} cy={pt.y} r={risky ? 10 : 8} fill={risky ? theme.risk : theme.accent} stroke={theme.paper} strokeWidth={3} />
              <Label x={lx} y={ly} anchor={anchor} size={20} color={risky ? theme.risk : theme.ink} weight={700}>
                {m.name}
              </Label>
            </g>
          )
        })}
      </g>

      {/* иллюзия готовности: демо работает, а остальное не продумано */}
      {frame >= b(2) - 2 && (
        <Browser x={S2.demo.x} y={S2.demo.y} w={S2.demo.w} h={S2.demo.h} at={b(2)} url="localhost:3000">
          <g opacity={demo}>
            <Label x={28} y={86} anchor="start" size={24} weight={700}>
              Экран Анны · демо
            </Label>
            <rect x={28} y={104} width={250} height={36} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
            <Label x={40} y={129} anchor="start" size={20} weight={500}>
              жим · 60 кг × 8
            </Label>
            <rect x={28} y={156} width={250} height={44} rx={10} fill={theme.accent} />
            <Label x={153} y={185} size={20} color={theme.paper} weight={600}>
              Сохранить подход
            </Label>
          </g>
          <g opacity={works}>
            <Tag x={400} y={152} text="✓ работает" color={theme.ok} fill={theme.okTint} size={22} />
          </g>
        </Browser>
      )}
      {ISSUES.map((t, i) => (
        <g key={t} opacity={issues[i]} transform={`translate(${(1 - issues[i]) * 20} 0)`}>
          <Tag x={S2.demo.x + S2.demo.w / 2} y={S2.tagsY + i * 44} text={t} color={theme.risk} fill={theme.riskTint} />
        </g>
      ))}
      <g opacity={illusion}>
        <Label x={S2.demo.x + S2.demo.w / 2} y={S2.tagsY + 3 * 44 + 6} size={26} color={theme.risk} weight={800}>
          иллюзия готовности
        </Label>
      </g>

      {/* доска 2: цена ошибки */}
      <g opacity={bar > 0 ? 1 : 0}>
        <Label x={C.x} y={C.y - 14} anchor="start" size={22} weight={700}>
          цена ошибки
        </Label>
        {[theme.ok, theme.alt, theme.risk].map((col, i) => {
          const seg = C.w / 3
          const shown = Math.max(0, Math.min(seg, C.w * bar - i * seg))
          return <rect key={col} x={C.x + i * seg} y={C.y} width={shown} height={16} rx={i === 0 ? 8 : 0} fill={col} />
        })}
        <g opacity={barWords}>
          <Label x={C.x} y={C.y + 44} anchor="start" size={20} color={theme.ok} weight={700}>
            низкая
          </Label>
          <Label x={C.x + C.w} y={C.y + 44} anchor="end" size={20} color={theme.risk} weight={700}>
            высокая
          </Label>
        </g>
        <g opacity={control}>
          <Label x={C.x + C.w / 2} y={C.y + 44} size={22} color={theme.accent} weight={700}>
            больнее промах → больше контроля
          </Label>
        </g>
      </g>

      {/* корзины режимов */}
      {BUCKETS.map((k, i) => {
        const x = S2.buckets[i]
        const on = landed(i)
        return (
          <g key={k.mode} opacity={bucketIn[i]}>
            <Card x={x} y={S2.bucketY} w={S2.bucketW} h={S2.bucketH} stroke={on ? k.color : theme.line} />
            <Label x={x + S2.bucketW / 2} y={S2.bucketY + 38} size={24} weight={700} color={on ? k.color : theme.ink}>
              {k.mode}
            </Label>
            <Label x={x + S2.bucketW / 2} y={S2.bucketY + 68} size={20} color={on ? theme.ink : theme.soft} weight={600}>
              {k.who}
            </Label>
            <rect x={x + 20} y={S2.bucketY + 84} width={S2.bucketW - 40} height={CH} rx={12} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="8 6" />
            <Tag x={x + S2.bucketW / 2} y={S2.bucketY + S2.bucketH - 30} text={k.cost} color={k.color} />
            {on && <Mark x={x + S2.bucketW - 28} y={S2.bucketY + 30} ok />}
          </g>
        )
      })}
      {tasks.map((t) =>
        frame >= t.at ? (
          <g key={t.lines[0]} opacity={t.shown}>
            <TaskCard x={t.pos.x} y={t.pos.y} lines={t.lines} color={frame >= t.landAt ? BUCKETS[t.bucket].color : theme.accent} />
          </g>
        ) : null,
      )}
      {frame >= agentIn && <Agent x={S2.buckets[1] + 42} y={S2.bucketY + 50} scale={0.42} enterAt={agentIn} pose={agent} label="" />}
    </KitScene>
  )
}
