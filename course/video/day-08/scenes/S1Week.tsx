import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1, WEEK_DAYS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Sheet } from './parts'

const ID = 's1-week'
const W = S1.week
const ST = S1.steps
const PR = S1.pr

// план дня: три шага
const STEPS = [
  { title: 'Отзывы', sub: 'собрать дословно' },
  { title: 'Приоритеты', sub: 'что делать первым' },
  { title: 'Задача агенту', sub: 'с критерием «готово»' },
]
const stepX = (i: number) => ST.x + i * (ST.w + ST.gap)

// Сцена 1 (короткое вступление): неделя с первыми тренерами позади, план дня — отзывы, приоритеты,
// задача агенту. Фоновый агент работает сам, пока вы заняты другим; от вас — ясная задача и проверка.
export function S1Week() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // неделя позади и план дня
  const tickAt = WEEK_DAYS.map((_, i) => b(0) + 6 + i * 8)
  const title = useAppear(b(0) + 30)
  const stepIn = [b(0) + 50, b(0) + 66, b(0) + 82]
  const focus = appear(frame, b(0) + 130, 14)

  // путь задачи: места внизу появляются, когда камера отъезжает
  const places = appear(frame, b(1) - 6, 12)
  const flyOn = frame >= b(1) + 30 && frame < b(1) + 66
  const fly = useTrack([
    [b(1) + 30, S1.you.x + 50, S1.you.y - 20],
    [b(1) + 64, S1.agent.x - 70, S1.agent.y - 20],
  ])
  const flow1 = appear(frame, b(1) + 30, 30)
  const solo = useAppear(b(1) + 70)
  const busy = useAppear(b(1) + 86)

  // от вас — ясная задача и проверка результата
  const clear = useAppear(b(2) + 6)
  const flow2 = appear(frame, b(2) + 34, 16)
  const prIn = usePop(b(2) + 50)
  const check = useAppear(b(2) + 80)
  const prOk = useAppear(b(2) + 100)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 20, ['point', 'neutral']],
    [b(1) + 86, ['think', 'neutral']],
    [b(2) + 110, ['cheer', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 66, 'working'],
    [b(2) + 50, 'done'],
  ])

  return (
    <KitScene chip="1 / 4 · План дня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* неделя с первыми тренерами позади */}
      {WEEK_DAYS.map((d, i) => {
        const x = W.x + i * (W.cell + W.gap)
        const done = appear(frame, tickAt[i], 6)
        return (
          <g key={d}>
            <rect x={x} y={W.y} width={W.cell} height={W.h} rx={8} fill={done > 0 ? theme.okTint : theme.white} stroke={done > 0 ? theme.ok : theme.line} strokeWidth={2.5} />
            <Label x={x + W.cell / 2} y={W.y + 24} size={18} weight={700} color={done > 0 ? theme.ok : theme.soft}>
              {d}
            </Label>
          </g>
        )
      })}
      <g opacity={appear(frame, tickAt[6] + 8, 8)}>
        <Mark x={W.x + 7 * (W.cell + W.gap) + 16} y={W.y + W.h / 2} ok r={14} />
      </g>

      {/* план дня: места шагов — пунктиром, карточки — по реплике */}
      <g opacity={title}>
        <Label x={S1.title.x} y={S1.title.y} size={28} weight={800}>
          План дня
        </Label>
      </g>
      {STEPS.map((s, i) => (
        <Slot key={s.title} x={stepX(i)} y={ST.y} w={ST.w} h={ST.h} />
      ))}
      {STEPS.map((s, i) => {
        const x = stepX(i)
        const on = i === 2 ? focus : 0
        return (
          <g key={s.title} opacity={appear(frame, stepIn[i], 12)}>
            <Card x={x} y={ST.y} w={ST.w} h={ST.h} stroke={i === 2 && on > 0 ? theme.accent : theme.line} fill={theme.white}>
              <rect x={x + 3} y={ST.y + 3} width={ST.w - 6} height={ST.h - 6} rx={10} fill={theme.accentTint} opacity={on} />
              <circle cx={x + 42} cy={ST.y + ST.h / 2} r={22} fill={theme.accent} />
              <Label x={x + 42} y={ST.y + ST.h / 2 + 8} size={22} color={theme.white} weight={800}>
                {String(i + 1)}
              </Label>
              <Label x={x + 80} y={ST.y + 48} anchor="start" size={24} weight={800}>
                {s.title}
              </Label>
              <Label x={x + 80} y={ST.y + 82} anchor="start" size={20} color={theme.soft} weight={600}>
                {s.sub}
              </Label>
            </Card>
            {i > 0 && <Arrow x1={stepX(i - 1) + ST.w + 6} y1={ST.y + ST.h / 2} x2={x - 6} y2={ST.y + ST.h / 2} color={theme.accent} draw={appear(frame, stepIn[i] - 8, 12)} />}
          </g>
        )
      })}

      {/* путь задачи: вы → фоновый агент → пул-реквест на проверку */}
      <g opacity={places * (1 - appear(frame, b(2) + 50, 6))}>
        <Slot x={PR.x} y={PR.y} w={PR.w} h={PR.h} text="пул-реквест" />
      </g>
      <Actor x={S1.you.x} y={S1.you.y} scale={0.7} label="Вы" enterAt={b(1) + 6}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={busy}>
        <Pill x={S1.you.x} y={S1.you.y - 92} text="заняты другим" color={theme.soft} size={20} compact />
      </g>
      <Arrow x1={S1.you.x + 60} y1={S1.you.y + 10} x2={S1.agent.x - 70} y2={S1.agent.y + 10} color={theme.line} dashed draw={flow1} />
      <g opacity={clear}>
        <Pill x={(S1.you.x + S1.agent.x) / 2 + 6} y={S1.you.y + 46} text="ясная задача" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {flyOn && <Sheet x={fly.x} y={fly.y} />}
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.8} label="Фоновый агент" enterAt={b(1) + 14} pose={agent} />
      <g opacity={solo}>
        <Pill x={S1.agent.x} y={S1.agent.y - 104} text="работает сам" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Arrow x1={S1.agent.x + 70} y1={S1.agent.y} x2={PR.x - 10} y2={S1.agent.y} color={theme.ok} draw={flow2} />
      {frame >= b(2) + 50 && (
        <g transform={`translate(${PR.x + PR.w / 2} ${PR.y + PR.h / 2}) scale(${prIn}) translate(${-(PR.x + PR.w / 2)} ${-(PR.y + PR.h / 2)})`}>
          <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} stroke={theme.ok} fill={theme.white}>
            <Label x={PR.x + 24} y={PR.y + 44} anchor="start" size={24} weight={800}>
              Пул-реквест
            </Label>
            <Label x={PR.x + 24} y={PR.y + 76} anchor="start" size={20} color={theme.soft} weight={600}>
              предложение изменений
            </Label>
            {[180, 96, 140].map((w, i) => (
              <rect key={i} x={PR.x + 24} y={PR.y + 98 + i * 20} width={w} height={10} rx={5} fill={i === 1 ? theme.risk : theme.ok} opacity={0.55} />
            ))}
          </Card>
        </g>
      )}
      <g opacity={check}>
        <Pill x={PR.x + PR.w / 2} y={PR.y - 30} text="ваша проверка" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={prOk}>
        <Mark x={PR.x + PR.w - 40} y={PR.y + PR.h - 42} ok r={18} />
      </g>
    </KitScene>
  )
}
