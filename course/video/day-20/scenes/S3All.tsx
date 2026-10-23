import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BIG, COMMIT_H, commitRowY, POLINA_WEEK, REMARKS, S3, WEEK } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { RowText } from './parts'

const ID = 's3-all'
const CM = S3.commit
const P = S3.polina
const BS = S3.bisect
// просьба «исправь всё» одной задачей
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Исправь все шесть замечаний из списка' },
  { from: 'agent', text: 'Сделаю всё сразу!' },
]
const SAVE = REMARKS.findIndex((r) => r.id === 'save')
const footY = CM.y + CM.head + CM.stats + BIG.fixes.length * CM.row
const cellX = (d: number) => P.x + 13 + d * (P.cell + P.gap)

// Гантель — тренировка в календаре; (x, y) — центр.
function Dumbbell({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g fill={color}>
      <rect x={x - 13} y={y - 2.5} width={26} height={5} />
      <rect x={x - 19} y={y - 10} width={7} height={20} rx={2} />
      <rect x={x + 12} y={y - 10} width={7} height={20} rx={2} />
    </g>
  )
}

// Сцена 3 (подводный камень): «Исправь все шесть замечаний» одной задачей → утром один коммит на 23 файла,
// без новых тестов → после выкладки у Полины тренировки съехали на день (такого в списке не было) →
// это «шаг вперёд — два назад» → поиск делением пополам приводит к этому коммиту, но не к правке внутри →
// у Ксении снова ошибка → откат уносит все шесть правок, а чинить всё равно по одному.
export function S3All() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // просьба и ночь агента
  const chatAt = b(0) + 6
  const allAtOnce = appear(frame, b(0) + 120, 10)
  const night = appear(frame, b(0) + 84, 10) * (1 - appear(frame, b(1), 8))

  // утром — один коммит на 23 файла (камера отъехала к b(1) + 24)
  const commitSlot = appear(frame, b(1) + 24, 8) * (1 - appear(frame, b(1) + 34, 6))
  const commitIn = useAppear(b(1) + 32)
  const statsIn = useAppear(b(1) + 50)
  const rowAt = BIG.fixes.map((_, i) => b(1) + 70 + i * 14)

  // проверить нельзя, новых тестов нет
  const unread = appear(frame, b(2) + 24, 10) * (1 - appear(frame, b(6) + 56, 8))
  const noTests = useAppear(b(2) + 84)

  // выкладка → у Полины всё съехало на день (места справа нарисованы заранее: камера приезжает на b(3) + 56)
  const shipped = appear(frame, b(3) + 6, 10) * (1 - appear(frame, b(6) + 4, 8))
  const polinaIn = useAppear(b(3) + 60)
  const shiftFrom = b(3) + 104
  const plusDay = useAppear(b(3) + 122)
  const polinaSay = useAppear(b(3) + 128)
  const notListed = useAppear(b(3) + 140)
  const twoBack = useAppear(b(3) + 150)

  // поиск делением пополам → этот коммит; какая из шести?
  const bisectLabel = useAppear(b(4) + 6)
  const goodAt = [0, 1, 2, 3].map((i) => b(4) + 16 + i * 8)
  const badAt = b(4) + 56
  const thisOne = useAppear(b(4) + 76)
  const which = BIG.fixes.map((_, i) => appear(frame, b(4) + 118 + i * 6, 8))

  // у Ксении снова ошибка — главная беда осталась
  const kseniaSay = useAppear(b(5) + 30)
  const saveBad = useAppear(b(5) + 84)
  const stayed = useAppear(b(5) + 104)

  // откат: уходят все шесть, удачные тоже
  const revert = useAppear(b(6) + 4)
  const strikeAt = BIG.fixes.map((_, i) => b(6) + 40 + i * 6)
  const alsoGood = useAppear(b(6) + 70)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 80, 'working'],
    [b(1) + 8, 'done'],
    [b(2) + 40, 'idle'],
  ])
  const polina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 120, ['surprised', 'worried']],
    [b(4) + 30, ['think', 'worried']],
  ])
  const ksenia = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 24, ['surprised', 'worried']],
    [b(6) + 30, ['think', 'worried']],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень: всё сразу" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* «Исправь все шесть» одной задачей */}
      {frame >= chatAt && <AgentChat x={S3.chat.x} y={S3.chat.y} w={S3.chat.w} at={chatAt} messages={CHAT} />}
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.7} label="" enterAt={4} pose={agent} />
      <g opacity={night}>
        <Pill x={S3.night.x} y={S3.night.y} text="работает всю ночь" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
      <g opacity={allAtOnce * (1 - appear(frame, b(1), 8))}>
        <Pill x={S3.night.x} y={S3.night.y + 44} text="шесть задач в одной" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>

      {/* утром — один коммит на 23 файла */}
      <g opacity={commitSlot}>
        <Slot x={CM.x} y={CM.y} w={CM.w} h={COMMIT_H} text="коммит" />
      </g>
      <g opacity={commitIn}>
        <Card x={CM.x} y={CM.y} w={CM.w} h={COMMIT_H} stroke={appear(frame, b(4) + 76, 8) > 0 ? theme.risk : theme.line} fill={theme.white}>
          <Label x={CM.x + 20} y={CM.y + 38} anchor="start" size={22} weight={800}>
            Коммит: «исправил все замечания»
          </Label>
          <line x1={CM.x + 16} y1={CM.y + CM.head - 4} x2={CM.x + CM.w - 16} y2={CM.y + CM.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {frame >= b(1) + 50 && (
        <g opacity={statsIn}>
          <Mono x={CM.x + 20} y={CM.y + CM.head + 28} fill={theme.ink}>
            <tspan>{`${BIG.files} файла  `}</tspan>
            <tspan fill={theme.ok}>{`+${BIG.adds}`}</tspan>
            <tspan fill={theme.risk}>{` −${BIG.dels}`}</tspan>
          </Mono>
        </g>
      )}
      {BIG.fixes.map((f, i) => {
        const y = commitRowY(i)
        const s = appear(frame, strikeAt[i], 12)
        const bad = i === SAVE ? saveBad : 0
        return (
          <g key={f} opacity={appear(frame, rowAt[i], 8)}>
            <g opacity={1 - which[i]}>
              <circle cx={CM.x + 32} cy={y - 7} r={6} fill={theme.alt} />
            </g>
            <g opacity={which[i]}>
              <circle cx={CM.x + 32} cy={y - 7} r={12} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} />
              <Label x={CM.x + 32} y={y - 1} size={18} weight={800} color={theme.alt}>
                ?
              </Label>
            </g>
            <g opacity={1 - 0.4 * s}>
              <RowText x={CM.x + 56} y={y} color={bad > 0 ? theme.risk : theme.ink} strike={s >= 0.5}>
                {f}
              </RowText>
            </g>
            {/* ✗ — только у сохранения: Ксения проверила; про остальные неизвестно */}
            {i === SAVE && (
              <g opacity={bad}>
                <Mark x={CM.x + CM.w - 40} y={y - 7} ok={false} r={13} />
              </g>
            )}
          </g>
        )
      })}
      <g opacity={noTests}>
        <line x1={CM.x + 16} y1={footY + 4} x2={CM.x + CM.w - 16} y2={footY + 4} stroke={theme.grid} strokeWidth={2} />
        <Mark x={CM.x + 36} y={footY + 28} ok={false} r={13} />
        <Label x={CM.x + 58} y={footY + 35} anchor="start" size={20} weight={800} color={theme.risk}>
          {`новых тестов: ${BIG.newTests}`}
        </Label>
      </g>
      <g opacity={unread}>
        <Pill x={CM.x + CM.w - 150} y={footY + 28} text="за 20–30 минут не прочесть" color={theme.alt} fill={theme.altTint} size={18} compact />
      </g>
      <g opacity={alsoGood}>
        <Pill x={CM.x + CM.w - 120} y={footY + 28} text="и удачные тоже" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>
      <g opacity={shipped}>
        <Pill x={CM.x + CM.w - 76} y={CM.y + 31} text="выложено" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <g opacity={revert}>
        <Pill x={CM.x + CM.w - 76} y={CM.y + 31} text="откат" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>

      {/* справа: неделя Полины — тренировки съехали на день */}
      <g opacity={1 - polinaIn}>
        <Slot x={P.x} y={P.y} w={P.w} h={P.h} text="программа Полины" />
      </g>
      <g opacity={polinaIn}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.line} fill={theme.white}>
          <Label x={P.x + 20} y={P.y + 32} anchor="start" size={20} weight={800}>
            Программа Полины · неделя
          </Label>
        </Card>
        {WEEK.map((d, i) => {
          const x = cellX(i)
          const after = plusDay > 0 && POLINA_WEEK.after.includes(i)
          return (
            <g key={d}>
              <rect x={x} y={P.y + 46} width={P.cell} height={66} rx={8} fill={after ? theme.riskTint : theme.paper} stroke={after ? theme.risk : theme.grid} strokeWidth={2.5} />
              <Label x={x + P.cell / 2} y={P.y + 68} size={18} weight={700} color={theme.soft}>
                {d}
              </Label>
            </g>
          )
        })}
        {POLINA_WEEK.before.map((d, i) => {
          const p = trackAt(frame, [
            [shiftFrom + i * 4, cellX(d) + P.cell / 2, 0],
            [shiftFrom + i * 4 + 20, cellX(POLINA_WEEK.after[i]) + P.cell / 2, 0],
          ])
          return <Dumbbell key={d} x={p.x} y={P.y + 92} color={frame >= shiftFrom + i * 4 + 20 ? theme.risk : theme.accent} />
        })}
      </g>
      <g opacity={plusDay}>
        <Pill x={P.x + P.w - 70} y={P.y + 26} text="+1 день" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <Coach x={S3.polinaCoach.x} y={S3.polinaCoach.y} scale={0.5} label="Полина" color={theme.ink} enterAt={b(3) + 64} pose={polina[0]} mood={polina[1]} />
      <g opacity={polinaSay}>
        <Callout x={S3.polinaSay.x} y={S3.polinaSay.y} tx={S3.polinaCoach.x + 22} ty={S3.polinaCoach.y - 30} text="Всё съехало на день!" color={theme.risk} />
      </g>
      <g opacity={notListed}>
        <Pill x={S3.notListed.x} y={S3.notListed.y} text="такого в списке не было" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>

      {/* места справа — пунктиром, пока там пусто */}
      <g opacity={1 - appear(frame, b(4) + 4, 8)}>
        <Slot x={S3.bisectSlot.x} y={S3.bisectSlot.y} w={S3.bisectSlot.w} h={S3.bisectSlot.h} text="какой коммит сломал?" />
      </g>
      <g opacity={1 - appear(frame, b(5) + 4, 8)}>
        <Slot x={S3.kseniaSlot.x} y={S3.kseniaSlot.y} w={S3.kseniaSlot.w} h={S3.kseniaSlot.h} text="а главная беда?" />
      </g>

      {/* поиск делением пополам приводит к этому коммиту */}
      <g opacity={bisectLabel}>
        <Label x={BS.x - 16} y={BS.y - 34} anchor="start" size={18} weight={700} color={theme.soft}>
          поиск делением пополам
        </Label>
        <line x1={BS.x} y1={BS.y} x2={BS.x + 4 * BS.dx + 10} y2={BS.y} stroke={theme.grid} strokeWidth={3} />
      </g>
      {goodAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <circle cx={BS.x + i * BS.dx} cy={BS.y} r={14} fill={theme.okTint} stroke={theme.ok} strokeWidth={3} />
        </g>
      ))}
      <g opacity={appear(frame, badAt, 8)}>
        <circle cx={BS.x + 4 * BS.dx + 10} cy={BS.y} r={18} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
      </g>
      <g opacity={thisOne}>
        <Label x={BS.x + 4 * BS.dx + 40} y={BS.y + 7} anchor="start" size={20} weight={700} color={theme.risk}>
          этот коммит
        </Label>
      </g>

      {/* у Ксении снова ошибка — главная беда осталась */}
      <Coach x={S3.ksenia.x} y={S3.ksenia.y} scale={0.5} label="Ксения" color={theme.ink} enterAt={b(5) + 6} pose={ksenia[0]} mood={ksenia[1]} />
      <g opacity={kseniaSay}>
        <Callout x={S3.kseniaSay.x} y={S3.kseniaSay.y} tx={S3.ksenia.x - 20} ty={S3.ksenia.y - 30} text="Снова не сохранилась!" color={theme.risk} />
      </g>
      <g opacity={stayed}>
        <Pill x={S3.stayed.x} y={S3.stayed.y} text="главная беда осталась" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <g opacity={twoBack}>
        <Pill x={S3.twoBack.x} y={S3.twoBack.y} text="шаг вперёд — два назад" color={theme.alt} fill={theme.altTint} size={18} compact />
      </g>
    </KitScene>
  )
}
