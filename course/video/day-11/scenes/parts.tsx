import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'
import { BIG_FONT } from '../layout'

// Детали сцен ролика дня 11 «Комментарии и уведомления»: пунктирное место, колокольчик, уведомление-баннер,
// комментарий под тренировкой, строка уведомления на экране телефона, переключатель, луна и солнце, строка с галочкой.
// Плашка, галочка, ключ и реплика — Pill, Mark, KeyGlyph и Callout из kit/props.tsx.

/** Колокольчик уведомления: (x, y) — центр, s — масштаб. */
export function Bell({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-10 6 Q-10 -12 0 -12 Q10 -12 10 6 L13 9 H-13 Z" fill={color} />
      <circle cx={0} cy={-14} r={2.5} fill={color} />
      <circle cx={0} cy={12} r={3.5} fill={color} />
    </g>
  )
}

/** Уведомление-баннер: колокольчик, заголовок и строка пояснения; (x, y) — центр. */
export function Notice({ x, y, w, title, sub, color = theme.accent }: { x: number; y: number; w: number; title: string; sub: string; color?: string }) {
  const h = 72
  const l = x - w / 2
  const t = y - h / 2
  return (
    <g>
      <rect x={l + 4} y={t + 5} width={w} height={h} rx={14} fill={theme.desk} />
      <rect x={l} y={t} width={w} height={h} rx={14} fill={theme.white} stroke={color} strokeWidth={3} />
      <Bell x={l + 30} y={t + h / 2} color={color} />
      <Label x={l + 56} y={t + 30} anchor="start" size={20} weight={700} color={color}>
        {title}
      </Label>
      <Label x={l + 56} y={t + 57} anchor="start" size={18} color={theme.soft}>
        {sub}
      </Label>
    </g>
  )
}

/** Комментарий под тренировкой: автор и текст; (x, y) — левый верхний угол. */
export function CommentCard({ x, y, w, h, author, text, fill = theme.white }: { x: number; y: number; w: number; h: number; author: string; text: string; fill?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={theme.accent} strokeWidth={2.5} />
      <rect x={x + 3} y={y + 10} width={6} height={h - 20} rx={3} fill={theme.accent} />
      <Label x={x + 24} y={y + 30} anchor="start" size={20} weight={700} color={theme.accent}>
        {author}
      </Label>
      <Label x={x + 24} y={y + 62} anchor="start" size={20} weight={600}>
        {text}
      </Label>
    </g>
  )
}

/** Строка уведомления на экране крупного телефона (координаты экрана, ширина 100); top — верх строки. */
export function PhoneNote({ top, text, color = theme.accent, fill = theme.paper, opacity = 1 }: { top: number; text: string; color?: string; fill?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={-50} y={top} width={100} height={21} rx={5} fill={fill} stroke={color} strokeWidth={1.5} />
      <text x={-46} y={top + 14.5} fill={theme.ink} style={{ font: `500 ${BIG_FONT}px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Переключатель «вкл/выкл» на экране телефона: (x, y) — центр; on 0…1. */
export function Toggle({ x, y, on }: { x: number; y: number; on: number }) {
  return (
    <g>
      <rect x={x - 10} y={y - 6} width={20} height={12} rx={6} fill={on > 0.5 ? theme.ok : theme.line} />
      <circle cx={x - 4 + 8 * on} cy={y} r={4.5} fill={theme.white} />
    </g>
  )
}

/** Месяц (ночь): (x, y) — центр; вырез закрашен цветом фона bg. */
export function Moon({ x, y, r = 8, color = theme.accent, bg = theme.paper }: { x: number; y: number; r?: number; color?: string; bg?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x + r * 0.5} cy={y - r * 0.35} r={r * 0.8} fill={bg} />
    </g>
  )
}

/** Солнце (утро): (x, y) — центр. */
export function Sun({ x, y, r = 6, color = theme.alt }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={x + Math.cos((a * Math.PI) / 180) * (r + 2.5)} y1={y + Math.sin((a * Math.PI) / 180) * (r + 2.5)} x2={x + Math.cos((a * Math.PI) / 180) * (r + 5.5)} y2={y + Math.sin((a * Math.PI) / 180) * (r + 5.5)} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      ))}
    </g>
  )
}

/** Строка с квадратом слева; на кадре at квадрат отмечается галочкой. (x, y) — левый верхний угол квадрата. */
export function TickRow({ x, y, text, at, size = 22 }: { x: number; y: number; text: string; at: number; size?: number }) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 8)
  return (
    <g>
      <rect x={x} y={y} width={30} height={30} rx={7} fill={theme.okTint} fillOpacity={g} stroke={g > 0 ? theme.ok : theme.line} strokeWidth={3} />
      <path d={`M${x + 7} ${y + 16} L${x + 13} ${y + 22} L${x + 24} ${y + 9}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} fill="none" stroke={theme.ok} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={x + 46} y={y + 23} anchor="start" size={size} weight={600}>
        {text}
      </Label>
    </g>
  )
}
