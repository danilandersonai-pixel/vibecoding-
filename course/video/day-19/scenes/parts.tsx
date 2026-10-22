import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { Label } from '../../kit/parts'
import { Slot } from '../../kit/props'
import { theme } from '../../theme'
import { COLS, colX, LIST, LIST_H, rowY, screenOf, TABS_H, type Remark } from '../layout'

// Детали сцен ролика дня 19 «Бета-тест: запуск»: крупный телефон и экраны приложения тренера,
// список замечаний, маленький человечек, глаз, часы, пузырь сообщения, флажок.
// Плашка, галочка, реплика и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

type Rect = { x: number; y: number; w: number; h: number }

/** Круг нажатия: расходится 18 кадров с кадра at. */
function Tap({ cx, cy, at, r = 12 }: { cx: number; cy: number; at?: number; r?: number }) {
  const frame = useCurrentFrame()
  if (at === undefined || frame < at || frame >= at + 18) return null
  const p = (frame - at) / 18
  return <circle cx={cx} cy={cy} r={r + p * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - p} />
}

/** Крупный телефон в координатах холста: r — рамка; экран — screenOf(r). */
export function Handset({ r, children }: { r: Rect; children?: ReactNode }) {
  const s = screenOf(r)
  return (
    <g>
      <rect x={r.x + 6} y={r.y + 8} width={r.w} height={r.h} rx={28} fill={theme.desk} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={28} fill={theme.ink} />
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill={theme.white} />
      <rect x={r.x + r.w / 2 - 22} y={r.y + 12} width={44} height={6} rx={3} fill={theme.soft} />
      {children}
    </g>
  )
}

export type Tab = 'people' | 'workouts' | 'programs' | 'records'
const TABS: Tab[] = ['people', 'workouts', 'programs', 'records']

