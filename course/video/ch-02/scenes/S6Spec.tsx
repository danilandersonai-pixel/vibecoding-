import { interpolate, useCurrentFrame } from 'remotion'
import { Agent } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Doc } from './parts'

const ID = 's6-spec'
const ST = S6.steps
const DY = S6.detailY
const DH = S6.detailH
const PR = S6.prompt
const RC = S6.recap

// четыре шага разработки от спецификации (s19, рис. 2.8)
const STEPS = [
  { title: 'Спецификация', sub: 'что, а не как' },
  { title: 'План', sub: 'части, данные, риски' },
  { title: 'Задачи', sub: 'по одному коммиту' },
  { title: 'Исполнение', sub: 'по одной, с проверкой' },
]
const SPEC = ['• цели', '• кто пользуется', '• главные сценарии', '• скорость и защита']
const PLAN = ['• части программы', '• где лежат данные', '• порядок работ', '• что может сломаться']
const TASKS = ['Экран тренировок', 'Напоминания', 'Вход тренера']
// чего в запросе быть не должно
const SECRETS = [
  { text: 'пароль: qwerty123', mono: true },
  { text: 'ключ: sk-live-4f9a…', mono: true },
  { text: 'телефон Анны: +7 916…', mono: false },
]
const RECAP = ['ЦКОКФ — пять вопросов', 'конкретность', 'круги уточнений', 'вопросы перед стартом', 'план до кода', 'спецификация']
const TASK_H = 62
const TASK_GAP = 10

