import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { SAFE, T } from '../theme'
import { AGENDA, NAME_X, plan } from './agendaPlan'
import type { AgendaSpec } from './agendaPlan'

type Props = { spec: AgendaSpec; clock: Clock; ctx: FrameCtx }

const NUM_STYLE = { fontFamily: T.mono, fontSize: AGENDA.num.size, fontWeight: 500, fontVariantLigatures: 'none' } as const

/** План ролика: чистая функция номера кадра. */
export function Agenda({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx, clock)
  return (
    <g>
      <g opacity={appear(frame, 0)}>
        <text x={SAFE.x} y={SAFE.y + AGENDA.title.base} fill={T.ink} style={{ fontFamily: T.font, fontSize: AGENDA.title.size, fontWeight: 600 }}>
          {p.title}
        </text>
      </g>
      {p.items.map((it, k) => {
        const o = appear(frame, it.at)
        if (o <= 0) return null
        return (
          <g key={k} data-part={`item:${k}`} opacity={o}>
            <text x={SAFE.x} y={it.y + AGENDA.num.base} fill={T.faint} style={NUM_STYLE}>
              {it.num}
            </text>
            <text x={NAME_X} y={it.y + AGENDA.name.base} fill={T.ink} style={{ fontFamily: T.font, fontSize: AGENDA.name.size, fontWeight: 500 }}>
              {it.name}
            </text>
          </g>
        )
      })}
    </g>
  )
}
