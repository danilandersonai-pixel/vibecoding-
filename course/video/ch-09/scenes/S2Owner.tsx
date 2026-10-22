import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BOARD2, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Badge, CodeRows, Cursor } from './parts'

const ID = 's2-owner'
const Q = S2.questions
const D = S2.docs
const M = S2.meter

// три вопроса об интеллектуальной собственности (рис. 9.1)
const QUESTIONS = ['Кому принадлежит код?', 'Задеты ли чужие права?', 'Что с моими данными?']
// два документа об авторстве
const DOCS = [
  { head: 'США · январь 2025 · Бюро авторского права', body: 'охраняют вклад человека, а не машины' },
  { head: 'Россия · Гражданский кодекс', body: 'автор — человек, чей творческий труд' },
]
// из чего складывается ваш вклад: плашки над шкалой, в два яруса
const CHIPS = [
  { text: 'идея', y: 256 },
  { text: 'устройство приложения', y: 210 },
  { text: 'выбор из вариантов ИИ', y: 256 },
  { text: 'переделки', y: 210 },
]

// Сцена 2: три вопроса о правах; автор — человек (доклад Бюро авторского права США, Гражданский кодекс);
// ваш вклад — идея, устройство, выбор, переделки; «сгенерировать и взять первое» — вклада почти нет.
export function S2Owner() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // три вопроса; потом в фокусе первый
  const qAt = QUESTIONS.map((_, i) => b(0) + 20 + i * 50)
  const dim = interpolate(frame, [b(1) + 4, b(1) + 16], [1, 0.35], CLAMP)
  const human = useAppear(b(1) + 60)
  const machine = useAppear(b(1) + 100)
  const docAt = [b(2) + 10, b(3) + 10]
  const code = useAppear(b(0) + 70) * interpolate(frame, [b(1) + 40, b(1) + 52], [1, 0], CLAMP)
  const countries = useAppear(b(1) + 30) * interpolate(frame, [b(2), b(2) + 10], [1, 0], CLAMP)

  // доска 2: шкала вклада
  const title = useAppear(b(4) + 10)
  const chipAt = CHIPS.map((_, i) => b(4) + 40 + i * 35)
  const fill = interpolate(frame, [chipAt[0], chipAt[0] + 10, chipAt[1], chipAt[1] + 10, chipAt[2], chipAt[2] + 10, chipAt[3], chipAt[3] + 10], [0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1], CLAMP)
  const firm = useAppear(b(5) + 10)
  const gen = useAppear(b(5) + 60)
  const cursor = trackAt(frame, [
    [b(5) + 64, BOARD2 + 420, 500],
    [b(5) + 96, BOARD2 + 316, 466],
  ])
  const click = frame >= b(5) + 100 && frame < b(5) + 118 ? (frame - b(5) - 100) / 18 : 0
  const toFirst = interpolate(frame, [b(5) + 112, b(5) + 124], [0, 1], CLAMP)
  const first = usePop(b(5) + 124)
  const zero = useAppear(b(5) + 150)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 60, ['cheer', 'happy']],
    [b(2) + 10, ['think', 'neutral']],
    [b(3) + 100, ['point', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 100, 'working'],
    [b(2) + 40, 'idle'],
  ])
  const you2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(4) + 40, ['point', 'neutral']],
    [b(5) + 10, ['cheer', 'happy']],
    [b(5) + 150, ['surprised', 'worried']],
  ])

  return (
    <KitScene chip="2 / 6 · Чей это код" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* три вопроса */}
      {QUESTIONS.map((q, i) => {
        const x = Q.x + i * (Q.w + Q.gap)
        return (
          <g key={q} opacity={appear(frame, qAt[i]) * (i === 0 ? 1 : dim)}>
            <Card x={x} y={Q.y} w={Q.w} h={Q.h} stroke={i === 0 ? theme.accent : theme.line} fill={theme.white}>
              <Badge x={x + 36} y={Q.y + Q.h / 2} n={i + 1} color={i === 0 ? theme.accent : theme.soft} />
              <Label x={x + 66} y={Q.y + Q.h / 2 + 7} anchor="start" size={21} weight={700}>
                {q}
              </Label>
            </Card>
          </g>
        )
      })}

      {/* автор — человек, а не программа */}
      <Actor x={S2.you.x} y={S2.you.y} scale={0.85} label="Вы" enterAt={b(0) + 40}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.85} enterAt={b(0) + 48} pose={agent} />
      <g opacity={human}>
        <Mark x={S2.you.x - 66} y={268} ok r={16} />
        <Pill x={S2.you.x + 10} y={268} text="автор" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={machine}>
        <Mark x={S2.agent.x - 84} y={268} ok={false} r={16} />
        <Pill x={S2.agent.x + 6} y={268} text="не автор" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* код приложения между вами и агентом: чей он? */}
      <g opacity={code}>
        <rect x={(S2.you.x + S2.agent.x) / 2 - 44} y={S2.you.y - 60} width={88} height={104} rx={8} fill={theme.white} stroke={theme.ink} strokeWidth={3} />
        <CodeRows x={(S2.you.x + S2.agent.x) / 2 - 30} y={S2.you.y - 34} widths={[56, 40, 50, 36]} step={18} />
        <Label x={(S2.you.x + S2.agent.x) / 2} y={S2.you.y + 80} size={20} color={theme.soft} weight={700}>
          чей код?
        </Label>
      </g>
      <g opacity={countries}>
        <Pill x={D.x + D.w / 2} y={D.y[0] + 60} text="во многих странах автор — только человек" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>

      {/* два документа */}
      {DOCS.map((d, i) => (
        <g key={d.head} opacity={appear(frame, docAt[i])}>
          <Card x={D.x} y={D.y[i]} w={D.w} h={D.h} stroke={i === 0 ? theme.alt : theme.accent} fill={theme.white}>
            <Label x={D.x + 24} y={D.y[i] + 38} anchor="start" size={20} color={i === 0 ? theme.alt : theme.accent} weight={700}>
              {d.head}
            </Label>
            <Label x={D.x + 24} y={D.y[i] + 84} anchor="start" size={22} weight={700}>
              {typed(d.body, frame, docAt[i] + 24, 30)}
            </Label>
          </Card>
        </g>
      ))}

      {/* доска 2: ваш вклад */}
      <g opacity={title}>
        <Label x={M.x} y={150} anchor="start" size={30} weight={800}>
          Ваш вклад
        </Label>
        <rect x={M.x} y={M.y - M.h / 2} width={M.w} height={M.h} rx={M.h / 2} fill={theme.white} stroke={theme.line} strokeWidth={3} />
        <rect x={M.x + 4} y={M.y - M.h / 2 + 4} width={Math.max(0, (M.w - 8) * fill)} height={M.h - 8} rx={(M.h - 8) / 2} fill={theme.accent} />
      </g>
      {CHIPS.map((c, i) => (
        <g key={c.text} opacity={appear(frame, chipAt[i], 10)}>
          <Pill x={M.x + (M.w / 4) * (i + 0.5)} y={c.y} text={c.text} color={theme.accent} fill={theme.white} size={20} compact />
        </g>
      ))}
      <g opacity={firm}>
        <Mark x={BOARD2 + 1110} y={250} ok r={16} />
        <Pill x={BOARD2 + 1110} y={M.y} text="позиция твёрже" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* «сгенерировать» и взять первое */}
      <g opacity={gen}>
        <rect x={S2.gen.x - 100} y={S2.gen.y - 25} width={200} height={50} rx={12} fill={theme.accent} />
        <Label x={S2.gen.x} y={S2.gen.y + 8} size={22} color={theme.white} weight={700}>
          Сгенерировать
        </Label>
        {click > 0 && <rect x={S2.gen.x - 100 - click * 14} y={S2.gen.y - 25 - click * 14} width={200 + click * 28} height={50 + click * 28} rx={16} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - click} />}
      </g>
      <Arrow x1={S2.gen.x + 110} y1={S2.gen.y} x2={S2.first.x - 90} y2={S2.first.y} color={theme.line} draw={toFirst} />
      {frame >= b(5) + 124 && (
        <g transform={`translate(${S2.first.x} ${S2.first.y}) scale(${first}) translate(${-S2.first.x} ${-S2.first.y})`}>
          <Pill x={S2.first.x} y={S2.first.y} text="первый ответ" color={theme.soft} fill={theme.white} size={20} compact />
        </g>
      )}
      <g opacity={zero}>
        <rect x={S2.small.x} y={S2.small.y} width={S2.small.w} height={S2.small.h} rx={S2.small.h / 2} fill={theme.white} stroke={theme.line} strokeWidth={3} />
        <rect x={S2.small.x + 4} y={S2.small.y + 4} width={14} height={S2.small.h - 8} rx={(S2.small.h - 8) / 2} fill={theme.risk} />
        <Label x={S2.small.x + S2.small.w / 2} y={S2.small.y + 72} size={20} color={theme.risk} weight={700}>
          вклад почти нулевой
        </Label>
      </g>
      {frame >= b(5) + 60 && frame < b(5) + 112 && <Cursor x={cursor.x} y={cursor.y} />}
      <Actor x={BOARD2 + 1150} y={460} scale={0.7} label="Вы" enterAt={b(4) + 20}>
        <Person color={theme.soft} pose={you2[0]} mood={you2[1]} />
      </Actor>
    </KitScene>
  )
}