// Сцена 6: разработка от спецификации — спецификация (её утверждает человек), план, задачи в один коммит,
// исполнение по одной с проверкой; пароли, ключи и личные данные в запрос не попадают; итог главы.
export function S6Spec() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const colX = (i: number) => ST.x + i * (ST.w + ST.gap)

  const stepAtF = STEPS.map((_, i) => b(0) + 12 + i * 16)
  const specAt = SPEC.map((_, i) => b(1) + 18 + i * 16)
  const approved = useAppear(b(1) + 120)
  const planIn = useAppear(b(2) + 30)
  const planAt = PLAN.map((_, i) => b(2) + 44 + i * 18)
  const taskIn = TASKS.map((_, i) => appear(frame, b(3) + 30 + i * 18))
  // исполнение: задачи по одной переезжают в четвёртый столбец и получают галочку
  const moveAt = TASKS.map((_, i) => b(4) + 16 + i * 48)
  const doneAt = moveAt.map((at) => at + 30)
  const active = stepAt(frame, [[0, -1], ...moveAt.map((at, i) => [at, i] as [number, number])])

  // доска 2: секреты зачёркнуты; итог
  const prompt = useAppear(b(5) + 8)
  const crossAt = SECRETS.map((_, i) => b(5) + 46 + i * 18)
  const never = useAppear(b(5) + 112)
  const recap = useAppear(b(6) + 6)
  const rowAt = RECAP.map((_, i) => b(6) + 24 + i * 16)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 46, ['surprised', 'worried']],
    [b(5) + 112, ['point', 'neutral']],
    [b(6) + 20, ['stand', 'happy']],
    [b(6) + 120, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="6 / 6 · Разработка от спецификации" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* четыре шага */}
      {STEPS.map((s, i) => {
        const x = colX(i)
        const a = appear(frame, stepAtF[i])
        const lit = i === 0 ? frame >= b(1) : i === 1 ? frame >= b(2) : i === 2 ? frame >= b(3) : frame >= b(4)
        return (
          <g key={s.title} opacity={a} transform={`translate(0 ${(1 - a) * 16})`}>
            <Card x={x} y={ST.y} w={ST.w} h={ST.h} stroke={lit ? theme.accent : theme.line} fill={lit ? theme.accentTint : theme.paper} />
            <circle cx={x + 34} cy={ST.y + 38} r={18} fill={lit ? theme.accent : theme.line} />
            <Label x={x + 34} y={ST.y + 45} size={20} color={theme.white} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={x + 64} y={ST.y + 46} anchor="start" size={24} weight={700}>
              {s.title}
            </Label>
            <Label x={x + 20} y={ST.y + 98} anchor="start" size={20} color={theme.soft} weight={500}>
              {s.sub}
            </Label>
          </g>
        )
      })}
      {/* стрелки между шагами; первая открывается, только когда спецификацию утвердили */}
      {[0, 1, 2].map((i) => {
        const x = colX(i) + ST.w
        const y = ST.y + ST.h / 2
        const gate = i === 0
        const color = gate ? (approved > 0.5 ? theme.ok : theme.risk) : theme.accent
        return (
          <g key={i} opacity={appear(frame, stepAtF[i + 1])}>
            <path d={`M${x + 4} ${y} H${x + ST.gap - 4} m-9 -7 l9 7 l-9 7`} fill="none" stroke={color} strokeWidth={3} />
          </g>
        )
      })}

      {/* 1: спецификация — пишете с ИИ, правите и утверждаете сами */}
      <g opacity={appear(frame, b(1) + 8)}>
        <Doc x={colX(0)} y={DY} w={ST.w} h={DH} color={theme.accent}>
          {SPEC.map((t, i) => (
            <Label key={t} x={colX(0) + 18} y={DY + 38 + i * 34} anchor="start" size={20} weight={500}>
              {typed(t, frame, specAt[i], 40)}
            </Label>
          ))}
        </Doc>
      </g>
      <g opacity={approved} transform={`rotate(-8 ${colX(0) + 170} ${DY + DH - 24})`}>
        <Pill x={colX(0) + 170} y={DY + DH - 24} text="утверждаете вы ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* 2: план */}
      <g opacity={planIn}>
        <Card x={colX(1)} y={DY} w={ST.w} h={DH} stroke={theme.accent}>
          {PLAN.map((t, i) => (
            <Label key={t} x={colX(1) + 18} y={DY + 40 + i * 40} anchor="start" size={20} weight={500}>
              {typed(t, frame, planAt[i], 40)}
            </Label>
          ))}
        </Card>
      </g>

      {/* 3 → 4: задачи по одному коммиту, исполнение по одной с проверкой */}
      {TASKS.map((t, i) => {
        const y = DY + i * (TASK_H + TASK_GAP)
        const p = trackAt(frame, [
          [moveAt[i], colX(2), y],
          [moveAt[i] + 24, colX(3), y],
        ])
        const done = appear(frame, doneAt[i], 8)
        const working = active === i && frame < doneAt[i]
        return (
          <g key={t} opacity={taskIn[i]}>
            {frame >= moveAt[i] && <rect x={colX(2)} y={y} width={ST.w} height={TASK_H} rx={12} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="8 6" />}
            <rect x={p.x} y={y} width={ST.w} height={TASK_H} rx={12} fill={done > 0 ? theme.okTint : theme.paper} stroke={working ? theme.alt : done > 0 ? theme.ok : theme.accent} strokeWidth={3} />
            <Label x={p.x + 18} y={y + 27} anchor="start" size={20} weight={700}>
              {t}
            </Label>
            <Label x={p.x + 18} y={y + 51} anchor="start" size={18} color={theme.soft} weight={500}>
              готово, если: …
            </Label>
            <g opacity={done}>
              <Mark x={p.x + ST.w - 28} y={y + TASK_H / 2} ok />
            </g>
          </g>
        )
      })}

      {/* доска 2: никаких паролей, ключей и личных данных */}
      <g opacity={prompt}>
        <Doc x={PR.x} y={PR.y} w={PR.w} h={PR.h} title="Запрос" color={theme.risk}>
          <Label x={PR.x + 24} y={PR.y + 86} anchor="start" size={22} weight={500}>
            Почини вход Марины.
          </Label>
          {SECRETS.map((s, i) => {
            const y = PR.y + 146 + i * 56
            const cross = interpolate(frame, [crossAt[i], crossAt[i] + 12], [0, 1], CLAMP)
            return (
              <g key={s.text}>
                <rect x={PR.x + 16} y={y - 32} width={PR.w - 32} height={46} rx={8} fill={theme.riskTint} />
                <text x={PR.x + 30} y={y} fill={theme.risk} style={{ font: `600 22px ${s.mono ? theme.mono : theme.font}` }}>
                  {s.text}
                </text>
                <line x1={PR.x + 24} y1={y - 8} x2={PR.x + 24 + (PR.w - 120) * cross} y2={y - 8} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
                <g opacity={cross}>
                  <Mark x={PR.x + PR.w - 44} y={y - 9} ok={false} />
                </g>
              </g>
            )
          })}
        </Doc>
      </g>
      <g opacity={never}>
        <Pill x={PR.x + PR.w / 2} y={PR.y + PR.h + 44} text="в запрос — никогда" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>

      {/* итог главы */}
      <g opacity={recap}>
        <Card x={RC.x} y={RC.y} w={RC.w} h={64 + RECAP.length * 40} stroke={theme.accent}>
          <Label x={RC.x + 24} y={RC.y + 42} anchor="start" size={24} color={theme.accent} weight={700}>
            Итог: как говорить с ИИ
          </Label>
          {RECAP.map((t, i) => (
            <g key={t} opacity={appear(frame, rowAt[i])}>
              <Mark x={RC.x + 40} y={RC.y + 84 + i * 40} ok r={12} />
              <Label x={RC.x + 66} y={RC.y + 91 + i * 40} anchor="start" size={22} weight={600}>
                {t}
              </Label>
            </g>
          ))}
        </Card>
      </g>
      {frame >= b(5) && <Coach x={RC.x + 170} y={476} scale={0.6} color={theme.accent} label="Марина" enterAt={b(5)} pose={marina[0]} mood={marina[1]} />}
      {frame >= b(6) + 60 && <Agent x={RC.x + 420} y={476} scale={0.6} enterAt={b(6) + 60} pose="done" />}
    </KitScene>
  )
}
