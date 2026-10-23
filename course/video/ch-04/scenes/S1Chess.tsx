import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { ChessBoard, Piece, Player, type PieceKind } from './parts'

const ID = 's1-chess'
const B = S1.board
const SC = S1.screen
const AMP = S1.amp

// центр клетки (столбец c слева, ряд r сверху)
const sq = (c: number, r: number) => ({ x: B.x + c * B.cell + B.cell / 2, y: B.y + r * B.cell + B.cell / 2 })

type P = { kind: PieceKind; dark: boolean; c: number; r: number }
// позиция: ход белых. Пешка g6 не бьёт h6, поэтому ферзь встанет туда безопасно; пешка a6 — беззащитная
const PIECES: P[] = [
  { kind: 'king', dark: true, c: 6, r: 0 },
  { kind: 'rook', dark: true, c: 5, r: 0 },
  { kind: 'queen', dark: true, c: 3, r: 0 },
  { kind: 'pawn', dark: true, c: 5, r: 1 },
  { kind: 'pawn', dark: true, c: 6, r: 2 },
  { kind: 'pawn', dark: true, c: 0, r: 2 },
  { kind: 'pawn', dark: true, c: 7, r: 1 },
  { kind: 'bishop', dark: true, c: 2, r: 3 },
  { kind: 'pawn', dark: true, c: 4, r: 3 },
  { kind: 'bishop', dark: false, c: 2, r: 4 },
  { kind: 'pawn', dark: false, c: 4, r: 4 },
  { kind: 'pawn', dark: false, c: 3, r: 5 },
  { kind: 'pawn', dark: false, c: 5, r: 6 },
  { kind: 'pawn', dark: false, c: 6, r: 6 },
  { kind: 'pawn', dark: false, c: 7, r: 6 },
  { kind: 'rook', dark: false, c: 5, r: 7 },
  { kind: 'king', dark: false, c: 6, r: 7 },
]
// белый ферзь — он пойдёт по плану: Фd2–h6, путь e3–f4–g5 свободен, на h6 его ничто не бьёт
const QUEEN = { from: sq(3, 6), to: sq(7, 2) }

// подсказки компьютера: откуда, куда, оценка (длина полосы 0…1) и что это за ход.
// Ход 1 — Сc4:a6: пешка без защиты, но слон уходит с диагонали на короля — план ломается.
// Ход 3 — h2–h3: тихий ход, ничего не отдаёт.
const MOVES = [
  { from: sq(2, 4), to: sq(0, 2), score: 0.95, text: 'выигрыш пешки' },
  { from: QUEEN.from, to: QUEEN.to, score: 0.85, text: 'атака на короля' },
  { from: sq(7, 6), to: sq(7, 5), score: 0.45, text: 'спокойный ход' },
]
const PLANS = ['план: атака на короля', 'план: беречь фигуры']
// что остаётся за человеком
const KEEP = ['суждение', 'вкус', 'понимание контекста', 'ответственность']
const ROW_H = 76

// Стрелка-подсказка на доске: толстая линия с наконечником, draw — доля длины.
function MoveArrow({ from, to, color, draw, width = 8 }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; draw: number; width?: number }) {
  if (draw <= 0) return null
  const x = from.x + (to.x - from.x) * draw
  const y = from.y + (to.y - from.y) * draw
  const a = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
  return (
    <g opacity={0.8}>
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d="M4 0 L-16 -12 L-16 12 Z" fill={color} transform={`translate(${x} ${y}) rotate(${a})`} />
    </g>
  )
}

