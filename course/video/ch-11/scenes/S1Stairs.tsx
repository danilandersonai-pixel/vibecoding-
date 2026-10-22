import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ON_STEP, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Chip, CodeCard, Stairs } from './parts'

const ID = 's1-stairs'
const B = S1.bits
const C = S1.code

// машинный код — нули и единицы; язык — читаемая строка; потом агент пишет код по просьбе Марины
const BITS = ['10110000 01100001', '00000101 11000011']
const CODE = ['if (reps > 0)', '  save(set)']
const WEEK = ['byClient(17)', '  .lastDays(7)']

// Сцена 1 (метафора): лестница уровней. Машинный код → языки программирования → обычная речь;
// Марина поднимается по ступеням, наверху просит словами, а код по её просьбе пишет агент.
// Нижние ступени остаются; дальше — направления, видные в 2026 году.
export function S1Stairs() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  const shown = [appear(frame, b(0) + 6, 14), appear(frame, b(1) + 6, 14), appear(frame, b(2) + 30, 14)]
  const subs = [appear(frame, b(0) + 120), appear(frame, b(1) + 110), appear(frame, b(2) + 100)]
  const glow = appear(frame, b(4) + 10) * (0.6 + 0.4 * Math.sin(frame / 6))

  // Марина прыгает со ступени на ступень дугой
  const [p0, p1, p2] = ON_STEP
  const hop = (at: number, a: { x: number; y: number }, z: { x: number; y: number }): [number, number, number][] => [
    [at, a.x, a.y],
    [at + 12, (a.x + z.x) / 2, Math.min(a.y, z.y) - 110],
    [at + 24, z.x, z.y],
  ]
  const marina = trackAt(frame, [...hop(b(1) + 20, p0, p1), ...hop(b(2) + 36, p1, p2)])
  const pose = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 60, ['think', 'worried']],
    [b(1) + 14, ['stand', 'neutral']],
    [b(1) + 60, ['point', 'neutral']],
    [b(1) + 110, ['stand', 'happy']],
    [b(2) + 74, ['cheer', 'happy']],
    [b(3) + 6, ['point', 'happy']],
    [b(3) + 160, ['stand', 'happy']],
    [b(4) + 20, ['cheer', 'happy']],
  ])

  // карточки ступеней: биты набираются, строка кода набирается, потом агент переписывает её по просьбе
  const bits = appear(frame, b(0) + 40)
  // процессор читает биты; уходит до прыжка Марины на вторую ступень
  const chip = appear(frame, b(0) + 60) * (1 - appear(frame, b(1) + 4, 10))
  const toChip = appear(frame, b(0) + 74, 14)
  const code = appear(frame, b(1) + 30)
  const rewrite = frame >= b(3) + 120
  const codeLines = rewrite ? WEEK.map((l, i) => typed(l, frame, b(3) + 120 + i * 22, 40)) : CODE.map((l, i) => typed(l, frame, b(1) + 40 + i * 14, 30))

  // просьба словами, агент и стрелки; к последней реплике агент уходит
  const ask = appear(frame, b(3) + 10)
  const away = 1 - appear(frame, b(4), 12)
  const toAgent = appear(frame, b(3) + 40, 20)
  const toCode = appear(frame, b(3) + 96, 16)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 70, 'working'],
    [b(3) + 170, 'done'],
  ])

  // последняя реплика: нижние ступени остаются, дальше — направления 2026 года
  const stays = appear(frame, b(4) + 20)
  const next = appear(frame, b(4) + 84)

  return (
    <KitScene chip="1 / 7 · Лестница уровней" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <Stairs shown={shown} subs={subs} glow={glow} />

      {/* машинный код на нижней ступени */}
      <g opacity={bits}>
        <CodeCard x={B.x} y={B.y} w={B.w} h={B.h} lines={BITS.map((l, i) => typed(l, frame, b(0) + 52 + i * 26, 40))} />
      </g>
      <g opacity={chip}>
        <Chip x={S1.chip.x} y={S1.chip.y} />
        <Arrow x1={B.x + 110} y1={B.y - 6} x2={S1.chip.x + 6} y2={S1.chip.y + 46} color={theme.ink} draw={toChip} />
      </g>
      {/* строка на языке программирования — на средней */}
      <g opacity={code}>
        <CodeCard x={C.x} y={C.y} w={C.w} h={C.h} lines={codeLines} />
      </g>

      {/* агент пишет код по просьбе */}
      <g opacity={away}>
        <Arrow x1={S1.ask.x - 240} y1={S1.ask.y + 14} x2={S1.agent.x + 60} y2={S1.agent.y - 70} color={theme.accent} dashed draw={toAgent} />
        <Arrow x1={S1.agent.x + 64} y1={S1.agent.y + 10} x2={C.x - 10} y2={C.y + 30} color={theme.accent} draw={toCode} />
        {frame >= b(3) + 40 && <Agent x={S1.agent.x} y={S1.agent.y} scale={0.75} enterAt={b(3) + 40} pose={agent} />}
      </g>

      <Coach x={marina.x} y={marina.y} scale={0.75} enterAt={b(0) + 20} pose={pose[0]} mood={pose[1]} />
      <g opacity={ask * away}>
        <Callout x={S1.ask.x} y={S1.ask.y} tx={p2.x + 6} ty={p2.y - 62} text="«Покажи Анне её тренировки за неделю»" color={theme.accent} />
      </g>

      <g opacity={stays}>
        <Mark x={S1.stays.x - 168} y={S1.stays.y} ok r={16} />
        <Pill x={S1.stays.x + 16} y={S1.stays.y} w={324} text="нижние ступени остаются" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
      <g opacity={next}>
        <Pill x={S1.next.x + 16} y={S1.next.y} w={420} text="дальше — направления 2026 года" color={theme.accent} size={22} />
      </g>
    </KitScene>
  )
}
