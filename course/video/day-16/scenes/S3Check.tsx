import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { editorHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { CODE, EMPTY_WEEK, S3, TESTS, TESTS_H, weekAverage } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CheckRow, Padlock, WeekBars } from './parts'

const ID = 's3-check'
const T = S3.tests
const W = S3.week
const K = S3.lock
const E = S3.code

// места тестов до их реплики: что за случай
const KINDS = ['обычный случай', 'странный ввод: запятая', 'странный ввод: кДж', 'итоги совпадают', 'пустой ввод', 'чужой тренер']
// числа сцены — из данных и расчётов layout.ts
const DAYS_WITH = EMPTY_WEEK.filter((d) => d.kcal !== null).length
const AVG = Math.round(weekAverage(EMPTY_WEEK, 'kcal') ?? 0)
const AVG_ZERO = Math.round(EMPTY_WEEK.reduce((s, d) => s + (d.kcal ?? 0), 0) / EMPTY_WEEK.length)
const rowY = (i: number) => T.y + T.head + i * T.row + T.row / 2

// Сцена 3 (проверьте у себя): агент пишет тесты на расчёт по правилам, до кода — обычный случай,
// странный ввод («52,5» и кДж), совпадение итогов, пустой день, чужой тренер. Справа сначала код
// текущего теста и агент, потом неделя с пустым четвергом (среднее по шести дням) и вход как Дима (день 4).
export function S3Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  const card = appear(frame, b(0) + 10, 12)
  const rules = useAppear(b(0) + 130)
  const testAt = [b(1) + 10, b(2) + 10, b(3) + 10, b(4) + 10, b(5) + 40, b(6) + 30]
  const passAt = [b(1) + 60, b(2) + 80, b(3) + 80, b(4) + 80, b(5) + 150, b(6) + 140]
  const allGreen = useAppear(b(7) + 4)

  // справа на репликах 1–5: код текущего теста и агент; уходят перед неделей
  const rightOut = 1 - appear(frame, b(5) - 24, 12)
  const say = appear(frame, b(0) + 50, 10)
  const codeSlot = appear(frame, b(0) + 30, 10) * (1 - appear(frame, testAt[0], 8))

  // справа потом: неделя с пустым днём и вход как Дима
  const weekSlot = appear(frame, b(5) - 10, 10)
  const week = appear(frame, b(5) + 20, 12)
  const barsAt = b(5) + 40
  const avg = useAppear(b(5) + 140)
  const zero = useAppear(b(5) + 165)
  const lock = appear(frame, b(6) + 20, 12)
  const oleg = useAppear(b(6) + 80)
  const anna = useAppear(b(6) + 130)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 40, 'working'],
    [passAt[0], 'done'],
    [testAt[1], 'working'],
    [passAt[1], 'done'],
    [testAt[2], 'working'],
    [passAt[2], 'done'],
    [testAt[3], 'working'],
    [passAt[3], 'done'],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(6) + 110, ['stand', 'neutral']],
    [b(7) + 20, ['stand', 'happy']],
  ])

  return (
    <KitScene chip="3 / 3 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* тесты на расчёт: по правилам и до кода */}
      <g opacity={card}>
        <Card x={T.x} y={T.y} w={T.w} h={TESTS_H} stroke={theme.ink} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 40} anchor="start" size={24} weight={800}>
            Тесты на расчёт
          </Label>
          <line x1={T.x + 16} y1={T.y + T.head} x2={T.x + T.w - 16} y2={T.y + T.head} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      <g opacity={rules * (1 - allGreen)}>
        <Pill x={T.x + T.w - 139} y={T.y + 32} w={230} text="по правилам, до кода" color={theme.accent} fill={theme.accentTint} compact />
      </g>
      <g opacity={allGreen}>
        <Pill x={T.x + T.w - 139} y={T.y + 32} w={230} text={`${TESTS.length} из ${TESTS.length} зелёные`} color={theme.ok} fill={theme.okTint} compact />
      </g>
      {TESTS.map((t, i) => {
        const on = appear(frame, testAt[i], 10)
        return (
          <g key={t.text}>
            <g opacity={card * (1 - on)}>
              <Slot x={T.x + 16} y={rowY(i) - 20} w={T.w - 32} h={40} text={KINDS[i]} />
            </g>
            <g opacity={on}>
              <CheckRow x={T.x + 34} y={rowY(i)} right={T.x + T.w - 24} text={t.text} tag={t.tag} state={frame >= passAt[i] ? 'pass' : 'wait'} />
            </g>
          </g>
        )
      })}

      {/* агент пишет тесты по правилам: справа — код текущего теста */}
      <g opacity={codeSlot}>
        <Slot x={E.x} y={E.y} w={E.w} h={editorHeight(3)} text="код теста" />
      </g>
      <g opacity={rightOut}>
        {CODE.map((lines, i) => {
          const gone = i < CODE.length - 1 ? appear(frame, testAt[i + 1], 8) : 0
          if (frame < testAt[i] || gone >= 1) return null
          return (
            <g key={i} opacity={1 - gone}>
              <Editor x={E.x} y={E.y} w={E.w} at={testAt[i]} file="nutrition.test.ts" lines={lines} highlight={[2]} />
            </g>
          )
        })}
        <Agent x={S3.agent.x} y={S3.agent.y} scale={0.65} enterAt={b(0) + 20} pose={agent} />
        <g opacity={say}>
          <Callout x={S3.say.x} y={S3.say.y} tx={S3.agent.x + 40} ty={S3.agent.y - 36} text="пишу тесты по правилам" color={theme.accent} />
        </g>
      </g>

      {/* неделя с пустым четвергом: «нет записей», среднее — по дням с записями */}
      <g opacity={weekSlot * (1 - week)}>
        <Slot x={W.x} y={W.y} w={W.w} h={W.h} text="неделя с пустым днём" />
      </g>
      <g opacity={week}>
        <Card x={W.x} y={W.y} w={W.w} h={W.h} stroke={theme.accent} fill={theme.white}>
          <Label x={W.x + 24} y={W.y + 38} anchor="start" size={22} weight={800}>
            Неделя с пустым днём
          </Label>
          <Label x={W.x + 24} y={W.y + 64} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · ккал по дням
          </Label>
        </Card>
      </g>
      {frame >= barsAt - 2 && <WeekBars x={S3.bars.x} y={S3.bars.y} w={S3.bars.w} h={S3.bars.h} days={EMPTY_WEEK.map((d) => ({ day: d.day, value: d.kcal }))} at={barsAt} top={S3.bars.top} labelSize={18} />}
      <g opacity={avg}>
        <Label x={W.x + 24} y={W.y + 278} anchor="start" size={22} color={theme.ok} weight={700}>
          {`среднее за ${DAYS_WITH} дней: ${AVG} ккал`}
        </Label>
        <Mark x={W.x + 400} y={W.y + 270} ok r={13} />
      </g>
      <g opacity={zero}>
        <Label x={W.x + 24} y={W.y + 308} anchor="start" size={20} color={theme.risk} weight={600}>
          {`с нулём за четверг — ${AVG_ZERO}`}
        </Label>
        <Mark x={W.x + 400} y={W.y + 301} ok={false} r={13} />
      </g>

      {/* чужой тренер: дневник Олега — да, дневник Анны — нет */}
      <g opacity={(1 - lock) * week}>
        <Slot x={K.x} y={K.y} w={K.w} h={K.h} text="кто видит дневник" />
      </g>
      <g opacity={lock}>
        <Card x={K.x} y={K.y} w={K.w} h={K.h} stroke={theme.alt} fill={theme.white} />
      </g>
      <g opacity={oleg}>
        <Label x={K.x + 24} y={K.y + 36} anchor="start" size={20} weight={600}>
          Дима → дневник Олега
        </Label>
        <Mark x={K.x + 290} y={K.y + 29} ok r={13} />
      </g>
      <g opacity={anna}>
        <Label x={K.x + 24} y={K.y + 72} anchor="start" size={20} color={theme.risk} weight={600}>
          Дима → дневник Анны
        </Label>
        <Mark x={K.x + 290} y={K.y + 65} ok={false} r={13} />
        <Padlock x={K.x + 340} y={K.y + 66} />
      </g>
      <Coach x={S3.dima.x} y={S3.dima.y} scale={0.65} label="Дима" color={theme.alt} enterAt={b(6) + 30} pose={dima[0]} mood={dima[1]} />
    </KitScene>
  )
}
