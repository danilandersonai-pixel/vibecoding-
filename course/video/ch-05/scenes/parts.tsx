import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'

// Детали сцен ролика «Читать код, который написал ИИ»: мастер в каске, раковина с двумя кранами,
// лупа, валик, плашки проходов, окно с текстом ошибки, кружок коммита, блок кода.
// Плашка, галочка, пузырь реплики и экран телефона — Pill, Mark, Callout и PhoneScreen из kit/props.tsx.

/** Мастер бригады в строительной каске; центр — середина фигуры, как у остальных героев. */
export function Worker({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.ink} pose={pose} mood={mood} />
      {/* каска: купол и козырёк поверх макушки */}
      <path d="M-26 -62 Q-26 -92 0 -92 Q26 -92 26 -62 Z" fill={theme.alt} stroke={theme.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={-34} y={-66} width={68} height={9} rx={4} fill={theme.alt} stroke={theme.ink} strokeWidth={2.5} />
      <line x1={0} y1={-90} x2={0} y2={-68} stroke={theme.ink} strokeWidth={2.5} />
    </Actor>
  )
}

/**
 * Раковина у стены: (x, top) — середина столешницы, w — её ширина.
 * cold / hot — насколько открыт каждый кран (0…1), flow — струя (0…1), frame — для бегущей воды в трубе,
 * leak — течь из колена трубы (0…1) с лужей на полу floorY; joint — колено трубы.
 */
export function Sink({ x, top, w, floorY, joint, cold, hot, flow, leak, frame }: { x: number; top: number; w: number; floorY: number; joint: { x: number; y: number }; cold: number; hot: number; flow: number; leak: number; frame: number }) {
  const spoutY = top - 38
  const dash = -(frame * 3) % 24
  // капли падают из колена к полу по очереди
  const drops = [0, 1, 2].map((i) => ((frame + i * 9) % 27) / 27)
  return (
    <g>
      {/* труба: из чаши вниз к колену и в стену */}
      <path d={`M${x} ${top + 18} V${joint.y} H${x + w / 2 + 16}`} fill="none" stroke={theme.line} strokeWidth={14} strokeLinejoin="round" />
      {flow > 0 && <path d={`M${x} ${top + 18} V${joint.y} H${x + w / 2 + 16}`} fill="none" stroke={theme.accent} strokeWidth={5} strokeDasharray="10 14" strokeDashoffset={dash} opacity={flow} />}
      <circle cx={joint.x} cy={joint.y} r={12} fill={theme.paper} stroke={leak > 0 ? theme.risk : theme.line} strokeWidth={4} />
      {/* ножки и столешница */}
      <rect x={x - w / 2 + 14} y={top + 16} width={12} height={floorY - top - 16} fill={theme.line} />
      <rect x={x + w / 2 - 26} y={top + 16} width={12} height={floorY - top - 16} fill={theme.line} />
      <rect x={x - w / 2} y={top} width={w} height={18} rx={4} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
      <path d={`M${x - 56} ${top} Q${x} ${top + 34} ${x + 56} ${top}`} fill={theme.codeBg} stroke={theme.ink} strokeWidth={3} />
      {/* смеситель: стойка, излив и две ручки — холодная (синяя) и горячая (красная) */}
      <rect x={x - 7} y={spoutY} width={14} height={38} fill={theme.soft} />
      <path d={`M${x} ${spoutY + 4} Q${x} ${spoutY - 16} ${x + 30} ${spoutY - 12} L${x + 30} ${spoutY - 2}`} fill="none" stroke={theme.soft} strokeWidth={9} strokeLinecap="round" />
      <g transform={`rotate(${-cold * 70} ${x - 26} ${spoutY + 14})`}>
        <rect x={x - 46} y={spoutY + 10} width={26} height={9} rx={4} fill={theme.accent} />
      </g>
      <g transform={`rotate(${hot * 70} ${x + 26} ${spoutY + 14})`}>
        <rect x={x + 20} y={spoutY + 10} width={26} height={9} rx={4} fill={theme.risk} />
      </g>
      <circle cx={x - 26} cy={spoutY + 14} r={6} fill={theme.soft} />
      <circle cx={x + 26} cy={spoutY + 14} r={6} fill={theme.soft} />
      {/* струя из излива в чашу */}
      {flow > 0 && <rect x={x + 26} y={spoutY - 2} width={8} height={(top + 10 - spoutY) * flow} rx={4} fill={theme.accent} opacity={0.7} />}
      {/* течь: капли из колена и лужа */}
      {leak > 0 && (
        <g opacity={leak}>
          {drops.map((p, i) => (
            <path key={i} d={`M${joint.x} ${joint.y + 14 + p * (floorY - joint.y - 20)} q5 8 0 12 q-5 -4 0 -12 Z`} fill={theme.accent} opacity={1 - p * 0.4} />
          ))}
          <ellipse cx={joint.x} cy={floorY + 2} rx={18 + leak * 40} ry={5 + leak * 3} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
        </g>
      )}
    </g>
  )
}

/** Лупа: центр стекла (x, y), r — радиус. */
export function Magnifier({ x, y, r = 34 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <line x1={x + r * 0.7} y1={y + r * 0.7} x2={x + r * 1.5} y2={y + r * 1.5} stroke={theme.ink} strokeWidth={9} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill={theme.accentTint} stroke={theme.ink} strokeWidth={5} />
    </g>
  )
}

