import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { typed } from '../reveal'
import { BAR, LH, TERM_CPS, TERM_PAD, terminalHeight, terminalStarts, type TermLine } from './layout'
import { Mono, Window } from './Window'

export type { TermLine }

const COLOR = { cmd: theme.termText, out: theme.termText, ok: theme.termOk, err: theme.termErr } as const

// Тёмный терминал: команды набираются с курсором, вывод появляется по строке.
export function Terminal({ x, y, w, at, lines }: { x: number; y: number; w: number; at: number; lines: TermLine[] }) {
  const frame = useCurrentFrame()
  const starts = terminalStarts(lines, at)
  const started = starts.filter((s) => frame >= s).length
  const blink = Math.floor(frame / 8) % 2 === 0
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={terminalHeight(lines.length)}
      at={at}
      bodyFill={theme.termBg}
      barFill={theme.termBar}
      stroke={theme.termBar}
      bar={
        <>
          <circle cx={22} cy={BAR / 2} r={6} fill={theme.termErr} />
          <circle cx={42} cy={BAR / 2} r={6} fill={theme.alt} />
          <circle cx={62} cy={BAR / 2} r={6} fill={theme.termOk} />
          <text x={86} y={BAR / 2 + 6} fill={theme.termDim} style={{ font: `500 18px ${theme.font}` }}>
            Терминал
          </text>
        </>
      }
    >
      {lines.slice(0, started).map((line, i) => {
        const base = BAR + TERM_PAD + i * LH + 23
        if (line.kind !== 'cmd') {
          return (
            <Mono key={i} x={TERM_PAD} y={base} fill={COLOR[line.kind]}>
              {line.text}
            </Mono>
          )
        }
        const shown = typed(line.text, frame, starts[i], TERM_CPS)
        const cursor = i === started - 1 && blink
        return (
          <Mono key={i} x={TERM_PAD} y={base} fill={theme.termText}>
            <tspan fill={theme.termDim}>{'$ '}</tspan>
            {shown}
            <tspan fill={theme.termDim} opacity={cursor ? 1 : 0}>
              █
            </tspan>
          </Mono>
        )
      })}
    </Window>
  )
}
