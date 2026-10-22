import { useCurrentFrame } from 'remotion'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { appear } from '../../kit/motion'
import { Pill } from '../../kit/props'
import { theme } from '../../theme'
import { PHONE_FONT } from '../layout'

// Детали сцен ролика «Проблема 70%»: строитель в каске, экран журнала тренировок,
// плашка-реплика с указкой, молния сбоя. Плашка и галочка — Pill и Mark из kit/props.tsx.

/** Строитель в каске; центр — середина фигуры, как у остальных героев. */
export function Builder({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.ink} pose={pose} mood={mood} />
      {/* каска: купол и козырёк */}
      <path d="M-27 -60 Q-26 -90 0 -90 Q26 -90 27 -60 Z" fill={theme.alt} stroke={theme.ink} strokeWidth={2.5} />
      <rect x={-34} y={-63} width={68} height={7} rx={3} fill={theme.alt} stroke={theme.ink} strokeWidth={2.5} />
    </Actor>
  )
}

export type LogRow = {
  text: string
  /** Кадр появления строки. */
  at: number
  /** Цвет рамки: обычная строка — зелёная, ошибочная — красная. */
  color?: string
  /** Кадр, с которого строка исчезает. */
  out?: number
}

const F = PHONE_FONT
const ROW_Y = -6
const ROW_STEP = 25

// Экран журнала тренировок (координаты экрана телефона от -54,-92 до 54,92): заголовок, поле ввода,
// кнопка «Сохранить» с касаниями taps и строки подходов. offline — значок «нет сети» (0…1).
// Телефон рисуется в масштабе PHONE_SCALE, поэтому текст F px на экране кадра не мельче 18 px.
export function LogScreen({ input = '', taps = [], rows, offline = 0 }: { input?: string; taps?: number[]; rows: LogRow[]; offline?: number }) {
  const frame = useCurrentFrame()
  const tap = taps.find((t) => frame >= t && frame < t + 18)
  const ripple = tap === undefined ? 0 : (frame - tap) / 18
  return (
    <g>
      <text x={-46} y={-73} fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Журнал
      </text>
      {/* нет сети: перечёркнутый значок */}
      <g opacity={offline} transform="translate(38 -78)">
        <path d="M-9 0 Q0 -9 9 0 M-5 4 Q0 -1 5 4" fill="none" stroke={theme.risk} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M-10 -8 L10 8" stroke={theme.risk} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <rect x={-50} y={-64} width={100} height={22} rx={5} fill={theme.white} stroke={theme.line} strokeWidth={1.5} />
      <text x={-44} y={-48.5} fill={input === '' ? theme.soft : theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
        {input === '' ? 'вес × раз' : input}
      </text>
      <rect x={-50} y={-37} width={100} height={22} rx={6} fill={theme.accent} />
      <text y={-21.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        Сохранить
      </text>
      {ripple > 0 && <circle cx={0} cy={-26} r={8 + ripple * 28} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
      {rows.map((r, i) => {
        const a = appear(frame, r.at, 8) * (r.out === undefined ? 1 : 1 - appear(frame, r.out, 10))
        if (a <= 0) return null
        const y = ROW_Y + i * ROW_STEP
        return (
          <g key={i} opacity={a}>
            <rect x={-50} y={y} width={100} height={21} rx={5} fill={theme.paper} stroke={r.color ?? theme.ok} strokeWidth={2} />
            <text x={-44} y={y + 15} fill={theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
              {r.text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Реплика героя: плашка с текстом по центру (x, y) и указка к говорящему (tx, ty). */
export function Callout({ x, y, tx, ty, text, color = theme.ink, fill = theme.white, size = 20 }: { x: number; y: number; tx: number; ty: number; text: string; color?: string; fill?: string; size?: number }) {
  const h = size + 20
  const from = ty > y ? y + h / 2 : y - h / 2
  return (
    <g>
      <line x1={x + (tx - x) * 0.25} y1={from} x2={tx} y2={ty} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={tx} cy={ty} r={4} fill={color} />
      <Pill x={x} y={y} text={text} color={color} fill={fill} size={size} weight={600} />
    </g>
  )
}

/** Молния сбоя: остриё внизу в (x, y), scale — масштаб. */
export function Bolt({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M8 -120 L-26 -48 L-2 -48 L-18 0 L30 -70 L6 -70 L24 -120 Z" fill={theme.alt} stroke={theme.risk} strokeWidth={3} strokeLinejoin="round" />
    </g>
  )
}
