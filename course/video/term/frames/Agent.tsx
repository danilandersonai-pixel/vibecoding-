import { Fragment } from 'react'
import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear, typedCount } from '../motion'
import { MOTION, SAFE, T } from '../theme'
import { BOX, MODE_ROW, REPLY, X0, boxRect, cursorUntil, plan, timeline } from './agentPlan'
import type { AgentSpec, StepLine } from './agentPlan'
import { FILL, SIGN } from './diffPlan'
import { LH, WIN, cells, rowTop, take } from './geometry'
import { Cursor, Row, Window } from './Window'

type Props = { spec: AgentSpec; clock: Clock; ctx: FrameCtx }

// Строки одного StepLine. Диффу — подложка и цветной знак, команде — faint «$ », остальным — просто текст.
function LineRows({ line }: { line: StepLine }) {
  const x = X0 + cells(line.col)
  return (
    <>
      {line.rows.map((text, r) => {
        const kind = line.diff?.kind
        const fill = kind ? FILL[kind] : undefined
        const signed = line.diff !== undefined && line.diff.sign !== ''
        const chars = [...text].length + (signed ? 1 : 0)
        const dim = r === 0 && line.dim ? Math.min(line.dim, [...text].length) : 0
        return (
          <Fragment key={r}>
            {fill && <rect x={x - 8} y={rowTop(line.row + r)} width={SAFE.x + SAFE.w - WIN.border - (x - 8)} height={LH} fill={fill} />}
            <Row role={line.role} x={x} row={line.row + r} fill={line.fill} weight={line.weight} chars={chars}>
              {signed && <tspan fill={SIGN[kind!]}>{r === 0 ? line.diff!.sign : ' '}</tspan>}
              {dim > 0 && (
                <tspan fill={T.faint} fontWeight={500}>
                  {take(text, dim)}
                </tspan>
              )}
              {dim > 0 ? [...text].slice(dim).join('') : text}
            </Row>
          </Fragment>
        )
      })}
    </>
  )
}

/** Агент: чистая функция номера кадра. */
export function Agent({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  if (!p.ok) return <Window title="Claude Code" tone="term">{null}</Window>
  const t = timeline(spec, p, clock)

  // Запрос: рамка растёт вместе с набранным текстом, знаки набираются по строкам
  const typed = typedCount(p.promptText, frame, t.promptAt)
  const begun = p.prompt.filter((r) => r.from < typed).length
  const rows = Math.max(1, begun)
  const box = boxRect(rows)

  // Курсор: в конце набранного; при наборе горит, потом мигает, пока не появилось следующее за запросом
  let cursor: JSX.Element | null = null
  if (frame < cursorUntil(t)) {
    const typing = frame >= t.promptAt && frame < t.typedEnd
    const idleSince = frame < t.promptAt ? 0 : t.typedEnd
    if (typing || Math.floor((frame - idleSince) / MOTION.blink) % 2 === 0) {
      const r = Math.max(0, begun - 1)
      const col = Math.min(typed - p.prompt[r].from, [...p.prompt[r].text].length)
      cursor = <Cursor x={X0 + cells(2 + col)} row={r} />
    }
  }

  return (
    <Window title="Claude Code" tone="term">
      <g data-part="prompt">
        <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8} fill="none" stroke={T.line} strokeWidth={2} />
        <Row x={X0} row={0} fill={T.faint} weight={700} chars={1}>
          {'>'}
        </Row>
        {p.prompt.map((r, i) => {
          const shown = take(r.text, typed - r.from)
          return (
            shown !== '' && (
              <Row key={i} x={X0 + cells(2)} row={i} fill={T.ink} chars={[...shown].length}>
                {shown}
              </Row>
            )
          )
        })}
      </g>
      {cursor}
      {p.steps.map((s, i) => {
        const start = t.steps[i]
        if (frame < start) return null
        return (
          <g key={s.id} data-part={`step:${s.id}`}>
            {s.lines.map((l, k) => frame >= start + l.delay && <LineRows key={k} line={l} />)}
          </g>
        )
      })}
      {frame >= t.reply && (
        <g data-part="reply">
          {p.reply.lines.map((text, j) => {
            const o = appear(frame, t.reply + j * MOTION.stagger)
            return (
              o > 0 && (
                <text key={j} x={X0} y={rowTop(p.reply.row) + j * REPLY.line + REPLY.base} fill={T.soft} opacity={o} style={{ fontFamily: T.font, fontSize: REPLY.size, fontWeight: 500 }}>
                  {text}
                </text>
              )
            )
          })}
        </g>
      )}
      {p.code && t.code !== null && frame >= t.code && (
        <g data-part="code">
          <rect x={BOX.x} y={rowTop(p.code.row)} width={BOX.w} height={p.code.rows * LH} rx={8} fill={T.raised} />
          {p.code.lines.map(
            (l, k) =>
              frame >= t.code! + k * MOTION.stagger &&
              l.rows.map((text, r) => (
                <Row key={`${k}-${r}`} role="code" x={X0} row={l.row + r} fill={T.ink} chars={[...text].length}>
                  {text}
                </Row>
              )),
          )}
        </g>
      )}
      {spec.mode && (
        <g data-part="mode">
          <rect x={SAFE.x + WIN.border} y={rowTop(MODE_ROW) - 2} width={SAFE.w - 2 * WIN.border} height={2} fill={T.edge} />
          <Row x={X0} row={MODE_ROW} fill={T.faint} chars={[...spec.mode].length}>
            {spec.mode}
          </Row>
        </g>
      )}
    </Window>
  )
}
