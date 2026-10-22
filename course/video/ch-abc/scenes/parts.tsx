import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { theme } from '../../theme'

// Детали сцен ролика «Как устроено приложение»: официант, флажок сохранения, жук-баг, клавиша.
// Общие детали (облако, окно браузера, плашка, галочка) — в kit/props.tsx.

/** Официант ресторана (метафора API): в позе cheer держит поднос над головой. */
export function Waiter({ pose = 'stand', mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
      {/* бабочка официанта */}
      <path d="M-10 -24 L0 -19 L10 -24 L10 -14 L0 -19 L-10 -14 Z" fill={theme.paper} />
      {pose === 'cheer' && <rect x={-76} y={-80} width={152} height={6} rx={3} fill={theme.ink} />}
    </Actor>
  )
}

/** Флажок сохранения на точке (cx, cy): up — насколько поднят (0…1). */
export function Flag({ cx, cy, up, color = theme.accent }: { cx: number; cy: number; up: number; color?: string }) {
  const top = cy - 16 - 56 * up
  return (
    <g opacity={up > 0 ? 1 : 0}>
      <line x1={cx} y1={cy - 14} x2={cx} y2={top} stroke={theme.ink} strokeWidth={3} />
      <path d={`M${cx} ${top} L${cx + 28} ${top + 8} L${cx} ${top + 16} Z`} fill={color} />
    </g>
  )
}

/** Жук-баг с центром (x, y). */
export function Bug({ x, y, scale = 1, color = theme.risk }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-14 -6 L-22 -12 M-14 2 L-24 2 M-14 8 L-22 14 M14 -6 L22 -12 M14 2 L24 2 M14 8 L22 14" stroke={theme.ink} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={0} cy={3} rx={15} ry={13} fill={color} />
      <circle cx={0} cy={-12} r={7} fill={theme.ink} />
      <line x1={0} y1={-9} x2={0} y2={16} stroke={theme.paper} strokeWidth={2} />
    </g>
  )
}

/** Клавиша с надписью, левый верхний угол (x, y). */
export function KeyCap({ x, y, w = 80, label }: { x: number; y: number; w?: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y + 6} width={w} height={56} rx={10} fill={theme.line} />
      <rect x={x} y={y} width={w} height={56} rx={10} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
      <text x={x + w / 2} y={y + 36} textAnchor="middle" fill={theme.ink} style={{ font: `700 24px ${theme.font}` }}>
        {label}
      </text>
    </g>
  )
}
