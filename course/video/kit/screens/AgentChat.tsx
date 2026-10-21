import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow, typed } from '../reveal'
import { AGENT_CPS, BAR, CHAT_FONT, CHAT_LINE, CHAT_MARGIN, CHAT_PAD_X, CHAT_PAD_Y, chatLayout, type ChatMessage } from './layout'
import { Window } from './Window'

export type { ChatMessage }

// Чат с агентом: мои сообщения справа, ответы агента слева и «печатаются».
export function AgentChat({ x, y, w, at, messages }: { x: number; y: number; w: number; at: number; messages: ChatMessage[] }) {
  const frame = useCurrentFrame()
  const { items, height } = chatLayout(messages, w, at)
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={height}
      at={at}
      bar={
        <>
          <circle cx={24} cy={BAR / 2} r={7} fill={theme.ok} />
          <text x={42} y={BAR / 2 + 6} fill={theme.ink} style={{ font: `600 18px ${theme.font}` }}>
            Чат с агентом
          </text>
        </>
      }
    >
      {items.map((m, i) => {
        if (frame < m.start) return null
        const mine = m.from === 'me'
        const g = grow(frame, m.start, 8)
        const bx = mine ? w - CHAT_MARGIN - m.bubbleW : CHAT_MARGIN
        // сколько знаков уже напечатано; у моих сообщений — весь текст
        let left = mine ? m.text.length : typed(m.text, frame, m.start, AGENT_CPS).length
        const visible = m.lines.map((line) => {
          const part = line.slice(0, Math.max(0, left))
          left -= line.length + 1
          return part
        })
        const rows = Math.max(1, visible.filter((l) => l !== '').length)
        return (
          <g key={i} opacity={g} transform={`translate(0 ${(1 - g) * 10})`}>
            <rect x={bx} y={m.top} width={m.bubbleW} height={rows * CHAT_LINE + CHAT_PAD_Y * 2} rx={14} fill={mine ? theme.accentTint : theme.codeBg} stroke={mine ? theme.accent : theme.line} strokeWidth={2} />
            {visible.map((line, j) => (
              <text key={j} x={bx + CHAT_PAD_X} y={m.top + CHAT_PAD_Y + j * CHAT_LINE + 21} fill={theme.ink} style={{ font: `500 ${CHAT_FONT}px ${theme.font}` }}>
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </Window>
  )
}
