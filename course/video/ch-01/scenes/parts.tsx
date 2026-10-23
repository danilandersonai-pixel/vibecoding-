import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { theme } from '../../theme'

// Детали сцен ролика «Вайб-кодинг: шкала, а не выключатель»: самолёт, штурвал, пилот,
// «вы», облачко реплики, кольцо лимита. Плашка-тег — Pill из kit/props.tsx.

/** Самолёт сбоку, нос вправо; центр — середина фюзеляжа, angle — наклон носа в градусах. */
export function Plane({ x, y, angle = 0, scale = 1 }: { x: number; y: number; angle?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      {/* хвостовое оперение */}
      <path d="M-66 -4 L-84 -40 L-64 -40 L-40 -6 Z" fill={theme.accent} />
      {/* дальнее крыло */}
      <path d="M-6 -6 L-30 -30 L-14 -30 L16 -6 Z" fill={theme.line} />
      {/* фюзеляж */}
      <path d="M-74 -8 Q-74 -14 -62 -14 L52 -14 Q78 -12 84 2 Q78 14 52 14 L-60 14 Q-74 12 -74 -8 Z" fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
      {/* кабина и окна */}
      <path d="M58 -11 Q72 -8 78 -2 L60 -2 Z" fill={theme.accent} />
      {[-42, -26, -10, 6, 22, 38].map((wx) => (
        <circle key={wx} cx={wx} cy={-3} r={3.5} fill={theme.accent} />
      ))}
      {/* ближнее крыло */}
      <path d="M-14 6 L-40 34 L-22 34 L18 6 Z" fill={theme.accent} />
    </g>
  )
}

/** Штурвал с центром (x, y); color — цвет руля (у автопилота — синий). */
export function Yoke({ x, y, color = theme.ink }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={8} x2={0} y2={30} stroke={theme.line} strokeWidth={8} strokeLinecap="round" />
      <path d="M-30 -18 L-30 0 Q-30 10 -20 10 L20 10 Q30 10 30 0 L30 -18" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={8} r={7} fill={color} />
    </g>
  )
}

/** Пилот — это вы: фигура в фуражке; asleep — глаза закрыты. */
export function Pilot({ pose, mood, asleep = false, ...props }: ActorProps & { pose?: Pose; mood?: Mood; asleep?: boolean }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
      {asleep && (
        <g>
          <circle cx={-8} cy={-56} r={6} fill={theme.paper} />
          <circle cx={8} cy={-56} r={6} fill={theme.paper} />
          <path d="M-13 -56 Q-8 -51 -3 -56 M3 -56 Q8 -51 13 -56" fill="none" stroke={theme.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {/* фуражка с кокардой */}
      <path d="M-26 -68 Q-24 -86 0 -88 Q24 -86 26 -68 Z" fill={theme.ink} />
      <rect x={-30} y={-70} width={60} height={7} rx={3} fill={theme.ink} />
      <circle cx={0} cy={-77} r={4} fill={theme.alt} />
    </Actor>
  )
}

/** «Вы» — фигура без аксессуаров (сцены 3 и 6). */
export function You({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
    </Actor>
  )
}

/** Облачко реплики: (x, y) — левый верхний угол; хвостик вниз к точке tx. */
export function Bubble({ x, y, w, text, tx, color = theme.ink, fill = theme.paper, size = 20 }: { x: number; y: number; w: number; text: string; tx: number; color?: string; fill?: string; size?: number }) {
  const h = size + 22
  return (
    <g>
      <path d={`M${tx - 9} ${y + h - 2} L${tx} ${y + h + 14} L${tx + 9} ${y + h - 2} Z`} fill={fill} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={2.5} />
      <rect x={tx - 8} y={y + h - 5} width={16} height={5} fill={fill} />
      <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${size}px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Кольцо-индикатор с центром (x, y): left — доля, которая осталась (0…1), дуга идёт по часовой от верха. */
export function Ring({ x, y, r, left, color = theme.accent, children }: { x: number; y: number; r: number; left: number; color?: string; children?: ReactNode }) {
  const c = 2 * Math.PI * r
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.paper} stroke={theme.grid} strokeWidth={18} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={18} strokeDasharray={`${c * left} ${c}`} transform={`rotate(-90 ${x} ${y})`} strokeLinecap="round" opacity={left > 0.002 ? 1 : 0} />
      {children}
    </g>
  )
}