/** Значок раздела с центром (0, 0), около 22 px. */
function TabIcon({ tab, color }: { tab: Tab; color: string }) {
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
  if (tab === 'programs')
    return (
      <g fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
        <rect x={-10} y={-10} width={20} height={20} rx={3} />
        <path d="M-5 -3 H5 M-5 3 H3" />
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

/** Центр значка раздела tab в нижней полосе экрана s. */
function tabCenter(s: Rect, tab: Tab): { x: number; y: number } {
  const i = TABS.indexOf(tab)
  return { x: s.x + (s.w * (i + 0.5)) / TABS.length, y: s.y + s.h - TABS_H / 2 }
}

/** Нижняя полоса разделов; active — открытый раздел, tap/tapAt — нажатие на раздел. */
export function TabBar({ s, active, tap, tapAt }: { s: Rect; active: Tab; tap?: Tab; tapAt?: number }) {
  const top = s.y + s.h - TABS_H
  return (
    <g>
      <line x1={s.x} y1={top} x2={s.x + s.w} y2={top} stroke={theme.grid} strokeWidth={2} />
      {TABS.map((t) => {
        const c = tabCenter(s, t)
        return (
          <g key={t}>
            <g transform={`translate(${c.x} ${c.y})`}>
              <TabIcon tab={t} color={t === active ? theme.accent : theme.line} />
            </g>
            {t === tap && <Tap cx={c.x} cy={c.y} at={tapAt} />}
          </g>
        )
      })}
    </g>
  )
}

/** Шапка экрана: название слева, ссылка «Ещё» справа (more), линия под ними. */
function ScreenHead({ s, title, more, tapAt }: { s: Rect; title: string; more?: boolean; tapAt?: number }) {
  return (
    <g>
      <Label x={s.x + 16} y={s.y + 36} anchor="start" size={22} weight={800}>
        {title}
      </Label>
      {more && (
        <g>
          <Label x={s.x + s.w - 16} y={s.y + 36} anchor="end" size={20} weight={700} color={theme.accent}>
            Ещё
          </Label>
          <Tap cx={s.x + s.w - 34} cy={s.y + 29} at={tapAt} />
        </g>
      )}
      <line x1={s.x + 10} y1={s.y + 54} x2={s.x + s.w - 10} y2={s.y + 54} stroke={theme.grid} strokeWidth={2} />
    </g>
  )
}

// Кнопка «Выбрать дату» в меню «Ещё» (от верха экрана) и дни недели в выборе даты
const MENU = { top: 58, row: 40, items: ['Выбрать дату', 'Повторять', 'Удалить'] }
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/** Экран «Тренировка» у Полины: подопечный, упражнения и кнопка; поля даты на нём нет.
 * menu — открыто меню «Ещё»; week — показан выбор дня (0…1), pick — выбран четверг (0…1). */
export function AssignScreen({ s, menu = false, week = 0, pick = 0, tapMore, tapDate, tapTab }: { s: Rect; menu?: boolean; week?: number; pick?: number; tapMore?: number; tapDate?: number; tapTab?: number }) {
  const cx = s.x + s.w / 2
  const cell = 28
  const gap = 3
  const w0 = s.x + (s.w - (7 * cell + 6 * gap)) / 2
  return (
    <g>
      <ScreenHead s={s} title="Тренировка" more tapAt={tapMore} />
      <Label x={s.x + 16} y={s.y + 80} anchor="start" size={18} color={theme.soft} weight={600}>
        Подопечный
      </Label>
      <rect x={s.x + 14} y={s.y + 88} width={s.w - 28} height={36} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
      <Label x={s.x + 26} y={s.y + 113} anchor="start" size={20} weight={600}>
        Женя
      </Label>
      <Label x={s.x + 16} y={s.y + 150} anchor="start" size={18} color={theme.soft} weight={600}>
        Упражнения
      </Label>
      {['присед 3 × 10', 'жим лёжа 3 × 8'].map((t, i) => (
        <g key={t}>
          <rect x={s.x + 14} y={s.y + 158 + i * 38} width={s.w - 28} height={32} rx={7} fill={theme.paper} stroke={theme.accent} strokeWidth={2} />
          <Label x={s.x + 26} y={s.y + 180 + i * 38} anchor="start" size={18} weight={600}>
            {t}
          </Label>
        </g>
      ))}
      <rect x={s.x + 14} y={s.y + 240} width={s.w - 28} height={42} rx={10} fill={theme.accent} />
      <Label x={cx} y={s.y + 268} size={20} weight={700} color={theme.white}>
        Назначить
      </Label>
      <TabBar s={s} active="workouts" tap="programs" tapAt={tapTab} />

      {/* меню «Ещё»: выбрать дату, повторять, удалить */}
      {menu && (
        <g>
          <rect x={s.x + s.w - 172} y={s.y + MENU.top} width={162} height={MENU.items.length * MENU.row + 8} rx={10} fill={theme.white} stroke={theme.ink} strokeWidth={2.5} />
          {MENU.items.map((t, i) => (
            <Label key={t} x={s.x + s.w - 158} y={s.y + MENU.top + 30 + i * MENU.row} anchor="start" size={18} weight={i === 0 ? 800 : 600} color={i === 0 ? theme.accent : theme.ink}>
              {t}
            </Label>
          ))}
          <Tap cx={s.x + s.w - 100} cy={s.y + MENU.top + 24} at={tapDate} />
        </g>
      )}

      {/* выбор дня: неделя, четверг отмечен */}
      {week > 0 && (
        <g opacity={week}>
          <rect x={s.x + 8} y={s.y + 58} width={s.w - 16} height={72} rx={10} fill={theme.white} stroke={theme.accent} strokeWidth={2.5} />
          <Label x={s.x + 20} y={s.y + 80} anchor="start" size={18} weight={700}>
            День
          </Label>
          {DAYS.map((d, i) => {
            const x = w0 + i * (cell + gap)
            const on = i === 3 ? pick : 0
            return (
              <g key={d}>
                <rect x={x} y={s.y + 92} width={cell} height={cell} rx={6} fill={on > 0 ? theme.accent : theme.paper} stroke={on > 0 ? theme.accent : theme.grid} strokeWidth={2} />
                <Label x={x + cell / 2} y={s.y + 112} size={18} weight={700} color={on > 0 ? theme.white : theme.soft}>
                  {d}
                </Label>
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
}

/** Экран «Программы» (шаблоны из дня 9): не то место, куда нужно Полине. */
export function ProgramsScreen({ s, tapBack }: { s: Rect; tapBack?: number }) {
  return (
    <g>
      <ScreenHead s={s} title="Программы" />
      {['Сила · 4 недели', 'Новичок · 3 недели'].map((t, i) => (
        <g key={t}>
          <rect x={s.x + 14} y={s.y + 70 + i * 50} width={s.w - 28} height={40} rx={8} fill={theme.paper} stroke={theme.alt} strokeWidth={2.5} />
          <Label x={s.x + 26} y={s.y + 97 + i * 50} anchor="start" size={18} weight={600}>
            {t}
          </Label>
        </g>
      ))}
      <TabBar s={s} active="programs" tap="workouts" tapAt={tapBack} />
    </g>
  )
}

/** Рамка списка замечаний и заголовок; cols — видимость подписей колонок (0…1). */
export function ListFrame({ cols, title = 'Замечания', stroke = theme.ink }: { cols: number[]; title?: string; stroke?: string }) {
  return (
    <g>
      <rect x={LIST.x + 6} y={LIST.y + 6} width={LIST.w} height={LIST_H} rx={12} fill={theme.desk} />
      <rect x={LIST.x} y={LIST.y} width={LIST.w} height={LIST_H} rx={12} fill={theme.white} stroke={stroke} strokeWidth={3} />
      <Label x={LIST.x + 20} y={LIST.y + 36} anchor="start" size={24} weight={800}>
        {title}
      </Label>
      <line x1={LIST.x + 12} y1={LIST.y + LIST.head} x2={LIST.x + LIST.w - 12} y2={LIST.y + LIST.head} stroke={theme.grid} strokeWidth={2} />
      {COLS.map((c, i) => (
        <g key={c.title} opacity={cols[i] ?? 0}>
          <Label x={colX(i) + 10} y={LIST.y + LIST.head + 26} anchor="start" size={18} weight={700} color={theme.soft}>
            {c.title}
          </Label>
        </g>
      ))}
    </g>
  )
}

/** Пустая строка списка: пунктирное место. */
export function EmptyRow({ i, text }: { i: number; text?: string }) {
  return <Slot x={LIST.x + 10} y={rowY(i) + 5} w={LIST.w - 20} h={LIST.row - 10} r={8} text={text} />
}

/** Строка замечания: четыре ячейки; stroke — цвет рамки строки. */
export function RemarkRow({ i, r, stroke = theme.line }: { i: number; r: Remark; stroke?: string }) {
  const cells = [r.who, r.task, r.stuck, r.expect]
  const y = rowY(i)
  return (
    <g>
      <rect x={LIST.x + 10} y={y + 5} width={LIST.w - 20} height={LIST.row - 10} rx={8} fill={theme.paper} stroke={stroke} strokeWidth={2.5} />
      {cells.map((t, k) => (
        <Label key={k} x={colX(k) + 10} y={y + 31} anchor="start" size={18} weight={k === 0 ? 800 : 600}>
          {t}
        </Label>
      ))}
    </g>
  )
}

/** Строка-отзыв без подробностей: кто и его слова; по такой строке нечего чинить. */
export function QuoteRow({ i, who, text }: { i: number; who: string; text: string }) {
  const y = rowY(i)
  return (
    <g>
      <rect x={LIST.x + 10} y={y + 5} width={LIST.w - 20} height={LIST.row - 10} rx={8} fill={theme.paper} stroke={theme.risk} strokeWidth={2.5} />
      <Label x={colX(0) + 10} y={y + 31} anchor="start" size={18} weight={800}>
        {who}
      </Label>
      <Label x={colX(1) + 10} y={y + 31} anchor="start" size={18} weight={600}>
        {text}
      </Label>
    </g>
  )
}

/** Маленький человечек (условный пользователь, как на рис. 8.12): (x, y) — центр; lit — закрашен (0…1). */
export function Dude({ x, y, lit = 0, color = theme.alt }: { x: number; y: number; lit?: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 16} r={11} fill={theme.white} stroke={theme.line} strokeWidth={3} />
      <path d={`M${x - 18} ${y + 22} V${y + 10} Q${x - 18} ${y - 2} ${x} ${y - 2} Q${x + 18} ${y - 2} ${x + 18} ${y + 10} V${y + 22} Z`} fill={theme.white} stroke={theme.line} strokeWidth={3} />
      <g opacity={lit}>
        <circle cx={x} cy={y - 16} r={11} fill={color} stroke={color} strokeWidth={3} />
        <path d={`M${x - 18} ${y + 22} V${y + 10} Q${x - 18} ${y - 2} ${x} ${y - 2} Q${x + 18} ${y - 2} ${x + 18} ${y + 10} V${y + 22} Z`} fill={color} stroke={color} strokeWidth={3} />
      </g>
    </g>
  )
}

/** Глаз (наблюдаем): (x, y) — центр. */
export function Eye({ x, y, color = theme.ink }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <path d={`M${x - 26} ${y} Q${x} ${y - 22} ${x + 26} ${y} Q${x} ${y + 22} ${x - 26} ${y} Z`} fill={theme.white} stroke={color} strokeWidth={3} />
      <circle cx={x} cy={y} r={8} fill={color} />
    </g>
  )
}

/** Часы-секундомер с временем t («0:42»): (x, y) — центр циферблата. */
export function Clock({ x, y, t, color = theme.ink }: { x: number; y: number; t: string; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="none" stroke={color} strokeWidth={3} />
      <path d={`M${x} ${y - 6} V${y} L${x + 5} ${y + 3}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={x - 4} y={y - 18} width={8} height={4} rx={1.5} fill={color} />
      <text x={x + 22} y={y + 7} fill={color} style={{ font: `700 20px ${theme.mono}`, fontVariantLigatures: 'none' }}>
        {t}
      </text>
    </g>
  )
}

/** Пузырь сообщения с хвостиком: (x, y) — центр. */
export function Bubble({ x, y, text, color = theme.soft }: { x: number; y: number; text: string; color?: string }) {
  const w = Math.round(text.length * 18 * 0.58 + 30)
  const h = 38
  const l = x - w / 2
  const t = y - h / 2
  return (
    <g>
      <path d={`M${l + 10} ${t} H${l + w - 10} Q${l + w} ${t} ${l + w} ${t + 10} V${t + h - 10} Q${l + w} ${t + h} ${l + w - 10} ${t + h} H${l + 26} L${l + 12} ${t + h + 10} L${l + 14} ${t + h} H${l + 10} Q${l} ${t + h} ${l} ${t + h - 10} V${t + 10} Q${l} ${t} ${l + 10} ${t} Z`} fill={theme.white} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Label x={x} y={y + 7} size={18} weight={600} color={theme.ink}>
        {text}
      </Label>
    </g>
  )
}

/** Флажок на древке: (x, y) — низ древка. */
export function Flag({ x, y, color = theme.ok }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 44} stroke={theme.ink} strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M${x + 2} ${y - 44} L${x + 30} ${y - 36} L${x + 2} ${y - 26} Z`} fill={color} />
    </g>
  )
}
