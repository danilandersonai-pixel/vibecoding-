import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { screenFont } from './labelSize'

export type DbRow = { text: string; color: string; dim?: boolean }

// База данных: цилиндр, внутри — строки таблицы, у каждой цвет владельца.
// У уменьшенной базы шрифт строк крупнее (на экране не мельче 18 px), строки растут вместе с ним.
export function Database({ rows = [], ...props }: ActorProps & { rows?: DbRow[] }) {
  const font = screenFont(18, props.scale ?? 1)
  const rowH = Math.round(font + 14)
  const step = rowH + 8
  const longest = Math.max(0, ...rows.map((r) => r.text.length))
  const rowW = Math.max(192, Math.round(longest * font * 0.62 + 40))
  const rx = rowW / 2 + 24
  const h = Math.max(150, 60 + rows.length * step)
  return (
    <Actor label="База данных" {...props} width={rx * 2} height={h}>
      <path d={`M${-rx} ${-h / 2 + 20} L${-rx} ${h / 2 - 20} A${rx} 22 0 0 0 ${rx} ${h / 2 - 20} L${rx} ${-h / 2 + 20}`} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <ellipse cx={0} cy={-h / 2 + 20} rx={rx} ry={22} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      {rows.map((r, i) => {
        const top = -h / 2 + 52 + i * step
        return (
          <g key={i} opacity={r.dim ? 0.25 : 1}>
            <rect x={-rowW / 2} y={top} width={rowW} height={rowH} rx={6} fill={theme.paper} stroke={r.color} strokeWidth={3} />
            <rect x={-rowW / 2} y={top} width={10} height={rowH} rx={3} fill={r.color} />
            <text x={-rowW / 2 + 20} y={top + rowH / 2 + font * 0.36} fill={theme.ink} style={{ font: `500 ${font}px ${theme.mono}` }}>
              {r.text}
            </text>
          </g>
        )
      })}
    </Actor>
  )
}
