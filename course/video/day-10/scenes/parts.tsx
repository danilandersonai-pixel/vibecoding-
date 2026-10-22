import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { Mark } from '../../kit/props'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'
import { ru } from '../layout'

// Детали сцен ролика дня 10 «Рекорды и отчёты»: пунктирное место, кубок рекорда, столбики
// объёма по дням, строка теста с отметкой. Плашка, галочка и реплика — Pill, Mark и Callout
// из kit/props.tsx.

/** Пунктирное место будущего элемента: (x, y) — левый верхний угол. */
export function Slot({ x, y, w, h, color = theme.line, rx = 10 }: { x: number; y: number; w: number; h: number; color?: string; rx?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray="9 7" />
}

/** Кубок рекорда: (x, y) — центр чаши, scale — масштаб. */
export function Cup({ x, y, scale = 1, color = theme.alt }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-30 -34 H30 V-6 Q30 26 0 30 Q-30 26 -30 -6 Z" fill={theme.altTint} stroke={color} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-30 -24 Q-52 -24 -48 -4 Q-44 12 -26 12 M30 -24 Q52 -24 48 -4 Q44 12 26 12" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      <path d="M0 30 V44 M-20 52 H20" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <path d="M0 -22 L5 -12 L16 -11 L8 -3 L10 8 L0 3 L-10 8 L-8 -3 L-16 -11 L-5 -12 Z" fill={color} />
    </g>
  )
}

export type BarDay = { day: string; value: number | null }

/**
 * Столбики объёма по дням: (x, y) — левый верхний угол области, top — верх шкалы.
 * Столбики растут по очереди с кадра at; день без тренировки (null) — пунктирное место «пропуск».
 */
export function DayBars({ x, y, w, h, days, at, top, color = theme.accent }: { x: number; y: number; w: number; h: number; days: BarDay[]; at: number; top: number; color?: string }) {
  const frame = useCurrentFrame()
  const base = y + h - 34
  const plot = h - 34 - 30
  const slot = w / days.length
  const bw = Math.min(slot * 0.52, 76)
  return (
    <g>
      <line x1={x} y1={base} x2={x + w} y2={base} stroke={theme.line} strokeWidth={3} />
      {days.map((d, i) => {
        const cx = x + slot * (i + 0.5)
        const g = grow(frame, at + i * 8, 16)
        if (d.value === null) {
          return (
            <g key={d.day} opacity={g}>
              <Slot x={cx - bw / 2} y={base - 40} w={bw} h={40} color={theme.risk} rx={6} />
              <Label x={cx} y={base - 52} size={18} color={theme.risk} weight={700}>
                пропуск
              </Label>
              <Label x={cx} y={base + 26} size={20} color={theme.soft} weight={600}>
                {d.day}
              </Label>
            </g>
          )
        }
        const bh = (plot * d.value * g) / top
        return (
          <g key={d.day}>
            <rect x={cx - bw / 2} y={base - bh} width={bw} height={bh} rx={6} fill={color} />
            <Label x={cx} y={base - bh - 10} size={20} color={color} weight={800} opacity={g >= 1 ? 1 : 0}>
              {ru(d.value)}
            </Label>
            <Label x={cx} y={base + 26} size={20} color={theme.soft} weight={600} opacity={g > 0 ? 1 : 0.4}>
              {d.day}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

export type TestState = 'wait' | 'fail' | 'pass'

/** Строка теста: слева отметка (ждёт — пунктир, упал — крестик, прошёл — галочка); (x, y) — центр отметки. */
export function TestRow({ x, y, text, state, size = 22 }: { x: number; y: number; text: string; state: TestState; size?: number }) {
  return (
    <g>
      {state === 'wait' ? <circle cx={x} cy={y} r={14} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="5 4" /> : <Mark x={x} y={y} ok={state === 'pass'} r={14} />}
      <Label x={x + 30} y={y + size * 0.36} anchor="start" size={size} color={state === 'fail' ? theme.risk : theme.ink} weight={600}>
        {text}
      </Label>
    </g>
  )
}
