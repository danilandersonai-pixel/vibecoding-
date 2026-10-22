import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'
import { DIARY, DIARY_H, diaryCols, diaryRowY, type Food } from '../layout'

// Детали сцен ролика дня 16 «Питание»: карточка дневника, столбики калорий за неделю,
// строка теста с видом проверки, ряд слагаемых белка и замок. Плашка, галочка, реплика
// и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

/**
 * Карточка дневника: заголовок, подписи колонок, продукты с граммами (строка i — с кадра rowAt[i]).
 * Ккал строк и итог рисует сцена (они меняются по-разному) — в детях, по diaryRowY / diaryTotalY.
 */
export function DiaryCard({ x, y, w, at, title, foods, rowAt, children }: { x: number; y: number; w: number; at: number; title: string; foods: Food[]; rowAt: number[]; children?: ReactNode }) {
  const frame = useCurrentFrame()
  const col = diaryCols(x, w)
  const subY = y + DIARY.head + 24
  return (
    <g>
      <g opacity={appear(frame, at, 12)}>
        <Card x={x} y={y} w={w} h={DIARY_H} stroke={theme.ok} fill={theme.white}>
          <Label x={col.name} y={y + 36} anchor="start" size={22} weight={800}>
            {title}
          </Label>
          <line x1={x + 16} y1={y + DIARY.head} x2={x + w - 16} y2={y + DIARY.head} stroke={theme.grid} strokeWidth={2} />
          <Label x={col.name} y={subY} anchor="start" size={18} color={theme.soft} weight={600}>
            продукт
          </Label>
          <Label x={col.grams} y={subY} anchor="end" size={18} color={theme.soft} weight={600}>
            вес
          </Label>
          <Label x={col.kcal} y={subY} anchor="end" size={18} color={theme.soft} weight={600}>
            ккал
          </Label>
        </Card>
      </g>
      {foods.map((f, i) => {
        const top = diaryRowY(y, i)
        return (
          <g key={f.name} opacity={appear(frame, rowAt[i], 10)}>
            <Label x={col.name} y={top + 30} anchor="start" size={22} weight={600}>
              {f.name}
            </Label>
            <Label x={col.grams} y={top + 30} anchor="end" size={22} color={theme.soft} weight={600}>
              {`${f.grams} г`}
            </Label>
          </g>
        )
      })}
      {children}
    </g>
  )
}

/** Пунктирное место значения в колонке ккал: (x, y) — правый край и базовая линия строки. */
export function ValueSlot({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <Slot x={x - 64} y={y - 24} w={64} h={32} r={8} />
    </g>
  )
}

export type Step = { at: number; text: string; color?: string }

/** Значение по шагам: каждое следующее сменяет предыдущее с кадра at (старое гаснет, новое проявляется). */
export function Steps({ x, y, steps, size = 22, weight = 700, anchor = 'end' }: { x: number; y: number; steps: Step[]; size?: number; weight?: number; anchor?: 'start' | 'middle' | 'end' }) {
  const frame = useCurrentFrame()
  return (
    <g>
      {steps.map((s, k) => {
        const next = steps[k + 1]
        const op = appear(frame, s.at, 10) * (next ? 1 - appear(frame, next.at, 10) : 1)
        if (op <= 0) return null
        return (
          <Label key={k} x={x} y={y} anchor={anchor} size={size} color={s.color ?? theme.ink} weight={weight} opacity={op}>
            {s.text}
          </Label>
        )
      })}
    </g>
  )
}

export type BarDay = { day: string; value: number | null }

/**
 * Столбики калорий по дням: (x, y) — левый верхний угол области, top — верх шкалы.
 * Столбики растут по очереди с кадра at; день без записей (null) — пунктирное место и «нет записей».
 * goal — пунктирная линия цели с кадра goalAt.
 */
