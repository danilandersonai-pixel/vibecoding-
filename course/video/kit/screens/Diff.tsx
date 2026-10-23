import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { revealCount } from '../reveal'
import { BAR, DIFF_PAD, LH, diffHeight } from './layout'
import { Mono, Window } from './Window'

export type DiffLine = { text: string; kind: 'add' | 'del' | 'same' }

const EVERY = 4 // новая строка каждые 4 кадра

const STYLE = {
  add: { mark: '+', fill: theme.okTint, color: theme.ok },
  del: { mark: '-', fill: theme.riskTint, color: theme.risk },
  same: { mark: '', fill: 'none', color: theme.soft },
} as const

// Что изменилось в файле: добавленные строки зелёным, удалённые красным.
export function Diff({ x, y, w, at, lines }: { x: number; y: number; w: number; at: number; lines: DiffLine[] }) {
  const frame = useCurrentFrame()
  const shown = revealCount(frame, at + 12, EVERY, lines.length)
  const top = BAR + DIFF_PAD
  const adds = lines.filter((l) => l.kind === 'add').length
  const dels = lines.filter((l) => l.kind === 'del').length
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={diffHeight(lines.length)}
      at={at}
      bar={
        <>
          <text x={18} y={BAR / 2 + 6} fill={theme.ink} style={{ font: `600 18px ${theme.font}` }}>
            Изменения
          </text>
          <text x={w - 18} y={BAR / 2 + 6} textAnchor="end" style={{ font: `600 18px ${theme.mono}` }}>
            <tspan fill={theme.ok}>{`+${adds}`}</tspan>
            <tspan fill={theme.risk}>{` -${dels}`}</tspan>
          </text>
        </>
      }
    >
      {lines.slice(0, shown).map((line, i) => {
        const s = STYLE[line.kind]
        return (
          <g key={i}>
            <rect x={3} y={top + i * LH} width={w - 6} height={LH} fill={s.fill} />
            <Mono x={18} y={top + i * LH + 23} fill={s.color}>
              {s.mark}
            </Mono>
            <Mono x={44} y={top + i * LH + 23} fill={line.kind === 'same' ? theme.soft : s.color}>
              {line.text}
            </Mono>
          </g>
        )
      })}
    </Window>
  )
}
