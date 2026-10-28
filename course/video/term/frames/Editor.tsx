import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { appear, typedCount } from '../motion'
import { fitText, monoChars } from '../text'
import { MOTION, SAFE, T } from '../theme'
import { BODY, LH, MONO_STYLE, WIN, baseline, cells, rowTop, take } from './geometry'
import { DIVIDER, PANEL_PAD, plan, span, timeline } from './editorPlan'
import type { CodeLine, EditorSpec, Geo, TreeRow } from './editorPlan'
import { Band, Cursor, Row, Window } from './Window'

type Props = { spec: EditorSpec; clock: Clock; ctx: FrameCtx }

// Размер значка папки в дереве
const ARROW = 10

function TreeView({ rows, geo }: { rows: TreeRow[]; geo: Geo }) {
  const labelCols = (r: TreeRow) => monoChars(geo.treeW - 2 * PANEL_PAD) - (r.depth * 2 + 2)
  return (
    <>
      {rows.slice(0, WIN.rows).map((r, i) => {
        const x = SAFE.x + PANEL_PAD + cells(r.depth * 2)
        const cy = rowTop(i) + LH / 2
        return (
          <g key={r.path} data-part={`tree:${r.path}`} data-selected={r.selected ? 'true' : undefined}>
            {r.selected && <rect x={SAFE.x + WIN.border} y={rowTop(i)} width={geo.treeW - WIN.border} height={LH} fill={T.ink} />}
            {r.kind === 'dir' && <path d={`M${x + 2} ${cy - ARROW / 2} L${x + 2 + ARROW} ${cy} L${x + 2} ${cy + ARROW / 2} Z`} fill={T.faint} />}
            {r.kind === 'open' && <path d={`M${x} ${cy - ARROW / 4} L${x + ARROW} ${cy - ARROW / 4} L${x + ARROW / 2} ${cy + (ARROW * 3) / 4} Z`} fill={T.faint} />}
            <Row x={x + cells(2)} row={i} fill={r.selected ? T.paper : T.soft} weight={r.selected ? 700 : undefined} chars={[...fitText(r.label, labelCols(r))].length}>
              {fitText(r.label, labelCols(r))}
            </Row>
          </g>
        )
      })}
      <rect x={SAFE.x + geo.treeW} y={BODY.y} width={DIVIDER} height={BODY.h} fill={T.edge} />
    </>
  )
}

/** Редактор: чистая функция номера кадра. */
export function Editor({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  if (!p.ok) return <Window title="Редактор" tone="paper">{null}</Window>
  const t = timeline(spec, p, clock)
  const { geo } = p

  // Строка подсказки ghost до своего кадра не существует — вместе с номером; строка typing существует сразу, пока без текста
  const hidden = (l: CodeLine) => l.isNew && !!t.ghost && frame < (t.ghost.lineAt.get(l.n) ?? 0)
  const started = (l: CodeLine) => !(l.isNew && t.typing) || frame >= (t.typing.lineStart.get(l.n) ?? 0)
  const typed = (l: CodeLine) => (t.typing && l.isNew ? typedCount(l.text, frame, t.typing.lineStart.get(l.n) ?? 0) : [...l.text].length)
  const fillOf = (l: CodeLine) => {
    if (t.ghost && l.isNew && frame < t.ghost.accept) return T.faint
    return l.text.trimStart().startsWith('//') ? T.soft : T.ink
  }

  // Курсор: на строке, которая набирается сейчас; при наборе горит, потом мигает
  let cursor: JSX.Element | null = null
  if (t.typing && frame >= t.typing.start) {
    const begun = p.lines.filter((l) => l.isNew && started(l))
    const l = begun[begun.length - 1]
    if (l && (frame < t.typing.end || Math.floor((frame - t.typing.end) / MOTION.blink) % 2 === 0)) {
      // Строка окна, в которой стоит курсор: последняя, что началась; на месте переноса (пробел не показан) — в конце её
      const n = typed(l)
      const r = Math.max(0, l.from.findLastIndex((f) => f <= n))
      cursor = <Cursor x={geo.textX + cells(Math.min(n - l.from[r], [...l.rows[r]].length))} row={1 + l.row + r} />
    }
  }

  const tab = fitText(p.path, monoChars(geo.panelW - 2 * PANEL_PAD))

  return (
    <Window title="Редактор" tone="paper">
      {p.tree && <TreeView rows={p.tree} geo={geo} />}
      <Row x={geo.panelX + PANEL_PAD} row={0} fill={T.ink} weight={700} chars={[...tab].length}>
        {tab}
      </Row>
      <rect x={geo.panelX} y={rowTop(1) - 2} width={geo.panelW} height={2} fill={T.edge} />
      {(spec.highlight ?? []).map((h, i) => {
        const s = span(p, h.lines)
        return s && <Band key={i} name={`highlight:${i}`} x={geo.panelX + 4} y={s.y} w={geo.panelW - 8} h={s.h} p={appear(frame, t.highlight[i])} />
      })}
      {p.lines.map(
        (l) =>
          !hidden(l) && (
            <g key={l.n} data-part={`line:${l.n}`}>
              <text x={geo.numRight} y={baseline(1 + l.row)} textAnchor="end" fill={T.faint} style={MONO_STYLE}>
                {l.n}
              </text>
              {l.rows.map((text, r) => {
                const shown = started(l) ? take(text, typed(l) - l.from[r]) : ''
                return (
                  shown !== '' && (
                    <Row key={r} role="code" x={geo.textX} row={1 + l.row + r} fill={fillOf(l)} chars={[...shown].length}>
                      {shown}
                    </Row>
                  )
                )
              })}
            </g>
          ),
      )}
      {cursor}
    </Window>
  )
}

