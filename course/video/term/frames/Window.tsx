import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { appear } from '../motion'
import { SAFE, T, alpha } from '../theme'
import { CELL, MONO_STYLE, WIN, baseline, rowTop } from './geometry'

type WindowProps = {
  /** Заголовок в полосе окна. */
  title: string
  /** Тело: терминал темнее, редактор и дифф — как бумага. */
  tone: 'term' | 'paper'
  children: ReactNode
}

// Общее окно кадров записи: на весь SAFE, полоса 48 px с заголовком (faint), тело, рамка edge 2 px, скругление 8.
// Появляется за MOTION.appear кадров с кадра 0 сцены. Дети рисуются в координатах холста.
export function Window({ title, tone, children }: WindowProps) {
  const frame = useCurrentFrame()
  const { x, y, w, h } = SAFE
  const { bar, radius: r, border } = WIN
  return (
    <g data-part="window" opacity={appear(frame, 0)}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={tone === 'term' ? T.termBg : T.paper} />
      <path d={`M${x} ${y + bar} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + bar} Z`} fill={T.raised} />
      <rect x={x} y={y + bar - border} width={w} height={border} fill={T.edge} />
      <text x={x + WIN.pad} y={y + bar / 2 + 8} fill={T.faint} style={MONO_STYLE}>
        {title}
      </text>
      {children}
      <rect x={x + border / 2} y={y + border / 2} width={w - border} height={h - border} rx={r - border / 2} fill="none" stroke={T.edge} strokeWidth={border} />
    </g>
  )
}

/** Блочный курсор: левый край — в x, строка тела row. */
export function Cursor({ x, row }: { x: number; row: number }) {
  return <rect data-part="cursor" x={x} y={rowTop(row) + 5} width={CELL} height={28} fill={T.ink} />
}

type BandProps = {
  /** Имя части для разметки: highlight:0, highlight:1… */
  name: string
  x: number
  y: number
  w: number
  h: number
  /** Сколько полосы показано: 0…1, растёт слева направо. */
  p: number
}

/** Подсветка строк: полоса растягивается слева направо; заливка ink 14 % и рамка ink 2 px. */
export function Band({ name, x, y, w, h, p }: BandProps) {
  if (p <= 0) return null
  return <rect data-part={name} x={x} y={y} width={w * p} height={h} fill={alpha(T.ink, 0.14)} stroke={T.ink} strokeWidth={2} />
}

type TextProps = {
  x: number
  row: number
  fill: string
  /** Сколько знаков в строке (с вложенными tspan): каждый ставится на сетку знаков сам, и значок из запасного шрифта не сдвигает остальные. */
  chars: number
  weight?: number
  children: ReactNode
  role?: string
}

/** Строка текста тела окна: row — номер строки тела. */
export function Row({ x, row, fill, chars, weight, children, role }: TextProps) {
  const xs = Array.from({ length: chars }, (_, i) => +(x + i * CELL).toFixed(2)).join(' ')
  return (
    <text data-role={role} x={xs} y={baseline(row)} fill={fill} style={weight ? { ...MONO_STYLE, fontWeight: weight } : MONO_STYLE}>
      {children}
    </text>
  )
}
