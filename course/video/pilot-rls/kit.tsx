import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { theme } from '../theme'

// Мелкие детали сцен пилота: сцена-холст, подписи, стрелки, движение по ключевым кадрам.

export function Stage({ children, chip }: { children: ReactNode; chip: string }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <svg viewBox="0 0 1280 720" width={1280} height={720} style={{ fontFamily: theme.font }}>
        {children}
      </svg>
      <div style={{ position: 'absolute', left: 32, top: 24, padding: '6px 14px', borderRadius: 999, background: theme.accentTint, color: theme.accent, font: `600 20px ${theme.font}` }}>{chip}</div>
    </AbsoluteFill>
  )
}

export function Label({ x, y, children, color = theme.ink, size = 22, weight = 600, anchor = 'middle', opacity = 1 }: { x: number; y: number; children: ReactNode; color?: string; size?: number; weight?: number; anchor?: 'start' | 'middle' | 'end'; opacity?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} style={{ font: `${weight} ${size}px ${theme.font}` }}>
      {children}
    </text>
  )
}

export function Arrow({ x1, y1, x2, y2, color = theme.line, dashed, progress = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; progress?: number }) {
  const x = x1 + (x2 - x1) * progress
  const y = y1 + (y2 - y1) * progress
  const a = Math.atan2(y2 - y1, x2 - x1)
  return (
    <g opacity={progress > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={3} strokeDasharray={dashed ? '8 8' : undefined} />
      {progress >= 1 && <path d="M0 0 L-14 -7 L-14 7 Z" fill={color} transform={`translate(${x2} ${y2}) rotate(${(a * 180) / Math.PI})`} />}
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
