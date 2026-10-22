import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { Mark } from '../../kit/props'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'

// Детали сцен ролика дня 14 «Надёжность»: колонна, колесо, сейф, секундомер, колокольчик,
// знак «внимание», копия базы, ночь, крутилка загрузки, строка с галочкой, экраны телефона.
// Плашка, галочка, реплика и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

const F = 18 // текст на экране телефона (телефон в масштабе 1)

/** Колонна под крышей: капитель, ствол с рисунком и подписью, база. ghost (0–1) — колонну «не видно»: бледная и пунктиром. */
export function Column({ x, top, bottom, w, label, color = theme.accent, ghost = 0, glow = 0, children }: { x: number; top: number; bottom: number; w: number; label: string; color?: string; ghost?: number; glow?: number; children?: ReactNode }) {
  const solid = 1 - ghost * 0.85
  return (
    <g>
      {glow > 0 && <rect x={x - 16} y={top - 8} width={w + 32} height={bottom - top + 16} rx={14} fill={theme.okTint} opacity={glow} />}
      <g opacity={solid}>
        <rect x={x - 8} y={top} width={w + 16} height={16} rx={4} fill={theme.white} stroke={color} strokeWidth={3} />
        <rect x={x} y={top + 16} width={w} height={bottom - top - 32} fill={theme.white} stroke={color} strokeWidth={3} />
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={x + w * k} y1={top + 120} x2={x + w * k} y2={bottom - 64} stroke={theme.grid} strokeWidth={3} />
        ))}
        <rect x={x - 8} y={bottom - 16} width={w + 16} height={16} rx={4} fill={theme.white} stroke={color} strokeWidth={3} />
        {children}
        <Label x={x + w / 2} y={bottom - 34} size={22} weight={800} color={color}>
          {label}
        </Label>
      </g>
      {ghost > 0 && <rect x={x - 8} y={top} width={w + 16} height={bottom - top} rx={6} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="9 7" opacity={ghost} />}
    </g>
  )
}

/** Колесо: шина, диск и болты; (x, y) — центр, r — радиус. flat (0–1) — спущено, низ сплющен; nail — гвоздь в шине. */
export function Tire({ x, y, r, flat = 0, nail = false }: { x: number; y: number; r: number; flat?: number; nail?: boolean }) {
  const ry = r * (1 - 0.26 * flat)
  const cy = y + r - ry
  const rx = r * (1 + 0.14 * flat)
  return (
    <g>
      <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={theme.ink} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <line key={i} x1={x + Math.cos(a) * rx * 0.8} y1={cy + Math.sin(a) * ry * 0.8} x2={x + Math.cos(a) * rx * 0.94} y2={cy + Math.sin(a) * ry * 0.94} stroke={theme.soft} strokeWidth={4} strokeLinecap="round" />
      })}
      <circle cx={x} cy={cy} r={r * 0.52} fill={theme.desk} stroke={theme.line} strokeWidth={3} />
      <circle cx={x} cy={cy} r={r * 0.17} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} cx={x + Math.cos(a) * r * 0.32} cy={cy + Math.sin(a) * r * 0.32} r={4} fill={theme.soft} />
      })}
      {nail && (
        <g>
          <line x1={x + rx * 0.62} y1={cy - ry * 0.62} x2={x + rx * 0.9} y2={cy - ry * 0.9} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
          <circle cx={x + rx * 0.92} cy={cy - ry * 0.92} r={7} fill={theme.risk} />
        </g>
      )}
    </g>
  )
}

/** Дверца сейфа с кодовым колесом: (x, y) — центр, s — масштаб. */
export function SafeBox({ x, y, s = 1, color = theme.ok }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-20} y={-20} width={40} height={40} rx={6} fill={theme.white} stroke={color} strokeWidth={3.5} />
      <circle r={10} fill="none" stroke={color} strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return <line key={i} x1={Math.cos(a) * 4} y1={Math.sin(a) * 4} x2={Math.cos(a) * 10} y2={Math.sin(a) * 10} stroke={color} strokeWidth={2.5} />
      })}
      <rect x={13} y={-8} width={4} height={16} rx={2} fill={color} />
    </g>
  )
}

/** Секундомер: (x, y) — центр циферблата; t (0–1) — доля круга, которую прошла стрелка. */
export function Watch({ x, y, r = 16, t = 0, color = theme.ink }: { x: number; y: number; r?: number; t?: number; color?: string }) {
  const a = t * Math.PI * 2 - Math.PI / 2
  return (
    <g>
      <rect x={x - 4} y={y - r - 9} width={8} height={7} rx={2} fill={color} />
      <circle cx={x} cy={y} r={r} fill={theme.white} stroke={color} strokeWidth={3} />
      <line x1={x} y1={y} x2={x + Math.cos(a) * r * 0.72} y2={y + Math.sin(a) * r * 0.72} stroke={theme.risk} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2.5} fill={color} />
    </g>
  )
}