/** Малярный валик ручкой вверх: (x, y) — середина ролика. */
export function Roller({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x + 40} ${y} H${x + 52} V${y - 30} H${x + 10} V${y - 70}`} fill="none" stroke={theme.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={x + 4} y={y - 104} width={12} height={34} rx={4} fill={theme.ink} />
      <rect x={x - 40} y={y - 12} width={80} height={24} rx={10} fill={theme.accent} stroke={theme.ink} strokeWidth={2.5} />
    </g>
  )
}

export type TabState = 'wait' | 'now' | 'done'

/** Плашка прохода: левый верхний угол (x, y), ширина w, высота h; сейчас — залита, пройдена — с галочкой. */
export function PassTab({ x, y, w, h, text, state }: { x: number; y: number; w: number; h: number; text: string; state: TabState }) {
  const color = state === 'wait' ? theme.line : state === 'now' ? theme.accent : theme.ok
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={state === 'now' ? theme.accent : state === 'done' ? theme.okTint : theme.paper} stroke={color} strokeWidth={3} />
      <text x={x + w / 2 + (state === 'done' ? 12 : 0)} y={y + h / 2 + 7} textAnchor="middle" fill={state === 'now' ? theme.white : state === 'done' ? theme.ok : theme.soft} style={{ font: `700 20px ${theme.font}` }}>
        {text}
      </text>
      {state === 'done' && <path d={`M${x + 18} ${y + h / 2} l6 7 l11 -13`} fill="none" stroke={theme.ok} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  )
}

export type TraceLine = { text: string; kind: 'err' | 'mine' | 'lib' | 'out' }

/**
 * Тёмное окно с текстом ошибки: строки появляются по одной (с кадра at, каждые 6 кадров).
 * mark — с какой силы (0…1) подсветить свою строку и приглушить строки библиотек.
 */
export function TraceWindow({ x, y, w, at, lines, row, frame, mark }: { x: number; y: number; w: number; at: number; lines: TraceLine[]; row: number; frame: number; mark: number }) {
  const h = BAR + 16 + lines.length * row + 16
  const color = { err: theme.termErr, mine: theme.termText, lib: theme.termText, out: theme.termText } as const
  return (
    <Window
      x={x}
      y={y}
      w={w}
      h={h}
      at={at}
      bodyFill={theme.termBg}
      barFill={theme.termBar}
      stroke={theme.termBar}
      bar={
        <text x={20} y={BAR / 2 + 6} fill={theme.termDim} style={{ font: `500 18px ${theme.font}` }}>
          Текст ошибки
        </text>
      }
    >
      {lines.map((l, i) => {
        if (frame < at + 12 + i * 6) return null
        const top = BAR + 16 + i * row
        return (
          <g key={i} opacity={l.kind === 'lib' ? 1 - mark * 0.6 : 1}>
            {l.kind === 'mine' && <rect x={6} y={top} width={w - 12} height={row} rx={6} fill={theme.alt} opacity={mark * 0.35} />}
            <Mono x={18} y={top + row / 2 + 7} fill={l.kind === 'mine' && mark > 0.5 ? theme.white : color[l.kind]}>
              {l.text}
            </Mono>
          </g>
        )
      })}
    </Window>
  )
}

export type CommitState = 'idle' | 'good' | 'bad' | 'test'

/** Кружок коммита с номером: серый — не проверен, зелёный — работает, красный — сломан, синий — проверяем. */
export function Commit({ x, y, r, n, state, dim = false }: { x: number; y: number; r: number; n: number; state: CommitState; dim?: boolean }) {
  const color = { idle: theme.line, good: theme.ok, bad: theme.risk, test: theme.accent }[state]
  const fill = { idle: theme.paper, good: theme.okTint, bad: theme.riskTint, test: theme.accentTint }[state]
  return (
    <g opacity={dim ? 0.35 : 1}>
      <circle cx={x} cy={y} r={r} fill={theme.paper} />
      <circle cx={x} cy={y} r={r} fill={fill} stroke={color} strokeWidth={state === 'test' ? 6 : 4} />
      <text x={x} y={y + 9} textAnchor="middle" fill={state === 'idle' ? theme.soft : color} style={{ font: `700 26px ${theme.font}` }}>
        {n}
      </text>
    </g>
  )
}

/** Карточка-блок кода: заголовок моноширинным шрифтом и серые полоски строк; дети — поверх, в координатах холста. */
export function CodeBlock({ x, y, w, h, title, rows, color = theme.line, children }: { x: number; y: number; w: number; h: number; title: string; rows: number; color?: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={theme.paper} stroke={color} strokeWidth={3} />
      <text x={x + 18} y={y + 34} fill={theme.ink} style={{ font: `600 20px ${theme.mono}` }}>
        {title}
      </text>
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} x={x + 18 + (i % 3 === 1 ? 24 : 0)} y={y + 52 + i * 22} width={w - 60 - (i % 4) * 26 - (i % 3 === 1 ? 24 : 0)} height={10} rx={5} fill={theme.grid} />
      ))}
      {children}
    </g>
  )
}
