import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow } from '../reveal'
import { BAR } from './layout'

type Props = {
  x: number
  y: number
  w: number
  h: number
  /** Кадр, с которого окно появляется. */
  at: number
  /** Содержимое полосы заголовка (в координатах окна); без него полосы нет. */
  bar?: ReactNode
  barFill?: string
  bodyFill?: string
  stroke?: string
  children: ReactNode
}

// Общее окно экранов: скруглённая рамка, полоса заголовка и мягкое появление снизу.
// Дети рисуются в координатах окна: (0, 0) — левый верхний угол.
export function Window({ x, y, w, h, at, bar, barFill = theme.codeBg, bodyFill = theme.paper, stroke = theme.line, children }: Props) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 10)
  const r = 12
  return (
    <g transform={`translate(${x} ${y + (1 - g) * 16})`} opacity={g}>
      <rect width={w} height={h} rx={r} fill={bodyFill} />
      {bar !== undefined && (
        <>
          <path d={`M0 ${BAR} V${r} Q0 0 ${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${BAR} Z`} fill={barFill} />
          {bar}
        </>
      )}
      {children}
      <rect width={w} height={h} rx={r} fill="none" stroke={stroke} strokeWidth={3} />
    </g>
  )
}

/** Строка моноширинного текста; пробелы в начале сохраняются. */
export function Mono({ x, y, size = 20, fill, children }: { x: number; y: number; size?: number; fill: string; children: ReactNode }) {
  return (
    <text x={x} y={y} fill={fill} style={{ font: `500 ${size}px ${theme.mono}`, whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
      {children}
    </text>
  )
}
