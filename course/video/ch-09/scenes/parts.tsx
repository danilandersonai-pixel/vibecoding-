import type { ReactNode } from 'react'
import { theme } from '../../theme'

// Детали сцен ролика «Этика вайб-кодинга»: лист эссе, открытая книга, строки «кода» полосками,
// номер в кружке, замок, переключатель, клавиша, курсор, лупа, знак «осторожно», значки тем.
// Плашка, галочка, облако и реплика — Pill, Mark, Cloud и Callout из kit/props.tsx.

/** Лист эссе в линейку с полем слева: (x, y) — левый верхний угол; дети — в координатах холста. */
export function Sheet({ x, y, w, h, title, children }: { x: number; y: number; w: number; h: number; title: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x + 8} y={y + 8} width={w} height={h} rx={6} fill={theme.desk} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={theme.white} stroke={theme.line} strokeWidth={3} />
      <line x1={x + 46} y1={y + 6} x2={x + 46} y2={y + h - 6} stroke={theme.risk} strokeWidth={2} opacity={0.45} />
      <text x={x + 62} y={y + 42} fill={theme.ink} style={{ font: `700 24px ${theme.font}` }}>
        {title}
      </text>
      {children}
    </g>
  )
}

/** Открытая книга: (x, y) — середина корешка; glow (0–1) — подсветка абзаца на правой странице. */
export function OpenBook({ x, y, glow = 0 }: { x: number; y: number; glow?: number }) {
  const w = 130
  const h = 160
  const rows = [0, 1, 2, 3, 4, 5]
  return (
    <g>
      <path d={`M${x} ${y - h / 2 + 8} Q${x - w / 2} ${y - h / 2 - 8} ${x - w} ${y - h / 2} V${y + h / 2} Q${x - w / 2} ${y + h / 2 - 12} ${x} ${y + h / 2} Z`} fill={theme.white} stroke={theme.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${x} ${y - h / 2 + 8} Q${x + w / 2} ${y - h / 2 - 8} ${x + w} ${y - h / 2} V${y + h / 2} Q${x + w / 2} ${y + h / 2 - 12} ${x} ${y + h / 2} Z`} fill={theme.white} stroke={theme.ink} strokeWidth={3} strokeLinejoin="round" />
      <rect x={x + 12} y={y - 18} width={w - 26} height={70} rx={6} fill={theme.altTint} stroke={theme.alt} strokeWidth={2} opacity={glow} />
      {rows.map((i) => (
        <g key={i}>
          <rect x={x - w + 16} y={y - h / 2 + 22 + i * 22} width={w - 34 - (i % 3) * 12} height={8} rx={4} fill={theme.grid} />
          <rect x={x + 18} y={y - h / 2 + 22 + i * 22} width={w - 34 - ((i + 1) % 3) * 12} height={8} rx={4} fill={i >= 3 && i <= 5 && glow > 0 ? theme.alt : theme.grid} />
        </g>
      ))}
    </g>
  )
}

/**
 * Строки «кода» полосками: (x, y) — левый край и середина первой строки; shown — сколько строк видно.
 * hi — номера строк, которые подсвечиваются цветом hiColor с прозрачностью hiOpacity (поверх тех же полосок).
 */
export function CodeRows({ x, y, widths, step, shown = widths.length, color = theme.grid, hi = [], hiColor = theme.alt, hiOpacity = 1 }: { x: number; y: number; widths: number[]; step: number; shown?: number; color?: string; hi?: number[]; hiColor?: string; hiOpacity?: number }) {
  return (
    <g>
      {widths.slice(0, shown).map((w, i) => {
        const indent = i > 0 && i < widths.length - 1 ? 24 : 0
        return (
          <g key={i}>
            <rect x={x + indent} y={y + i * step - 6} width={w} height={12} rx={6} fill={color} />
            {hi.includes(i) && <rect x={x + indent} y={y + i * step - 6} width={w} height={12} rx={6} fill={hiColor} opacity={hiOpacity} />}
          </g>
        )
      })}
    </g>
  )
}

/** Номер в кружке с центром (x, y). */
export function Badge({ x, y, n, color = theme.accent, r = 18 }: { x: number; y: number; n: number | string; color?: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <text x={x} y={y + 7} textAnchor="middle" fill={theme.white} style={{ font: `700 20px ${theme.font}` }}>
        {n}
      </text>
    </g>
  )
}

/** Замок: (x, y) — середина корпуса; scale — масштаб. */
export function Lock({ x, y, color = theme.ink, scale = 1 }: { x: number; y: number; color?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-9 -6 V-14 A9 9 0 0 1 9 -14 V-6" fill="none" stroke={color} strokeWidth={4} />
      <rect x={-14} y={-7} width={28} height={22} rx={4} fill={color} />
      <circle cx={0} cy={3} r={3} fill={theme.white} />
    </g>
  )
}

/** Переключатель: (x, y) — середина; on (0–1) — насколько включён. */
export function Toggle({ x, y, on }: { x: number; y: number; on: number }) {
  return (
    <g>
      <rect x={x - 30} y={y - 16} width={60} height={32} rx={16} fill={on > 0.5 ? theme.ok : theme.grid} />
      <circle cx={x - 14 + 28 * on} cy={y} r={12} fill={theme.white} />
    </g>
  )
}

/** Клавиша с подписью: (x, y) — середина; pressed — нажата. */
export function Key({ x, y, text, pressed = false }: { x: number; y: number; text: string; pressed?: boolean }) {
  const w = Math.round(text.length * 20 * 0.6 + 34)
  const dy = pressed ? 3 : 0
  return (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height={44} rx={8} fill={theme.line} />
      <rect x={x - w / 2} y={y - 22 + dy} width={w} height={40} rx={8} fill={pressed ? theme.accentTint : theme.white} stroke={pressed ? theme.accent : theme.line} strokeWidth={2.5} />
      <text x={x} y={y + 5 + dy} textAnchor="middle" fill={theme.ink} style={{ font: `600 20px ${theme.mono}` }}>
        {text}
      </text>
    </g>
  )
}

/** Курсор мыши: (x, y) — кончик стрелки. */
export function Cursor({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} l0 30 l8 -8 l7 15 l6 -3 l-7 -14 l11 -1 Z`} fill={theme.ink} stroke={theme.white} strokeWidth={2} strokeLinejoin="round" />
}

/** Лупа: (x, y) — центр стекла, r — радиус. */
export function Lens({ x, y, r = 22, color = theme.accent }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.accentTint} stroke={color} strokeWidth={4} />
      <line x1={x + r * 0.7} y1={y + r * 0.7} x2={x + r * 1.5} y2={y + r * 1.5} stroke={color} strokeWidth={7} strokeLinecap="round" />
    </g>
  )
}

