import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'

// Детали сцен ролика «Как устроено приложение»: официант, облако, флажок сохранения, жук-баг,
// клавиша, окно браузера, плашка-«пилюля».

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

/** Плашка с текстом по центру (x, y); w — ширина. */
export function Pill({ x, y, w, text, color = theme.accent, fill = theme.paper, size = 22, weight = 700, mono = false }: { x: number; y: number; w: number; text: string; color?: string; fill?: string; size?: number; weight?: number; mono?: boolean }) {
  const h = size + 20
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={3} />
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
