import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Pill } from '../../kit/props'
import { theme } from '../../theme'

// Детали сцен ролика «Что остаётся человеку»: шахматная доска и фигуры, шахматист лицом влево,
// плашка-реплика с указкой, таймер. Плашка и галочка — Pill и Mark из kit/props.tsx.

export type PieceKind = 'pawn' | 'rook' | 'bishop' | 'queen' | 'king'

/** Шахматная фигура с центром (x, y) клетки; dark — чёрная. Нарисована на клетку 44 px. */
export function Piece({ x, y, kind, dark }: { x: number; y: number; kind: PieceKind; dark: boolean }) {
  const s = { fill: dark ? theme.ink : theme.white, stroke: theme.ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const }
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* подставка — общая у всех фигур */}
      <rect x={-13} y={11} width={26} height={7} rx={2} {...s} />
      {kind === 'pawn' && (
        <>
          <path d="M-8 11 Q-6 0 -3 -2 L3 -2 Q6 0 8 11 Z" {...s} />
          <circle cx={0} cy={-8} r={6.5} {...s} />
        </>
      )}
      {kind === 'rook' && <path d="M-10 11 L-8 -6 L-11 -6 L-11 -16 L-6 -16 L-6 -11 L-2 -11 L-2 -16 L2 -16 L2 -11 L6 -11 L6 -16 L11 -16 L11 -6 L8 -6 L10 11 Z" {...s} />}
      {kind === 'bishop' && (
        <>
          <path d="M-9 11 Q-9 -2 0 -16 Q9 -2 9 11 Z" {...s} />
          <circle cx={0} cy={-18} r={3} {...s} />
          <path d="M-3 -9 L4 -2" stroke={dark ? theme.white : theme.ink} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
      {kind === 'queen' && (
        <>
          <path d="M-11 11 L-13 -12 L-6 -2 L0 -16 L6 -2 L13 -12 L11 11 Z" {...s} />
          <circle cx={0} cy={-18} r={3} {...s} />
        </>
      )}
      {kind === 'king' && (
        <>
          <path d="M-11 11 Q-13 -8 0 -8 Q13 -8 11 11 Z" {...s} />
          <path d="M0 -10 L0 -22 M-5 -17 L5 -17" stroke={theme.ink} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

/** Шахматная доска 8×8: (x, y) — левый верхний угол, cell — сторона клетки. */
export function ChessBoard({ x, y, cell }: { x: number; y: number; cell: number }) {
  const squares = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      squares.push(<rect key={`${r}-${c}`} x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill={(r + c) % 2 === 0 ? theme.white : theme.grid} />)
    }
  }
  return (
    <g>
      <rect x={x - 8} y={y - 8} width={cell * 8 + 16} height={cell * 8 + 16} rx={8} fill={theme.desk} stroke={theme.line} strokeWidth={3} />
      {squares}
    </g>
  )
}

/** Шахматист лицом влево (к доске): фигура отражена, подпись — нет. */
export function Player({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <g transform="scale(-1 1)">
        <Person color={theme.soft} pose={pose} mood={mood} />
      </g>
    </Actor>
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

/** Таймер: циферблат с центром (x, y) и радиусом r, сектор заполнен на долю p (0…1). */
export function Timer({ x, y, r, p, color = theme.accent }: { x: number; y: number; r: number; p: number; color?: string }) {
  const a = Math.min(0.9999, Math.max(0, p)) * Math.PI * 2
  const ex = x + r * Math.sin(a)
  const ey = y - r * Math.cos(a)
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.white} stroke={theme.ink} strokeWidth={3} />
      {p > 0 && <path d={`M${x} ${y} L${x} ${y - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ey} Z`} fill={color} opacity={0.35} />}
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={theme.ink} strokeWidth={3} strokeLinecap="round" />
      <rect x={x - 6} y={y - r - 10} width={12} height={8} rx={2} fill={theme.ink} />
    </g>
  )
}
