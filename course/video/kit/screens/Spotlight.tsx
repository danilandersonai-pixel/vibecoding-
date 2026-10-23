import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow } from '../reveal'

// Затемняет всё, кроме круга: «смотрите сюда». Рисуется поверх остального в сцене.
export function Spotlight({ x, y, r, at = 0 }: { x: number; y: number; r: number; at?: number }) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 12)
  // большой прямоугольник с круглой дыркой (even-odd); запас на камеру с приближением
  const hole = `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`
  return (
    <g opacity={g}>
      <path d={`M-2000 -2000 H3280 V2720 H-2000 Z ${hole}`} fill={theme.ink} fillOpacity={0.62} fillRule="evenodd" />
      <circle cx={x} cy={y} r={r} fill="none" stroke={theme.accent} strokeWidth={4} />
    </g>
  )
}
