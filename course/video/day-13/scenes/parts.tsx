import { useCurrentFrame } from 'remotion'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, typed } from '../../kit/reveal'
import { PHONE_FONT } from '../../kit/screens/layout'
import { theme } from '../../theme'

// Детали сцен ролика дня 13 «Своё отличие»: карточка приложения со списком умений, строка отзыва,
// мини-карточка в стопке, экран телефона с подходом, шаг «сделать у себя» и маленький телефон среза.
// Плашка, галочка, реплика и пунктирное место — Pill, Mark, Callout и Slot из kit/props.tsx.

/** Карточка приложения: название и умения с галочками; галочка строки i — на кадре tickAt[i]. (x, y) — левый верхний угол. */
export function AppCard({ x, y, w, h, title, rows, tickAt, rowY, row, color = theme.line }: { x: number; y: number; w: number; h: number; title: string; rows: string[]; tickAt: number[]; rowY: number; row: number; color?: string }) {
  const frame = useCurrentFrame()
  return (
    <Card x={x} y={y} w={w} h={h} stroke={color} fill={theme.white}>
      <Label x={x + 24} y={y + 40} anchor="start" size={24} weight={800} color={color === theme.line ? theme.ink : color}>
        {title}
      </Label>
      <line x1={x + 20} y1={y + 58} x2={x + w - 20} y2={y + 58} stroke={theme.grid} strokeWidth={2} />
      {rows.map((r, i) => {
        const y0 = rowY + i * row
        const on = appear(frame, tickAt[i], 8)
        return (
          <g key={r}>
            <circle cx={x + 38} cy={y0 - 7} r={14} fill="none" stroke={theme.grid} strokeWidth={2.5} opacity={1 - on} />
            <g opacity={on}>
              <Mark x={x + 38} y={y0 - 7} ok r={14} />
            </g>
            <Label x={x + 66} y={y0} anchor="start" size={22} weight={600}>
              {r}
            </Label>
          </g>
        )
      })}
    </Card>
  )
}

/** Строка отзыва: оценка в плашке и слова человека в кавычках, набираются с кадра at. (x, y) — левый верхний угол. */
export function ReviewRow({ x, y, h, rating, text, at, textAt }: { x: number; y: number; h: number; rating: string; text: string; at: number; textAt: number }) {
  const frame = useCurrentFrame()
  const shown = typed(`«${text}»`, frame, textAt, 40)
  return (
    <g opacity={appear(frame, at, 10)}>
      <Pill x={x + 44} y={y + h / 2} text={rating} color={theme.risk} fill={theme.riskTint} compact />
      <Label x={x + 106} y={y + h / 2 + 7} anchor="start" size={20} weight={600}>
        {shown}
      </Label>
    </g>
  )
}

/** Мини-карточка жалобы в стопке: (x, y) — левый верхний угол. */
export function MiniCard({ x, y, w, h, text, color }: { x: number; y: number; w: number; h: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.white} stroke={color} strokeWidth={2.5} />
      <Label x={x + w / 2} y={y + h / 2 + 7} size={18} weight={600}>
        {text}
      </Label>
    </g>
  )
}

const F = PHONE_FONT

/** Экран телефона Анны (координаты экрана от -54,-92 до 54,92): упражнение, подход и кнопка «Сохранить»; на кадре tapAt — нажатие. */
export function SetScreen({ tapAt }: { tapAt: number }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const saved = appear(frame, tapAt + 10, 8)
  return (
    <g>
      <text x={-44} y={-64} fill={theme.ink} style={{ font: `800 ${F + 2}px ${theme.font}` }}>
        Присед
      </text>
      <rect x={-48} y={-50} width={96} height={56} rx={8} fill={theme.white} stroke={theme.grid} strokeWidth={2} />
      <text x={-40} y={-30} fill={theme.soft} style={{ font: `600 ${F}px ${theme.font}` }}>
        подход 3
      </text>
      <text x={-40} y={-10} fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        10 × 40 кг
      </text>
      <rect x={-48} y={40} width={96} height={30} rx={8} fill={saved > 0 ? theme.ok : theme.accent} />
      <text y={60} textAnchor="middle" fill={theme.white} style={{ font: `700 ${F}px ${theme.font}` }}>
        {saved > 0 ? '✓ сохранено' : 'Сохранить'}
      </text>
      {ripple > 0 && <circle cx={0} cy={55} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}

/** Шаг «сделать у себя»: номер в кружке, на кадре at он сменяется галочкой. (x, y) — центр кружка слева. */
export function StepRow({ x, y, n, text, at }: { x: number; y: number; n: number; text: string; at: number }) {
  const frame = useCurrentFrame()
  const g = grow(frame, at, 8)
  return (
    <g>
      <circle cx={x} cy={y} r={17} fill={g > 0 ? theme.okTint : theme.accentTint} stroke={g > 0 ? theme.ok : theme.accent} strokeWidth={3} />
      <g opacity={1 - g}>
        <Label x={x} y={y + 7} size={18} weight={800} color={theme.accent}>
          {String(n)}
        </Label>
      </g>
      <path d={`M${x - 8} ${y} L${x - 2} ${y + 6} L${x + 9} ${y - 6}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} fill="none" stroke={theme.ok} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={x + 32} y={y + 8} anchor="start" size={22} weight={600}>
        {text}
      </Label>
    </g>
  )
}

/** Маленький телефон без надписей: экран с кнопкой; на кадре tapAt — нажатие. (x, y) — центр. */
export function MiniPhone({ x, y, tapAt }: { x: number; y: number; tapAt: number }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const done = frame >= tapAt + 8
  return (
    <g>
      <rect x={x - 38} y={y - 64} width={76} height={128} rx={12} fill={theme.ink} />
      <rect x={x - 32} y={y - 54} width={64} height={108} rx={5} fill={theme.paper} />
      {[0, 1].map((i) => (
        <rect key={i} x={x - 24} y={y - 42 + i * 16} width={i === 0 ? 40 : 30} height={8} rx={4} fill={theme.line} />
      ))}
      <rect x={x - 24} y={y + 22} width={48} height={20} rx={6} fill={done ? theme.ok : theme.accent} />
      {ripple > 0 && <circle cx={x} cy={y + 32} r={8 + ripple * 24} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
    </g>
  )
}
