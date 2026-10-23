import { useCurrentFrame } from 'remotion'
import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

export type AgentPose = 'idle' | 'working' | 'done'

// Цвет индикатора состояния: серый — ждёт, жёлтый — работает, зелёный — готово.
const LIGHT: Record<AgentPose, string> = { idle: theme.line, working: theme.alt, done: theme.ok }

// Руки: ждёт — опущены, работает — перед корпусом, готово — правая поднята.
const ARMS: Record<AgentPose, { left: string; right: string; hands: [number, number][] }> = {
  idle: { left: 'M-34 14 L-48 34 L-46 50', right: 'M34 14 L48 34 L46 50', hands: [[-46, 50], [46, 50]] },
  working: { left: 'M-34 14 L-48 34 L-20 34', right: 'M34 14 L48 34 L20 34', hands: [[-20, 34], [20, 34]] },
  done: { left: 'M-34 14 L-48 34 L-46 50', right: 'M34 14 L56 -4 L58 -38', hands: [[-46, 50], [58, -38]] },
}

// Робот-помощник: антенна, экран-лицо, корпус и индикатор состояния.
export function Agent({ pose = 'idle', ...props }: ActorProps & { pose?: AgentPose }) {
  const frame = useCurrentFrame()
  const arms = ARMS[pose]
  // Пока агент работает, индикатор мягко мигает.
  const lightOpacity = pose === 'working' ? 0.6 + 0.4 * Math.sin(frame / 4) : 1
  return (
    <Actor label="Агент" {...props} width={120} height={170}>
      <path d="M0 -66 L0 -80" stroke={theme.accent} strokeWidth={5} strokeLinecap="round" />
      <circle cx={0} cy={-82} r={7} fill={theme.accent} />
      <rect x={-34} y={-4} width={68} height={68} rx={14} fill={theme.accent} />
      {[arms.left, arms.right].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={theme.accent} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {arms.hands.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
      ))}
      <circle cx={0} cy={44} r={8} fill={LIGHT[pose]} stroke={theme.paper} strokeWidth={3} opacity={lightOpacity} />
      <rect x={-40} y={-66} width={80} height={56} rx={14} fill={theme.paper} stroke={theme.accent} strokeWidth={5} />
      <g fill="none" stroke={theme.ink} strokeWidth={4} strokeLinecap="round">
        {pose === 'idle' && (
          <>
            <path d="M-20 -42 L-8 -42 M8 -42 L20 -42" />
            <path d="M-8 -24 L8 -24" />
          </>
        )}
        {pose === 'working' && (
          <>
            <circle cx={-14} cy={-42} r={4.5} fill={theme.ink} stroke="none" />
            <circle cx={14} cy={-42} r={4.5} fill={theme.ink} stroke="none" />
            <path d="M-12 -24 L-11 -24 M0 -24 L1 -24 M12 -24 L13 -24" strokeWidth={5} />
          </>
        )}
        {pose === 'done' && (
          <>
            <path d="M-22 -39 Q-14 -49 -6 -39 M6 -39 Q14 -49 22 -39" />
            <path d="M-12 -28 Q0 -18 12 -28" />
          </>
        )}
      </g>
    </Actor>
  )
}
