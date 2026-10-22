import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { grow, stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { packRow, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's3-t-shape'
const T = S3.tasks
const D = S3.dirs
const BAR = S3.bar
const LEG = S3.leg
const C = S3.card

// типовое, что ИИ делает быстро (s25)
const TASKS = ['формы', 'адреса для запросов', 'сервис по документации']
// растущие направления (таблица s25)
const DIRS = ['безопасность', 'скорость и надёжность', 'связывание систем', 'инструменты для команды', 'ИИ-инженерия', 'предметная область']
// ширина — темы на перекладине буквы Т (рис. 4.2)
const WIDE = ['безопасность', 'данные', 'интерфейс', 'тесты', 'выкладывание']
const wideW = (t: string) => Math.round(t.length * 18 * 0.56 + 28)
const OFFER_W = Math.round('Рейтинг по весу?'.length * 20 * 0.56 + 28)
const WIDE_X = packRow(WIDE.map(wideW), 10, { center: BAR.x + BAR.w / 2 })

// Сцена 3: типовую работу ИИ делает быстро, растёт цена глубины; T-образный профиль: перекладина —
// ширина (помогает ИИ), ножка — глубина (ваша). Лучшая ножка новичка — предметная область: Марина
// замечает, что подсказка ИИ не нужна тренерам.
export function S3TShape() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: типовые задачи и направления
  const taskAt = [b(0) + 20, b(0) + 50, b(0) + 80]
  const doneAt = [b(0) + 112, b(0) + 126, b(0) + 140]
  const fast = useAppear(b(0) + 156)
  const head = useAppear(b(1) + 4)
  const dirAt = DIRS.map((_, i) => b(1) + 14 + i * 11)
  const domainOn = frame >= b(4) + 10

  // доска 2: буква Т
  const bar = grow(frame, b(2) + 36, 24)
  const wideAt = WIDE.map((_, i) => b(2) + 56 + i * 12)
  const wideTag = useAppear(b(2) + 130)
  // ИИ быстро даёт основы любой темы (рис. 4.2) — пока строится буква Т
  const basics = appear(frame, b(2) + 140) * (1 - appear(frame, b(4) + 40, 10))
  const leg = grow(frame, b(3) + 14, 50)
  const deepTag = useAppear(b(3) + 76)
  const yours = useAppear(b(4) + 14) * (1 - appear(frame, b(4) + 120, 10))
  const gym = useAppear(b(4) + 128)

  // пример: подсказка ИИ мимо, Марина знает, что важно тренерам
  const offer = appear(frame, b(5) + 16) * (1 - appear(frame, b(5) + 170, 10))
  const reject = frame >= b(5) + 96
  const reply = appear(frame, b(5) + 110) * (1 - appear(frame, b(5) + 170, 10))
  const card = useAppear(b(5) + 176)
  const expert = useAppear(b(6) + 20)
  const glow = frame >= b(6) + 20 ? 0.5 + 0.5 * Math.sin((frame - b(6)) / 6) : 0

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 24, 'working'],
    [b(0) + 146, 'done'],
    [b(1) + 30, 'idle'],
  ])
  const agent2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(2) + 56, 'working'],
    [b(2) + 130, 'done'],
    [b(3), 'idle'],
    [b(5) + 10, 'done'],
    [b(5) + 100, 'idle'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 120, ['stand', 'happy']],
    [b(5) + 40, ['think', 'neutral']],
    [b(5) + 96, ['point', 'worried']],
    [b(5) + 176, ['point', 'happy']],
    [b(6) + 20, ['cheer', 'happy']],
  ])

  const legH = (LEG.bottom - (BAR.y + BAR.h)) * leg
  const legX = LEG.x + LEG.w / 2
  return (
    <KitScene chip="3 / 6 · Т-образный специалист" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* типовое — ИИ делает быстро */}
      {TASKS.map((t, i) => {
        const y = T.y + i * (T.h + T.gap)
        const done = frame >= doneAt[i]
        return (
          <g key={t} opacity={appear(frame, taskAt[i], 10)}>
            <Card x={T.x} y={y} w={T.w} h={T.h} stroke={done ? theme.ok : theme.line} fill={done ? theme.okTint : theme.paper}>
              <Label x={T.x + 20} y={y + T.h / 2 + 7} anchor="start" size={20} weight={600}>
                {typed(t, frame, taskAt[i], 40)}
              </Label>
            </Card>
            {done && <Mark x={T.x + T.w - 30} y={y + T.h / 2} ok r={15} />}
          </g>
        )
      })}
      <g opacity={fast}>
        <Pill x={S3.fast.x} y={S3.fast.y} text="ИИ делает быстро" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.9} enterAt={6} pose={agent} />

      {/* растёт цена глубины */}
      <g opacity={head}>
        <Pill x={S3.head.x} y={S3.head.y} text="Растёт цена глубины" color={theme.alt} fill={theme.altTint} size={22} />
      </g>
      {DIRS.map((t, i) => {
        const deep = i === DIRS.length - 1 && domainOn
        return (
          <g key={t} opacity={appear(frame, dirAt[i], 10)}>
            <Pill x={D.x} y={D.y + i * D.step} w={D.w} text={t} color={deep ? theme.white : theme.alt} fill={deep ? theme.alt : theme.paper} size={22} />
          </g>
        )
      })}

      {/* доска 2: буква Т — перекладина */}
      {bar > 0 && <rect x={BAR.x} y={BAR.y} width={BAR.w * bar} height={BAR.h} rx={16} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />}
      {WIDE.map((t, i) => (
        <g key={t} opacity={appear(frame, wideAt[i], 10)}>
          <Pill x={WIDE_X[i]} y={BAR.y + BAR.h / 2} w={wideW(t)} text={t} color={theme.accent} fill={theme.white} size={18} compact />
        </g>
      ))}
      <g opacity={wideTag}>
        <Label x={LEG.x + LEG.w + 20} y={BAR.y + BAR.h + 38} anchor="start" size={22} color={theme.accent} weight={700}>
          ширина: выручает ИИ
        </Label>
      </g>

      {/* ножка — глубина */}
      {/* контур ножки виден сразу: буква Т целиком */}
      <rect x={LEG.x} y={BAR.y + BAR.h - 3} width={LEG.w} height={LEG.bottom - BAR.y - BAR.h + 3} rx={14} fill="none" stroke={theme.alt} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(2) + 70) * (1 - leg)} />
      {leg > 0 && <rect x={LEG.x} y={BAR.y + BAR.h - 3} width={LEG.w} height={legH + 3} rx={14} fill={theme.altTint} stroke={theme.alt} strokeWidth={3 + glow * 3} />}
      <g opacity={deepTag}>
        <Label x={LEG.x - 24} y={340} anchor="end" size={22} color={theme.alt} weight={700}>
          глубина:
        </Label>
        <Label x={LEG.x - 24} y={372} anchor="end" size={22} color={theme.alt} weight={700}>
          строите сами
        </Label>
      </g>
      <g opacity={yours}>
        {['ваша', 'предметная', 'область'].map((t, i) => (
          <Label key={t} x={legX} y={330 + i * 32} size={20} color={theme.alt} weight={700}>
            {t}
          </Label>
        ))}
      </g>
      <g opacity={gym}>
        <Label x={legX} y={346} size={20} color={theme.alt} weight={800}>
          тренировки
        </Label>
        <Label x={legX} y={378} size={18} color={theme.soft} weight={600}>
          у Марины
        </Label>
      </g>

      <g opacity={basics}>
        <Callout x={S3.agent2.x + 40} y={306} tx={S3.agent2.x + 4} ty={S3.agent2.y - 80} text="Подскажу основы любой темы" color={theme.accent} fill={theme.accentTint} />
      </g>

      {/* пример: рейтинг по весу — мимо; тренеру важнее пропуски */}
      <g opacity={offer}>
        <Callout x={S3.agent2.x + 10} y={250} tx={S3.agent2.x + 6} ty={S3.agent2.y - 84} text="Рейтинг по весу?" color={theme.accent} />
        {reject && <Mark x={S3.agent2.x + 10 + OFFER_W / 2 + 4} y={226} ok={false} r={15} />}
      </g>
      <g opacity={reply}>
        <Callout x={S3.marina.x - 30} y={180} tx={S3.marina.x - 4} ty={S3.marina.y - 84} text="Тренеру важнее другое" color={theme.ok} fill={theme.okTint} />
      </g>
      <g opacity={card}>
        <Card x={C.x} y={C.y} w={C.w} h={C.h} stroke={theme.ok} fill={theme.white}>
          <Label x={C.x + 24} y={C.y + 40} anchor="start" size={22} weight={700}>
            Кто пропустил занятие
          </Label>
          <line x1={C.x + 20} y1={C.y + 60} x2={C.x + C.w - 20} y2={C.y + 60} stroke={theme.grid} strokeWidth={2} />
          <circle cx={C.x + 34} cy={C.y + 92} r={7} fill={theme.risk} />
          <Label x={C.x + 52} y={C.y + 99} anchor="start" size={20} weight={600}>
            Олег — вторник, четверг
          </Label>
          <circle cx={C.x + 34} cy={C.y + 132} r={7} fill={theme.ok} />
          <Label x={C.x + 52} y={C.y + 139} anchor="start" size={20} weight={600}>
            Анна — без пропусков
          </Label>
        </Card>
      </g>
      <Agent x={S3.agent2.x} y={S3.agent2.y} scale={0.8} enterAt={b(2) + 40} pose={agent2} />
      <Coach x={S3.marina.x} y={S3.marina.y} scale={0.8} label="Марина" enterAt={b(4) + 60} pose={marina[0]} mood={marina[1]} />
      <g opacity={expert}>
        <Pill x={S3.marina.x} y={318} text="знает дело ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={interpolate(frame, [b(6) + 20, b(6) + 32], [0, 1], CLAMP)}>
        <Label x={legX} y={LEG.bottom + 30} size={20} color={theme.alt} weight={700}>
          видно знатоку
        </Label>
      </g>
    </KitScene>
  )
}
