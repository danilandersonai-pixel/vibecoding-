import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { theme } from '../../theme'

// Детали сцен ролика «Своё приложение по образцу»: повар, тарелка, кастрюля, стена,
// маленький телефон, звёзды отзыва. Общие детали (плашка, галочка, облако, окно браузера) — в kit/props.tsx.

/** Повар — это вы: фигура в поварском колпаке. */
export function Chef({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
      {/* колпак */}
      <path d="M-22 -70 L-22 -86 Q-38 -92 -30 -106 Q-24 -118 -10 -112 Q-2 -126 12 -116 Q28 -120 30 -104 Q38 -92 22 -86 L22 -70 Z" fill={theme.paper} stroke={theme.line} strokeWidth={3} strokeLinejoin="round" />
      <line x1={-22} y1={-78} x2={22} y2={-78} stroke={theme.line} strokeWidth={2} />
    </Actor>
  )
}

/** Тарелка с салатом; (x, y) — центр тарелки, steam — пар (0…1), frame — для покачивания пара. */
export function Plate({ x, y, scale = 1, steam = 0, frame = 0 }: { x: number; y: number; scale?: number; steam?: number; frame?: number }) {
  const wave = (i: number) => Math.sin(frame / 6 + i * 2) * 4
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {steam > 0 &&
        [-18, 0, 18].map((dx, i) => (
          <path key={dx} d={`M${dx} -36 q${6 + wave(i)} -10 0 -20 q${-6 - wave(i)} -10 0 -20`} fill="none" stroke={theme.line} strokeWidth={3} strokeLinecap="round" opacity={steam * 0.8} />
        ))}
      <ellipse cx={0} cy={6} rx={70} ry={16} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <path d="M-44 4 Q-40 -30 0 -32 Q40 -30 44 4 Z" fill={theme.okTint} stroke={theme.ok} strokeWidth={3} />
      <circle cx={-18} cy={-12} r={7} fill={theme.risk} />
      <circle cx={10} cy={-18} r={6} fill={theme.alt} />
      <circle cx={24} cy={-6} r={6} fill={theme.risk} />
      <path d="M-6 -4 q6 -12 14 -4" fill="none" stroke={theme.ok} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

/** Кастрюля на плите; (x, y) — центр кастрюли, steam — пар (0…1). */
export function Pot({ x, y, steam = 0, frame = 0 }: { x: number; y: number; steam?: number; frame?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {steam > 0 &&
        [-20, 0, 20].map((dx, i) => (
          <path key={dx} d={`M${dx} -34 q${8 + Math.sin(frame / 5 + i) * 4} -12 0 -24 q-8 -12 0 -24`} fill="none" stroke={theme.line} strokeWidth={3} strokeLinecap="round" opacity={steam * 0.8} />
        ))}
      <rect x={-70} y={34} width={140} height={14} rx={4} fill={theme.ink} />
      <rect x={-50} y={-26} width={100} height={58} rx={10} fill={theme.soft} />
      <rect x={-58} y={-32} width={116} height={10} rx={5} fill={theme.ink} />
      <rect x={-80} y={-14} width={24} height={8} rx={4} fill={theme.ink} />
      <rect x={56} y={-14} width={24} height={8} rx={4} fill={theme.ink} />
    </g>
  )
}

/** Кирпичная стена: прямоугольник x, y, w, h; щель с центром на slotY (если задан). */
export function Wall({ x, y, w, h, slotY }: { x: number; y: number; w: number; h: number; slotY?: number }) {
  const rows = Math.floor(h / 22)
  const bricks: ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    const top = y + r * 22
    if (slotY !== undefined && top + 22 > slotY - 20 && top < slotY + 20) continue
    const shift = r % 2 === 0 ? 0 : -w / 2
    for (let bx = x + shift; bx < x + w; bx += w) {
      const left = Math.max(x, bx)
      const right = Math.min(x + w, bx + w)
      bricks.push(<rect key={`${r}-${bx}`} x={left + 1.5} y={top + 1.5} width={right - left - 3} height={19} rx={3} fill={theme.altTint} stroke={theme.alt} strokeWidth={2} />)
    }
  }
  return <g>{bricks}</g>
}

/** Маленький телефон без текста (значок приложения); (x, y) — центр, color — цвет экрана. */
export function MiniPhone({ x, y, w = 40, h = 66, color = theme.alt, children }: { x: number; y: number; w?: number; h?: number; color?: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} fill={theme.ink} />
      <rect x={-w / 2 + 4} y={-h / 2 + 7} width={w - 8} height={h - 14} rx={3} fill={theme.paper} />
      <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w - 16} height={6} rx={2} fill={color} />
      <rect x={-w / 2 + 8} y={-h / 2 + 23} width={w - 16} height={5} rx={2} fill={theme.grid} />
      <rect x={-w / 2 + 8} y={-h / 2 + 32} width={w - 22} height={5} rx={2} fill={theme.grid} />
      {children}
    </g>
  )
}

/** Звёзды отзыва: n закрашено из 5; (x, y) — центр первой звезды, size — радиус. */
export function Stars({ x, y, n, size = 10 }: { x: number; y: number; n: number; size?: number }) {
  const star = (cx: number) => {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size : size * 0.45
      const a = (Math.PI / 5) * i - Math.PI / 2
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`)
    }
    return pts.join(' ')
  }
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={star(x + i * size * 2.3)} fill={i < n ? theme.alt : theme.paper} stroke={theme.alt} strokeWidth={2} />
      ))}
    </g>
  )
}
