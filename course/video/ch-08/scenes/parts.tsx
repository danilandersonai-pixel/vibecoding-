import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { theme } from '../../theme'

// Детали сцен ролика «Безопасность и надёжность»: пекарня, пирог, замки, колокол сигнализации,
// хозяйка пекарни, жучок-баг, выключатель флага, секундомер, улитка, сейф с копиями.
// Общие детали (плашка, галочка, облако, окно браузера, ключ) — в kit/props.tsx.

type Rect = { x: number; y: number; w: number; h: number }

/** Пирог: (x, y) — середина низа, s — масштаб. */
export function Pie({ x, y, s = 1, color = theme.alt }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-36 0 Q-38 -30 0 -32 Q38 -30 36 0 Z" fill={theme.altTint} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-22 -24 L-8 -6 M-6 -30 L10 -6 M12 -28 L24 -10" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <rect x={-42} y={-4} width={84} height={8} rx={4} fill={color} />
    </g>
  )
}

/**
 * Фасад пекарни: маркиза, вывеска, дверь и витрина с пирогами.
 * pies — сколько пирогов на витрине (0…6).
 */
export function Shop({ shop, door, win, pies = 2 }: { shop: Rect; door: Rect; win: Rect; pies?: number }) {
  const stripes = 8
  const sw = (shop.w + 20) / stripes
  return (
    <g>
      {/* стена */}
      <rect x={shop.x} y={shop.y} width={shop.w} height={shop.h} fill={theme.paper} stroke={theme.ink} strokeWidth={4} />
      {/* вывеска */}
      <rect x={shop.x + shop.w / 2 - 120} y={shop.y - 72} width={240} height={50} rx={10} fill={theme.alt} />
      <text x={shop.x + shop.w / 2} y={shop.y - 38} textAnchor="middle" fill={theme.white} style={{ font: `700 26px ${theme.font}` }}>
        Пекарня
      </text>
      {/* маркиза в полоску */}
      {Array.from({ length: stripes }, (_, i) => (
        <path key={i} d={`M${shop.x - 10 + i * sw} ${shop.y} h${sw} v34 q${-sw / 2} 16 ${-sw} 0 Z`} fill={i % 2 === 0 ? theme.risk : theme.white} stroke={theme.ink} strokeWidth={2} />
      ))}
      {/* дверь */}
      <rect x={door.x} y={door.y} width={door.w} height={door.h} fill={theme.altTint} stroke={theme.ink} strokeWidth={4} />
      <rect x={door.x + 16} y={door.y + 16} width={door.w - 32} height={60} rx={6} fill={theme.paper} stroke={theme.ink} strokeWidth={2} />
      {/* витрина */}
      <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={theme.white} stroke={theme.ink} strokeWidth={4} />
      <line x1={win.x + 8} y1={win.y + win.h - 34} x2={win.x + win.w - 8} y2={win.y + win.h - 34} stroke={theme.line} strokeWidth={4} />
      {Array.from({ length: Math.min(6, pies) }, (_, i) => {
        const row = i < 3 ? 0 : 1
        const col = i % 3
        return <Pie key={i} x={win.x + 46 + col * 74} y={win.y + win.h - 36 - row * 46} s={0.62} />
      })}
    </g>
  )
}

/** Замок: (x, y) — середина корпуса; cheap — тонкий и простой, иначе — массивный; open — дужка откинута. */
export function Padlock({ x, y, cheap = false, open = false, scale = 1 }: { x: number; y: number; cheap?: boolean; open?: boolean; scale?: number }) {
  const color = cheap ? theme.line : theme.ok
  const bw = cheap ? 40 : 60
  const bh = cheap ? 34 : 50
  const arc = cheap ? 13 : 20
  const thick = cheap ? 4 : 9
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={open ? `M${-arc} ${-bh / 2} V${-bh / 2 - 16} A${arc} ${arc} 0 0 1 ${arc + 10} ${-bh / 2 - 26}` : `M${-arc} ${-bh / 2} V${-bh / 2 - 12} A${arc} ${arc} 0 0 1 ${arc} ${-bh / 2 - 12} V${-bh / 2}`} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round" />
      <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={cheap ? 5 : 10} fill={color} />
      <circle cx={0} cy={-2} r={cheap ? 4 : 7} fill={theme.paper} />
      <rect x={-2} y={0} width={4} height={cheap ? 8 : 14} fill={theme.paper} />
    </g>
  )
}

/** Колокол сигнализации: (x, y) — центр; ring (0…1) — звенит: качается, вокруг волны. */
export function Bell({ x, y, ring = 0, scale = 1 }: { x: number; y: number; ring?: number; scale?: number }) {
  const swing = ring > 0 ? Math.sin(ring * Math.PI * 10) * 14 : 0
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {ring > 0 &&
        [26, 40, 54].map((r, i) => (
          <g key={r} opacity={Math.max(0, Math.sin(ring * Math.PI * 4 + i))}>
            <path d={`M${-r} ${-r * 0.6} A${r} ${r} 0 0 0 ${-r} ${r * 0.6}`} fill="none" stroke={theme.risk} strokeWidth={4} strokeLinecap="round" transform={`translate(-14 4)`} />
            <path d={`M${r} ${-r * 0.6} A${r} ${r} 0 0 1 ${r} ${r * 0.6}`} fill="none" stroke={theme.risk} strokeWidth={4} strokeLinecap="round" transform={`translate(14 4)`} />
          </g>
        ))}
      <rect x={-8} y={-34} width={16} height={8} rx={3} fill={theme.ink} />
      <g transform={`rotate(${swing} 0 -28)`}>
        <path d="M-24 14 Q-24 -26 0 -28 Q24 -26 24 14 L30 20 H-30 Z" fill={ring > 0 ? theme.risk : theme.riskTint} stroke={theme.risk} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={0} cy={24} r={6} fill={theme.ink} />
      </g>
    </g>
  )
}

