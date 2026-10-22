import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANNA_FRIDAY, ANNA_WEEK, recordOf, ru, S2, TABLE_H, volumeOf } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Cup, DayBars, Slot } from './parts'

const ID = 's2-build'
const D = S2.defs
const T = S2.table
const R = S2.report

// два определения: метка и текст
const DEFS = [
  { tag: 'Рекорд', text: 'самый большой вес в упражнении' },
  { tag: 'Объём', text: 'сумма по подходам: повторы × вес' },
]
// варианты агента для рекорда: выбирает человек
const OPTIONS = [
  { text: 'самый большой вес', y: 140 },
  { text: 'больше всего повторов', y: 190 },
]
const OPT_X = 820
const rowY = (i: number) => T.y + T.head + i * T.row
const TOTAL_Y = rowY(ANNA_FRIDAY.length)
const VAL_X = T.x + T.w - 28
// числа сцены — из данных и расчётов layout.ts
const FRIDAY = volumeOf(ANNA_FRIDAY)
const BEFORE = recordOf([...ANNA_WEEK[0].sets, ...ANNA_WEEK[1].sets])
const RECORD = recordOf(ANNA_FRIDAY)
const WEEK = ANNA_WEEK.reduce((sum, d) => sum + volumeOf(d.sets), 0)
const COL = R.x + 520

