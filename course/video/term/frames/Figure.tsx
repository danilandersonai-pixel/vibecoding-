import type { JSX } from 'react'
import { useCurrentFrame } from 'remotion'
import defs from '../../../content/figures/_defs.svg?raw'
import type { Clock, FrameCtx, Rect } from '../frame'
import { appear } from '../motion'
import { FIGURE_VARS, MOTION, T } from '../theme'
import { FOCUS, fit, focusLayers, parse, starts, toCanvas, viewOf } from './figurePlan'
import type { FigureSpec } from './figurePlan'
import { n } from './style'
import { defsOf, drawn, isDrawable, rootFontSize, scopeMarkers } from './svg'

type Props = { spec: FigureSpec; clock: Clock; ctx: FrameCtx }

const MARKERS = defsOf(defs)

// Контур прямоугольника со скруглёнными углами: дырка в подложке focus
const roundedRect = ({ x, y, w, h }: Rect, r: number) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + r)}V${n(y + h - r)}Q${n(x + w)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)}H${n(x + r)}Q${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - r)}V${n(y + r)}Q${n(x)} ${n(y)} ${n(x + r)} ${n(y)}Z`

/** Схема книги: чистая функция номера кадра. */
export function Figure({ spec, clock, ctx }: Props): JSX.Element {
  const frame = useCurrentFrame()
  const p = parse(spec.svg)
  if (!p.ok) return <g data-figure="1" />
  const f = fit(viewOf(spec, p.viewBox))
  const at = starts(spec, clock, p.children)
  const [vx, vy, vw, vh] = f.view
  const area = f.rect
  const lessonId = ctx.lesson.id

  return (
    <g data-figure="1" style={{ ...FIGURE_VARS, fontFamily: T.font }}>
      {/* Маркеры стрелок: схема ссылается на них по id, а цвет наконечников берут из переменных этой обёртки. id свои (term-arrow…
          с id ролика), не страницы (bk-arrow…): иначе ссылка уходит в маркер FigureDefs, раньше в документе, и красится темой страницы */}
      <defs dangerouslySetInnerHTML={{ __html: scopeMarkers(MARKERS, lessonId) }} />
      {/* Вложенный <svg> сам масштабирует схему по viewBox и обрезает всё, что вне crop; id и маски не нужны */}
      <svg x={n(area.x)} y={n(area.y)} width={n(area.w)} height={n(area.h)} viewBox={`${vx} ${vy} ${vw} ${vh}`} fontSize={rootFontSize(spec.svg)}>
        {p.children.map((child, k) => {
          if (isDrawable(child)) {
            const done = appear(frame, at[k], MOTION.draw)
            return done > 0 ? <g key={k} data-el={k} dangerouslySetInnerHTML={{ __html: drawn(scopeMarkers(child, lessonId), done) }} /> : null
          }
          const o = appear(frame, at[k])
          return o > 0 ? <g key={k} data-el={k} opacity={o} dangerouslySetInnerHTML={{ __html: scopeMarkers(child, lessonId) }} /> : null
        })}
      </svg>
      {focusLayers(spec, clock, frame).map(({ index, o }) => {
        const fo = spec.focus![index]
        const r = toCanvas(f, fo.rect)
        return (
          <g key={fo.name} data-part={`focus:${fo.name}`} opacity={o}>
            <path
              d={`M${n(area.x)} ${n(area.y)}H${n(area.x + area.w)}V${n(area.y + area.h)}H${n(area.x)}Z${roundedRect(r, FOCUS.radius)}`}
              fill={T.desk}
              fillOpacity={FOCUS.dim}
              fillRule="evenodd"
            />
            <rect x={n(r.x)} y={n(r.y)} width={n(r.w)} height={n(r.h)} rx={FOCUS.radius} fill="none" stroke={T.ink} strokeWidth={FOCUS.stroke} />
          </g>
        )
      })}
    </g>
  )
}
