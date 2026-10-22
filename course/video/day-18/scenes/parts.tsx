import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { theme } from '../../theme'
import { HAND, rowTop, SCREEN, screenOf } from '../layout'

// Детали сцен ролика дня 18 «Тренировка без интернета»: крупный телефон с полосой сети, строки
// подходов с пометками, ввод подхода, значок сети, конверт подхода в пути, карточка с шапкой,
// значки (штанга, гантель, самолёт, база), строка списка. Плашка, галочка, реплика и пунктирное
// место — Pill, Mark, Callout и Slot из kit/props.tsx.

type Rect = { x: number; y: number; w: number; h: number }

/** Крупный телефон в координатах холста: (x, y) — левый верхний угол рамки; dark — экран погас (0…1). */
export function Handset({ x, y, dark = 0, children }: { x: number; y: number; dark?: number; children?: ReactNode }) {
  const s = screenOf({ x, y })
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={HAND.w} height={HAND.h} rx={28} fill={theme.desk} />
      <rect x={x} y={y} width={HAND.w} height={HAND.h} rx={28} fill={theme.ink} />
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill={theme.white} />
      <rect x={x + HAND.w / 2 - 22} y={y + 12} width={44} height={6} rx={3} fill={theme.soft} />
      {children}
      {dark > 0 && <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill={theme.ink} opacity={0.94 * dark} />}
    </g>
  )
}

/** Полоска сети: четыре столбика с правым нижним углом (x, y); on — сколько связи (0…1); без связи — косая черта. */
export function Bars({ x, y, on, s = 1 }: { x: number; y: number; on: number; s?: number }) {
  const color = on > 0.5 ? theme.ok : theme.line
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-26 + i * 7} y={-6 - i * 4} width={5} height={6 + i * 4} rx={1.5} fill={color} />
      ))}
      <path d="M-28 -20 L2 2" stroke={theme.risk} strokeWidth={3} strokeLinecap="round" opacity={1 - on} />
    </g>
  )
}

/** Самолёт (режим полёта): (x, y) — центр, около 22 px. */
function Plane({ x, y, color = theme.alt, s = 1 }: { x: number; y: number; color?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -11 Q2 -11 2 -6 L2 -2 L11 3 L11 6 L2 3 L2 7 L5 9 L5 11 L0 10 L-5 11 L-5 9 L-2 7 L-2 3 L-11 6 L-11 3 L-2 -2 L-2 -6 Q-2 -11 0 -11 Z" fill={color} />
    </g>
  )
}

/** Строка состояния экрана: справа сеть (net 0…1) или режим полёта (plane 0…1). */
export function StatusBar({ s, net, plane = 0 }: { s: Rect; net: number; plane?: number }) {
  const right = s.x + s.w - 14
  const y = s.y + SCREEN.status
  const offline = plane > 0 ? 0 : 1 - net
  return (
    <g>
      <g opacity={1 - plane}>
        <Bars x={right} y={y + 2} on={net} />
        <g opacity={offline}>
          <Label x={right - 38} y={y + 2} anchor="end" size={18} weight={700} color={theme.risk}>
            нет сети
          </Label>
        </g>
        <g opacity={net}>
          <Label x={right - 38} y={y + 2} anchor="end" size={18} weight={700} color={theme.ok}>
            есть сеть
          </Label>
        </g>
      </g>
      <g opacity={plane}>
        <Plane x={right - 10} y={y - 4} />
        <Label x={right - 30} y={y + 2} anchor="end" size={18} weight={700} color={theme.alt}>
          режим полёта
        </Label>
      </g>
    </g>
  )
}

/** Шапка экрана: название и справа счётчик очереди (count < 0 — без счётчика). */
export function ScreenTitle({ s, title, count = -1, pulse = 0 }: { s: Rect; title: string; count?: number; pulse?: number }) {
  return (
    <g>
      <Label x={s.x + 16} y={s.y + SCREEN.title} anchor="start" size={22} weight={800}>
        {title}
      </Label>
      {count >= 0 && (
        <g>
          {pulse > 0 && <rect x={s.x + s.w - 146} y={s.y + SCREEN.title - 22} width={140} height={30} rx={15} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} opacity={pulse} />}
          <Label x={s.x + s.w - 16} y={s.y + SCREEN.title - 1} anchor="end" size={18} weight={700} color={count > 0 ? theme.alt : theme.soft}>
            {`в очереди: ${count}`}
          </Label>
        </g>
      )}
      <line x1={s.x + 10} y1={s.y + SCREEN.line} x2={s.x + s.w - 10} y2={s.y + SCREEN.line} stroke={theme.grid} strokeWidth={2} />
    </g>
  )
}

