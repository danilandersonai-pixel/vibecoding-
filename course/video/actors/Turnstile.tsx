import { interpolate } from 'remotion'
import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

// Турникет в зале — метафора RLS. open от 0 (закрыт) до 1 (планка поднята).
export function Turnstile({ open = 0, ...props }: ActorProps & { open?: number }) {
  const angle = interpolate(open, [0, 1], [0, -80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const color = open > 0.5 ? theme.ok : theme.risk
  return (
    <Actor label="RLS" {...props} width={160} height={170}>
      <rect x={-70} y={-80} width={24} height={160} rx={6} fill={theme.ink} />
      <rect x={46} y={-80} width={24} height={160} rx={6} fill={theme.ink} />
      <circle cx={-58} cy={-60} r={8} fill={color} />
      <g transform={`translate(-46 0) rotate(${angle})`}>
        <rect x={0} y={-7} width={100} height={14} rx={7} fill={color} />
      </g>
    </Actor>
  )
}
