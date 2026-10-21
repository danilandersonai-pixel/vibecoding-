import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

export type DbRow = { text: string; color: string; dim?: boolean }

// База данных: цилиндр, внутри — строки таблицы, у каждой цвет владельца.
export function Database({ rows = [], ...props }: ActorProps & { rows?: DbRow[] }) {
  const h = Math.max(150, 60 + rows.length * 40)
  return (
    <Actor label="База данных" {...props} width={240} height={h}>
      <path d={`M-120 ${-h / 2 + 20} L-120 ${h / 2 - 20} A120 22 0 0 0 120 ${h / 2 - 20} L120 ${-h / 2 + 20}`} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <ellipse cx={0} cy={-h / 2 + 20} rx={120} ry={22} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      {rows.map((r, i) => (
        <g key={i} opacity={r.dim ? 0.25 : 1}>
          <rect x={-96} y={-h / 2 + 52 + i * 40} width={192} height={32} rx={6} fill={theme.paper} stroke={r.color} strokeWidth={3} />
          <rect x={-96} y={-h / 2 + 52 + i * 40} width={10} height={32} rx={3} fill={r.color} />
          <text x={-76} y={-h / 2 + 74 + i * 40} fill={theme.ink} style={{ font: `500 18px ${theme.mono}` }}>
            {r.text}
          </text>
        </g>
      ))}
    </Actor>
  )
}
