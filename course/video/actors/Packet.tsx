import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { screenFont } from './labelSize'

// Запрос в пути: карточка с адресом, например «client/17».
// У уменьшенной карточки шрифт крупнее (на экране не мельче 18 px), карточка растёт вместе с ним.
export function Packet({ text, color = theme.accent, ...props }: ActorProps & { text: string; color?: string }) {
  const font = screenFont(20, props.scale ?? 1)
  const w = Math.max(120, Math.round(text.length * font * 0.65 + 36))
  const h = Math.round(font + 28)
  return (
    <Actor {...props} width={w} height={h}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={theme.paper} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={font * 0.35} fill={color} style={{ font: `600 ${font}px ${theme.mono}` }}>
        {text}
      </text>
    </Actor>
  )
}
