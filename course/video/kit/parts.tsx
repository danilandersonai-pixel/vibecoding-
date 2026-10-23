import type { ReactNode } from 'react'
import { theme } from '../theme'

// Мелкие детали сцен: подписи, стрелки, карточки.

export function Label({ x, y, children, color = theme.ink, size = 22, weight = 600, anchor = 'middle', opacity = 1 }: { x: number; y: number; children: ReactNode; color?: string; size?: number; weight?: number; anchor?: 'start' | 'middle' | 'end'; opacity?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} style={{ font: `${weight} ${size}px ${theme.font}` }}>
      {children}
    </text>
  )
}

/** Стрелка. progress — линия растёт, наконечник появляется в конце; draw (0–1) — стрелка «рисуется» вместе с наконечником. */
export function Arrow({ x1, y1, x2, y2, color = theme.line, dashed, progress = 1, draw }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; progress?: number; draw?: number }) {
  const p = draw ?? progress
  const x = x1 + (x2 - x1) * p
  const y = y1 + (y2 - y1) * p
  const a = Math.atan2(y2 - y1, x2 - x1)
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={3} strokeDasharray={dashed ? '8 8' : undefined} />
      {(draw === undefined ? p >= 1 : p > 0) && <path d="M0 0 L-14 -7 L-14 7 Z" fill={color} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`} />}
    </g>
  )
}

/** Карточка с текстом на холсте (подсказки, пропуска, итоги). */
export function Card({ x, y, w, h, children, stroke = theme.line, fill = theme.paper, opacity = 1 }: { x: number; y: number; w: number; h: number; children?: ReactNode; stroke?: string; fill?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={stroke} strokeWidth={3} />
      {children}
    </g>
  )
}
