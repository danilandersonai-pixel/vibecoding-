import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { theme } from '../theme'
import { BAR, PHONE_FONT } from './screens/layout'
import { Mono, Window } from './screens/Window'

// Общие детали сцен роликов: окно браузера, плашка, галочка, облако, экран телефона, ключ.
// Детали одного ролика (официант, самолёт и т. п.) лежат в его папке.

/** Окно браузера: адресная строка в полосе заголовка, страница — в детях (координаты окна). */
export function Browser({ x, y, w, h, at, url, focus = 0, children }: { x: number; y: number; w: number; h: number; at: number; url: string; focus?: number; children?: ReactNode }) {
  const field = Math.min(w - 120, url.length * 12 + 40)
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={h}
      at={at}
      bar={
        <>
          <circle cx={22} cy={BAR / 2} r={6} fill={theme.line} />
          <circle cx={40} cy={BAR / 2} r={6} fill={theme.line} />
          <rect x={64} y={7} width={field} height={BAR - 14} rx={8} fill={theme.paper} stroke={focus > 0 ? theme.accent : theme.grid} strokeWidth={focus > 0 ? 3 : 2} />
          <Mono x={80} y={BAR / 2 + 7} fill={theme.ink}>
            {url}
          </Mono>
        </>
      }
    >
      {children}
    </Window>
  )
}

/** Плашка с текстом по центру (x, y). w — ширина, без неё считается от текста. compact — плотнее: рамка 2,5, высота size + 16, размер по умолчанию 18 (без compact: рамка 3, высота size + 20, размер 22). */
export function Pill({ x, y, w, text, color = theme.accent, fill = theme.paper, compact = false, size = compact ? 18 : 22, weight = 700, mono = false }: { x: number; y: number; w?: number; text: string; color?: string; fill?: string; size?: number; weight?: number; mono?: boolean; compact?: boolean }) {
  const width = w ?? Math.round(text.length * size * (mono ? 0.62 : 0.56) + 28)
  const h = size + (compact ? 16 : 20)
  return (
    <g>
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={compact ? 2.5 : 3} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fill={color} style={{ font: `${weight} ${size}px ${mono ? theme.mono : theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Галочка или крестик в кружке с центром (x, y). */
export function Mark({ x, y, ok, r = 14 }: { x: number; y: number; ok: boolean; r?: number }) {
  const color = ok ? theme.ok : theme.risk
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={ok ? theme.okTint : theme.riskTint} stroke={color} strokeWidth={3} />
      {ok ? (
        <path d={`M${x - r * 0.45} ${y} L${x - r * 0.1} ${y + r * 0.38} L${x + r * 0.5} ${y - r * 0.38}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M${x - r * 0.4} ${y - r * 0.4} L${x + r * 0.4} ${y + r * 0.4} M${x + r * 0.4} ${y - r * 0.4} L${x - r * 0.4} ${y + r * 0.4}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
      )}
    </g>
  )
}

/** Облако (GitHub, интернет); (x, y) — левый верхний угол, w×h — размер. */
export function Cloud({ x, y, w, h, children, stroke = theme.line, fill = theme.paper }: { x: number; y: number; w: number; h: number; children?: ReactNode; stroke?: string; fill?: string }) {
  const d = `M${x + w * 0.16} ${y + h} H${x + w * 0.86} A${w * 0.14} ${h * 0.26} 0 0 0 ${x + w * 0.9} ${y + h * 0.5} A${w * 0.2} ${h * 0.3} 0 0 0 ${x + w * 0.62} ${y + h * 0.2} A${w * 0.22} ${h * 0.32} 0 0 0 ${x + w * 0.2} ${y + h * 0.36} A${w * 0.16} ${h * 0.32} 0 0 0 ${x + w * 0.16} ${y + h} Z`
  return (
    <g>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={3} />
      {children}
    </g>
  )
}

const F = PHONE_FONT

// Экран телефона (координаты экрана от -54,-92 до 54,92): кнопка с подписью label, затем список.
// Телефон рисуется в масштабе PHONE_SCALE, поэтому текст F px на экране кадра не мельче 18 px.
export function PhoneScreen({ tapAt, listAt, list, label = 'Мои тренировки', listColor = theme.ok, children }: { tapAt: number; listAt: number; list: string[]; label?: string; listColor?: string; children?: ReactNode }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const shown = frame >= listAt
  return (
    <g>
      <rect x={-50} y={-84} width={100} height={26} rx={7} fill={theme.accent} />
      <text y={-66.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        {label}
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

// Ключ: кольцо и бородка; центр кольца — (x, y), color — цвет линии, scale — масштаб.
export function KeyGlyph({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={8} fill="none" stroke={color} strokeWidth={4} />
      <path d="M8 0 H28 M22 0 V7 M27 0 V6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}

/** Реплика героя: плашка с текстом по центру (x, y) и указка к говорящему (tx, ty). */
export function Callout({ x, y, tx, ty, text, color = theme.ink, fill = theme.white, size = 20 }: { x: number; y: number; tx: number; ty: number; text: string; color?: string; fill?: string; size?: number }) {
  const h = size + 20
  const from = ty > y ? y + h / 2 : y - h / 2
  return (
    <g>
      <line x1={x + (tx - x) * 0.25} y1={from} x2={tx} y2={ty} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={tx} cy={ty} r={4} fill={color} />
      <Pill x={x} y={y} text={text} color={color} fill={fill} size={size} weight={600} />
    </g>
  )
}
