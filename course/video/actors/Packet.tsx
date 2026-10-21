import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

// Запрос в пути: карточка с адресом, например «client/17».
export function Packet({ text, color = theme.accent, ...props }: ActorProps & { text: string; color?: string }) {
  const w = Math.max(120, text.length * 13 + 36)
  return (
    <Actor {...props} width={w} height={48}>
      <rect x={-w / 2} y={-24} width={w} height={48} rx={10} fill={theme.paper} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={7} fill={color} style={{ font: `600 20px ${theme.mono}` }}>
        {text}
      </text>
    </Actor>
  )
}
