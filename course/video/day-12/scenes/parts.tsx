import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Label } from '../../kit/parts'
import { Mark } from '../../kit/props'
import { grow } from '../../kit/reveal'
import { PHONE_FONT } from '../../kit/screens/layout'
import { theme } from '../../theme'

// Детали сцен ролика дня 12 «Приглашение по ссылке»: пунктирное место, дверь с кодовым замком,
// замок, лупа, строка с галочкой, экраны телефона, незнакомец. Плашка, галочка и реплика —
// Pill, Mark и Callout из kit/props.tsx.

const F = PHONE_FONT

/** Дверь зала с кодовой панелью: (x, y) — центр двери. */
export function Door({ x, y, scale = 1, color = theme.ink }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-46} y={-70} width={92} height={140} rx={6} fill={theme.desk} />
      <rect x={-36} y={-60} width={72} height={130} rx={4} fill={theme.paper} stroke={color} strokeWidth={3} />
      <circle cx={24} cy={8} r={5} fill={color} />
      <rect x={2} y={-44} width={28} height={36} rx={4} fill={theme.white} stroke={color} strokeWidth={2.5} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={9 + c * 7} cy={-36 + r * 9} r={2} fill={color} />))}
    </g>
  )
}

/** Замок: (x, y) — центр корпуса. */
export function Lock({ x, y, scale = 1, color = theme.accent }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-13 -6 V-18 Q-13 -32 0 -32 Q13 -32 13 -18 V-6" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      <rect x={-20} y={-8} width={40} height={32} rx={6} fill={color} />
      <circle cx={0} cy={5} r={4} fill={theme.paper} />
      <rect x={-1.5} y={6} width={3} height={9} rx={1.5} fill={theme.paper} />
    </g>
  )
}

/** Лупа: (x, y) — центр стекла. */
export function Lens({ x, y, color = theme.alt }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={4} />
      <path d={`M${x + 10} ${y + 10} L${x + 22} ${y + 22}`} stroke={color} strokeWidth={6} strokeLinecap="round" />
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

// Экраны телефона — в координатах экрана (от -54,-92 до 54,92); телефон рисуется в масштабе
// PHONE_SCALE, поэтому текст F px на экране кадра не мельче 18 px.

/** Сообщение на экране: строки по центру, галочка или крестик, кнопка (tapAt — кадр нажатия). */
export function PhoneMsg({ lines, color = theme.ink, ok, button, tapAt }: { lines: string[]; color?: string; ok?: boolean; button?: string; tapAt?: number }) {
  const frame = useCurrentFrame()
  const ripple = tapAt !== undefined && frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  return (
    <g>
      {lines.map((l, i) => (
        <text key={l} y={-44 + i * 18} textAnchor="middle" fill={color} style={{ font: `700 ${F}px ${theme.font}` }}>
          {l}
        </text>
      ))}
      {ok !== undefined && <Mark x={0} y={6} ok={ok} r={13} />}
      {button && (
        <g>
          <rect x={-44} y={38} width={88} height={26} rx={7} fill={theme.accent} />
          <text y={55.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
            {button}
          </text>
          {ripple > 0 && <circle cx={0} cy={51} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        </g>
      )}
    </g>
  )
}

/** Вход: два поля и кнопка «Войти». */
export function PhoneLogin() {
  return (
    <g>
      <text y={-62} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Вход
      </text>
      {[-44, -12].map((y) => (
        <rect key={y} x={-44} y={y} width={88} height={24} rx={5} fill={theme.white} stroke={theme.line} strokeWidth={2} />
      ))}
      <text x={-38} y={-27} fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
        Анна
      </text>
      <text x={-38} y={5} fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
        ••••••
      </text>
      <rect x={-44} y={24} width={88} height={26} rx={7} fill={theme.accent} />
      <text y={41.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        Войти
      </text>
    </g>
  )
}

/** Список на экране: заголовок, строки и бледная подпись внизу. */
export function PhoneList({ title, rows, note, color = theme.ok }: { title: string; rows: string[]; note?: string; color?: string }) {
  return (
    <g>
      <text y={-66} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        {title}
      </text>
      {rows.map((r, i) => (
        <g key={r}>
          <rect x={-50} y={-54 + i * 32} width={100} height={26} rx={6} fill={theme.paper} stroke={color} strokeWidth={2} />
          <text x={-44} y={-36.5 + i * 32} fill={theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
            {r}
          </text>
        </g>
      ))}
      {note && (
        <text y={-54 + rows.length * 32 + 18} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${F}px ${theme.font}` }}>
          {note}
        </text>
      )}
    </g>
  )
}

/** Незнакомый человек (серый, без снаряжения); подпись — как у героев. */
export function Stranger({ x, y, scale = 1, enterAt, label, pose, mood }: { x: number; y: number; scale?: number; enterAt?: number; label?: string; pose?: Pose; mood?: Mood }) {
  return (
    <Actor x={x} y={y} scale={scale} enterAt={enterAt} label={label}>
      <Person color={theme.soft} pose={pose} mood={mood} />
    </Actor>
  )
}
