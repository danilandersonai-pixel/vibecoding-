import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { typedCount } from '../motion'
import { MOTION, T } from '../theme'
import { COLS, TEXT_X, cells } from './geometry'
import { lastRow, plan, scrollAt, timeline } from './terminalPlan'
import type { TerminalSpec } from './terminalPlan'
import { Cursor, Row, Window } from './Window'

type Props = { spec: TerminalSpec; clock: Clock; ctx: FrameCtx }

// Первые n знаков строки (по знакам, а не по кодовым единицам).
const take = (text: string, n: number) => [...text].slice(0, Math.max(0, n)).join('')

/** Терминал: чистая функция номера кадра. */
export function Terminal({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  const tl = timeline(p, clock)
  const scroll = scrollAt(lastRow(p, tl, frame))
  const row = (r: number) => r - scroll // строка окна, на которой сейчас стоит строка терминала r
  const onScreen = (r: number) => r >= scroll

  // Курсор стоит у подсказки, пока её команда ждёт, набирается и не начался вывод; при наборе горит, в ожидании мигает
  const cursors = p.entries.map((e, i) => {
    const t = tl[i]
    if (e.cmdRows.length === 0 || frame < t.promptAt || frame >= (t.lineAt[0] ?? t.typedEnd + MOTION.stagger)) return null
    const typing = frame >= t.start && frame < t.typedEnd
    const idleSince = frame < t.start ? t.promptAt : t.typedEnd
    if (!typing && Math.floor((frame - idleSince) / MOTION.blink) % 2 === 1) return null
    const at = [...e.prompt].length + typedCount(e.cmd, frame, t.start)
    const r = Math.min(Math.floor(at / COLS), e.cmdRows.length - 1)
    return onScreen(e.cmdRow + r) ? <Cursor key={e.event} x={TEXT_X + cells(at - r * COLS)} row={row(e.cmdRow + r)} /> : null
  })

  return (
    <Window title={spec.title ?? 'Терминал'} tone="term">
      {p.entries.map((e, i) => {
        const t = tl[i]
        const typed = [...e.prompt].length + typedCount(e.cmd, frame, t.start)
        return (
          <g key={e.event}>
            {e.cmdRows.length > 0 && frame >= t.promptAt && onScreen(e.cmdRow + e.cmdRows.length - 1) && (
              <g data-part={`cmd:${e.event}`}>
                {e.cmdRows.map((text, r) => {
                  const shown = take(text, typed - r * COLS)
                  const prompt = take(shown, [...e.prompt].length - r * COLS)
                  return (
                    onScreen(e.cmdRow + r) &&
                    shown !== '' && (
                      <Row key={r} x={TEXT_X} row={row(e.cmdRow + r)} fill={T.ink} weight={700} chars={[...shown].length}>
                        <tspan fill={T.faint} fontWeight={500}>
                          {prompt}
                        </tspan>
                        {[...shown].slice([...prompt].length).join('')}
                      </Row>
                    )
                  )
                })}
              </g>
            )}
            {e.lines.map(
              (l, k) =>
                frame >= t.lineAt[k] &&
                onScreen(l.row + l.rows.length - 1) && (
                  <g key={k} data-part={`line:${e.event}:${k}`}>
                    {l.rows.map(
                      (text, r) =>
                        onScreen(l.row + r) && (
                          <Row key={r} x={TEXT_X} row={row(l.row + r)} fill={l.err ? T.err : T.ink} chars={[...text].length}>
                            {text}
                          </Row>
                        ),
                    )}
                  </g>
                ),
            )}
          </g>
        )
      })}
      {cursors}
    </Window>
  )
}