/** Гантель-значок строки: (x, y) — центр. */
function Dumbbell({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g fill={color}>
      <rect x={x - 9} y={y - 2} width={18} height={4} />
      <rect x={x - 14} y={y - 8} width={5} height={16} rx={1.5} />
      <rect x={x + 9} y={y - 8} width={5} height={16} rx={1.5} />
    </g>
  )
}

/** Часы (ждёт отправки) или галочка (отправлено): (x, y) — центр значка. */
function StateIcon({ x, y, sent }: { x: number; y: number; sent: number }) {
  return (
    <g>
      <g opacity={1 - sent}>
        <circle cx={x} cy={y} r={7.5} fill="none" stroke={theme.alt} strokeWidth={2.5} />
        <path d={`M${x} ${y - 4} V${y} L${x + 3} ${y + 2}`} fill="none" stroke={theme.alt} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <path d={`M${x - 6} ${y} L${x - 2} ${y + 4} L${x + 6} ${y - 5}`} fill="none" stroke={theme.ok} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={sent} />
    </g>
  )
}

/** Строка подхода на экране: значение, номер подхода справа (idOn 0…1), пометка «не отправлено» → «отправлено»
 * (sent 0…1) или своя пометка note; glow — рамка вокруг пометки; flash — строка только что записана. */
export function SetRow({ s, i, text, id, idOn = 0, sent = 0, note, noteColor = theme.alt, glow = 0, flash = 0, strike }: { s: Rect; i: number; text: string; id?: string; idOn?: number; sent?: number; note?: string; noteColor?: string; glow?: number; flash?: number; strike?: { text: string; draw: number } }) {
  const x = s.x + 12
  const y = rowTop(s, i)
  const w = s.w - 24
  return (
    <g>
      <rect x={x} y={y} width={w} height={SCREEN.rowH} rx={10} fill={theme.paper} stroke={flash > 0 ? theme.ok : theme.grid} strokeWidth={flash > 0 ? 3 : 2} />
      <Dumbbell x={x + 22} y={y + 31} color={theme.soft} />
      {strike ? (
        <g>
          <Label x={x + 46} y={y + 27} anchor="start" size={22} weight={800} color={theme.line} opacity={1 - strike.draw}>
            {strike.text}
          </Label>
          <g opacity={strike.draw}>
            <Label x={x + 46} y={y + 27} anchor="start" size={22} weight={800}>
              {text}
            </Label>
          </g>
        </g>
      ) : (
        <Label x={x + 46} y={y + 27} anchor="start" size={22} weight={800}>
          {text}
        </Label>
      )}
      {id && (
        <g opacity={idOn}>
          <text x={x + w - 10} y={y + 26} textAnchor="end" fill={theme.accent} style={{ font: `600 18px ${theme.mono}`, fontVariantLigatures: 'none' }}>
            {id}
          </text>
        </g>
      )}
      {note ? (
        <Label x={x + 46} y={y + 52} anchor="start" size={18} weight={700} color={noteColor}>
          {note}
        </Label>
      ) : (
        <g>
          <StateIcon x={x + 54} y={y + 46} sent={sent} />
          <g opacity={1 - sent}>
            <Label x={x + 68} y={y + 52} anchor="start" size={18} weight={700} color={theme.alt}>
              не отправлено
            </Label>
          </g>
          <g opacity={sent}>
            <Label x={x + 68} y={y + 52} anchor="start" size={18} weight={700} color={theme.ok}>
              отправлено
            </Label>
          </g>
        </g>
      )}
      {glow > 0 && <rect x={x + 40} y={y + 34} width={170} height={26} rx={8} fill="none" stroke={theme.alt} strokeWidth={3} opacity={glow} />}
    </g>
  )
}

