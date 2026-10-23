import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'
import { levelColor, type Level } from '../layout'

// Детали сцен ролика дня 20 «Бета-тест: исправления»: строка списка, карточка замечания,
// заголовок ступени, строка с галочкой. Плашка, галочка, облако, реплика и пунктирное место —
// Pill, Mark, Cloud, Callout и Slot из kit/props.tsx.

/** Текст строки; при strike — зачёркнут по своей ширине (line-through), бледнее. */
export function RowText({ x, y, children, size = 20, weight = 600, color = theme.ink, strike = false }: { x: number; y: number; children: string; size?: number; weight?: number; color?: string; strike?: boolean }) {
  return (
    <text x={x} y={y} fill={strike ? theme.soft : color} style={{ font: `${weight} ${size}px ${theme.font}`, textDecoration: strike ? 'line-through' : 'none' }}>
      {children}
    </text>
  )
}

/** Строка списка замечаний: кто (жирно) и о чём; (x, y) — левый край и базовая линия; struck 0…1 — зачёркивается. */
export function RemarkRow({ x, y, who, text, nameW = 92, color = theme.ink, struck = 0 }: { x: number; y: number; who: string; text: string; nameW?: number; color?: string; struck?: number }) {
  const strike = struck >= 0.5
  return (
    <g opacity={1 - 0.4 * struck}>
      <RowText x={x} y={y} weight={800} color={color} strike={strike}>
        {who}
      </RowText>
      <RowText x={x + nameW} y={y} strike={strike}>
        {text}
      </RowText>
    </g>
  )
}

/** Карточка замечания на ступени: (x, y) — левый верхний угол; цвет рамки — по ступени; glow — подсветка 0…1. */
export function RemarkCard({ x, y, w, h, who, text, level, glow = 0 }: { x: number; y: number; w: number; h: number; who: string; text: string; level: Level; glow?: number }) {
  const c = levelColor(level)
  return (
    <g>
      <rect x={x + 4} y={y + 5} width={w} height={h} rx={10} fill={theme.desk} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.white} stroke={c.color} strokeWidth={3} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={8} fill={c.fill} opacity={glow} />
      <Label x={x + 16} y={y + 28} anchor="start" size={18} weight={800} color={c.color}>
        {who}
      </Label>
      <Label x={x + 16} y={y + 56} anchor="start" size={18} weight={600}>
        {text}
      </Label>
    </g>
  )
}

/** Заголовок ступени: кружок с номером, название и пояснение; (x, y) — левый верхний угол, h — высота ступени. */
export function LevelHead({ x, y, w, h, n, title, sub }: { x: number; y: number; w: number; h: number; n: Level; title: string; sub: string }) {
  const c = levelColor(n)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={c.fill} stroke={c.color} strokeWidth={3} />
      <circle cx={x + 24} cy={y + h / 2} r={15} fill={c.color} />
      <Label x={x + 24} y={y + h / 2 + 7} size={20} weight={800} color={theme.white}>
        {String(n)}
      </Label>
      <Label x={x + 48} y={y + h / 2 - 6} anchor="start" size={20} weight={800} color={c.color}>
        {title}
      </Label>
      <Label x={x + 48} y={y + h / 2 + 22} anchor="start" size={18} weight={600} color={theme.soft}>
        {sub}
      </Label>
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

/** Флажок запуска: древко и полотнище; (x, y) — низ древка. */
export function Flag({ x, y, color = theme.ok }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 40} stroke={theme.ink} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${x} ${y - 40} L${x + 28} ${y - 32} L${x} ${y - 24} Z`} fill={color} />
    </g>
  )
}
