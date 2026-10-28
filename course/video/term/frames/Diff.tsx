import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { fitText } from '../text'
import { SAFE, T } from '../theme'
import { COLS, LH, TEXT_X, WIN, rowTop } from './geometry'
import { FILL, SIGN, SIGNED, TEXT, lineAt, plan, span } from './diffPlan'
import type { DiffSpec } from './diffPlan'
import { Band, Row, Window } from './Window'

type Props = { spec: DiffSpec; clock: Clock; ctx: FrameCtx }

/** Дифф: чистая функция номера кадра. */
export function Diff({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  const left = SAFE.x + WIN.border
  const width = SAFE.w - 2 * WIN.border
  // Слои: подложки строк, подсветка, заголовки, текст
  const shown = p.items.map((it) => {
    const start = clock.beat(it.at)
    return { it, start, lines: it.lines.map((l, k) => ({ l, k, on: frame >= lineAt(start, k) })) }
  })

  return (
    <Window title="Изменения" tone="paper">
      {shown.flatMap(({ lines }) =>
        lines.map(({ l, k, on }) => {
          const fill = FILL[l.kind]
          return on && fill && <rect key={`${l.row}-${k}`} x={left} y={rowTop(l.row)} width={width} height={l.rows.length * LH} fill={fill} />
        }),
      )}
      {(spec.highlight ?? []).map((h, i) => {
        const entry = shown.find((s) => s.it.event === h.event)
        const s = entry && span(entry.it, h.lines)
        return s && <Band key={i} name={`highlight:${i}`} x={left + 2} y={rowTop(s.row)} w={width - 4} h={s.rows * LH} p={appear(frame, clock.beat(h.at))} />
      })}
      {shown.map(
        ({ it, start, lines }) => {
          if (frame < start) return null
          const path = fitText(it.path, COLS - 14)
          return (
            <g key={it.event}>
              <g data-part={`file:${it.event}`} opacity={appear(frame, start)}>
                <rect x={left} y={rowTop(it.headerRow)} width={width} height={LH} fill={T.raised} />
                <Row x={TEXT_X} row={it.headerRow} fill={T.ink} weight={700} chars={[...path].length + 2 + `+${it.add}`.length + 1 + `−${it.del}`.length}>
                  {path}
                  {'  '}
                  <tspan fill={T.ok}>{`+${it.add}`}</tspan>
                  {' '}
                  <tspan fill={T.err}>{`−${it.del}`}</tspan>
                </Row>
              </g>
              {lines.map(
                ({ l, k, on }) =>
                  on && (
                    <g key={k} data-part={`line:${it.event}:${k}`}>
                      {l.rows.map((text, r) => {
                        const signed = SIGNED.includes(l.kind)
                        return (
                          <Row key={r} x={TEXT_X} row={l.row + r} fill={TEXT[l.kind]} chars={[...text].length + (signed ? 1 : 0)}>
                            {signed && <tspan fill={SIGN[l.kind]}>{r === 0 ? l.raw[0] : ' '}</tspan>}
                            {text}
                          </Row>
                        )
                      })}
                    </g>
                  ),
              )}
            </g>
          )
        },
      )}
    </Window>
  )
}

