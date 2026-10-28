import type { CSSProperties, JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear } from '../motion'
import { SAFE, T, alpha } from '../theme'
import { CARD, SCALE, TABLE, TEXT, TITLE, TONES, headAt, markerAt, markerRect, plan, scaleAt } from './boardPlan'
import type { BoardSpec } from './boardPlan'

type Props = { spec: BoardSpec; clock: Clock; ctx: FrameCtx }

const golos = (size: number, weight = 500): CSSProperties => ({ fontFamily: T.font, fontSize: size, fontWeight: weight })
const n = (v: number) => +v.toFixed(2)

/** Доска: заголовок, таблица, карточки и шкала — чистая функция номера кадра. */
export function Board({ spec, clock }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec)
  const { table, scale } = p

  return (
    <g>
      {p.title && (
        <g data-part="title" opacity={appear(frame, 0)}>
          {p.title.lines.map((line, j) => (
            <text key={j} x={SAFE.x} y={n(p.title!.rect.y + j * TITLE.line + TITLE.base)} fill={T.ink} style={golos(TITLE.size, 600)}>
              {line}
            </text>
          ))}
        </g>
      )}

      {table && (
        <>
          <g opacity={appear(frame, headAt(spec, clock))}>
            <rect data-rule="top" x={n(table.x)} y={n(table.y)} width={n(table.w)} height={TABLE.rule} fill={T.ink} />
            {table.head.cells.map((lines, c) =>
              lines.map((line, j) => (
                <text key={`${c}:${j}`} x={n(table.cols[c].x + TABLE.padX)} y={n(table.y + TABLE.rule + TABLE.padY + TEXT.base + j * TEXT.line)} fill={T.soft} style={golos(TEXT.size, 600)}>
                  {line}
                </text>
              )),
            )}
            <rect data-rule="head" x={n(table.x)} y={n(table.head.y + table.head.h - TABLE.rule)} width={n(table.w)} height={TABLE.rule} fill={T.soft} />
          </g>
          {table.rows.map((r, k) => {
            const o = appear(frame, clock.beat(r.at))
            if (o <= 0) return null
            // Метка строки: последняя, чья реплика уже наступила
            let mark: { tone: string; o: number } | null = null
            for (const m of spec.table!.mark ?? []) {
              const mo = appear(frame, clock.beat(m.at))
              if (m.row === k && mo > 0) mark = { tone: m.tone ? TONES[m.tone] : T.ink, o: mo }
            }
            const last = k === table.rows.length - 1
            return (
              <g key={k} data-part={`row:${k}`} opacity={o}>
                {mark && <rect x={n(table.x)} y={n(r.y)} width={n(table.w)} height={n(r.h)} fill={alpha(mark.tone, 0.14)} opacity={mark.o} />}
                {mark && <rect data-mark="bar" x={n(table.x)} y={n(r.y)} width={TABLE.bar} height={n(r.h)} fill={mark.tone} opacity={mark.o} />}
                {r.cells.map((lines, c) =>
                  lines.map((line, j) => (
                    <text key={`${c}:${j}`} x={n(table.cols[c].x + TABLE.padX)} y={n(r.y + TABLE.padY + TEXT.base + j * TEXT.line)} fill={T.ink} style={golos(TEXT.size)}>
                      {line}
                    </text>
                  )),
                )}
                <rect data-rule={last ? 'bottom' : 'between'} x={n(table.x)} y={n(r.y + r.h - TABLE.rule)} width={n(table.w)} height={TABLE.rule} fill={last ? T.soft : T.edge} />
              </g>
            )
          })}
        </>
      )}

      {p.cards.map((c, k) => {
        const o = appear(frame, clock.beat(c.at))
        if (o <= 0) return null
        const tone = c.tone ? TONES[c.tone] : null
        // Абзацы текста идут под заголовком; верх каждого — после строк предыдущего и зазора
        const first = c.y + CARD.padY + c.title.length * CARD.titleLine + CARD.para
        const tops = c.text.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? first : acc[i - 1] + c.text[i - 1].length * TEXT.line + CARD.para], [])
        return (
          <g key={k} data-part={`card:${k}`} opacity={o}>
            <rect x={n(c.x + 1)} y={n(c.y + 1)} width={n(c.w - 2)} height={n(c.h - 2)} rx={8} fill={T.paper} stroke={tone ?? T.edge} strokeWidth={2} />
            {c.title.map((line, j) => (
              <text key={`t${j}`} x={n(c.x + CARD.padX)} y={n(c.y + CARD.padY + j * CARD.titleLine + CARD.titleBase)} fill={tone ?? T.ink} style={golos(CARD.titleSize, 600)}>
                {line}
              </text>
            ))}
            {c.text.map((para, i) =>
              para.map((line, j) => (
                <text key={`p${i}:${j}`} x={n(c.x + CARD.padX)} y={n(tops[i] + j * TEXT.line + TEXT.base)} fill={T.soft} style={golos(TEXT.size)}>
                  {line}
                </text>
              )),
            )}
          </g>
        )
      })}

      {scale && (
        <>
          <g opacity={appear(frame, scaleAt(spec, clock))}>
            <text x={SAFE.x} y={n(scale.y + SCALE.line / 2 + 10)} fill={T.soft} style={golos(TEXT.size)}>
              {scale.left}
            </text>
            <rect data-scale="line" x={n(scale.x0)} y={n(scale.y)} width={n(scale.x1 - scale.x0)} height={SCALE.line} fill={T.line} />
            <text x={SAFE.x + SAFE.w} y={n(scale.y + SCALE.line / 2 + 10)} textAnchor="end" fill={T.soft} style={golos(TEXT.size)}>
              {scale.right}
            </text>
          </g>
          {scale.items.map((it, k) => {
            const o = appear(frame, clock.beat(it.at))
            if (o <= 0) return null
            return (
              <g key={k} data-part={`item:${k}`} opacity={o}>
                <circle cx={n(it.cx)} cy={n(scale.y + SCALE.line / 2)} r={SCALE.dot} fill={T.ink} />
                {it.lines.map((line, j) => (
                  <text key={j} x={n(it.box.x + it.box.w / 2)} y={n(it.box.y + j * SCALE.label.line + SCALE.label.base)} textAnchor="middle" fill={T.ink} style={golos(SCALE.label.size)}>
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
          {(() => {
            const m = markerAt(scale, clock, frame)
            if (!m) return null
            const r = markerRect(scale, 0)
            return (
              <g data-part="marker" transform={`translate(${n(m.cx)} 0)`} opacity={m.opacity}>
                <path d={`M0 ${n(r.y)}L${-r.w / 2} ${n(r.y + r.h)}L${r.w / 2} ${n(r.y + r.h)}Z`} fill={T.ink} />
              </g>
            )
          })()}
        </>
      )}
    </g>
  )
}
