import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { appear } from '../../kit/motion'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'

// Детали сцен ролика «Фоновые агенты»: стажёр с бейджем, листок записки, солнце и луна,
// журнал действий агента, ноутбук, папка копии проекта, база и часы.
// Плашка, галочка, пузырь реплики, ключ и экран телефона — Pill, Mark, Callout, KeyGlyph и PhoneScreen из kit/props.tsx.

/** Стажёр: бейдж на шнурке; центр — середина фигуры, как у остальных героев. */
export function Intern({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
      <path d="M-15 -19 L0 12 L15 -19" fill="none" stroke={theme.paper} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-13} y={10} width={26} height={32} rx={5} fill={theme.white} stroke={theme.alt} strokeWidth={3} />
      <rect x={-7} y={18} width={14} height={4} rx={2} fill={theme.alt} />
      <rect x={-7} y={27} width={10} height={4} rx={2} fill={theme.line} />
    </Actor>
  )
}

/** Листок записки (иконка): (x, y) — центр. */
export function NoteIcon({ x, y, color = theme.accent }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-20} y={-26} width={40} height={52} rx={5} fill={theme.white} stroke={color} strokeWidth={3} />
      {[-12, -2, 8].map((dy, i) => (
        <rect key={dy} x={-12} y={dy} width={i === 2 ? 14 : 24} height={4} rx={2} fill={color} />
      ))}
    </g>
  )
}

/** Солнце, которое к вечеру становится луной: t 0 — солнце, 1 — луна. (x, y) — центр. */
export function SunMoon({ x, y, t }: { x: number; y: number; t: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g opacity={1 - t}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={0} y1={-32} x2={0} y2={-42} stroke={theme.alt} strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
        <circle r={24} fill={theme.alt} />
      </g>
      <g opacity={t}>
        <circle r={24} fill={theme.accent} />
        <circle cx={11} cy={-8} r={21} fill={theme.paper} />
      </g>
    </g>
  )
}

export type JournalRow = { text: string; kind: 'run' | 'fail' | 'edit' }

const ROW_COLOR = { run: theme.termText, fail: theme.termErr, edit: theme.termOk } as const

/**
 * Журнал действий агента: тёмное окно, строка i появляется на кадре at[i].
 * mark — подсветка повторяющихся строк (с from по to включительно), её прозрачность — opacity.
 */
export function Journal({ x, y, w, row, rows, at, frame, mark }: { x: number; y: number; w: number; row: number; rows: JournalRow[]; at: number[]; frame: number; mark?: { from: number; to: number; opacity: number } }) {
  const h = BAR + 32 + rows.length * row
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={h}
      at={at[0] - 12}
      bodyFill={theme.termBg}
      barFill={theme.termBar}
      stroke={theme.termBar}
      bar={
        <text x={18} y={BAR / 2 + 7} fill={theme.termDim} style={{ font: `600 20px ${theme.font}` }}>
          Журнал действий агента
        </text>
      }
    >
      {mark && mark.opacity > 0 && (
        <rect x={6} y={BAR + 16 + mark.from * row - 2} width={w - 12} height={(mark.to - mark.from + 1) * row + 4} rx={6} fill={theme.alt} fillOpacity={0.22 * mark.opacity} stroke={theme.alt} strokeOpacity={mark.opacity} strokeWidth={3} />
      )}
      {rows.map((r, i) => (
        <g key={i} opacity={appear(frame, at[i], 6)}>
          <Mono x={20} y={BAR + 16 + i * row + 23} fill={ROW_COLOR[r.kind]}>
            {r.text}
          </Mono>
        </g>
      ))}
    </Window>
  )
}

/** Пульс: кольцо расходится от (x, y) каждые period кадров, начиная с from — кадр живёт, схема не меняется. */
export function Pulse({ x, y, r, frame, from, color = theme.accent, period = 40 }: { x: number; y: number; r: number; frame: number; from: number; color?: string; period?: number }) {
  if (frame < from) return null
  const p = ((frame - from) % period) / period
  return <circle cx={x} cy={y} r={r + p * 26} fill="none" stroke={color} strokeWidth={3} opacity={(1 - p) * 0.8} />
}

/** Ноутбук с крышкой: open 1 — открыт, 0 — закрыт. (x, y) — середина основания. */
export function Laptop({ x, y, open }: { x: number; y: number; open: number }) {
  const lid = 54 * open
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-46} y={-lid - 4} width={92} height={lid + 4} rx={6} fill={theme.ink} opacity={open > 0.05 ? 1 : 0} />
      {open > 0.3 && <rect x={-40} y={-lid + 2} width={80} height={Math.max(0, lid - 8)} rx={3} fill={theme.accentTint} />}
      <rect x={-58} y={-4} width={116} height={10} rx={4} fill={theme.soft} />
    </g>
  )
}

/** Папка — отдельная копия проекта; (x, y) — левый верхний угол, подпись справа. */
export function Folder({ x, y, color, children }: { x: number; y: number; color: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 6 Q0 0 6 0 H18 L24 6 H40 Q46 6 46 12 V34 Q46 40 40 40 H6 Q0 40 0 34 Z" fill={theme.paper} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <line x1={0} y1={14} x2={46} y2={14} stroke={color} strokeWidth={3} />
      {children}
    </g>
  )
}

/** База данных (иконка): (x, y) — центр. */
export function DbIcon({ x, y, color = theme.alt }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-26 -22 V22 A26 9 0 0 0 26 22 V-22" fill={theme.paper} stroke={color} strokeWidth={3} />
      <ellipse cx={0} cy={-22} rx={26} ry={9} fill={theme.paper} stroke={color} strokeWidth={3} />
      <path d="M-26 0 A26 9 0 0 0 26 0" fill="none" stroke={color} strokeWidth={3} />
    </g>
  )
}

/** Часы: (x, y) — центр, t (0…1) — сколько прошло (стрелка обходит круг). */
export function Clock({ x, y, r = 30, t, color = theme.accent }: { x: number; y: number; r?: number; t: number; color?: string }) {
  const a = t * Math.PI * 2 - Math.PI / 2
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={theme.paper} stroke={color} strokeWidth={4} />
      {t > 0 && <path d={`M0 0 L0 ${-r + 6} A${r - 6} ${r - 6} 0 ${t > 0.5 ? 1 : 0} 1 ${Math.cos(a) * (r - 6)} ${Math.sin(a) * (r - 6)} Z`} fill={theme.accentTint} />}
      <line x1={0} y1={0} x2={Math.cos(a) * (r - 8)} y2={Math.sin(a) * (r - 8)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle r={4} fill={color} />
    </g>
  )
}
