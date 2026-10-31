import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { MOTION, T } from '../theme'
import { LH, cells } from './geometry'
import { DIRTY_LABEL, LANE, edgePath, headAt, laneX, plan, rowFor } from './gitLogPlan'
import type { GitLogSpec } from './gitLogPlan'
import { Row, Window } from './Window'

type Props = { spec: GitLogSpec; clock: Clock; ctx: FrameCtx }

// Линии и точки main — ink, ветки — soft; сама линия — fig-line толщиной 3 px
const LINE = { stroke: T.line, width: 3 }

/** История git: чистая функция номера кадра. */
export function GitLog({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  const { dirty } = p
  // Растворение dirty: появляется на реплике at, исчезает за MOTION.appear кадров с реплики until
  const dirtyOn = dirty !== null && frame >= clock.beat(dirty.at) && frame < clock.beat(dirty.until) + MOTION.appear
  const dirtyOpacity = dirty ? appear(frame, clock.beat(dirty.at)) * (1 - appear(frame, clock.beat(dirty.until))) : 0
  const dirtyHead = dirty?.head ?? null
  const dirtyLane = dirtyHead?.lane ?? 0

  return (
    <Window title="История" tone="term">
      {p.edges.map((e) => {
        const start = clock.beat(e.child.at)
        if (frame < start) return null
        const draw = appear(frame, start, MOTION.draw)
        return (
          <path
            key={`${e.child.event}-${e.nth}`}
            data-part={e.nth === 0 ? `edge:${e.child.event}` : `edge:${e.child.event}:${e.nth + 1}`}
            d={edgePath(laneX(e.parent.lane), e.parent.y, laneX(e.child.lane), e.child.y)}
            fill="none"
            stroke={LINE.stroke}
            strokeWidth={LINE.width}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        )
      })}
      {p.nodes.map((n) => {
        const start = clock.beat(n.at)
        if (frame < start) return null
        const main = n.branch === 'main'
        return (
          <g key={n.event} data-part={`commit:${n.event}`} opacity={appear(frame, start)}>
            <circle cx={laneX(n.lane)} cy={n.y} r={LANE.r} fill={main ? T.ink : T.soft} />
            <Row x={p.textX} row={rowFor(n.y)} fill={T.soft} chars={[...n.hash].length}>
              {n.hash}
            </Row>
            <Row x={p.msgX} row={rowFor(n.y)} fill={T.ink} chars={[...n.message].length}>
              {n.message}
            </Row>
          </g>
        )
      })}
      {dirty && dirtyOn && (
        <g data-part="dirty" opacity={dirtyOpacity}>
          {dirtyHead && (
            <path d={edgePath(laneX(dirtyHead.lane), dirtyHead.y, laneX(dirtyLane), dirty.y)} fill="none" stroke={T.warn} strokeWidth={LINE.width} strokeDasharray="6 6" />
          )}
          <circle cx={laneX(dirtyLane)} cy={dirty.y} r={LANE.r} fill="none" stroke={T.warn} strokeWidth={3} strokeDasharray="5 5" />
          <Row x={p.textX} row={rowFor(dirty.y)} fill={T.warn} chars={[...DIRTY_LABEL, ...dirty.text].length}>
            {DIRTY_LABEL + dirty.text}
          </Row>
        </g>
      )}
      {p.labels.map((l) => {
        const h = headAt(l.entries, frame, clock)
        if (!h || h.opacity <= 0) return null
        const color = l.branch === 'main' ? T.ink : T.soft
        return (
          <g key={l.branch} data-part={`head:${l.branch}`} opacity={h.opacity}>
            <rect x={l.x} y={h.y - LH / 2} width={l.w} height={LH} rx={6} fill="none" stroke={color} strokeWidth={2} />
            <Row x={l.x + cells(1)} row={rowFor(h.y)} fill={color} weight={700} chars={[...l.branch].length}>
              {l.branch}
            </Row>
          </g>
        )
      })}
    </Window>
  )
}
