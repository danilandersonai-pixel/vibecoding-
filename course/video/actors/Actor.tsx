import type { ReactNode } from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme } from '../theme'
import { labelFontSize } from './labelSize'

export type ActorProps = {
  x: number
  y: number
  scale?: number
  highlight?: boolean
  /** Кадр, с которого актёр появляется с пружинкой; без него — виден сразу. */
  enterAt?: number
  label?: string
}

// Общая обёртка актёров: позиция, масштаб, появление пружиной и подсветка.
export function Actor({ x, y, scale = 1, highlight, enterAt, label, children, width = 120, height = 160 }: ActorProps & { children: ReactNode; width?: number; height?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = enterAt === undefined ? 1 : spring({ frame: frame - enterAt, fps, config: { damping: 14 } })
  const fontSize = labelFontSize(scale)
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * pop})`} opacity={Math.min(1, pop * 1.5)}>
      {highlight && <rect x={-width / 2 - 14} y={-height / 2 - 14} width={width + 28} height={height + 28} rx={18} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />}
      {children}
      {label && (
        <text y={height / 2 + 8 + fontSize} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${fontSize}px ${theme.font}` }}>
          {label}
        </text>
      )}
    </g>
  )
}
