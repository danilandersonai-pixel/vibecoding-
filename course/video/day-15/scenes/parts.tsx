import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { Slot } from '../../kit/props'
import { typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { EMPTY_Y, FIELDS, FOCUS, FORM, HAND, screenOf, TABS_H, WELCOME_Y, type EmptyState } from '../layout'

// Детали сцен ролика дня 15 «Первое знакомство и полировка»: крупный телефон и экраны приложения
// тренера (шапка, разделы, пустой экран, первый экран, приглашение, регистрация, список),
// клавиша, пометка-овал, кнопка-значок. Плашка, галочка, реплика и пунктирное место —
// Pill, Mark, Callout и Slot из kit/props.tsx.

type Rect = { x: number; y: number; w: number; h: number }

/** Крупный телефон в координатах холста: (x, y) — левый верхний угол рамки; dark — экран погас (0…1). */
export function Handset({ x, y, w = HAND.w, h = HAND.h, dark = 0, children }: { x: number; y: number; w?: number; h?: number; dark?: number; children?: ReactNode }) {
  const s = screenOf({ x, y, w, h })
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} rx={28} fill={theme.desk} />
      <rect x={x} y={y} width={w} height={h} rx={28} fill={theme.ink} />
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill={theme.white} />
      <rect x={x + w / 2 - 22} y={y + 12} width={44} height={6} rx={3} fill={theme.soft} />
      {children}
      {dark > 0 && <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill={theme.ink} opacity={0.92 * dark} />}
    </g>
  )
}

/** Шапка экрана: название раздела и линия под ним. */
export function ScreenHead({ s, title }: { s: Rect; title: string }) {
  return (
    <g>
      <Label x={s.x + 18} y={s.y + 36} anchor="start" size={22} weight={800}>
        {title}
      </Label>
      <line x1={s.x + 12} y1={s.y + 54} x2={s.x + s.w - 12} y2={s.y + 54} stroke={theme.grid} strokeWidth={2} />
    </g>
  )
}

export type Tab = 'home' | 'people' | 'workouts' | 'records'
const TABS: Tab[] = ['home', 'people', 'workouts', 'records']

/** Значок раздела с центром (0, 0), около 22 px. */
function TabIcon({ tab, color }: { tab: Tab; color: string }) {
  if (tab === 'home') return <path d="M-11 2 L0 -9 L11 2 V11 H-11 Z" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
  if (tab === 'people')
    return (
      <g fill="none" stroke={color} strokeWidth={3}>
        <circle cx={0} cy={-4} r={5} />
        <path d="M-9 11 Q-9 3 0 3 Q9 3 9 11" />
      </g>
    )
  if (tab === 'workouts')
    return (
      <g fill={color}>
        <rect x={-9} y={-2} width={18} height={4} />
        <rect x={-13} y={-8} width={5} height={16} rx={1.5} />
        <rect x={8} y={-8} width={5} height={16} rx={1.5} />
      </g>
    )
  return (
    <g fill={color}>
      <rect x={-10} y={0} width={5} height={10} rx={1} />
      <rect x={-2.5} y={-8} width={5} height={18} rx={1} />
      <rect x={5} y={-3} width={5} height={13} rx={1} />
    </g>
  )
}

