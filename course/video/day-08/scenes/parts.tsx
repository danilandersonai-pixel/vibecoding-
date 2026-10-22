import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'

// Детали сцен ролика дня 8 «Отзывы и фоновые агенты»: листок отзыва, пунктирное место,
// лист задачи, строка с галочкой. Плашка, галочка, облако и реплика — Pill, Mark, Cloud
// и Callout из kit/props.tsx.

/** Листок отзыва: автор цветом и его слова дословно; (x, y) — левый верхний угол. */
export function Note({ x, y, w, h, author, color, text }: { x: number; y: number; w: number; h: number; author: string; color: string; text: string }) {
  return (
    <g>
      <rect x={x + 6} y={y + 6} width={w} height={h} rx={10} fill={theme.desk} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.white} stroke={color} strokeWidth={3} />
      <rect x={x + 3} y={y + 10} width={7} height={h - 20} rx={3} fill={color} />
      <Label x={x + 28} y={y + 36} anchor="start" size={20} color={color} weight={700}>
        {author}
      </Label>
      <Label x={x + 28} y={y + 74} anchor="start" size={22} weight={600}>
        {text}
      </Label>
    </g>
  )
}

/** Пунктирное место будущего элемента: (x, y) — левый верхний угол. */
export function Slot({ x, y, w, h, color = theme.line }: { x: number; y: number; w: number; h: number; color?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray="9 7" />
}

/** Лист задачи с загнутым уголком и строками: (x, y) — центр, color — цвет рамки. */
export function Sheet({ x, y, color = theme.accent }: { x: number; y: number; color?: string }) {
  const w = 44
  const h = 56
  const l = x - w / 2
  const t = y - h / 2
  return (
    <g>
      <path d={`M${l} ${t} H${l + w - 12} L${l + w} ${t + 12} V${t + h} H${l} Z`} fill={theme.white} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={l + 8} y={t + 18 + i * 11} width={w - 16 - (i % 2) * 8} height={5} rx={2.5} fill={color} opacity={0.6} />
      ))}
    </g>
  )
}

/** Строка с квадратом слева; на кадре at квадрат отмечается галочкой. (x, y) — левый верхний угол квадрата. */
export function TickRow({ x, y, text, at, size = 22, color = theme.ink }: { x: number; y: number; text: string; at: number; size?: number; color?: string }) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 8)
  return (
    <g>
      <rect x={x} y={y} width={30} height={30} rx={7} fill={theme.okTint} fillOpacity={g} stroke={g > 0 ? theme.ok : theme.line} strokeWidth={3} />
      <path d={`M${x + 7} ${y + 16} L${x + 13} ${y + 22} L${x + 24} ${y + 9}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} fill="none" stroke={theme.ok} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={x + 46} y={y + 23} anchor="start" size={size} color={color} weight={600}>
        {text}
      </Label>
    </g>
  )
}