export function WeekBars({ x, y, w, h, days, at, top, goal, goalAt = 0, color = theme.accent, labelSize = 20 }: { x: number; y: number; w: number; h: number; days: BarDay[]; at: number; top: number; goal?: number; goalAt?: number; color?: string; labelSize?: number }) {
  const frame = useCurrentFrame()
  const base = y + h - 34
  const plot = h - 34 - 30
  const slot = w / days.length
  const bw = Math.min(slot * 0.55, 40)
  const goalY = goal === undefined ? 0 : base - (plot * goal) / top
  const grows = days.map((_, i) => grow(frame, at + i * 6, 14))
  const cxs = days.map((_, i) => x + slot * (i + 0.5))
  const tops = days.map((d, i) => (d.value === null ? base : base - (plot * d.value * grows[i]) / top))
  return (
    <g>
      <line x1={x} y1={base} x2={x + w} y2={base} stroke={theme.line} strokeWidth={3} />
      {days.map((d, i) => {
        const cx = cxs[i]
        const g = grows[i]
        if (d.value === null) {
          return (
            <g key={d.day} opacity={g}>
              <Slot x={cx - bw / 2} y={base - 34} w={bw} h={34} r={6} color={theme.risk} />
              <Label x={cx} y={base + 24} size={labelSize} color={theme.risk} weight={700}>
                {d.day}
              </Label>
              <Label x={cx} y={base + 48} size={18} color={theme.risk} weight={700}>
                нет записей
              </Label>
            </g>
          )
        }
        return (
          <g key={d.day}>
            <rect x={cx - bw / 2} y={tops[i]} width={bw} height={base - tops[i]} rx={5} fill={color} />
            <Label x={cx} y={base + 24} size={labelSize} color={theme.soft} weight={600} opacity={g > 0 ? 1 : 0.4}>
              {d.day}
            </Label>
          </g>
        )
      })}
      {goal !== undefined && (
        <g opacity={appear(frame, goalAt, 12)}>
          <line x1={x - 6} y1={goalY} x2={x + w + 6} y2={goalY} stroke={theme.ok} strokeWidth={3} strokeDasharray="10 7" />
        </g>
      )}
      {/* числа над столбиками — поверх линии цели, с белой подложкой, чтобы линия их не резала */}
      {days.map((d, i) =>
        d.value === null || grows[i] < 1 ? null : (
          <text key={d.day} x={cxs[i]} y={tops[i] - 9} textAnchor="middle" fill={color} stroke={theme.white} strokeWidth={6} strokeLinejoin="round" style={{ font: `800 18px ${theme.font}`, paintOrder: 'stroke' }}>
            {String(Math.round(d.value))}
          </text>
        ),
      )}
    </g>
  )
}

export type CheckState = 'wait' | 'pass'

/** Строка теста: отметка (ждёт — пунктир, прошёл — галочка), текст и вид проверки справа; (x, y) — центр отметки, right — правый край. */
export function CheckRow({ x, y, right, text, tag, state }: { x: number; y: number; right: number; text: string; tag: string; state: CheckState }) {
  const tagW = Math.round(tag.length * 18 * 0.56 + 28)
  return (
    <g>
      {state === 'wait' ? <circle cx={x} cy={y} r={14} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="5 4" /> : <Mark x={x} y={y} ok r={14} />}
      <Label x={x + 30} y={y + 8} anchor="start" size={22} weight={600}>
        {text}
      </Label>
      <Pill x={right - tagW / 2} y={y} w={tagW} text={tag} color={theme.soft} fill={theme.paper} compact />
    </g>
  )
}

/**
 * Ряд слагаемых белка: числа в колонках (центр колонки i — x + x0 + i × step), между ними «+».
 * Слагаемое i — с кадра at[i]; hl — подсветка округлённых колонок (0…1).
 */
export function Terms({ x, y, x0, step, terms, at, hl = 0, hlCols = [], color = theme.ink }: { x: number; y: number; x0: number; step: number; terms: string[]; at: number[]; hl?: number; hlCols?: number[]; color?: string }) {
  const frame = useCurrentFrame()
  return (
    <g>
      {hlCols.map((i) => (
        <rect key={i} x={x + x0 + i * step - 31} y={y - 27} width={62} height={38} rx={10} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} opacity={hl} />
      ))}
      {terms.map((t, i) => {
        const cx = x + x0 + i * step
        const on = appear(frame, at[i], 8)
        return (
          <g key={i} opacity={on}>
            <Label x={cx} y={y} size={24} weight={700} color={color}>
              {t}
            </Label>
            {i > 0 && (
              <Label x={cx - step / 2} y={y} size={22} weight={600} color={theme.soft}>
                +
              </Label>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Замок: (x, y) — центр корпуса. */
export function Padlock({ x, y, color = theme.risk, scale = 1 }: { x: number; y: number; color?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-9 -6 V-14 Q-9 -24 0 -24 Q9 -24 9 -14 V-6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <rect x={-15} y={-7} width={30} height={22} rx={5} fill={color} />
      <circle cx={0} cy={3} r={3.5} fill={theme.white} />
    </g>
  )
}
