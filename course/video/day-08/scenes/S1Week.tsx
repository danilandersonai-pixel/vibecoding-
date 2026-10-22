import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1, WEEK_DAYS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Sheet, Slot } from './parts'

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
// голова героя в масштабе 0,8 — сюда указывает реплика
const headY = S1.peopleY - 64

// Сцена 1 (вступление): неделя в приложении позади, у Марины, Димы и Олега накопились замечания.
// План дня: отзывы → приоритеты → задача фоновому агенту, который работает сам и присылает пул-реквест.
export function S1Week() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // неделя: галочка на каждом дне
  const tickAt = WEEK_DAYS.map((_, i) => b(0) + 24 + i * 14)
  const weekLabel = useAppear(b(0) + 10)
  const first = useAppear(b(0) + 40) * (1 - appear(frame, b(1) + 6, 10))
  // замечания: Марина, Дима, Олег
  const sayAt = [b(1) + 22, b(1) + 52, b(1) + 84]
  const count = useAppear(b(1) + 124)

  // доска 2: план дня и путь задачи
  const title = useAppear(b(2) - 10)
  const stepAt0 = [b(2) - 6, b(2) + 4, b(2) + 14]
  const focus = appear(frame, b(2) + 110, 14)
  const busy = useAppear(b(3) + 26)
  const flyOn = frame >= b(3) + 16 && frame < b(3) + 60
  const fly = useTrack([
    [b(3) + 16, S1.you.x + 50, S1.you.y - 20],
    [b(3) + 56, S1.agent.x - 70, S1.agent.y - 20],
  ])
  const flow1 = appear(frame, b(3) + 16, 30)
  const solo = useAppear(b(3) + 60)
  const flow2 = appear(frame, b(3) + 104, 16)
  const prIn = usePop(b(3) + 118)
  const prOk = useAppear(b(3) + 150)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 60, ['point', 'happy']],
    [b(0) + 140, ['stand', 'happy']],
    [b(1) + 22, ['point', 'worried']],
    [b(1) + 90, ['stand', 'neutral']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 90, ['cheer', 'happy']],
    [b(0) + 150, ['stand', 'happy']],
    [b(1) + 52, ['think', 'worried']],
  ])
  const oleg = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 84, ['think', 'happy']],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(3) + 40, ['think', 'neutral']],
    [b(3) + 150, ['cheer', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 58, 'working'],
    [b(3) + 118, 'done'],
  ])

  return (
    <KitScene chip="1 / 4 · Неделя с первыми тренерами" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* неделя в приложении: дни с галочками */}
      {WEEK_DAYS.map((d, i) => {
        const x = W.x + i * (W.cell + W.gap)
        const done = appear(frame, tickAt[i], 8)
        return (
          <g key={d} opacity={appear(frame, i * 3, 10)}>
            <rect x={x} y={W.y} width={W.cell} height={W.h} rx={10} fill={done > 0 ? theme.okTint : theme.white} stroke={done > 0 ? theme.ok : theme.line} strokeWidth={3} />
            <Label x={x + W.cell / 2} y={W.y + 33} size={20} weight={700} color={done > 0 ? theme.ok : theme.soft}>
              {d}
            </Label>
            <g opacity={done}>
              <Mark x={x + W.cell - 6} y={W.y + 4} ok r={11} />
            </g>
          </g>
        )
      })}
      <g opacity={weekLabel}>
        <Label x={W.x + 7 * (W.cell + W.gap) + 14} y={W.y + 34} anchor="start" size={20} color={theme.soft} weight={600}>
          неделя в приложении
        </Label>
      </g>
      <g opacity={first}>
        <Pill x={(S1.people[0].x + S1.people[1].x) / 2} y={S1.sayY} text="первые тренеры" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* тренеры и подопечный */}
      <Coach x={S1.people[0].x} y={S1.peopleY} scale={0.8} label="Марина" enterAt={4} pose={marina[0]} mood={marina[1]} />
      <Coach x={S1.people[1].x} y={S1.peopleY} scale={0.8} label="Дима" color={theme.alt} enterAt={12} pose={dima[0]} mood={dima[1]} />
      <Client x={S1.people[2].x} y={S1.peopleY} scale={0.8} label="Олег" enterAt={b(1) + 14} pose={oleg[0]} mood={oleg[1]} />
      {S1.people.map((p, i) => (
        <g key={p.name} opacity={appear(frame, sayAt[i], 10)}>
          <Callout x={p.x} y={S1.sayY} tx={p.x + 8} ty={headY - 14} text={p.say} color={i === 2 ? theme.ok : i === 1 ? theme.alt : theme.accent} />
        </g>
      ))}
      <g opacity={count}>
        <Pill x={S1.count.x} y={S1.count.y} text="3 замечания" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* доска 2: план дня */}
      <g opacity={title}>
        <Label x={S1.title.x} y={S1.title.y} size={28} weight={800}>
          План дня
        </Label>
      </g>
      {/* места трёх шагов и пул-реквеста — заранее, пунктиром */}
      {STEPS.map((s, i) => (
        <Slot key={s.title} x={stepX(i)} y={ST.y} w={ST.w} h={ST.h} />
      ))}
      <Slot x={PR.x} y={PR.y} w={PR.w} h={PR.h} />
      {STEPS.map((s, i) => {
        const x = stepX(i)
        const on = i === 2 ? focus : 0
        return (
          <g key={s.title} opacity={appear(frame, stepAt0[i], 12)}>
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
            {i > 0 && <Arrow x1={stepX(i - 1) + ST.w + 6} y1={ST.y + ST.h / 2} x2={x - 6} y2={ST.y + ST.h / 2} color={theme.accent} draw={appear(frame, stepAt0[i] - 8, 12)} />}
          </g>
        )
      })}

      {/* путь задачи: вы → агент в фоне → пул-реквест */}
      <Actor x={S1.you.x} y={S1.you.y} scale={0.7} label="Вы" enterAt={b(3)}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={busy}>
        <Pill x={S1.you.x} y={S1.you.y - 92} text="заняты другим" color={theme.soft} size={20} compact />
      </g>
      <Arrow x1={S1.you.x + 60} y1={S1.you.y + 10} x2={S1.agent.x - 70} y2={S1.agent.y + 10} color={theme.line} dashed draw={flow1} />
      {flyOn && <Sheet x={fly.x} y={fly.y} />}
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.8} label="Фоновый агент" enterAt={b(2) + 70} pose={agent} />
      <g opacity={solo}>
        <Pill x={S1.agent.x} y={S1.agent.y - 104} text="работает сам" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Arrow x1={S1.agent.x + 70} y1={S1.agent.y} x2={PR.x - 10} y2={S1.agent.y} color={theme.ok} draw={flow2} />
      {frame >= b(3) + 118 && (
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
      <g opacity={prOk}>
        <Mark x={PR.x + PR.w - 40} y={PR.y + PR.h - 42} ok r={18} />
      </g>
    </KitScene>
  )
}
