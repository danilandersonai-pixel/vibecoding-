import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { SAFE, T } from '../theme'
import { BOOK_LABEL, BOOK_X, RECAP, plan } from './recapPlan'
import type { RecapSpec } from './recapPlan'
import { golos, n } from './style'

type Props = { spec: RecapSpec; clock: Clock; ctx: FrameCtx }

// Галочка линией: короткий штрих вниз-вправо и длинный вверх-вправо, по высоте первой строки пункта
const tick = (top: number) => {
  const cy = top + RECAP.item.line / 2
  return `M${n(SAFE.x + 2)} ${n(cy)}L${n(SAFE.x + 10)} ${n(cy + 9)}L${n(SAFE.x + 24)} ${n(cy - 10)}`
}

/** Итог: чистая функция номера кадра. */
export function Recap({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx, clock)
  return (
    <g>
      <g opacity={appear(frame, 0)}>
        <text x={SAFE.x} y={p.title.y + RECAP.title.base} fill={T.ink} style={golos(RECAP.title.size, 600)}>
          {p.title.text}
        </text>
      </g>
      {p.items.map((it, k) => {
        const o = appear(frame, it.at)
        if (o <= 0) return null
        return (
          <g key={k} data-part={`item:${k}`} opacity={o}>
            <path d={tick(it.y)} fill="none" stroke={T.ok} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {it.lines.map((line, j) => (
              <text key={j} x={SAFE.x + RECAP.item.indent} y={it.y + j * RECAP.item.line + RECAP.item.base} fill={T.ink} style={golos(RECAP.item.size)}>
                {line}
              </text>
            ))}
          </g>
        )
      })}
      {p.book && appear(frame, p.bookAt) > 0 && (
        <g data-part="book" opacity={appear(frame, p.bookAt)}>
          <text x={SAFE.x} y={p.book.y + RECAP.book.base} fill={T.faint} style={golos(RECAP.book.size)}>
            {BOOK_LABEL}
          </text>
          {p.book.sections.flatMap((lines, i) => {
            const before = p.book!.sections.slice(0, i).reduce((sum, s) => sum + s.length, 0)
            return lines.map((line, j) => (
              <text key={`${i}:${j}`} x={BOOK_X} y={p.book!.y + (before + j) * RECAP.book.line + RECAP.book.base} fill={T.soft} style={golos(RECAP.book.size)}>
                {line}
              </text>
            ))
          })}
        </g>
      )}
    </g>
  )
}