// Сцена 2 (что строим сегодня): определения словами — ИИ предлагает варианты, выбирает человек;
// пятница Анны: повторы × вес по каждому подходу, объём 690 кг и новый рекорд 55 кг;
// на доске 2 — отчёт для Марины за неделю: тренировки, объём по дням, рекорд.
export function S2Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: варианты агента и определения
  const optAt = [b(0) + 50, b(0) + 74]
  const pick = useAppear(b(0) + 140)
  const fly = trackAt(frame, [
    [b(1) + 6, OPT_X, OPTIONS[0].y],
    [b(1) + 34, D.x + D.tagW + 40 + 120, D.y[0] + D.h / 2],
  ])
  const flyOn = frame >= b(1) + 6 && frame < b(1) + 36
  const optOut = 1 - appear(frame, b(1) + 6, 8)
  const agentOut = 1 - appear(frame, b(3) - 20, 12)
  const slots = useAppear(b(0) + 12)
  const tagAt = [b(1) + 8, b(2) + 6]
  const textAt = [b(1) + 34, b(2) + 14]

  // пятница Анны: строки по очереди, итог — к концу реплики
  const title = useAppear(b(3) + 10)
  const lineAt = [b(3) + 40, b(3) + 66, b(3) + 92]
  const total = useAppear(b(3) + 130)
  const ring = useAppear(b(4) + 4, 8)
  const toCup = appear(frame, b(4) + 12, 18)
  const cup = usePop(b(4) + 20)
  const badge = useAppear(b(4) + 30)
  const before = useAppear(b(4) + 50)

  // доска 2: отчёт за неделю
  const card = useAppear(b(5) + 24)
  const dayAt = [b(5) + 60, b(5) + 70, b(5) + 80]
  const count = useAppear(b(5) + 92)
  const barsAt = b(5) + 100
  const week = useAppear(b(5) + 140)
  const rec = useAppear(b(5) + 170)
  const glow = [appear(frame, b(6) + 6, 10) * (1 - appear(frame, b(6) + 50, 10)), appear(frame, b(6) + 50, 10) * (1 - appear(frame, b(6) + 96, 10)), appear(frame, b(6) + 96, 10) * (1 - appear(frame, b(6) + 140, 10))]
  const happy = useAppear(b(6) + 130)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 30, 'working'],
    [b(0) + 50, 'done'],
    [b(0) + 140, 'idle'],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 60, ['stand', 'happy']],
    [b(4) + 24, ['cheer', 'happy']],
    [b(5), ['stand', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 120, ['think', 'neutral']],
    [b(6) + 10, ['stand', 'happy']],
    [b(6) + 120, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="2 / 4 · Рекорд, объём, отчёт" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* определения: места пунктиром, метка и текст — по реплике */}
      {DEFS.map((d, i) => {
        const y = D.y[i]
        const on = appear(frame, tagAt[i], 10)
        return (
          <g key={d.tag}>
            <g opacity={slots * (1 - on)}>
              <Slot x={D.x} y={y} w={D.w} h={D.h} />
            </g>
            <g opacity={on}>
              <Card x={D.x} y={y} w={D.w} h={D.h} stroke={theme.accent} fill={theme.white} />
              <Pill x={D.x + 20 + D.tagW / 2} y={y + D.h / 2} w={D.tagW} text={d.tag} color={theme.accent} fill={theme.accentTint} size={20} compact />
            </g>
            <Label x={D.x + D.tagW + 40} y={y + D.h / 2 + 8} anchor="start" size={22} weight={700}>
              {typed(d.text, frame, textAt[i], 36)}
            </Label>
          </g>
        )
      })}

      {/* агент предлагает варианты рекорда — выбираете вы */}
      <g opacity={agentOut}>
        {OPTIONS.map((o, i) => (
          <g key={o.text} opacity={appear(frame, optAt[i], 10) * (i === 0 ? optOut : 1 - 0.6 * pick)}>
            <Pill x={OPT_X} y={o.y} text={o.text} color={theme.alt} fill={i === 0 && pick > 0 ? theme.altTint : theme.white} size={20} compact />
          </g>
        ))}
        <g opacity={pick * optOut}>
          <Mark x={OPT_X - 132} y={OPTIONS[0].y} ok r={14} />
        </g>
        <g opacity={pick}>
          <Pill x={OPT_X} y={OPTIONS[1].y + 50} text="выбор за вами" color={theme.accent} fill={theme.accentTint} size={18} compact />
        </g>
        <Agent x={OPT_X} y={336} scale={0.65} enterAt={b(0) + 20} pose={agent} />
      </g>
      {flyOn && <Pill x={fly.x} y={fly.y} text={OPTIONS[0].text} color={theme.alt} fill={theme.altTint} size={20} compact />}

      {/* пятница Анны: повторы × вес по каждому подходу */}
      <g opacity={slots}>
        <Slot x={T.x} y={T.y} w={T.w} h={TABLE_H} />
      </g>
      <g opacity={title}>
        <Card x={T.x} y={T.y} w={T.w} h={TABLE_H} stroke={theme.ink} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 36} anchor="start" size={22} weight={800}>
            Анна · пятница · присед
          </Label>
          <Label x={VAL_X} y={T.y + 36} anchor="end" size={20} color={theme.soft} weight={600}>
            кг
          </Label>
          <line x1={T.x + 16} y1={T.y + T.head} x2={T.x + T.w - 16} y2={T.y + T.head} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {ANNA_FRIDAY.map((s, i) => {
        const y = rowY(i)
        return (
          <g key={i} opacity={appear(frame, lineAt[i], 10)}>
            <Label x={T.x + 24} y={y + 33} anchor="start" size={20} color={theme.soft} weight={600}>
              {`подход ${i + 1}`}
            </Label>
            <Label x={T.x + 150} y={y + 33} anchor="start" size={24} weight={700}>
              {`${s.reps} × ${ru(s.kg)} кг`}
            </Label>
            <Label x={T.x + 360} y={y + 33} size={24} color={theme.soft} weight={700}>
              =
            </Label>
            <Label x={VAL_X} y={y + 33} anchor="end" size={24} weight={700}>
              {ru(s.reps * s.kg)}
            </Label>
          </g>
        )
      })}
      <g opacity={ring}>
        <rect x={T.x + 196} y={rowY(2) + 6} width={92} height={38} rx={19} fill="none" stroke={theme.alt} strokeWidth={3} />
      </g>
      <g opacity={total}>
        <line x1={T.x + 16} y1={TOTAL_Y + 4} x2={T.x + T.w - 16} y2={TOTAL_Y + 4} stroke={theme.ink} strokeWidth={2.5} />
        <Label x={T.x + 24} y={TOTAL_Y + 40} anchor="start" size={24} color={theme.accent} weight={800}>
          Объём
        </Label>
        <Label x={VAL_X} y={TOTAL_Y + 40} anchor="end" size={26} color={theme.accent} weight={800}>
          {`${ru(FRIDAY)} кг`}
        </Label>
      </g>

      {/* новый рекорд: 55 больше прежних 52,5 */}
      <Client x={S2.anna.x} y={S2.anna.y} scale={0.8} label="Анна" enterAt={b(3) + 6} pose={anna[0]} mood={anna[1]} />
      <g opacity={appear(frame, b(3) + 10, 12) * (1 - appear(frame, b(4) + 20, 6))}>
        <circle cx={S2.cup.x} cy={S2.cup.y} r={58} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="9 7" />
      </g>
      <Arrow x1={T.x + T.w + 20} y1={rowY(2) + 25} x2={S2.cup.x - 70} y2={S2.cup.y + 16} color={theme.alt} draw={toCup} />
      {frame >= b(4) + 20 && <Cup x={S2.cup.x} y={S2.cup.y} scale={cup} />}
      <g opacity={badge}>
        <Pill x={S2.record.x} y={S2.record.y} w={270} text={`новый рекорд: ${ru(RECORD)} кг`} color={theme.alt} fill={theme.altTint} size={22} compact />
      </g>
      <g opacity={before}>
        <Label x={S2.record.x} y={S2.record.y + 50} size={20} color={theme.soft} weight={600}>
          {`было ${ru(BEFORE)} кг`}
        </Label>
      </g>

      {/* доска 2: отчёт для Марины за неделю */}
      <g opacity={1 - card}>
        <Slot x={R.x} y={R.y} w={R.w} h={R.h} />
      </g>
      <g opacity={card}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 28} y={R.y + 44} anchor="start" size={26} weight={800}>
            Отчёт для Марины
          </Label>
          <Label x={R.x + 28} y={R.y + 76} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · неделя · присед
          </Label>
          <line x1={R.x + 20} y1={R.y + 96} x2={R.x + R.w - 20} y2={R.y + 96} stroke={theme.grid} strokeWidth={2} />
          <Label x={R.x + 28} y={R.y + 140} anchor="start" size={20} color={theme.soft} weight={600}>
            Тренировки
          </Label>
          <Label x={R.x + 28} y={R.y + 178} anchor="start" size={20} color={theme.soft} weight={600}>
            Объём по дням, кг
          </Label>
          <line x1={COL - 24} y1={R.y + 196} x2={COL - 24} y2={R.y + R.h - 24} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {/* места столбиков и итогов — пунктиром, пока их нет */}
      <g opacity={card * (1 - appear(frame, barsAt, 8))}>
        <Slot x={R.x + 30} y={R.y + 200} w={440} h={200} />
      </g>
      <g opacity={card * (1 - week)}>
        <Slot x={COL - 10} y={R.y + 196} w={248} h={96} />
      </g>
      <g opacity={card * (1 - rec)}>
        <Slot x={COL - 10} y={R.y + 304} w={248} h={110} />
      </g>
      {/* три тренировки: подсветка на последней реплике */}
      <g opacity={glow[0]}>
        <rect x={R.x + 160} y={R.y + 112} width={350} height={42} rx={21} fill={theme.okTint} />
      </g>
      {ANNA_WEEK.map((d, i) => (
        <g key={d.day} opacity={appear(frame, dayAt[i], 8)}>
          <Mark x={R.x + 188 + i * 84} y={R.y + 133} ok r={13} />
          <Label x={R.x + 208 + i * 84} y={R.y + 141} anchor="start" size={20} weight={700}>
            {d.day}
          </Label>
        </g>
      ))}
      <g opacity={count}>
        <Label x={R.x + 452} y={R.y + 142} size={24} color={theme.ok} weight={800}>
          3 из 3
        </Label>
      </g>
      {frame >= barsAt - 2 && <DayBars x={R.x + 30} y={R.y + 186} w={440} h={236} days={ANNA_WEEK.map((d) => ({ day: d.day, value: volumeOf(d.sets) }))} at={barsAt} top={800} />}
      <g opacity={glow[1]}>
        <rect x={COL - 10} y={R.y + 196} width={248} height={96} rx={14} fill={theme.accentTint} />
      </g>
      <g opacity={week}>
        <Label x={COL} y={R.y + 228} anchor="start" size={20} color={theme.soft} weight={600}>
          Объём за неделю
        </Label>
        <Label x={COL} y={R.y + 272} anchor="start" size={32} color={theme.accent} weight={800}>
          {`${ru(WEEK)} кг`}
        </Label>
      </g>
      <g opacity={glow[2]}>
        <rect x={COL - 10} y={R.y + 304} width={248} height={110} rx={14} fill={theme.altTint} />
      </g>
      <g opacity={rec}>
        <Label x={COL} y={R.y + 336} anchor="start" size={20} color={theme.soft} weight={600}>
          Новый рекорд
        </Label>
        <Label x={COL} y={R.y + 372} anchor="start" size={26} color={theme.alt} weight={800}>
          {`присед ${ru(RECORD)} кг`}
        </Label>
        <Label x={COL} y={R.y + 402} anchor="start" size={20} color={theme.soft} weight={600}>
          {`было ${ru(BEFORE)} кг`}
        </Label>
      </g>
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.8} label="Марина" enterAt={b(5) + 30} pose={marina[0]} mood={marina[1]} />
      <g opacity={happy}>
        <Callout x={S2.marina.x} y={S2.marina.y - 170} tx={S2.marina.x + 4} ty={S2.marina.y - 74} text="всё видно сразу" color={theme.accent} />
      </g>
    </KitScene>
  )
}