/** Нижняя полоса разделов; active — открытый раздел, tapAt — кадр нажатия на раздел tap. */
export function TabBar({ s, active, tap, tapAt }: { s: Rect; active: Tab; tap?: Tab; tapAt?: number }) {
  const frame = useCurrentFrame()
  const top = s.y + s.h - TABS_H
  const ripple = tapAt !== undefined && frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  return (
    <g>
      <line x1={s.x} y1={top} x2={s.x + s.w} y2={top} stroke={theme.grid} strokeWidth={2} />
      {TABS.map((t, i) => {
        const cx = s.x + (s.w * (i + 0.5)) / TABS.length
        return (
          <g key={t} transform={`translate(${cx} ${top + TABS_H / 2})`}>
            <TabIcon tab={t} color={t === active ? theme.accent : theme.line} />
            {t === tap && ripple > 0 && <circle r={10 + ripple * 24} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
          </g>
        )
      })}
    </g>
  )
}

const SCREEN_TAB: Record<string, Tab> = { Тренировки: 'workouts', Подопечные: 'people', Рекорды: 'records' }

/** Кнопка экрана: прямоугольник шириной w по центру cx, верх y; tapAt — кадр нажатия (круг расходится). */
export function ScreenButton({ cx, y, w, h = 44, text, fill = theme.accent, color = theme.white, size = 20, tapAt }: { cx: number; y: number; w: number; h?: number; text: string; fill?: string; color?: string; size?: number; tapAt?: number }) {
  const frame = useCurrentFrame()
  const ripple = tapAt !== undefined && frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  return (
    <g>
      <rect x={cx - w / 2} y={y} width={w} height={h} rx={10} fill={fill} />
      <Label x={cx} y={y + h / 2 + size * 0.36} size={size} weight={700} color={color}>
        {text}
      </Label>
      {ripple > 0 && <circle cx={cx} cy={y + h / 2} r={14 + ripple * 60} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}

/** Пустой экран: значок и «что здесь будет», «что сделать», кнопка; show — видимость трёх частей,
 * slots — пунктирные места частей, пока их нет; missing — места слов и кнопки пунктиром цвета риска
 * (на экране их нет совсем). */
export function EmptyBody({ s, state, show = [1, 1, 1], slots = false, missing = [0, 0], tapAt, glow = 0 }: { s: Rect; state: EmptyState; show?: [number, number, number]; slots?: boolean; missing?: [number, number]; tapAt?: number; glow?: number }) {
  const cx = s.x + s.w / 2
  const bw = s.w - 48
  const tab = SCREEN_TAB[state.screen] ?? 'home'
  const place = (k: number, y: number, h: number, text?: string) =>
    slots && show[k] < 1 ? (
      <g opacity={1 - show[k]}>
        <Slot x={s.x + 20} y={y} w={s.w - 40} h={h} text={text} />
      </g>
    ) : null
  return (
    <g>
      <ScreenHead s={s} title={state.screen} />
      {place(0, s.y + EMPTY_Y.icon - 30, EMPTY_Y.what + 30 - EMPTY_Y.icon + 30)}
      {place(1, s.y + EMPTY_Y.todo - 22, 2 * EMPTY_Y.line + 6)}
      {place(2, s.y + EMPTY_Y.button, EMPTY_Y.buttonH)}
      <g opacity={missing[0]}>
        <Slot x={s.x + 20} y={s.y + EMPTY_Y.icon - 30} w={s.w - 40} h={EMPTY_Y.todo + 2 * EMPTY_Y.line - EMPTY_Y.icon + 10} color={theme.risk} text="ни слова" />
      </g>
      <g opacity={missing[1]}>
        <Slot x={s.x + 20} y={s.y + EMPTY_Y.button} w={s.w - 40} h={EMPTY_Y.buttonH} color={theme.risk} text="ни кнопки" />
      </g>
      <g opacity={show[0]}>
        {state.what.length > 0 && (
          <g>
            <circle cx={cx} cy={s.y + EMPTY_Y.icon} r={26} fill={theme.accentTint} />
            <g transform={`translate(${cx} ${s.y + EMPTY_Y.icon}) scale(1.3)`}>
              <TabIcon tab={tab} color={theme.accent} />
            </g>
          </g>
        )}
        {state.what.map((l, i) => (
          <Label key={l} x={cx} y={s.y + EMPTY_Y.what + i * EMPTY_Y.line} size={20} weight={800}>
            {l}
          </Label>
        ))}
      </g>
      <g opacity={show[1]}>
        {state.todo.map((l, i) => (
          <Label key={l} x={cx} y={s.y + EMPTY_Y.todo + i * EMPTY_Y.line} size={20} color={theme.soft} weight={600}>
            {l}
          </Label>
        ))}
      </g>
      {state.button !== '' && (
        <g opacity={show[2]}>
          {glow > 0 && <rect x={cx - bw / 2 - 6} y={s.y + EMPTY_Y.button - 6} width={bw + 12} height={EMPTY_Y.buttonH + 12} rx={14} fill="none" stroke={theme.alt} strokeWidth={4} opacity={glow} />}
          <ScreenButton cx={cx} y={s.y + EMPTY_Y.button} w={bw} h={EMPTY_Y.buttonH} text={state.button} tapAt={tapAt} />
        </g>
      )}
      <TabBar s={s} active={tab} />
    </g>
  )
}

/** Первый экран после регистрации: приветствие, пояснение и одна кнопка. polish — 0: кнопка бледная,
 * текст мелкий; 1: после правки. glow — рамка вокруг кнопки; name — имя в приветствии ('' — без имени). */
export function WelcomeBody({ s, polish = 0, glow = 0, tapAt, name = 'Ира' }: { s: Rect; polish?: number; glow?: number; tapAt?: number; name?: string }) {
  const cx = s.x + s.w / 2
  const bw = s.w - 32
  const small = polish < 0.5
  return (
    <g>
      <ScreenHead s={s} title="Главная" />
      <Label x={s.x + 18} y={s.y + WELCOME_Y.hello} anchor="start" size={22} weight={800}>
        {name === '' ? 'Здравствуйте!' : `Здравствуйте, ${name}!`}
      </Label>
      {['Здесь вы ведёте', 'подопечных.'].map((l, i) => (
        <Label key={l} x={s.x + 18} y={s.y + WELCOME_Y.about + i * 24} anchor="start" size={20} color={theme.soft} weight={600}>
          {l}
        </Label>
      ))}
      <Label x={s.x + 18} y={s.y + WELCOME_Y.call} anchor="start" size={small ? 18 : 22} color={small ? theme.line : theme.ink} weight={small ? 500 : 800}>
        Первый шаг:
      </Label>
      {glow > 0 && <rect x={cx - bw / 2 - 6} y={s.y + WELCOME_Y.button - 6} width={bw + 12} height={WELCOME_Y.buttonH + 12} rx={14} fill="none" stroke={theme.alt} strokeWidth={4} opacity={glow} />}
      <ScreenButton cx={cx} y={s.y + WELCOME_Y.button} w={bw} h={WELCOME_Y.buttonH} text="Пригласить подопечного" size={18} fill={small ? theme.accentTint : theme.accent} color={small ? theme.line : theme.white} tapAt={tapAt} />
      <TabBar s={s} active="home" />
    </g>
  )
}

/** Экран приглашения (из дня 12): ссылка печатается с кадра at. */
export function InviteBody({ s, at }: { s: Rect; at: number }) {
  const frame = useCurrentFrame()
  const cx = s.x + s.w / 2
  return (
    <g>
      <ScreenHead s={s} title="Приглашение" />
      <Label x={s.x + 18} y={s.y + 90} anchor="start" size={18} color={theme.soft} weight={600}>
        Ссылка для подопечного
      </Label>
      <rect x={s.x + 16} y={s.y + 104} width={s.w - 32} height={42} rx={8} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2.5} />
      <text x={s.x + 28} y={s.y + 131} fill={theme.ink} style={{ font: `500 18px ${theme.mono}`, whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
        {typed('join/k7Qx9fLm2aT4', frame, at, 40)}
      </text>
      <Label x={s.x + 18} y={s.y + 176} anchor="start" size={18} color={theme.soft} weight={600}>
        одноразовая, 48 часов
      </Label>
      <ScreenButton cx={cx} y={s.y + 196} w={s.w - 32} text="Отправить ссылку" />
      <TabBar s={s} active="people" />
    </g>
  )
}

/** Регистрация: три поля и кнопка; values — сколько полей уже заполнено, focus — номер элемента в фокусе
 * (0–2 поля, 3 кнопка), tapAt — нажатие на кнопку. */
export function RegisterBody({ s, filled = 3, focus = -1, focusOn = 1, tapAt }: { s: Rect; filled?: number; focus?: number; focusOn?: number; tapAt?: number }) {
  const cx = s.x + s.w / 2
  const f = focus >= 0 ? FOCUS[focus] : null
  return (
    <g>
      <ScreenHead s={s} title="Регистрация" />
      {FIELDS.map((fl, i) => (
        <g key={fl.label}>
          <Label x={s.x + 18} y={s.y + FORM.label + i * FORM.step} anchor="start" size={18} color={theme.soft} weight={600}>
            {fl.label}
          </Label>
          <rect x={s.x + 16} y={s.y + FORM.box + i * FORM.step} width={s.w - 32} height={FORM.boxH} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
          {i < filled && (
            <Label x={s.x + 28} y={s.y + FORM.box + i * FORM.step + 27} anchor="start" size={20} weight={600}>
              {fl.value}
            </Label>
          )}
        </g>
      ))}
      <ScreenButton cx={cx} y={s.y + FORM.button} w={s.w - 32} h={FORM.buttonH} text="Создать аккаунт" tapAt={tapAt} />
      {f && <rect x={s.x + 10} y={s.y + f.y - 6} width={s.w - 20} height={f.h + 12} rx={12} fill="none" stroke={theme.accent} strokeWidth={4} opacity={focusOn} />}
    </g>
  )
}

/** Список экрана: строки с рамкой цвета color; shown — сколько строк уже видно. */
export function ListBody({ s, title, rows, color, shown = rows.length, tab }: { s: Rect; title: string; rows: string[]; color: string; shown?: number; tab: Tab }) {
  return (
    <g>
      <ScreenHead s={s} title={title} />
      {rows.slice(0, shown).map((r, i) => (
        <g key={r}>
          <rect x={s.x + 14} y={s.y + 70 + i * 50} width={s.w - 28} height={40} rx={8} fill={theme.paper} stroke={color} strokeWidth={2.5} />
          <Label x={s.x + 28} y={s.y + 97 + i * 50} anchor="start" size={20} weight={600}>
            {r}
          </Label>
        </g>
      ))}
      <TabBar s={s} active={tab} />
    </g>
  )
}

/** Клавиша с надписью: (x, y) — центр; down — нажата (0…1). */
export function Key({ x, y, w, h = 50, text, down = 0 }: { x: number; y: number; w: number; h?: number; text: string; down?: number }) {
  const dy = down * 4
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2 + 5} width={w} height={h} rx={10} fill={theme.line} />
      <rect x={x - w / 2} y={y - h / 2 + dy} width={w} height={h} rx={10} fill={down > 0 ? theme.accentTint : theme.white} stroke={down > 0 ? theme.accent : theme.ink} strokeWidth={3} />
      <Label x={x} y={y + 7 + dy} size={20} weight={800} color={down > 0 ? theme.accent : theme.ink}>
        {text}
      </Label>
    </g>
  )
}

/** Пометка на скриншоте: овал, который «обводится» за draw (0…1). */
export function Ring({ cx, cy, rx, ry, draw }: { cx: number; cy: number; rx: number; ry: number; draw: number }) {
  if (draw <= 0) return null
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} fill="none" stroke={theme.risk} strokeWidth={4} transform={`rotate(-3 ${cx} ${cy})`} />
}

/** Кнопка-значок «+» (вид сверху), (x, y) — левый верхний угол. */
export function PlusButton({ x, y, size = 40 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={10} fill={theme.accent} />
      <path d={`M${x + size / 2} ${y + 10} V${y + size - 10} M${x + 10} ${y + size / 2} H${x + size - 10}`} stroke={theme.white} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}

/** Динамик (скринридер читает вслух): (x, y) — центр. */
export function Speaker({ x, y, color = theme.ink }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-12 -5 H-5 L4 -13 V13 L-5 5 H-12 Z" fill={color} />
      <path d="M9 -7 Q14 0 9 7 M13 -12 Q21 0 13 12" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}