/** Колокольчик оповещения: (x, y) — центр; ring (0–1) — звенит: качается, рядом волны. */
export function Bell({ x, y, ring = 0, color = theme.alt }: { x: number; y: number; ring?: number; color?: string }) {
  const frame = useCurrentFrame()
  const tilt = ring > 0 ? Math.sin(frame / 2.2) * 14 * ring : 0
  return (
    <g>
      <g transform={`rotate(${tilt} ${x} ${y - 18})`}>
        <path d={`M${x - 16} ${y + 8} Q${x - 14} ${y - 18} ${x} ${y - 18} Q${x + 14} ${y - 18} ${x + 16} ${y + 8} L${x + 20} ${y + 12} H${x - 20} Z`} fill={color} />
        <circle cx={x} cy={y + 16} r={4.5} fill={color} />
        <circle cx={x} cy={y - 21} r={3.5} fill={color} />
      </g>
      {ring > 0 && (
        <g fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={ring}>
          <path d={`M${x - 26} ${y - 14} Q${x - 32} ${y - 2} ${x - 26} ${y + 10}`} />
          <path d={`M${x + 26} ${y - 14} Q${x + 32} ${y - 2} ${x + 26} ${y + 10}`} />
        </g>
      )}
    </g>
  )
}

/** Знак «внимание»: треугольник с восклицательным знаком; (x, y) — центр. */
export function Caution({ x, y, s = 1, color = theme.risk }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -17 L19 15 H-19 Z" fill={theme.riskTint} stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
      <line x1={0} y1={-6} x2={0} y2={4} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={0} cy={10} r={2.2} fill={color} />
    </g>
  )
}

/** Копия базы: лист с загнутым уголком и маленьким цилиндром; (x, y) — центр, s — масштаб. */
export function CopyDoc({ x, y, s = 1, color = theme.ok }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-22 -28 H12 L22 -18 V28 H-22 Z" fill={theme.white} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <path d="M12 -28 V-18 H22" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M-11 -6 V12 A11 4 0 0 0 11 12 V-6" fill={theme.okTint} stroke={color} strokeWidth={2.5} />
      <ellipse cx={0} cy={-6} rx={11} ry={4} fill={theme.white} stroke={color} strokeWidth={2.5} />
    </g>
  )
}

/** Ночь: месяц в тёмном кружке; (x, y) — центр. */
export function Night({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.termBar} />
      <circle cx={x - r * 0.08} cy={y + r * 0.04} r={r * 0.6} fill={theme.alt} />
      <circle cx={x + r * 0.2} cy={y - r * 0.16} r={r * 0.52} fill={theme.termBar} />
    </g>
  )
}

/** Крутилка загрузки: дуга вращается; (x, y) — центр. */
export function Spinner({ x, y, r = 18, color = theme.accent }: { x: number; y: number; r?: number; color?: string }) {
  const frame = useCurrentFrame()
  return (
    <g transform={`rotate(${(frame * 12) % 360} ${x} ${y})`}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={theme.grid} strokeWidth={5} />
      <path d={`M${x} ${y - r} A${r} ${r} 0 0 1 ${x + r} ${y}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
    </g>
  )
}

/** Строка с квадратом слева; на кадре at квадрат отмечается галочкой. (x, y) — левый верхний угол квадрата. */
export function TickRow({ x, y, text, at, size = 22 }: { x: number; y: number; text: string; at: number; size?: number }) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 8)
  return (
    <g>
      <rect x={x} y={y} width={30} height={30} rx={7} fill={theme.okTint} fillOpacity={g} stroke={g > 0 ? theme.ok : theme.line} strokeWidth={3} />
      <path d={`M${x + 7} ${y + 16} L${x + 13} ${y + 22} L${x + 24} ${y + 9}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} fill="none" stroke={theme.ok} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={x + 46} y={y + 23} anchor="start" size={size} weight={600}>
        {text}
      </Label>
    </g>
  )
}

// Экраны телефона — в координатах экрана (от -54,-92 до 54,92); телефон в масштабе 1, текст 18 px.

const t = (y: number, text: string, color: string = theme.ink, weight = 700) => (
  <text y={y} textAnchor="middle" fill={color} style={{ font: `${weight} ${F}px ${theme.font}` }}>
    {text}
  </text>
)

function Button({ y, text, tapAt }: { y: number; text: string; tapAt?: number }) {
  const frame = useCurrentFrame()
  const ripple = tapAt !== undefined && frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  return (
    <g>
      <rect x={-50} y={y} width={100} height={34} rx={8} fill={theme.accent} />
      {t(y + 23, text, theme.white, 600)}
      {ripple > 0 && <circle cx={0} cy={y + 17} r={10 + ripple * 34} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}

/** Форма подхода: чей телефон, упражнение, повторы × вес и кнопка «Сохранить» (tapAt — кадр нажатия). */
export function SetForm({ who, title, value, tapAt, busy = false }: { who: string; title: string; value: string; tapAt?: number; busy?: boolean }) {
  return (
    <g>
      {t(-62, who, theme.soft, 600)}
      {t(-30, title)}
      <rect x={-50} y={-16} width={100} height={32} rx={6} fill={theme.white} stroke={theme.line} strokeWidth={2} />
      {t(6, value, theme.ink, 600)}
      {busy ? <Spinner x={0} y={56} r={14} /> : <Button y={40} text="Сохранить" tapAt={tapAt} />}
    </g>
  )
}

/** Понятное сообщение об ошибке: крестик, две строки и кнопка «Повторить». */
export function SetFailed({ who }: { who: string }) {
  return (
    <g>
      {t(-62, who, theme.soft, 600)}
      <Mark x={0} y={-30} ok={false} r={15} />
      {t(8, 'Не удалось')}
      {t(30, 'сохранить')}
      <Button y={46} text="Повторить" />
    </g>
  )
}
