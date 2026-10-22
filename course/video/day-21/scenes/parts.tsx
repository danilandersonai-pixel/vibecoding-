import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { theme } from '../../theme'
import type { Status } from '../layout'

// Детали сцен ролика дня 21 «Запуск»: замок https, часы, значки данных (замеры, фото, питание), весы закона,
// маленький телефон, флажок, плашка статуса чек-листа, круг нажатия и кружок с номером.
// Плашка, галочка, реплика и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

/** Замок https: (x, y) — центр корпуса, s — масштаб. */
export function Padlock({ x, y, color = theme.ok, s = 1 }: { x: number; y: number; color?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-5 -2 V-7 A5 5 0 0 1 5 -7 V-2" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <rect x={-8} y={-2} width={16} height={13} rx={3} fill={color} />
      <circle cx={0} cy={4} r={1.8} fill={theme.white} />
    </g>
  )
}

/** Часы: (x, y) — центр. */
export function Clock({ x, y, r = 11, color = theme.soft }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.white} stroke={color} strokeWidth={2.5} />
      <path d={`M${x} ${y - r * 0.6} V${y} H${x + r * 0.5}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

export type TileIcon = 'scale' | 'photo' | 'plate'

/** Значок вида данных с центром (x, y), около 44 px: напольные весы, фото, тарелка. */
export function DataIcon({ kind, x, y, color = theme.accent }: { kind: TileIcon; x: number; y: number; color?: string }) {
  if (kind === 'scale')
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x={-20} y={-18} width={40} height={36} rx={8} fill={theme.white} stroke={color} strokeWidth={3} />
        <path d="M-11 -4 A11 11 0 0 1 11 -4" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <path d="M0 -4 L5 -12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <rect x={-12} y={6} width={24} height={5} rx={2.5} fill={color} />
      </g>
    )
  if (kind === 'photo')
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x={-20} y={-16} width={40} height={32} rx={5} fill={theme.white} stroke={color} strokeWidth={3} />
        <circle cx={0} cy={-5} r={5} fill={color} />
        <path d="M-10 13 Q-10 3 0 3 Q10 3 10 13" fill={color} />
      </g>
    )
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={4} rx={20} ry={11} fill={theme.white} stroke={color} strokeWidth={3} />
      <ellipse cx={0} cy={3} rx={10} ry={5} fill="none" stroke={color} strokeWidth={2} />
      <path d="M-24 -16 V-2 M-28 -16 V-8 Q-28 -4 -24 -4 Q-20 -4 -20 -8 V-16 M24 -16 V-2" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

/** Весы (закон): (x, y) — центр стойки наверху. */
export function Scales({ x, y, color = theme.soft }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 -12 V14 M-10 14 H10 M-16 -8 H16" />
      <path d="M-16 -8 L-22 4 H-10 Z M16 -8 L10 4 H22 Z" />
    </g>
  )
}

/** Маленький телефон: (x, y) — левый верхний угол, w×h — размер. */
export function MiniPhone({ x, y, w = 56, h = 96 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.ink} />
      <rect x={x + 5} y={y + 12} width={w - 10} height={h - 22} rx={4} fill={theme.paper} />
      <rect x={x + w / 2 - 8} y={y + 5} width={16} height={3} rx={1.5} fill={theme.soft} />
      <rect x={x + 10} y={y + 22} width={w - 20} height={8} rx={3} fill={theme.accent} />
      {[38, 50, 62].map((t) => (
        <rect key={t} x={x + 10} y={y + t} width={w - 20 - (t % 3) * 4} height={5} rx={2.5} fill={theme.grid} />
      ))}
    </g>
  )
}

/** Щит с галочкой (надёжность): (x, y) — центр. */
export function Shield({ x, y, color = theme.ok }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -26 L22 -18 V0 Q22 18 0 28 Q-22 18 -22 0 V-18 Z" fill={theme.white} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-9 0 L-2 8 L11 -8" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** Флажок финиша на древке: (x, y) — низ древка. */
export function Flag({ x, y, color = theme.ok }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <path d={`M${x} ${y} V${y - 60}`} stroke={theme.ink} strokeWidth={4} strokeLinecap="round" />
      <path d={`M${x + 2} ${y - 60} H${x + 44} L${x + 34} ${y - 48} L${x + 44} ${y - 36} H${x + 2} Z`} fill={color} />
    </g>
  )
}

const STATUS: Record<Status, { text: string; color: string; fill: string }> = {
  done: { text: 'сделано', color: theme.ok, fill: theme.okTint },
  unsure: { text: 'не знаю', color: theme.alt, fill: theme.altTint },
  todo: { text: 'не сделано', color: theme.risk, fill: theme.riskTint },
  fixed: { text: 'закрыто', color: theme.white, fill: theme.ok },
}

/** Плашка статуса пункта чек-листа по центру (x, y), ширина одна для всех статусов. */
export function StatusPill({ x, y, status }: { x: number; y: number; status: Status }) {
  const s = STATUS[status]
  return <Pill x={x} y={y} w={136} text={s.text} color={s.color} fill={s.fill} size={18} compact />
}

/** Круг нажатия: расходится 18 кадров с кадра at. */
export function Tap({ cx, cy, at, r = 12 }: { cx: number; cy: number; at: number; r?: number }) {
  const frame = useCurrentFrame()
  if (frame < at || frame >= at + 18) return null
  const p = (frame - at) / 18
  return <circle cx={cx} cy={cy} r={r + p * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - p} />
}

/** Кружок с номером пункта: (x, y) — центр. */
export function NumberDot({ x, y, n, color = theme.accent }: { x: number; y: number; n: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill={color} />
      <Label x={x} y={y + 7} size={18} weight={800} color={theme.white}>
        {String(n)}
      </Label>
    </g>
  )
}
