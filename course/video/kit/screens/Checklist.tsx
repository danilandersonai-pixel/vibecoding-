import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow, revealCount } from '../reveal'
import { CHECK_PAD, CHECK_ROW, checklistHeight } from './layout'
import { Window } from './Window'

const EVERY = 16 // галочка каждые 16 кадров

// Чек-лист: первые done пунктов отмечаются галочками по одной.
export function Checklist({ x, y, w, at, items, done }: { x: number; y: number; w: number; at: number; items: string[]; done: number }) {
  const frame = useCurrentFrame()
  const start = at + 16
  const ticked = revealCount(frame, start, EVERY, Math.min(done, items.length))
  return (
    <Window x={x} y={y} w={w} h={checklistHeight(items.length)} at={at}>
      {items.map((item, i) => {
        const g = i < ticked ? grow(frame, start + i * EVERY, 8) : 0
        const ry = CHECK_PAD + i * CHECK_ROW
        return (
          <g key={i} transform={`translate(${CHECK_PAD + 4} ${ry + (CHECK_ROW - 30) / 2})`}>
            <rect width={30} height={30} rx={7} fill={theme.okTint} fillOpacity={g} stroke={g > 0 ? theme.ok : theme.line} strokeWidth={3} />
            <path d="M7 16 L13 22 L24 9" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} fill="none" stroke={theme.ok} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <text x={46} y={23} fill={theme.ink} style={{ font: `500 22px ${theme.font}` }}>
              {item}
            </text>
          </g>
        )
      })}
    </Window>
  )
}