// Сцена 1 (метафора): компьютер мгновенно считает варианты и подсказывает ходы, план выбирает шахматист;
// сильный ход ломает план — это видит только игрок. С ИИ так же: усилитель, код пишет он, остальное — ваше.
export function S1Chess() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска и компьютер
  const pieceAt = PIECES.map((_, i) => 8 + i * 3)
  const screenAt = b(0) + 30
  const thinking = frame >= b(0) + 50 && frame < b(1) - 20
  // полосы оценок «пляшут», пока машина считает, и встают на место
  const settle = grow(frame, b(1) - 30, 24)
  const scores = MOVES.map((m, i) => {
    const jitter = 0.35 + 0.3 * Math.abs(Math.sin(frame / (4 + i) + i * 2))
    const shown = appear(frame, b(0) + 50 + i * 8, 10)
    return shown * (jitter * (1 - settle) + m.score * settle)
  })
  const arrowsAt = [b(0) + 112, b(0) + 128, b(0) + 144]
  const textAt = [b(1) - 20, b(1) - 10, b(1)]

  // планы: шахматист выбирает атаку
  const plansAt = [b(1) + 34, b(1) + 52]
  const chosen = frame >= b(1) + 110
  // сильный ход ломает план; ход по плану; ферзь идёт
  const bad = frame >= b(2) + 50
  const good = frame >= b(2) + 100
  const queen = trackAt(frame, [
    [b(2) + 128, QUEEN.from.x, QUEEN.from.y],
    [b(2) + 160, QUEEN.to.x, QUEEN.to.y],
  ])
  const arrowsOut = interpolate(frame, [b(2) + 122, b(2) + 132], [1, 0], CLAMP)

  // доска 2: усилитель
  // появляется, пока камера едет: в середине сцены доска 2 уже не пустая
  const ampTitle = useAppear(b(3) - 6)
  const inputs = useAppear(b(3))
  const ampIn = usePop(b(3) + 6)
  const out = grow(frame, b(3) + 12, 40)
  const wave = frame >= b(3) + 20 ? (frame - b(3)) % 30 : -1
  const strongTag = useAppear(b(3) + 60)
  const weakTag = useAppear(b(3) + 110)

  // доска 2: агент пишет код, за Мариной — суждение, вкус, контекст, ответственность
  const codeCard = useAppear(b(3) + 4)
  const codeAt = [0, 1, 2, 3, 4].map((i) => b(4) + 6 + i * 14)
  const keepAt = [b(4) + 40, b(4) + 70, b(4) + 92, b(4) + 140]
  const mission = useAppear(b(5) + 40)

  const player = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 130, ['think', 'neutral']],
    [b(1) + 60, ['think', 'neutral']],
    [b(1) + 100, ['point', 'happy']],
    [b(1) + 140, ['stand', 'neutral']],
    [b(2) + 40, ['surprised', 'worried']],
    [b(2) + 90, ['point', 'neutral']],
    [b(2) + 150, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(4) + 4, 'working'],
    [b(4) + 90, 'done'],
    [b(4) + 130, 'idle'],
    [b(5) + 40, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 36, ['point', 'neutral']],
    [b(4) + 150, ['stand', 'happy']],
    [b(5) + 40, ['cheer', 'happy']],
  ])

  const queenMoved = frame >= b(2) + 128
  return (
    <KitScene chip="1 / 6 · Шахматист и компьютер" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* компьютер с вариантами */}
      {frame >= screenAt && (
        <>
          <rect x={SC.x + SC.w / 2 - 14} y={SC.y + SC.h} width={28} height={26} fill={theme.line} />
          <rect x={SC.x + SC.w / 2 - 70} y={SC.y + SC.h + 24} width={140} height={10} rx={5} fill={theme.line} opacity={appear(frame, screenAt, 10)} />
          <Window
            x={SC.x}
            y={SC.y}
            w={SC.w}
            h={SC.h}
            at={screenAt}
            bar={
              <>
                <Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={700}>
                  Компьютер
                </Label>
                <Label x={SC.w - 18} y={BAR / 2 + 7} anchor="end" size={18} color={thinking ? theme.alt : theme.ok} weight={600}>
                  {thinking ? `считаю${'.'.repeat(1 + (Math.floor(frame / 6) % 3))}` : frame >= b(1) - 20 ? 'готово' : ''}
                </Label>
              </>
            }
          >
            {MOVES.map((m, i) => {
              const y = BAR + 14 + i * ROW_H
              const color = i === 0 && bad ? theme.risk : i === 1 && good ? theme.ok : theme.accent
              return (
                <g key={m.text} opacity={appear(frame, b(0) + 46 + i * 8, 10)}>
                  <Label x={18} y={y + 24} anchor="start" size={20} weight={700} color={color}>
                    {`ход ${i + 1}`}
                  </Label>
                  <rect x={96} y={y + 9} width={176} height={18} rx={9} fill={theme.grid} />
                  <rect x={96} y={y + 9} width={176 * scores[i]} height={18} rx={9} fill={color} />
                  <g opacity={appear(frame, textAt[i], 10)}>
                    <Label x={18} y={y + 56} anchor="start" size={20} color={i === 0 && bad ? theme.risk : theme.ink} weight={600}>
                      {i === 0 && bad ? 'ломает план' : m.text}
                    </Label>
                  </g>
                  {i === 0 && bad && <Mark x={SC.w - 26} y={y + 50} ok={false} r={13} />}
                  {i === 1 && good && <Mark x={SC.w - 26} y={y + 50} ok r={13} />}
                </g>
              )
            })}
          </Window>
        </>
      )}

      {/* доска, фигуры и подсказки */}
      <ChessBoard x={B.x} y={B.y} cell={B.cell} />
      {PIECES.map((p, i) => {
        const at = sq(p.c, p.r)
        return (
          <g key={`${p.c}-${p.r}`} opacity={appear(frame, pieceAt[i], 8)}>
            <Piece x={at.x} y={at.y} kind={p.kind} dark={p.dark} />
          </g>
        )
      })}
      {/* белый ферзь отдельно: он ходит */}
      <g opacity={appear(frame, 8 + PIECES.length * 3, 8)}>
        <Piece x={queenMoved ? queen.x : QUEEN.from.x} y={queenMoved ? queen.y : QUEEN.from.y} kind="queen" dark={false} />
      </g>
      <g opacity={arrowsOut}>
        {MOVES.map((m, i) => {
          const color = i === 0 && bad ? theme.risk : i === 1 && good ? theme.ok : theme.accent
          const dim = (i === 0 && good) || i === 2 ? (frame >= b(2) + 10 ? 0.35 : 1) : 1
          return (
            <g key={m.text} opacity={dim}>
              <MoveArrow from={m.from} to={m.to} color={color} draw={grow(frame, arrowsAt[i], 12)} width={i === 1 && good ? 10 : 8} />
            </g>
          )
        })}
      </g>
      <g opacity={appear(frame, b(2) + 150, 10)}>
        <Pill x={B.x + 4 * B.cell} y={B.y + 8 * B.cell + 34} text="ход по плану ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* шахматист и планы партии */}
      <Player x={S1.player.x} y={S1.player.y} scale={0.9} label="Шахматист" enterAt={6} pose={player[0]} mood={player[1]} />
      {PLANS.map((t, i) => {
        const on = chosen && i === 0
        const off = chosen && i === 1
        return (
          <g key={t} opacity={appear(frame, plansAt[i]) * (off ? 0.4 : 1)}>
            <Pill x={S1.plans.x} y={S1.plans.y[i]} w={270} text={t} color={on ? theme.white : theme.accent} fill={on ? theme.accent : theme.paper} size={20} />
          </g>
        )
      })}
      <g opacity={appear(frame, b(1) + 120)}>
        <Label x={S1.plans.x} y={S1.plans.y[1] + 58} size={20} color={theme.soft} weight={600}>
          выбирает человек
        </Label>
      </g>

      {/* доска 2: ИИ — усилитель */}
      <g opacity={ampTitle}>
        <Pill x={S1.ampTitle.x} y={S1.ampTitle.y} text="ИИ — усилитель" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      {[
        { y: S1.rows[0], color: theme.ok, tint: theme.okTint, before: 'сильное', after: 'сильнее', tag: strongTag },
        { y: S1.rows[1], color: theme.risk, tint: theme.riskTint, before: 'слабое', after: 'заметнее', tag: weakTag },
      ].map((r) => (
        <g key={r.before}>
          <g opacity={inputs}>
            <Label x={S1.inX} y={r.y - 22} anchor="start" size={20} color={r.color} weight={700}>
              {r.before}
            </Label>
            <rect x={S1.inX} y={r.y - 13} width={200} height={26} rx={13} fill={r.tint} stroke={r.color} strokeWidth={2.5} />
            <rect x={S1.inX} y={r.y - 13} width={110} height={26} rx={13} fill={r.color} />
          </g>
          {out > 0 && <rect x={S1.outX} y={r.y - 17} width={210 * out} height={34} rx={17} fill={r.color} />}
          <g opacity={r.tag}>
            <Label x={S1.outX} y={r.y - 28} anchor="start" size={20} color={r.color} weight={700}>
              {r.after}
            </Label>
          </g>
        </g>
      ))}
      {frame >= b(3) + 6 && (
        <g transform={`translate(${AMP.x + AMP.w / 2} ${AMP.y + AMP.h / 2}) scale(${ampIn}) translate(${-(AMP.x + AMP.w / 2)} ${-(AMP.y + AMP.h / 2)})`}>
          <rect x={AMP.x} y={AMP.y} width={AMP.w} height={AMP.h} rx={18} fill={theme.accent} />
          <circle cx={AMP.x + AMP.w / 2} cy={AMP.y + 62} r={30} fill={theme.paper} stroke={theme.white} strokeWidth={4} />
          <circle cx={AMP.x + AMP.w / 2} cy={AMP.y + 62} r={12} fill={theme.accent} />
          <text x={AMP.x + AMP.w / 2} y={AMP.y + 160} textAnchor="middle" fill={theme.white} style={{ font: `800 40px ${theme.font}` }}>
            ИИ
          </text>
        </g>
      )}
      {wave >= 0 &&
        [0, 1].map((k) => {
          const t = ((wave + k * 15) % 30) / 30
          return <path key={k} d={`M${AMP.x + AMP.w + 6 + t * 16} ${AMP.y + 40} Q${AMP.x + AMP.w + 26 + t * 16} ${AMP.y + 100} ${AMP.x + AMP.w + 6 + t * 16} ${AMP.y + 160}`} fill="none" stroke={theme.accent} strokeWidth={4} strokeLinecap="round" opacity={1 - t} />
        })}

      {/* агент пишет код, как машина считает ходы */}
      <g opacity={codeCard}>
        <Card x={S1.code.x} y={S1.code.y} w={S1.code.w} h={S1.code.h} fill={theme.codeBg}>
          <Label x={S1.code.x + 20} y={S1.code.y + 36} anchor="start" size={20} color={theme.soft} weight={700}>
            код пишет ИИ
          </Label>
          {codeAt.map((at, i) => (
            <rect key={at} x={S1.code.x + 20 + (i % 3) * 16} y={S1.code.y + 58 + i * 26} width={(150 - (i % 2) * 40 - (i % 3) * 16) * appear(frame, at, 10)} height={12} rx={6} fill={i === 2 ? theme.accent : theme.line} />
          ))}
        </Card>
      </g>
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.85} enterAt={b(3) + 2} pose={agent} />
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.85} label="Марина" enterAt={b(3) + 10} pose={marina[0]} mood={marina[1]} />
      {KEEP.map((t, i) => (
        <g key={t} opacity={appear(frame, keepAt[i], 10)}>
          <Pill x={S1.marina.x} y={S1.keepY[i]} text={t} color={theme.accent} fill={theme.accentTint} size={20} compact />
        </g>
      ))}
      <g opacity={mission}>
        <Pill x={S1.mission.x} y={S1.mission.y} text="ИИ работает на вас, а не вместо вас" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
    </KitScene>
  )
}
