import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { theme } from '../../theme'
import { PHONE_FONT } from '../layout'

const F = PHONE_FONT

// Экран телефона (координаты экрана от -54,-92 до 54,92): кнопка «Мои тренировки», затем список.
// Телефон рисуется в масштабе PHONE_SCALE, поэтому текст F px на экране кадра не мельче 18 px.
export function PhoneScreen({ tapAt, listAt, list, listColor = theme.ok, children }: { tapAt: number; listAt: number; list: string[]; listColor?: string; children?: ReactNode }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const shown = frame >= listAt
  return (
    <g>
      <rect x={-50} y={-84} width={100} height={26} rx={7} fill={theme.accent} />
      <text y={-66.5} textAnchor="middle" fill="#fff" style={{ font: `600 ${F}px ${theme.font}` }}>
        Мои тренировки
      </text>
      {ripple > 0 && <circle cx={0} cy={-71} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
      {shown &&
        list.map((t, i) => (
          <g key={t}>
            <rect x={-50} y={-48 + i * 32} width={100} height={26} rx={6} fill={theme.paper} stroke={listColor} strokeWidth={2} />
            <text x={-44} y={-30.5 + i * 32} fill={theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
              {t}
            </text>
          </g>
        ))}
      {children}
    </g>
  )
}