/** Хозяйка пекарни в фартуке и шапочке; центр — середина фигуры, как у остальных героев. */
export function Baker({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
      {/* фартук */}
      <path d="M-22 6 H22 V62 Q0 70 -22 62 Z" fill={theme.paper} opacity={0.92} />
      {/* шапочка */}
      <rect x={-22} y={-86} width={44} height={14} rx={6} fill={theme.white} stroke={theme.line} strokeWidth={3} />
    </Actor>
  )
}

/** Гость пекарни — человек без аксессуаров. */
export function Guest({ pose, mood, color = theme.soft, ...props }: ActorProps & { pose?: Pose; mood?: Mood; color?: string }) {
  return (
    <Actor {...props}>
      <Person color={color} pose={pose} mood={mood} />
    </Actor>
  )
}

/** Жучок-баг: (x, y) — центр, s — масштаб. */
export function Bug({ x, y, s = 1, color = theme.risk }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-1, 1].map((side) => (
        <g key={side} stroke={color} strokeWidth={4} strokeLinecap="round">
          <path d={`M${side * 14} -6 L${side * 30} -16`} />
          <path d={`M${side * 16} 4 L${side * 32} 4`} />
          <path d={`M${side * 14} 14 L${side * 28} 26`} />
          <path d={`M${side * 6} -22 L${side * 14} -34`} />
        </g>
      ))}
      <ellipse cx={0} cy={4} rx={18} ry={22} fill={color} />
      <circle cx={0} cy={-20} r={10} fill={color} />
      <line x1={0} y1={-10} x2={0} y2={24} stroke={theme.paper} strokeWidth={3} />
    </g>
  )
}

/** Выключатель фича-флага: (x, y) — левый верхний угол, on (0…1) — включён. */
export function Toggle({ x, y, on }: { x: number; y: number; on: number }) {
  const w = 96
  const h = 48
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={on > 0.5 ? theme.ok : theme.grid} stroke={on > 0.5 ? theme.ok : theme.line} strokeWidth={3} />
      <circle cx={x + h / 2 + on * (w - h)} cy={y + h / 2} r={h / 2 - 6} fill={theme.white} stroke={theme.line} strokeWidth={2} />
    </g>
  )
}

/** Секундомер: (x, y) — центр, r — радиус, t (0…1) — сколько прошло по кругу. */
export function Stopwatch({ x, y, r, t }: { x: number; y: number; r: number; t: number }) {
  const a = t * Math.PI * 2 - Math.PI / 2
  return (
    <g>
      <rect x={x - 12} y={y - r - 22} width={24} height={14} rx={4} fill={theme.ink} />
      <circle cx={x} cy={y} r={r} fill={theme.paper} stroke={theme.ink} strokeWidth={5} />
      {Array.from({ length: 12 }, (_, i) => {
        const k = (i / 12) * Math.PI * 2
        return <line key={i} x1={x + (r - 12) * Math.cos(k)} y1={y + (r - 12) * Math.sin(k)} x2={x + (r - 4) * Math.cos(k)} y2={y + (r - 4) * Math.sin(k)} stroke={theme.ink} strokeWidth={i % 3 === 0 ? 4 : 2} />
      })}
      <line x1={x} y1={y} x2={x + (r - 18) * Math.cos(a)} y2={y + (r - 18) * Math.sin(a)} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={theme.ink} />
    </g>
  )
}

/** Улитка — «тормозит»: (x, y) — середина низа, s — масштаб. */
export function Snail({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-46 0 H40 Q52 0 52 -12 Q52 -20 44 -20 L40 -20" fill={theme.altTint} stroke={theme.alt} strokeWidth={4} strokeLinejoin="round" />
      <path d="M44 -20 L48 -40 M52 -20 L60 -38" stroke={theme.alt} strokeWidth={3} strokeLinecap="round" />
      <circle cx={48} cy={-42} r={4} fill={theme.alt} />
      <circle cx={60} cy={-40} r={4} fill={theme.alt} />
      <circle cx={-4} cy={-30} r={30} fill={theme.paper} stroke={theme.alt} strokeWidth={5} />
      <path d="M-4 -30 m-18 0 a18 18 0 1 0 18 -18 a12 12 0 1 0 12 12" fill="none" stroke={theme.alt} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}

/** Сейф для резервных копий: (x, y) — середина низа. */
export function Vault({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 70} y={y - 120} width={140} height={120} rx={12} fill={theme.codeBg} stroke={theme.ink} strokeWidth={4} />
      <rect x={x - 56} y={y - 106} width={112} height={92} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <circle cx={x} cy={y - 60} r={22} fill={theme.paper} stroke={theme.ink} strokeWidth={4} />
      {[0, 60, 120].map((d) => (
        <line key={d} x1={x} y1={y - 60} x2={x + 18 * Math.cos((d * Math.PI) / 180)} y2={y - 60 + 18 * Math.sin((d * Math.PI) / 180)} stroke={theme.ink} strokeWidth={3} />
      ))}
      <rect x={x + 40} y={y - 72} width={8} height={24} rx={3} fill={theme.ink} />
    </g>
  )
}
