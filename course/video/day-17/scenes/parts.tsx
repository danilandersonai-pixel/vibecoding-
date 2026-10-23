import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { appear } from '../../kit/motion'
import { Label } from '../../kit/parts'
import { grow } from '../../kit/reveal'
import { PHONE_FONT } from '../../kit/screens/layout'
import { theme } from '../../theme'

// Детали сцен ролика дня 17 «Замеры и фото прогресса»: весы, сантиметровая лента, фото-заглушка
// (силуэт, без настоящего тела), навесной замок, маленький график, строка с галочкой, таймер ссылки,
// корзина, переключатель, экраны телефона, человек без снаряжения. Плашка, галочка, реплика
// и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

const F = PHONE_FONT

/** Напольные весы с табло: (x, y) — середина верхнего края площадки. */
export function Scales({ x, y, value }: { x: number; y: number; value: string }) {
  return (
    <g>
      <rect x={x - 90} y={y} width={180} height={40} rx={12} fill={theme.white} stroke={theme.line} strokeWidth={3} />
      <rect x={x - 38} y={y + 7} width={76} height={26} rx={6} fill={theme.termBg} />
      <text x={x} y={y + 27} textAnchor="middle" fill={theme.termOk} style={{ font: `600 18px ${theme.mono}` }}>
        {value}
      </text>
    </g>
  )
}

/** Сантиметровая лента на талии: (x, y) — центр, w — ширина; draw (0–1) — лента обвивается. */
export function Tape({ x, y, w, draw }: { x: number; y: number; w: number; draw: number }) {
  const len = w * draw
  return (
    <g opacity={draw > 0 ? 1 : 0}>
      <rect x={x - w / 2} y={y - 8} width={len} height={16} rx={3} fill={theme.alt} opacity={0.9} />
      {Array.from({ length: Math.floor(len / 9) }, (_, i) => (
        <line key={i} x1={x - w / 2 + 5 + i * 9} y1={y - 8} x2={x - w / 2 + 5 + i * 9} y2={y - (i % 2 ? 3 : 0)} stroke={theme.white} strokeWidth={1.5} />
      ))}
    </g>
  )
}

/** Фото прогресса — заглушка: рамка и простой силуэт. (x, y) — левый верхний угол; date — подпись под снимком. */
export function PhotoThumb({ x, y, w, h, date, stroke = theme.line }: { x: number; y: number; w: number; h: number; date?: string; stroke?: string }) {
  const cx = x + w / 2
  const r = w * 0.14
  const top = y + h * 0.58
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={theme.codeBg} stroke={stroke} strokeWidth={2.5} />
      <circle cx={cx} cy={y + h * 0.36} r={r} fill={theme.grid} />
      <path d={`M${cx - w * 0.3} ${y + h - 3} V${top + h * 0.12} Q${cx - w * 0.3} ${top} ${cx} ${top} Q${cx + w * 0.3} ${top} ${cx + w * 0.3} ${top + h * 0.12} V${y + h - 3} Z`} fill={theme.grid} />
      {date && (
        <text x={cx} y={y + h + 22} textAnchor="middle" fill={theme.soft} style={{ font: `600 18px ${theme.font}` }}>
          {date}
        </text>
      )}
    </g>
  )
}

/** Навесной замок с замочной скважиной: (x, y) — центр корпуса. */
export function Padlock({ x, y, scale = 1, color = theme.ok }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-12 -8 V-20 Q-12 -33 0 -33 Q12 -33 12 -20 V-8" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <rect x={-21} y={-10} width={42} height={34} rx={7} fill={color} />
      <circle cx={0} cy={3} r={4.5} fill={theme.paper} />
      <path d="M-3 5 L3 5 L2 15 L-2 15 Z" fill={theme.paper} />
    </g>
  )
}

/** Маленький график по неделям: заголовок, шкала min–max, линия рисуется с кадра at. (x, y) — левый верхний угол. */
export function Trend({ x, y, w, h, title, values, min, max, at, color = theme.accent, unit }: { x: number; y: number; w: number; h: number; title: string; values: number[]; min: number; max: number; at: number; color?: string; unit: string }) {
  const frame = useCurrentFrame()
  const left = x + 46
  const right = x + w - 18
  const top = y + 58
  const bottom = y + h - 34
  const px = (i: number) => left + ((right - left) * i) / (values.length - 1)
  const py = (v: number) => bottom - ((bottom - top) * (v - min)) / (max - min)
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)} ${py(v)}`).join(' ')
  const drawn = grow(frame, at + 6, 36)
  const fmt = (v: number) => String(v).replace('.', ',')
  const last = values.length - 1
  return (
    <g opacity={appear(frame, at, 10)}>
      <Label x={x} y={y + 20} anchor="start" size={20} weight={700}>
        {title}
      </Label>
      {[top, (top + bottom) / 2, bottom].map((gy) => (
        <line key={gy} x1={left} y1={gy} x2={right} y2={gy} stroke={theme.grid} strokeWidth={2} />
      ))}
      <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawn} fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={6} fill={theme.paper} stroke={color} strokeWidth={3.5} opacity={grow(frame, at + 6 + (i / last) * 36, 5)} />
      ))}
      <g opacity={grow(frame, at + 10, 6)}>
        <Label x={px(0)} y={py(values[0]) - 14} size={18} weight={700} color={color}>
          {fmt(values[0])}
        </Label>
      </g>
      <g opacity={grow(frame, at + 44, 6)}>
        <Label x={px(last)} y={values[last] < values[0] ? py(values[last]) + 28 : py(values[last]) - 14} anchor="end" size={18} weight={700} color={color}>
          {`${fmt(values[last])} ${unit}`}
        </Label>
      </g>
      <Label x={x} y={y + h - 8} anchor="start" size={18} color={theme.soft} weight={500}>
        нед.
      </Label>
      {values.map((_, i) => (
        <Label key={i} x={px(i)} y={y + h - 8} size={18} color={theme.soft} weight={500}>
          {String(i + 1)}
        </Label>
      ))}
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

/** Таймер ссылки: кольцо убывает (left 0–1), в центре подпись. (x, y) — центр. */
export function Timer({ x, y, r, left, label, color = theme.ok }: { x: number; y: number; r: number; left: number; label: string; color?: string }) {
  const c = 2 * Math.PI * r
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.white} stroke={theme.grid} strokeWidth={7} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${c * left} ${c}`} transform={`rotate(-90 ${x} ${y})`} strokeLinecap="round" opacity={left > 0 ? 1 : 0} />
      <Label x={x} y={y + 7} size={20} weight={800} color={left > 0 ? color : theme.risk}>
        {label}
      </Label>
    </g>
  )
}

