import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { MISSED_WEEK, ru, S4, TESTS, TESTS_H, volumeOf } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { DayBars, Slot, TestRow, type TestState } from './parts'

const ID = 's4-check'
const T = S4.tests
const R = S4.report
const E = S4.empty

// числа сцены — из данных и расчётов layout.ts
const DONE = MISSED_WEEK.filter((d) => d.sets.length > 0)
const VOLUME = DONE.reduce((sum, d) => sum + volumeOf(d.sets), 0)
const COL = R.x + 376
const rowY = (i: number) => T.y + T.head + i * T.row + T.row / 2

// Сцена 4 (проверьте у себя): агент пишет тесты на расчёт по правилам; обычный случай, пустой вес,
// подтягивания, фунты и «52,5»; сломать нарочно — тесты краснеют. Отчёт за неделю с пропуском:
// 2 из 3 тренировок, 1440 кг, без NaN; неделя без тренировок — «тренировок не было».
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // тесты: строки сразу, отметки — по репликам
  const card = useAppear(b(0) + 6)
  const rowIn = TESTS.map((_, i) => b(0) + 20 + i * 8)
  const passAt = [b(1) + 50, b(2) + 24, b(2) + 60, b(2) + 96, b(2) + 132, b(3) + 150]
  // сломали нарочно: на время поломки первые пять тестов красные
  const broken = frame >= b(3) + 40 && frame < b(3) + 130
  const breakTag = appear(frame, b(3) + 30, 8) * (1 - appear(frame, b(3) + 130, 8))
  const rules = appear(frame, b(0) + 120, 10) * (1 - breakTag)
  const state = (i: number): TestState => {
    if (i < 5 && broken) return 'fail'
    return frame >= passAt[i] ? 'pass' : 'wait'
  }
  const ask = appear(frame, b(0) + 40, 10) * (1 - appear(frame, b(4) - 30, 10))
  const agentOut = 1 - appear(frame, b(4) - 20, 12)

  // отчёт за неделю с пропуском: место пунктиром, карточка — по реплике
  const slot = appear(frame, b(4) - 10, 12) * (1 - appear(frame, b(4) + 20, 8))
  const report = useAppear(b(4) + 20)
  const dayAt = [b(4) + 34, b(4) + 46, b(4) + 58]
  const barsAt = b(4) + 76
  const count = useAppear(b(5) + 20)
  const volume = useAppear(b(5) + 60)
  const noNan = useAppear(b(5) + 100)
  const emptySlot = appear(frame, b(4) + 20, 12) * (1 - appear(frame, b(6) + 70, 8))
  const empty = useAppear(b(6) + 70)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 40, 'working'],
    [b(2) + 140, 'done'],
    [b(3) + 40, 'working'],
    [b(3) + 130, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 80, ['think', 'neutral']],
    [b(5) + 30, ['stand', 'happy']],
    [b(6) + 110, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* тесты на расчёт */}
      <g opacity={card}>
        <Card x={T.x} y={T.y} w={T.w} h={TESTS_H} stroke={theme.ink} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 40} anchor="start" size={24} weight={800}>
            Тесты на расчёт
          </Label>
          <line x1={T.x + 16} y1={T.y + T.head - 6} x2={T.x + T.w - 16} y2={T.y + T.head - 6} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      <g opacity={rules}>
        <Pill x={T.x + T.w - 104} y={T.y + 32} w={176} text="по правилам" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={breakTag}>
        <Pill x={T.x + T.w - 104} y={T.y + 32} w={176} text="сломали код" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      {TESTS.map((t, i) => (
        <g key={t} opacity={appear(frame, rowIn[i], 10)}>
          <TestRow x={T.x + 42} y={rowY(i)} text={t} state={state(i)} />
        </g>
      ))}

      {/* агент пишет тесты, пока отчёта ещё нет */}
      <g opacity={agentOut}>
        <Agent x={S4.agent.x} y={S4.agent.y} scale={0.65} enterAt={b(0) + 20} pose={agent} />
      </g>
      <g opacity={ask}>
        <Callout x={S4.agent.x} y={S4.agent.y - 132} tx={S4.agent.x} ty={S4.agent.y - 66} text="пишу тесты по правилам" color={theme.accent} />
      </g>

      {/* отчёт за неделю с пропуском */}
      <g opacity={slot}>
        <Slot x={R.x} y={R.y} w={R.w} h={R.h} />
      </g>
      <g opacity={report}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 40} anchor="start" size={22} weight={800}>
            Отчёт · неделя с пропуском
          </Label>
          <Label x={R.x + 24} y={R.y + 70} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · присед
          </Label>
          <line x1={R.x + 16} y1={R.y + 86} x2={R.x + R.w - 16} y2={R.y + 86} stroke={theme.grid} strokeWidth={2} />
          <line x1={COL - 20} y1={R.y + 104} x2={COL - 20} y2={R.y + R.h - 20} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {/* места итогов — пунктиром, пока их нет */}
      <g opacity={report * (1 - count)}>
        <Slot x={COL - 6} y={R.y + 104} w={R.x + R.w - COL - 10} h={196} />
      </g>
      {MISSED_WEEK.map((d, i) => {
        const x = R.x + 40 + i * 92
        const y = R.y + 120
        const missed = d.sets.length === 0
        return (
          <g key={d.day} opacity={appear(frame, dayAt[i], 8)}>
            {missed ? <circle cx={x} cy={y} r={13} fill="none" stroke={theme.risk} strokeWidth={2.5} strokeDasharray="5 4" /> : <Mark x={x} y={y} ok r={13} />}
            <Label x={x + 20} y={y + 8} anchor="start" size={20} color={missed ? theme.risk : theme.ink} weight={700}>
              {d.day}
            </Label>
          </g>
        )
      })}
      {frame >= barsAt - 2 && <DayBars x={S4.bars.x} y={S4.bars.y} w={S4.bars.w} h={S4.bars.h} days={MISSED_WEEK.map((d) => ({ day: d.day, value: d.sets.length > 0 ? volumeOf(d.sets) : null }))} at={barsAt} top={800} />}
      <g opacity={count}>
        <Label x={COL} y={R.y + 128} anchor="start" size={26} color={theme.ok} weight={800}>
          {`${DONE.length} из ${MISSED_WEEK.length}`}
        </Label>
      </g>
      <g opacity={volume}>
        <Label x={COL} y={R.y + 184} anchor="start" size={20} color={theme.soft} weight={600}>
          Объём
        </Label>
        <Label x={COL} y={R.y + 226} anchor="start" size={32} color={theme.accent} weight={800}>
          {`${ru(VOLUME)} кг`}
        </Label>
      </g>
      <g opacity={noNan}>
        <Mark x={COL + 12} y={R.y + 274} ok r={13} />
        <Label x={COL + 34} y={R.y + 281} anchor="start" size={20} color={theme.ok} weight={700}>
          NaN нет
        </Label>
      </g>

      {/* неделя без тренировок: понятный отчёт, а не ошибка */}
      <g opacity={emptySlot}>
        <Slot x={E.x} y={E.y} w={E.w} h={E.h} />
      </g>
      <g opacity={empty}>
        <Card x={E.x} y={E.y} w={E.w} h={E.h} stroke={theme.ok} fill={theme.white}>
          <Label x={E.x + 22} y={E.y + 40} anchor="start" size={20} color={theme.soft} weight={600}>
            Пустая неделя:
          </Label>
          <Label x={E.x + 188} y={E.y + 40} anchor="start" size={22} color={theme.ok} weight={800}>
            «тренировок не было»
          </Label>
        </Card>
      </g>
      <Coach x={S4.marina.x} y={S4.marina.y} scale={0.55} label="Марина" enterAt={b(4) + 40} pose={marina[0]} mood={marina[1]} />
    </KitScene>
  )
}
