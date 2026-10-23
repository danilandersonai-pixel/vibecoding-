import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { grow } from '../reveal'
import { chartHeight, niceMax } from './layout'
import { Window } from './Window'

const LEFT = 64
const RIGHT = 24
const TOP = 52
const SMALL = 18

const fmt = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')

// График: линия «рисуется» слева направо, столбики растут по очереди.
export function Chart({ x, y, w, at, kind, values, labels, unit }: { x: number; y: number; w: number; at: number; kind: 'line' | 'bars'; values: number[]; labels?: string[]; unit?: string }) {
  const frame = useCurrentFrame()
  const h = chartHeight(w)
  const bottom = labels ? 46 : 22
  const plotW = w - LEFT - RIGHT
  const plotH = h - TOP - bottom
  const top = niceMax(Math.max(...values, 0))
  const n = values.length
  const slot = plotW / Math.max(n, 1)
  const px = (i: number) => LEFT + slot * (i + 0.5)
  const py = (v: number) => TOP + plotH - (plotH * v) / top
  const start = at + 14
  const ticks = [0, top / 2, top]

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)} ${py(v)}`).join(' ')
  const drawn = grow(frame, start, 40)

  return (
    <Window x={x} y={y} w={w} h={h} at={at}>
      {unit && (
        <text x={18} y={34} fill={theme.soft} style={{ font: `600 ${SMALL}px ${theme.font}` }}>
          {unit}
        </text>
      )}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={LEFT} y1={py(t)} x2={w - RIGHT} y2={py(t)} stroke={theme.grid} strokeWidth={2} />
          <text x={LEFT - 10} y={py(t) + 6} textAnchor="end" fill={theme.soft} style={{ font: `500 ${SMALL}px ${theme.font}` }}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {labels?.map((label, i) => (
        <text key={i} x={px(i)} y={h - 14} textAnchor="middle" fill={theme.soft} style={{ font: `500 ${SMALL}px ${theme.font}` }}>
          {label}
        </text>
      ))}
      {kind === 'line' && n > 0 && (
        <>
          <path d={line} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawn} fill="none" stroke={theme.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          {values.map((v, i) => {
            const p = grow(frame, start + (n > 1 ? (i / (n - 1)) * 40 : 0), 6)
            return (
              <g key={i} opacity={p}>
                <circle cx={px(i)} cy={py(v)} r={7} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
                <text x={px(i)} y={py(v) - 16} textAnchor="middle" fill={theme.accent} style={{ font: `700 ${SMALL}px ${theme.font}` }}>
                  {fmt(v)}
                </text>
              </g>
            )
          })}
        </>
      )}
      {kind === 'bars' &&
        values.map((v, i) => {
          const g = grow(frame, start + i * 5, 16)
          const bw = Math.min(slot * 0.56, 72)
          const bh = (plotH * v * g) / top
          return (
            <g key={i}>
              <rect x={px(i) - bw / 2} y={TOP + plotH - bh} width={bw} height={bh} rx={6} fill={theme.accent} />
              <text x={px(i)} y={TOP + plotH - bh - 10} textAnchor="middle" fill={theme.accent} opacity={g >= 1 ? 1 : 0} style={{ font: `700 ${SMALL}px ${theme.font}` }}>
                {fmt(v)}
              </text>
            </g>
          )
        })}
    </Window>
  )
}