/** Знак «осторожно»: треугольник с восклицательным знаком, (x, y) — центр. */
export function Warn({ x, y, size = 40 }: { x: number; y: number; size?: number }) {
  const h = size * 0.87
  return (
    <g>
      <path d={`M${x} ${y - h / 2} L${x + size / 2} ${y + h / 2} L${x - size / 2} ${y + h / 2} Z`} fill={theme.risk} stroke={theme.risk} strokeWidth={4} strokeLinejoin="round" />
      <rect x={x - 2.5} y={y - h / 4} width={5} height={h * 0.4} rx={2} fill={theme.white} />
      <circle cx={x} cy={y + h * 0.3} r={3} fill={theme.white} />
    </g>
  )
}

/** Значок «чей код»: лист кода с бирочкой; (x, y) — центр. */
export function CodeTagIcon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 34} y={y - 40} width={68} height={80} rx={8} fill={theme.white} stroke={theme.accent} strokeWidth={4} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 22 + (i === 1 ? 8 : 0)} y={y - 24 + i * 16} width={i === 1 ? 32 : 40} height={8} rx={4} fill={theme.accent} opacity={0.5} />
      ))}
      <path d={`M${x + 20} ${y + 20} l24 0 l10 10 l-10 10 l-24 0 Z`} fill={theme.alt} />
      <circle cx={x + 28} cy={y + 30} r={3} fill={theme.white} />
    </g>
  )
}

/** Значок «что сказать»: облачко речи с буквами ИИ; (x, y) — центр. */
export function SayIcon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 46} y={y - 34} width={92} height={60} rx={18} fill={theme.white} stroke={theme.ok} strokeWidth={4} />
      <path d={`M${x - 18} ${y + 24} L${x - 30} ${y + 42} L${x - 2} ${y + 25}`} fill={theme.white} stroke={theme.ok} strokeWidth={4} strokeLinejoin="round" />
      <text x={x} y={y + 8} textAnchor="middle" fill={theme.ok} style={{ font: `800 26px ${theme.font}` }}>
        ИИ
      </text>
    </g>
  )
}

/** Значок «кого не отсечь»: три головы, крайняя — за чертой; (x, y) — центр. */
export function PeopleIcon({ x, y }: { x: number; y: number }) {
  const heads = [
    { dx: -38, color: theme.accent },
    { dx: 0, color: theme.ok },
    { dx: 46, color: theme.risk },
  ]
  return (
    <g>
      {heads.map((h) => (
        <g key={h.dx}>
          <circle cx={x + h.dx} cy={y - 14} r={13} fill={theme.paper} stroke={h.color} strokeWidth={4} />
          <path d={`M${x + h.dx - 18} ${y + 30} V${y + 14} Q${x + h.dx - 18} ${y + 2} ${x + h.dx} ${y + 2} Q${x + h.dx + 18} ${y + 2} ${x + h.dx + 18} ${y + 14} V${y + 30} Z`} fill={h.color} />
        </g>
      ))}
      <line x1={x + 24} y1={y - 36} x2={x + 24} y2={y + 36} stroke={theme.ink} strokeWidth={3} strokeDasharray="6 5" />
    </g>
  )
}
