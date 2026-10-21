import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

export function Server(props: ActorProps) {
  return (
    <Actor label="Сервер" {...props} width={140} height={170}>
      {[-60, -5, 50].map((y) => (
        <g key={y}>
          <rect x={-70} y={y - 25} width={140} height={48} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
          <circle cx={-48} cy={y} r={6} fill={theme.ok} />
          <rect x={-30} y={y - 4} width={80} height={8} rx={4} fill={theme.grid} />
        </g>
      ))}
    </Actor>
  )
}
