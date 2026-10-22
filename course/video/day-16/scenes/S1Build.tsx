import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { DIARY_H, dayTotal, diaryCols, diaryRowY, diaryTotalY, OATS, OATS_G, portion, rowKcal, S1, TARGETS, TARGETS_H, TUESDAY, WEEK, weekAverage } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { DiaryCard, Padlock, ValueSlot, WeekBars } from './parts'

const ID = 's1-build'
const T = S1.targets
const D = S1.diary
const L = S1.label
const C = S1.calc
const SUM = S1.summary
const A = S1.access

// четыре цели Марины на день
const GOALS = [
  { name: 'Калории', value: `${TARGETS.kcal} ккал` },
  { name: 'Белки', value: `${TARGETS.protein} г` },
  { name: 'Жиры', value: `${TARGETS.fat} г` },
  { name: 'Углеводы', value: `${TARGETS.carbs} г` },
]
// числа сцены — из данных и расчётов layout.ts
const OATS_KCAL = portion(OATS.kcal, OATS_G)
const ROWS = rowKcal(TUESDAY)
const TOTAL = Math.round(dayTotal(TUESDAY, 'kcal'))
const AVG_KCAL = Math.round(weekAverage(WEEK, 'kcal') ?? 0)
const AVG_PROTEIN = Math.round(weekAverage(WEEK, 'protein') ?? 0)
const COL = diaryCols(D.x, D.w)
const ROW0_Y = diaryRowY(D.y, 0) + 30
const TOTAL_TOP = diaryTotalY(D.y)
const GOAL_Y = S1.bars.y + S1.bars.h - 34 - ((S1.bars.h - 64) * TARGETS.kcal) / S1.bars.top
const MID = A.y + A.h / 2