/** Корзина: (x, y) — центр. */
export function Trash({ x, y, color = theme.risk }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-14 -10 H14 M-5 -10 V-15 H5 V-10" />
      <path d="M-11 -10 L-9 15 H9 L11 -10" />
      <path d="M-3 -3 V9 M3 -3 V9" />
    </g>
  )
}

/** Переключатель: (x, y) — левый край по центру высоты; on — включён. */
export function Toggle({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g>
      <rect x={x} y={y - 13} width={48} height={26} rx={13} fill={on ? theme.risk : theme.grid} />
      <circle cx={on ? x + 35 : x + 13} cy={y} r={10} fill={theme.white} />
    </g>
  )
}

/** Человек без снаряжения (подруга, незнакомые, тестовый пользователь); подпись — как у героев. */
export function Someone({ x, y, scale = 1, enterAt, label, pose, mood, color = theme.soft }: { x: number; y: number; scale?: number; enterAt?: number; label?: string; pose?: Pose; mood?: Mood; color?: string }) {
  return (
    <Actor x={x} y={y} scale={scale} enterAt={enterAt} label={label}>
      <Person color={color} pose={pose} mood={mood} />
    </Actor>
  )
}

// Экраны телефона — в координатах экрана (от -54,-92 до 54,92); телефон рисуется в масштабе
// PHONE_SCALE, поэтому текст F px на экране кадра не мельче 18 px.

/** Форма замеров: заголовок, строки (shown — сколько заполнено), кнопка «Сохранить». */
export function MeasureScreen({ rows, shown, tapAt, saved }: { rows: { label: string; value: string }[]; shown: number; tapAt: number; saved: boolean }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  return (
    <g>
      <text y={-70} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Замеры
      </text>
      <text y={-54} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${F}px ${theme.font}` }}>
        неделя 5
      </text>
      {rows.map((r, i) => (
        <g key={r.label}>
          <rect x={-50} y={-44 + i * 30} width={100} height={24} rx={5} fill={theme.white} stroke={i < shown ? theme.ok : theme.line} strokeWidth={2} />
          <text x={-45} y={-27.5 + i * 30} fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
            {r.label}
          </text>
          {i < shown && (
            <text x={45} y={-27.5 + i * 30} textAnchor="end" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
              {r.value}
            </text>
          )}
        </g>
      ))}
      <rect x={-50} y={48} width={100} height={26} rx={7} fill={saved ? theme.ok : theme.accent} />
      <text y={65.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        {saved ? 'Сохранено' : 'Сохранить'}
      </text>
      {ripple > 0 && <circle cx={0} cy={61} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}

/** Камера: видоискатель с силуэтом-заглушкой и кнопка спуска; tapAt — кадр снимка, вспышка после него. */
export function CameraScreen({ tapAt, done }: { tapAt: number; done: boolean }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const flash = frame >= tapAt ? 1 - appear(frame, tapAt + 2, 14) : 0
  return (
    <g>
      <text y={-72} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Фото прогресса
      </text>
      <rect x={-48} y={-62} width={96} height={112} rx={6} fill={theme.codeBg} stroke={theme.line} strokeWidth={2} />
      <circle cx={0} cy={-24} r={13} fill={theme.grid} />
      <path d="M-28 48 V8 Q-28 -4 0 -4 Q28 -4 28 8 V48 Z" fill={theme.grid} />
      {[
        [-42, -56, 1, 1],
        [42, -56, -1, 1],
        [-42, 44, 1, -1],
        [42, 44, -1, -1],
      ].map(([cx, cy, sx, sy]) => (
        <path key={`${cx}${cy}`} d={`M${cx} ${cy + 10 * sy} V${cy} H${cx + 10 * sx}`} fill="none" stroke={theme.ink} strokeWidth={2} />
      ))}
      <rect x={-48} y={-62} width={96} height={112} rx={6} fill={theme.white} opacity={flash} />
      <circle cx={0} cy={72} r={12} fill={done ? theme.ok : theme.white} stroke={done ? theme.ok : theme.ink} strokeWidth={3} />
      {done && <path d="M-5 72 L-1 76 L6 67" fill="none" stroke={theme.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
      {ripple > 0 && <circle cx={0} cy={72} r={12 + ripple * 26} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}
