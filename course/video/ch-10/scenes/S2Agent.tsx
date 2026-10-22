import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Pulse } from './parts'

const ID = 's2-agent'
const ST = S2.steps
const NW = S2.node.w
const NH = S2.node.h

// четыре ступени (рис. 10.1): название и что делает ИИ
const STEPS = [
  { title: 'Автодополнение', text: 'дописывает строку' },
  { title: 'Чат', text: 'отвечает и пишет куски' },
  { title: 'Агент рядом', text: 'правит файлы при вас' },
  { title: 'Агент в фоне', text: 'сам, сразу много задач' },
]
const ASKS = ['Править файл?', 'Запустить тесты?', 'Ещё правку?']
const TASKS = ['задача 1', 'задача 2', 'задача 3']

const stepX = (i: number) => ST.x + i * (ST.w + ST.gap)
const stepTop = (i: number) => ST.top0 - i * ST.rise

// центр узла круга
const mid = (n: { x: number; y: number }) => ({ x: n.x + NW / 2, y: n.y + NH / 2 })

// Сцена 2: четыре ступени помощников — агент рядом спрашивает подтверждения, агент в фоне ведёт задачи сам;
// правило «критерий и тест заранее». Доска 2: песочница с кругом агента, после зелёных проверок — пул-реквест.
export function S2Agent() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: ступени, сценки, правило
  const stepAt0 = STEPS.map((_, i) => b(0) + 20 + i * 28)
  const rise = appear(frame, b(0) + 140)
  const near = appear(frame, b(1) + 6)
  const askIdx = Math.min(ASKS.length - 1, Math.max(0, Math.floor((frame - b(1) - 20) / 46)))
  const ask = appear(frame, b(1) + 20 + askIdx * 46, 8)
  const yes = appear(frame, b(1) + 42 + askIdx * 46, 6)
  const askOut = interpolate(frame, [b(2) - 6, b(2) + 6], [1, 0], CLAMP)
  const far = appear(frame, b(2) + 6)
  const focus3 = interpolate(frame, [b(2) + 6, b(2) + 20], [1, 0.45], CLAMP)
  const taskAt = TASKS.map((_, i) => b(2) + 40 + i * 22)
  // фоновый агент закрывает задачи одну за другой, пока зритель читает правило
  const taskDone = TASKS.map((_, i) => frame >= b(3) + 90 + i * 32)
  const rule1 = appear(frame, b(3) + 14)
  const rule2 = appear(frame, b(3) + 30)

  // доска 2: песочница и круг
  const box = appear(frame, b(4) - 24)
  const nodeAt = [0, 1, 2, 3, 4].map((i) => b(4) + 16 + i * 8)
  const nodes = [S2.task, S2.plan, S2.act, S2.obs, S2.check]
  const P = nodes.map(mid)
  const t0 = b(4) + 60
  const path: [number, number, number][] = [
    [t0, P[0].x, P[0].y],
    [t0 + 16, P[1].x, P[1].y],
    [t0 + 32, P[2].x, P[2].y],
    [t0 + 48, P[3].x, P[3].y],
    [t0 + 64, P[4].x, P[4].y],
    [t0 + 84, P[1].x, P[1].y],
    [t0 + 100, P[2].x, P[2].y],
    [t0 + 116, P[3].x, P[3].y],
    [t0 + 132, P[4].x, P[4].y],
    [b(5) + 8, P[4].x, P[4].y + 70],
    [b(5) + 30, S2.pr.x + 60, P[4].y + 70],
  ]
  const token = trackAt(frame, path)
  const tokenOn = frame >= t0 && frame < b(5) + 34
  const fail = frame >= t0 + 48 && frame < t0 + 100
  const pass = frame >= t0 + 116
  const flash = frame >= t0 + 64 && frame < t0 + 84
  const budget = interpolate(frame, [t0, t0 + 132], [1, 0.55], CLAMP)
  const yesPath = interpolate(frame, [b(5), b(5) + 30], [0, 1], CLAMP)
  const pr = appear(frame, b(5) + 30)

  const near1 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 42, ['point', 'happy']],
    [b(1) + 70, ['stand', 'neutral']],
    [b(1) + 88, ['point', 'happy']],
    [b(1) + 116, ['stand', 'neutral']],
    [b(1) + 134, ['point', 'happy']],
  ])
  const nearAgent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 50, 'working'],
  ])
  const soloAgent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(2) + 30, 'working'],
    [b(3) + 154, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 40, ['think', 'neutral']],
    [b(5) + 90, ['stand', 'happy']],
  ])

  // путь «да»: от проверок вниз, под наблюдением — к пул-реквесту за рамкой
  const yesY = S2.check.y + NH + 36
  const yesD = `M${P[4].x} ${S2.check.y + NH} V${yesY} H${S2.pr.x + 60} V${S2.pr.y + S2.pr.h + 4}`

  return (
    <KitScene chip="2 / 7 · Что делает фоновый агент" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: четыре ступени */}
      {STEPS.map((s, i) => {
        const g = appear(frame, stepAt0[i], 10)
        const x = stepX(i)
        const top = stepTop(i)
        const lit = (i === 2 && near > 0 && frame < b(2) + 6) || (i === 3 && far > 0)
        return (
          <g key={s.title} opacity={g} transform={`translate(0 ${(1 - g) * 16})`}>
            <rect x={x} y={top} width={ST.w} height={ST.bottom - top} rx={10} fill={lit ? theme.accentTint : theme.codeBg} stroke={lit ? theme.accent : theme.line} strokeWidth={3} />
            <circle cx={x + 28} cy={top + 30} r={15} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
            <Label x={x + 28} y={top + 37} size={19} weight={700} color={theme.accent}>
              {i + 1}
            </Label>
            <Label x={x + 54} y={top + 38} anchor="start" size={22} weight={700}>
              {s.title}
            </Label>
            <Label x={x + 18} y={top + 62} anchor="start" size={18} weight={500} color={theme.soft}>
              {s.text}
            </Label>
          </g>
        )
      })}
      <g opacity={rise}>
        <Pill x={300} y={210} w={330} text="больше самостоятельности ИИ" color={theme.accent} fill={theme.paper} size={20} compact />
        <Arrow x1={470} y1={204} x2={560} y2={160} color={theme.accent} />
      </g>

      {/* агент рядом: спрашивает, вы подтверждаете */}
      <g opacity={near * focus3}>
        <Coach x={S2.pair.marina.x} y={S2.pair.marina.y} scale={0.55} enterAt={b(1) + 6} pose={near1[0]} mood={near1[1]} />
        <Agent x={S2.pair.agent.x} y={S2.pair.agent.y} scale={0.55} label="" enterAt={b(1) + 12} pose={nearAgent} />
        <g opacity={ask * askOut}>
          <Callout x={S2.pair.agent.x + 10} y={128} tx={S2.pair.agent.x} ty={S2.pair.agent.y - 52} text={ASKS[askIdx]} size={20} />
        </g>
        <g opacity={yes * askOut}>
          <Pill x={S2.pair.marina.x - 26} y={128} w={78} text="да" color={theme.ok} fill={theme.okTint} size={20} compact />
        </g>
      </g>

      {/* агент в фоне: сам ведёт несколько задач */}
      <g opacity={far}>
        <Agent x={S2.solo.x} y={S2.solo.y} scale={0.55} label="" enterAt={b(2) + 6} pose={soloAgent} />
      </g>
      {TASKS.map((t, i) => {
        const g = appear(frame, taskAt[i], 8)
        return (
          <g key={t} opacity={g} transform={`translate(${(1 - g) * -20} 0)`}>
            <Pill x={S2.tasksX} y={96 + i * 36} w={120} text={taskDone[i] ? `${t} ✓` : t} color={taskDone[i] ? theme.ok : theme.alt} fill={taskDone[i] ? theme.okTint : theme.altTint} size={18} compact />
          </g>
        )
      })}

      {/* правило: критерий и тест заранее — в фон; неясно — рядом */}
      <g opacity={rule1}>
        <Pill x={1085} y={S2.ruleY} w={350} text="есть критерий и тест → в фон" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={rule2}>
        <Pill x={738} y={S2.ruleY} w={300} text="неясно, что нужно → рядом" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>

      {/* доска 2: песочница */}
      <g opacity={box}>
        <rect x={S2.frame.x} y={S2.frame.y} width={S2.frame.w} height={S2.frame.h} rx={18} fill={theme.zone} stroke={theme.accent} strokeWidth={3} strokeDasharray="12 8" />
        <Label x={S2.frame.x + 24} y={S2.frame.y + 40} anchor="start" size={22} weight={700} color={theme.accent}>
          Песочница · копия проекта
        </Label>
        {/* бюджет: время, деньги, токены */}
        <Label x={S2.budget.x - 12} y={S2.budget.y + 13} anchor="end" size={18} weight={600} color={theme.soft}>
          бюджет
        </Label>
        <rect x={S2.budget.x} y={S2.budget.y} width={S2.budget.w} height={18} rx={9} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
        <rect x={S2.budget.x + 2} y={S2.budget.y + 2} width={(S2.budget.w - 4) * budget} height={14} rx={7} fill={theme.alt} />
      </g>

      {/* узлы круга */}
      {nodes.map((n, i) => {
        const g = appear(frame, nodeAt[i], 8)
        const isCheck = i === 4
        const isObs = i === 3
        const stroke = isCheck && pass ? theme.ok : isCheck && flash ? theme.risk : i === 0 ? theme.accent : theme.line
        const fill = isCheck && pass ? theme.okTint : isCheck && flash ? theme.riskTint : theme.white
        const titles = ['Задача', 'План шага', 'Действие', 'Наблюдение', 'Проверки ок?']
        const subs = ['экспорт в CSV', 'что делать дальше', 'правка, команда', pass ? 'тесты прошли' : fail ? 'тест упал' : 'вывод, ошибки', 'тесты, сборка']
        const subColor = isObs && pass ? theme.ok : isObs && fail ? theme.risk : theme.soft
        return (
          <g key={titles[i]} opacity={g}>
            <rect x={n.x} y={n.y} width={NW} height={NH} rx={12} fill={fill} stroke={stroke} strokeWidth={3} />
            <Label x={n.x + NW / 2} y={n.y + 32} size={22} weight={700}>
              {titles[i]}
            </Label>
            <Label x={n.x + NW / 2} y={n.y + 60} size={18} weight={600} color={subColor}>
              {subs[i]}
            </Label>
          </g>
        )
      })}
      {/* стрелки круга */}
      <g opacity={appear(frame, nodeAt[4] + 6)}>
        <Arrow x1={S2.task.x + NW + 4} y1={P[0].y} x2={S2.plan.x - 4} y2={P[1].y} color={theme.ink} />
        <Arrow x1={S2.plan.x + NW + 4} y1={P[1].y} x2={S2.act.x - 4} y2={P[2].y} color={theme.ink} />
        <Arrow x1={P[2].x} y1={S2.act.y + NH + 4} x2={P[3].x} y2={S2.obs.y - 4} color={theme.ink} />
        <Arrow x1={S2.obs.x - 4} y1={P[3].y} x2={S2.check.x + NW + 4} y2={P[4].y} color={theme.ink} />
        <Arrow x1={P[4].x} y1={S2.check.y - 4} x2={P[1].x} y2={S2.plan.y + NH + 4} color={theme.risk} dashed />
        <Label x={P[4].x + 14} y={(S2.plan.y + NH + S2.check.y) / 2 + 7} anchor="start" size={20} weight={700} color={theme.risk}>
          нет
        </Label>
      </g>
      {/* да → пул-реквест за рамкой песочницы */}
      <g opacity={yesPath > 0 ? 1 : 0}>
        <path d={yesD} fill="none" stroke={theme.ok} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - yesPath} />
        <Label x={P[4].x + 14} y={yesY - 10} anchor="start" size={20} weight={700} color={theme.ok}>
          да
        </Label>
      </g>

      {/* жетон задачи бежит по кругу */}
      {tokenOn && (
        <g transform={`translate(${token.x} ${token.y - NH / 2 - 14})`}>
          <circle r={11} fill={pass ? theme.ok : theme.alt} stroke={theme.white} strokeWidth={3} />
        </g>
      )}

      {/* место пул-реквеста за рамкой — пунктиром, пока круг идёт */}
      <g opacity={appear(frame, b(4) + 40) * (1 - pr)}>
        <rect x={S2.pr.x} y={S2.pr.y} width={S2.pr.w} height={S2.pr.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={S2.pr.x + S2.pr.w / 2} y={S2.pr.y + S2.pr.h / 2 + 8} size={22} weight={700} color={theme.line}>
          что выйдет наружу?
        </Label>
      </g>

      {/* пул-реквест — единственное, что выходит наружу */}
      <g opacity={pr} transform={`translate(0 ${(1 - pr) * 12})`}>
        <Card x={S2.pr.x} y={S2.pr.y} w={S2.pr.w} h={S2.pr.h} stroke={theme.ok} fill={theme.white}>
          <Label x={S2.pr.x + 24} y={S2.pr.y + 42} anchor="start" size={24} weight={700} color={theme.ok}>
            Пул-реквест
          </Label>
          <Label x={S2.pr.x + 24} y={S2.pr.y + 78} anchor="start" size={20} weight={500}>
            предложение изменений
          </Label>
          <Label x={S2.pr.x + 24} y={S2.pr.y + 110} anchor="start" size={18} weight={500} color={theme.soft}>
            ветка и описание
          </Label>
        </Card>
        <Mark x={S2.pr.x + S2.pr.w - 34} y={S2.pr.y + 34} ok r={15} />
      </g>
      <Pulse x={S2.pr.x + S2.pr.w - 34} y={S2.pr.y + 34} r={15} frame={frame} from={b(5) + 80} color={theme.ok} />
      {frame >= b(5) + 20 && <Coach x={S2.marina.x} y={S2.marina.y} scale={0.7} label="Марина" enterAt={b(5) + 20} pose={marina[0]} mood={marina[1]} />}
      <g opacity={appear(frame, b(5) + 46)}>
        <Callout x={S2.marina.x - 10} y={114} tx={S2.marina.x + 2} ty={S2.marina.y - 54} text={frame >= b(5) + 130 ? 'проверю утром' : 'решаю я'} color={theme.accent} />
      </g>
    </KitScene>
  )
}