// Сцена 1 (что строим сегодня): Марина ставит цели КБЖУ, Анна пишет дневник — порцию по этикетке
// считает код, строки складываются в итог; на доске 2 — сводка за неделю для Марины,
// а дневник как данные о здоровье видят только Анна и её тренер.
export function S1Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // места пунктиром и подсветка того, о чём реплика
  const slotAt = [b(0) + 4, b(0) + 14, b(0) + 24, b(0) + 34]
  const glowT = appear(frame, b(0) + 84, 10)
  const glowD = appear(frame, b(0) + 114, 10)
  const toCoach = useAppear(b(0) + 160) * (1 - appear(frame, b(2) - 16, 10))

  // цели Марины
  const targets = appear(frame, b(1) + 20, 12)
  const goalAt = [b(1) + 66, b(1) + 84, b(1) + 102, b(1) + 120]
  const kbzhu = useAppear(b(1) + 158)

  // дневник Анны и этикетка
  const diaryAt = b(2) + 16
  const rowAt = TUESDAY.map((_, i) => b(2) + 70 + i * 14)
  const label = appear(frame, b(2) + 40, 12)
  const per100 = useAppear(b(2) + 165)

  // расчёт порции и перелёт 210 в строку дневника
  const calc = appear(frame, b(3) + 10, 12)
  const result = useAppear(b(3) + 120)
  const fly = trackAt(frame, [
    [b(3) + 150, C.x + 120, C.y + 84],
    [b(3) + 172, COL.kcal - 22, ROW0_Y - 8],
  ])
  const flyOn = frame >= b(3) + 150 && frame < b(3) + 173
  const valueAt = [b(3) + 171, ...TUESDAY.slice(1).map((_, i) => b(4) + 22 + i * 12)]
  const total = useAppear(b(4) + 90)

  // доска 2: сводка и доступ
  const summary = appear(frame, b(5) + 36, 12)
  const barsAt = b(5) + 56
  const goalLine = b(5) + 100
  const avg = useAppear(b(5) + 120)
  const prot = useAppear(b(5) + 140)
  const access = appear(frame, b(6) + 8, 12)
  const health = useAppear(b(6) + 36)
  const who = [appear(frame, b(6) + 90, 10), appear(frame, b(6) + 120, 10), appear(frame, b(6) + 158, 10)]

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 30, ['point', 'neutral']],
    [b(1) + 150, ['stand', 'happy']],
    [b(4) + 100, ['cheer', 'happy']],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 60, ['point', 'neutral']],
    [b(2) + 150, ['think', 'neutral']],
    [b(3) + 150, ['stand', 'happy']],
    [b(4) + 100, ['cheer', 'happy']],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(5) + 150, ['stand', 'happy']],
    [b(6) + 100, ['point', 'happy']],
  ])

  return (
    <KitScene chip="1 / 3 · Цели, дневник, сводка" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* места будущих частей: пунктиром с подписью; подсветка — по словам реплики */}
      {[
        { x: T.x, y: T.y, w: T.w, h: TARGETS_H, text: 'цели тренера', glow: glowT, gone: targets },
        { x: D.x, y: D.y, w: D.w, h: DIARY_H, text: 'дневник подопечного', glow: glowD, gone: appear(frame, diaryAt, 12) },
        { x: L.x, y: L.y, w: L.w, h: L.h, text: 'этикетка', glow: 0, gone: label },
        { x: C.x, y: C.y, w: C.w, h: C.h, text: 'расчёт порции', glow: 0, gone: calc },
      ].map((s, i) => (
        <g key={s.text} opacity={appear(frame, slotAt[i], 10) * (1 - s.gone)}>
          <Slot x={s.x} y={s.y} w={s.w} h={s.h} text={s.text} />
          <g opacity={s.glow}>
            <Slot x={s.x} y={s.y} w={s.w} h={s.h} color={theme.accent} />
          </g>
        </g>
      ))}
      <g opacity={toCoach}>
        <Pill x={1090} y={440} text="сводка для тренера" color={theme.accent} fill={theme.accentTint} compact />
        <Arrow x1={1200} y1={440} x2={1250} y2={440} color={theme.accent} />
      </g>

      {/* цели Марины на день */}
      <g opacity={targets}>
        <Card x={T.x} y={T.y} w={T.w} h={TARGETS_H} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 36} anchor="start" size={22} weight={800}>
            Цели Анны на день
          </Label>
          <line x1={T.x + 16} y1={T.y + T.head} x2={T.x + T.w - 16} y2={T.y + T.head} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      <g opacity={kbzhu}>
        <Pill x={T.x + T.w - 52} y={T.y + 28} w={68} text="КБЖУ" color={theme.accent} fill={theme.accentTint} compact />
      </g>
      {GOALS.map((g, i) => {
        const y = T.y + T.head + i * T.row + 34
        return (
          <g key={g.name} opacity={appear(frame, goalAt[i], 10)}>
            <Label x={T.x + 24} y={y} anchor="start" size={22} weight={600}>
              {g.name}
            </Label>
            <Label x={T.x + T.w - 24} y={y} anchor="end" size={24} color={theme.accent} weight={800}>
              {g.value}
            </Label>
          </g>
        )
      })}
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.75} label="Марина" enterAt={b(1) + 6} pose={marina[0]} mood={marina[1]} />

      {/* дневник Анны: продукты и граммы; ккал — пунктиром, пока код не посчитал */}
      <DiaryCard x={D.x} y={D.y} w={D.w} at={diaryAt} title="Дневник Анны · вторник" foods={TUESDAY} rowAt={rowAt}>
        {TUESDAY.map((f, i) => {
          const y = diaryRowY(D.y, i) + 30
          const on = appear(frame, valueAt[i], 8)
          return (
            <g key={f.name}>
              <ValueSlot x={COL.kcal} y={y} opacity={appear(frame, rowAt[i], 10) * (1 - on)} />
              <Label x={COL.kcal} y={y} anchor="end" size={22} weight={700} opacity={on}>
                {String(ROWS[i])}
              </Label>
            </g>
          )
        })}
        <g opacity={appear(frame, diaryAt, 12) * (1 - total)}>
          <Slot x={D.x + 16} y={TOTAL_TOP + 8} w={D.w - 32} h={48} text="итог дня" />
        </g>
        <g opacity={total}>
          <line x1={D.x + 16} y1={TOTAL_TOP + 4} x2={D.x + D.w - 16} y2={TOTAL_TOP + 4} stroke={theme.ink} strokeWidth={2.5} />
          <Label x={COL.name} y={TOTAL_TOP + 32} anchor="start" size={22} color={theme.accent} weight={800}>
            Итого
          </Label>
          <Label x={COL.name} y={TOTAL_TOP + 56} anchor="start" size={18} color={theme.soft} weight={600}>
            {`цель ${TARGETS.kcal} ккал`}
          </Label>
          <Label x={COL.kcal} y={TOTAL_TOP + 44} anchor="end" size={26} color={theme.accent} weight={800}>
            {`${TOTAL} ккал`}
          </Label>
        </g>
      </DiaryCard>

      {/* этикетка: значения на 100 г */}
      <g opacity={label}>
        <Card x={L.x} y={L.y} w={L.w} h={L.h} stroke={theme.alt} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 38} anchor="start" size={22} weight={800}>
            Этикетка · овсянка
          </Label>
          <Label x={L.x + 24} y={L.y + 92} anchor="start" size={28} color={theme.alt} weight={800}>
            {`${OATS.kcal} ккал`}
          </Label>
          <Label x={L.x + 24} y={L.y + 132} anchor="start" size={20} color={theme.soft} weight={600}>
            {`Б ${OATS.protein} · Ж ${OATS.fat} · У ${OATS.carbs} г`}
          </Label>
        </Card>
      </g>
      <g opacity={label}>
        <Pill x={L.x + L.w - 74} y={L.y + 82} w={100} text="на 100 г" color={per100 > 0 ? theme.alt : theme.soft} fill={per100 > 0 ? theme.altTint : theme.paper} compact />
      </g>

      {/* расчёт порции: значение на 100 г × граммы / 100 */}
      <g opacity={calc}>
        <Card x={C.x} y={C.y} w={C.w} h={C.h} stroke={theme.accent} fill={theme.white}>
          <Label x={C.x + 24} y={C.y + 40} anchor="start" size={24} weight={700}>
            {typed(`${OATS.kcal} × ${OATS_G} / 100`, frame, b(3) + 40, 24)}
          </Label>
          <Pill x={C.x + C.w - 66} y={C.y + 32} w={88} text="порция" color={theme.accent} fill={theme.accentTint} compact />
          <Label x={C.x + 24} y={C.y + 84} anchor="start" size={26} color={theme.accent} weight={800} opacity={result}>
            {`= ${OATS_KCAL} ккал`}
          </Label>
        </Card>
      </g>
      {flyOn && (
        <Label x={fly.x} y={fly.y} anchor="middle" size={24} color={theme.accent} weight={800}>
          {String(OATS_KCAL)}
        </Label>
      )}
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.75} label="Анна" enterAt={b(2) + 6} pose={anna[0]} mood={anna[1]} />

      {/* доска 2: сводка для Марины за неделю */}
      <g opacity={1 - summary}>
        <Slot x={SUM.x} y={SUM.y} w={SUM.w} h={SUM.h} text="сводка для тренера" />
      </g>
      <g opacity={summary}>
        <Card x={SUM.x} y={SUM.y} w={SUM.w} h={SUM.h} stroke={theme.accent} fill={theme.white}>
          <Label x={SUM.x + 28} y={SUM.y + 44} anchor="start" size={26} weight={800}>
            Сводка для Марины
          </Label>
          <Label x={SUM.x + 28} y={SUM.y + 76} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · неделя · ккал по дням
          </Label>
          <line x1={SUM.x + 16} y1={SUM.y + 96} x2={SUM.x + SUM.w - 16} y2={SUM.y + 96} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {frame >= barsAt - 2 && <WeekBars x={S1.bars.x} y={S1.bars.y} w={S1.bars.w} h={S1.bars.h} days={WEEK.map((d) => ({ day: d.day, value: d.kcal }))} at={barsAt} top={S1.bars.top} goal={TARGETS.kcal} goalAt={goalLine} />}
      <g opacity={appear(frame, goalLine + 10, 10)}>
        <Pill x={S1.goal.x} y={GOAL_Y} w={119} text={`цель ${TARGETS.kcal}`} color={theme.ok} fill={theme.okTint} compact />
      </g>
      <g opacity={avg}>
        <Label x={S1.stats.x} y={250} anchor="start" size={20} color={theme.soft} weight={600}>
          В среднем
        </Label>
        <Label x={S1.stats.x} y={290} anchor="start" size={28} color={theme.accent} weight={800}>
          {`${AVG_KCAL} ккал`}
        </Label>
      </g>
      <g opacity={prot}>
        <Label x={S1.stats.x} y={344} anchor="start" size={20} color={theme.soft} weight={600}>
          Белки в среднем
        </Label>
        <Label x={S1.stats.x} y={384} anchor="start" size={28} weight={800}>
          {`${AVG_PROTEIN} г`}
        </Label>
        <Label x={S1.stats.x} y={414} anchor="start" size={20} color={theme.soft} weight={600}>
          {`цель ${TARGETS.protein} г`}
        </Label>
      </g>
      <Coach x={S1.marina2.x} y={S1.marina2.y} scale={0.8} label="Марина" enterAt={b(5) + 30} pose={marina2[0]} mood={marina2[1]} />

      {/* кто видит дневник: данные о здоровье — только Анна и её тренер */}
      <g opacity={1 - access}>
        <Slot x={A.x} y={A.y} w={A.w} h={A.h} text="кто видит дневник" />
      </g>
      <g opacity={access}>
        <Card x={A.x} y={A.y} w={A.w} h={A.h} stroke={theme.line} fill={theme.white} />
      </g>
      <g opacity={health}>
        <Pill x={A.x + 124} y={MID} w={200} text="данные о здоровье" color={theme.risk} fill={theme.riskTint} compact />
        <Label x={A.x + 244} y={MID + 7} anchor="start" size={20} color={theme.soft} weight={600}>
          видят:
        </Label>
      </g>
      {[
        { name: 'Анна', x: A.x + 340, ok: true },
        { name: 'Марина', x: A.x + 450, ok: true },
        { name: 'Дима', x: A.x + 600, ok: false },
      ].map((p, i) => (
        <g key={p.name} opacity={who[i]}>
          <Mark x={p.x} y={MID} ok={p.ok} r={13} />
          <Label x={p.x + 22} y={MID + 7} anchor="start" size={20} color={p.ok ? theme.ink : theme.risk} weight={700}>
            {p.name}
          </Label>
        </g>
      ))}
      <g opacity={who[2]}>
        <Padlock x={A.x + 720} y={MID} />
      </g>
      <Coach x={S1.dima.x} y={S1.dima.y} scale={0.8} label="Дима" color={theme.alt} enterAt={b(6) + 130} pose="stand" mood="neutral" />
    </KitScene>
  )
}