/** Ввод подхода внизу экрана: поле со значением и кнопка «Сохранить» (tapAt — нажатие). */
export function SetInput({ s, value, tapAt }: { s: Rect; value: string; tapAt?: number }) {
  const frame = useCurrentFrame()
  const y = s.y + SCREEN.form
  const h = SCREEN.formH
  const ripple = tapAt !== undefined && frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const bx = s.x + 160
  const bw = s.w - 172
  return (
    <g>
      <rect x={s.x + 12} y={y} width={140} height={h} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
      {value === '' ? (
        <Label x={s.x + 22} y={y + 30} anchor="start" size={18} color={theme.line} weight={600}>
          повторы × кг
        </Label>
      ) : (
        <Label x={s.x + 24} y={y + 30} anchor="start" size={20} weight={700}>
          {value}
        </Label>
      )}
      <rect x={bx} y={y} width={bw} height={h} rx={8} fill={theme.accent} />
      <Label x={bx + bw / 2} y={y + 29} size={18} weight={700} color={theme.white}>
        Сохранить
      </Label>
      {ripple > 0 && <circle cx={bx + bw / 2} cy={y + h / 2} r={12 + ripple * 40} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}

/** Значок сети на пути подхода: вышка и волны; on — связь есть (0…1), без связи — красный крестик. (x, y) — низ вышки. */
export function Signal({ x, y, on, label }: { x: number; y: number; on: number; label?: string }) {
  const color = on > 0.5 ? theme.ok : theme.soft
  return (
    <g>
      <path d={`M${x} ${y - 46} L${x - 14} ${y} M${x} ${y - 46} L${x + 14} ${y} M${x - 9} ${y - 16} H${x + 9}`} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
      <circle cx={x} cy={y - 50} r={6} fill={color} />
      <g fill="none" stroke={theme.ok} strokeWidth={3.5} strokeLinecap="round" opacity={on}>
        <path d={`M${x - 16} ${y - 62} Q${x - 24} ${y - 50} ${x - 16} ${y - 38} M${x + 16} ${y - 62} Q${x + 24} ${y - 50} ${x + 16} ${y - 38}`} />
        <path d={`M${x - 26} ${y - 70} Q${x - 38} ${y - 50} ${x - 26} ${y - 30} M${x + 26} ${y - 70} Q${x + 38} ${y - 50} ${x + 26} ${y - 30}`} />
      </g>
      <g opacity={1 - on} stroke={theme.risk} strokeWidth={5} strokeLinecap="round">
        <path d={`M${x - 22} ${y - 72} L${x + 22} ${y - 28} M${x + 22} ${y - 72} L${x - 22} ${y - 28}`} />
      </g>
      {label && (
        <Label x={x} y={y + 26} size={18} weight={700} color={on > 0.5 ? theme.ok : theme.risk}>
          {label}
        </Label>
      )}
    </g>
  )
}

/** Подход в пути: конвертик с текстом по центру (x, y); lost — пропал по дороге (0…1). */
export function SetPacket({ x, y, text, color = theme.accent, lost = 0 }: { x: number; y: number; text: string; color?: string; lost?: number }) {
  const w = Math.round(text.length * 18 * 0.6 + 24)
  const h = 34
  return (
    <g opacity={1 - lost * 0.6}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={theme.white} stroke={color} strokeWidth={3} />
      <text x={x} y={y + 6.5} textAnchor="middle" fill={color} style={{ font: `700 18px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Карточка с шапкой: заголовок 22 px, значок слева (icon), содержимое — дети. */
export function Panel({ x, y, w, h, title, icon, stroke = theme.line, children }: { x: number; y: number; w: number; h: number; title: string; icon?: ReactNode; stroke?: string; children?: ReactNode }) {
  const tx = icon ? x + 56 : x + 20
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={theme.white} stroke={stroke} strokeWidth={3} />
      {icon}
      <Label x={tx} y={y + 38} anchor="start" size={22} weight={800}>
        {title}
      </Label>
      <line x1={x + 12} y1={y + 54} x2={x + w - 12} y2={y + 54} stroke={theme.grid} strokeWidth={2} />
      {children}
    </g>
  )
}

/** Кружок с буквой — чья карточка: (x, y) — центр. */
export function Avatar({ x, y, color, letter }: { x: number; y: number; color: string; letter: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill={color} />
      <Label x={x} y={y + 7} size={18} weight={800} color={theme.white}>
        {letter}
      </Label>
    </g>
  )
}

/** Значок базы данных (цилиндр): (x, y) — центр. */
export function DbIcon({ x, y, color = theme.accent }: { x: number; y: number; color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={3}>
      <ellipse cx={x} cy={y - 9} rx={12} ry={5} />
      <path d={`M${x - 12} ${y - 9} V${y + 9} A12 5 0 0 0 ${x + 12} ${y + 9} V${y - 9}`} />
      <path d={`M${x - 12} ${y} A12 5 0 0 0 ${x + 12} ${y}`} />
    </g>
  )
}

/** Штанга на стойке пола: (x, y) — середина грифа. */
export function Barbell({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 90} y={y - 4} width={180} height={8} rx={4} fill={theme.soft} />
      {[-1, 1].map((d) => (
        <g key={d}>
          <rect x={x + d * 62 - 7} y={y - 30} width={14} height={60} rx={4} fill={theme.ink} />
          <rect x={x + d * 76 - 5} y={y - 22} width={10} height={44} rx={3} fill={theme.ink} />
        </g>
      ))}
    </g>
  )
}

/** Строка с квадратом слева; на кадре at квадрат отмечается галочкой. (x, y) — левый верхний угол квадрата. */
export function TickRow({ x, y, text, at, size = 22 }: { x: number; y: number; text: string; at: number; size?: number }) {
  const frame = useCurrentFrame()
  const g = Math.min(1, Math.max(0, (frame - at) / 8))
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
