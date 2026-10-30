import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { SAFE, T } from '../theme'
import { AGENDA, NAME_X, plan } from './agendaPlan'
import type { AgendaSpec } from './agendaPlan'
import { golos } from './style'

type Props = { spec: AgendaSpec; clock: Clock; ctx: FrameCtx }

const MONO_STYLE = { fontFamily: T.mono, fontWeight: 500, fontVariantLigatures: 'none' } as const

/** План ролика: чистая функция номера кадра. */
export function Agenda({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx, clock)
  return (
    <g>
      <g opacity={appear(frame, 0)}>
        <text x={SAFE.x} y={p.kicker.y + AGENDA.kicker.base} fill={T.faint} style={{ ...MONO_STYLE, fontSize: AGENDA.kicker.size }}>
          {p.kicker.text}
        </text>
        {p.title.lines.map((line, j) => (
          <text key={j} x={SAFE.x} y={p.title.y + j * AGENDA.title.line + AGENDA.title.base} fill={T.ink} style={golos(AGENDA.title.size, 600)}>
            {line}
          </text>
        ))}
      </g>
      {p.items.map((it, k) => {
        const o = appear(frame, it.at)
        if (o <= 0) return null
        return (
          <g key={k} data-part={`item:${k}`} opacity={o}>
            <text x={SAFE.x} y={it.y + AGENDA.num.base} fill={T.faint} style={{ ...MONO_STYLE, fontSize: AGENDA.num.size }}>
              {it.num}
            </text>
            {it.lines.map((line, j) => (
              <text key={j} x={NAME_X} y={it.y + j * AGENDA.name.line + AGENDA.name.base} fill={T.ink} style={golos(AGENDA.name.size)}>
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </g>
  )
}
