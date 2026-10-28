import { Fragment } from 'react'
import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import type { Clock, FrameCtx } from '../frame'
import { fitText } from '../text'
import { SAFE, T, alpha } from '../theme'
import { CONSOLE, CONSOLE_TOP, FIELD_H, PAGE, TAB_CHARS, URL_BAR, consoleAt, isError, isWarning, plan, slotAt } from './browserPlan'
import type { BrowserSpec } from './browserPlan'
import { LH, MONO_STYLE, WIN, cells, rowTop } from './geometry'
import { Row, Window } from './Window'

type Props = { spec: BrowserSpec; clock: Clock; ctx: FrameCtx }

const GOLOS = { fontFamily: T.font, fontWeight: 500 } as const
// Панель Console с закруглёнными нижними углами по форме окна
const panelPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x} ${y} H${x + w} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} Z`

/** Браузер: чистая функция номера кадра. */
export function Browser({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = plan(spec, ctx)
  if (!p.ok) return <Window title="Браузер" tone="paper">{null}</Window>
  const textX = SAFE.x + WIN.pad
  const iconX = textX + 12

  // Страница: заголовок и текст — в одной группе, поля и кнопки — каждая в своей. Ключ — порядок строки (после action или, у пропавших, до него), не текст:
  // одинаковые строки не должны давать одинаковые ключи
  const slots = p.slots
    .map((slot) => ({ key: slot.to ? `a${slot.to.order}` : `b${slot.from!.order}`, item: (slot.to ?? slot.from)!, ...slotAt(slot, spec, clock, frame) }))
    .filter((s) => s.opacity > 0)
  const consoleTop = CONSOLE_TOP

  return (
    <Window title={fitText(p.title, TAB_CHARS)} tone="paper">
      <g data-part="url">
        <rect x={URL_BAR.x} y={URL_BAR.y} width={URL_BAR.w} height={URL_BAR.h} rx={8} fill={T.termBg} stroke={T.edge} strokeWidth={2} />
        <text x={URL_BAR.x + 16} y={URL_BAR.y + 26} fill={T.soft} style={MONO_STYLE}>
          {p.url}
        </text>
      </g>
      <g data-part="page">
        {slots.map(({ key, item, y, opacity }) => {
          if (item.kind === 'title') {
            return (
              <Fragment key={key}>
                {item.lines.map((line, j) => (
                  <text key={j} x={p.x} y={y + 40 + j * 52} fill={T.ink} opacity={opacity} style={{ ...GOLOS, fontSize: 40, fontWeight: 600 }}>
                    {line}
                  </text>
                ))}
              </Fragment>
            )
          }
          if (item.kind !== 'text') return null
          const fill = item.tone === 'err' ? T.err : item.tone === 'ok' ? T.ok : T.ink
          return (
            <Fragment key={key}>
              {item.lines.map((line, j) => (
                <text key={j} x={p.x} y={y + 30 + j * 40} fill={fill} opacity={opacity} style={{ ...GOLOS, fontSize: 28 }}>
                  {line}
                </text>
              ))}
            </Fragment>
          )
        })}
      </g>
      {slots.map(({ key, item, y, opacity }) => {
        if (item.kind === 'field')
          return (
            <g key={key} data-part={`field:${item.text}`} opacity={opacity}>
              <text x={p.x} y={y + 36} fill={T.soft} style={{ ...GOLOS, fontSize: 28 }}>
                {item.text}
              </text>
              <rect x={p.inputX} y={y} width={PAGE.input} height={FIELD_H} rx={8} fill={T.termBg} stroke={T.line} strokeWidth={2} />
              <text x={p.inputX + 16} y={y + 34} fill={T.ink} style={MONO_STYLE}>
                {item.value}
              </text>
            </g>
          )
        if (item.kind === 'button')
          return (
            <g key={key} data-part={`button:${item.text}`} opacity={opacity}>
              <rect x={p.inputX} y={y} width={item.w} height={FIELD_H} rx={8} fill={T.ink} />
              <text x={p.inputX + item.w / 2} y={y + 36} textAnchor="middle" fill={T.desk} style={{ ...GOLOS, fontSize: 28, fontWeight: 600 }}>
                {item.text}
              </text>
            </g>
          )
        return null
      })}
      {spec.console === true && (
        <g data-part="console">
          <path d={panelPath(SAFE.x, consoleTop, SAFE.w, SAFE.y + SAFE.h - consoleTop, WIN.radius)} fill={T.termBg} />
          <rect x={SAFE.x} y={consoleTop} width={SAFE.w} height={CONSOLE.bar} fill={T.raised} />
          <rect x={SAFE.x} y={consoleTop} width={SAFE.w} height={WIN.border} fill={T.edge} />
          <rect x={SAFE.x} y={consoleTop + CONSOLE.bar - WIN.border} width={SAFE.w} height={WIN.border} fill={T.edge} />
          <rect x={textX - 8} y={consoleTop + CONSOLE.bar - 4} width={cells(7) + 16} height={4} fill={T.ink} />
          <text x={textX} y={consoleTop + 32} fill={T.ink} style={{ ...MONO_STYLE, fontWeight: 700 }}>
            Console
          </text>
        </g>
      )}
      {p.messages.map((m, k) => {
        if (frame < consoleAt(spec, clock, k)) return null
        const err = isError(m.type)
        const warn = isWarning(m.type)
        const fill = err ? T.err : warn ? T.warn : T.soft
        const cy = rowTop(m.row) + LH / 2
        return (
          <g key={k} data-part={`console:${k}`}>
            {err && <rect x={SAFE.x + WIN.border} y={rowTop(m.row)} width={SAFE.w - 2 * WIN.border} height={m.rows.length * LH} fill={alpha(T.err, 0.1)} />}
            {err && <path data-icon="error" d={`M${iconX - 7} ${cy - 7} L${iconX + 7} ${cy + 7} M${iconX + 7} ${cy - 7} L${iconX - 7} ${cy + 7}`} fill="none" stroke={T.err} strokeWidth={3} strokeLinecap="round" />}
            {warn && <path data-icon="warning" d={`M${iconX} ${cy - 9} L${iconX + 10} ${cy + 8} L${iconX - 10} ${cy + 8} Z`} fill={T.warn} />}
            {m.rows.map((text, r) => (
              <Row key={r} x={textX + cells(2)} row={m.row + r} fill={fill} chars={[...text].length}>
                {text}
              </Row>
            ))}
          </g>
        )
      })}
    </Window>
  )
}
