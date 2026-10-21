import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow, revealCount } from '../reveal'
import { BAR, EDITOR_PAD, LH, editorHeight } from './layout'
import { Mono, Window } from './Window'

const GUTTER = 56
const EVERY = 5 // новая строка кода каждые 5 кадров

// Редактор кода: вкладка с именем файла, строки появляются по одной, нужные — подсвечены.
// highlight — номера строк так, как они показаны слева (с 1).
export function Editor({ x, y, w, at, file, lines, highlight = [] }: { x: number; y: number; w: number; at: number; file: string; lines: string[]; highlight?: number[] }) {
  const frame = useCurrentFrame()
  const start = at + 12
  const shown = revealCount(frame, start, EVERY, lines.length)
  const top = BAR + EDITOR_PAD
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={editorHeight(lines.length)}
      at={at}
      bar={
        <>
          <rect x={16} y={6} width={file.length * 11 + 32} height={BAR - 6} rx={6} fill={theme.paper} />
          <rect x={16} y={6} width={file.length * 11 + 32} height={4} rx={2} fill={theme.accent} />
          <Mono x={32} y={BAR / 2 + 8} size={18} fill={theme.ink}>
            {file}
          </Mono>
        </>
      }
    >
      <line x1={GUTTER} y1={BAR} x2={GUTTER} y2={editorHeight(lines.length)} stroke={theme.grid} strokeWidth={2} />
      {highlight.map((n) => {
        const g = grow(frame, start + (n - 1) * EVERY + 6, 10)
        return (
          <g key={n} opacity={g}>
            <rect x={3} y={top + (n - 1) * LH} width={w - 6} height={LH} fill={theme.altTint} />
            <rect x={3} y={top + (n - 1) * LH} width={5} height={LH} fill={theme.alt} />
          </g>
        )
      })}
      {lines.slice(0, shown).map((line, i) => (
        <g key={i}>
          <text x={GUTTER - 12} y={top + i * LH + 23} textAnchor="end" fill={theme.soft} style={{ font: `500 18px ${theme.mono}` }}>
            {i + 1}
          </text>
          <Mono x={GUTTER + 14} y={top + i * LH + 23} fill={theme.ink}>
            {line}
          </Mono>
        </g>
      ))}
    </Window>
  )
}
