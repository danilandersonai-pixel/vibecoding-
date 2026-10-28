import { CANVAS, T } from '../theme'
import { FADE, VIEW, fadeOpacity } from './layout'

// Растушёвка при наезде камеры: по краям видимой части кадра (ниже шапки, выше полосы субтитров) полоса 48 px из desk в прозрачный,
// чтобы у края экрана не торчали обрывки соседней панели; ниже полосы субтитров — desk. Непрозрачность — fadeOpacity(zoom):
// без наезда растушёвки нет. Градиенты (CameraFadeDefs) объявляются один раз в общем <svg> ролика.

const SIDES = ['top', 'bottom', 'left', 'right'] as const
const DIR = { top: [0, 0, 0, 1], bottom: [0, 1, 0, 0], left: [0, 0, 1, 0], right: [1, 0, 0, 0] } as const
const id = (side: (typeof SIDES)[number]) => `lesson-fade-${side}`

export function CameraFadeDefs() {
  return (
    <defs>
      {SIDES.map((side) => {
        const [x1, y1, x2, y2] = DIR[side]
        return (
          <linearGradient key={side} id={id(side)} x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset={0} stopColor={T.desk} stopOpacity={1} />
            <stop offset={1} stopColor={T.desk} stopOpacity={0} />
          </linearGradient>
        )
      })}
    </defs>
  )
}

export function CameraFade({ zoom }: { zoom: number }) {
  const o = fadeOpacity(zoom)
  if (o <= 0) return null
  const h = VIEW.bottom - VIEW.top
  return (
    <g data-part="camera-fade" opacity={+o.toFixed(3)}>
      <rect x={0} y={VIEW.top} width={CANVAS.w} height={FADE.band} fill={`url(#${id('top')})`} />
      <rect x={0} y={VIEW.bottom - FADE.band} width={CANVAS.w} height={FADE.band} fill={`url(#${id('bottom')})`} />
      <rect x={0} y={VIEW.top} width={FADE.band} height={h} fill={`url(#${id('left')})`} />
      <rect x={CANVAS.w - FADE.band} y={VIEW.top} width={FADE.band} height={h} fill={`url(#${id('right')})`} />
      <rect x={0} y={VIEW.bottom} width={CANVAS.w} height={CANVAS.h - VIEW.bottom} fill={T.desk} />
    </g>
  )
}
