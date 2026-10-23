import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { ANNA_WEEK, LOG_H, KOSTYA_LB, KOSTYA_RECORD, REPORT3_H, ru, RULES, S3, toKg, volumeOf } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's3-empty'
const L = S3.log
const R = S3.report
const RU = S3.rules
const P = S3.patch

// числа сцены — из данных и расчётов layout.ts
const DEMO_WEEK = ANNA_WEEK.reduce((sum, d) => sum + volumeOf(d.sets), 0)
const KOSTYA_KG = ru(toKg(KOSTYA_LB, 'lb'))
const rowTop = (i: number) => L.y + L.head + i * L.row
const R1 = R.y + R.head
const R2 = R1 + R.rows[0]
// тесты по правилам: сначала красные, после правки кода агентом — зелёные (строки не длиннее 40 знаков)
const NAMES = ['пустой вес не сохраняется', `${KOSTYA_LB} фунтов ≈ ${KOSTYA_KG} кг`, 'подтягивания без кг']
const RED: TermLine[] = [{ text: 'npm test', kind: 'cmd' }, ...NAMES.map((n): TermLine => ({ text: `FAIL ${n}`, kind: 'err' })), { text: '0 passed, 3 failed', kind: 'err' }]
const GREEN: TermLine[] = [{ text: 'npm test', kind: 'cmd' }, ...NAMES.map((n): TermLine => ({ text: `PASS ${n}`, kind: 'ok' })), { text: '3 passed, 0 failed', kind: 'ok' }]

/** Пустое поле веса — пунктирный квадрат. */
function EmptyBox({ x, y, color }: { x: number; y: number; color: string }) {
  return <rect x={x} y={y} width={64} height={36} rx={8} fill={theme.white} stroke={color} strokeWidth={3} strokeDasharray="7 5" />
}

// Сцена 3 (подводный камень): в демо всё сходится, а в зале — пустой вес (NaN и объём NaN кг),
// фунты без единицы (ложный рекорд 135 кг, на деле ≈ 61,2 кг) и подтягивания без веса.
// Доска 2: правила решает человек, тесты до кода, агент правит код до зелёного, заплатка «NaN → 0» — нет.
export function S3Empty() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: записи из зала и отчёт
  const log = useAppear(b(0) + 8)
  const report = useAppear(b(0) + 24)
  const demo = useAppear(b(0) + 50)
  const live = appear(frame, b(2) + 88, 10)
  const rowAt = [b(1) + 10, b(3) + 10, b(5) + 10]
  // Анна: пустой вес → NaN → объём недели NaN кг
  const nan = useAppear(b(1) + 130)
  const nanMath = useAppear(b(2) + 10)
  const toR1 = appear(frame, b(2) + 60, 16)
  const broken1 = appear(frame, b(2) + 88, 10)
  // Костя: фунты → «135 кг» → ложный рекорд
  const lb = useAppear(b(3) + 44)
  const fake = useAppear(b(3) + 150)
  const toR2 = appear(frame, b(4) + 6, 16)
  const broken2 = appear(frame, b(4) + 26, 10)
  const real = useAppear(b(4) + 100)
  const truth = useAppear(b(4) + 130)
  // подтягивания: пустое поле = «свой вес»
  const own = useAppear(b(5) + 90)
  const notForgot = useAppear(b(5) + 100)

  // доска 2: правила, тесты, агент, заплатка
  const rules = useAppear(b(6) + 30)
  const ruleAt = [b(6) + 66, b(6) + 112, b(6) + 156]
  const red = frame >= b(7) + 10 && frame < b(7) + 124
  const redOut = 1 - appear(frame, b(7) + 116, 8)
  const fixing = useAppear(b(7) + 86)
  const greenOn = frame >= b(7) + 120
  const patchSlot = appear(frame, b(6) + 30, 12) * (1 - appear(frame, b(8) + 6, 8))
  const patch = useAppear(b(8) + 6)
  const stamp = useAppear(b(8) + 70)
  const hidden = useAppear(b(8) + 100)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'worried']],
    [b(2) + 60, ['stand', 'worried']],
  ])
  const kostya = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 60, ['point', 'neutral']],
    [b(4) + 30, ['think', 'worried']],
    [b(5) + 20, ['cheer', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 60, ['stand', 'happy']],
    [b(2) + 96, ['surprised', 'worried']],
    [b(3) + 40, ['think', 'worried']],
    [b(4) + 30, ['surprised', 'worried']],
    [b(5) + 20, ['think', 'neutral']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(7) + 70, 'working'],
    [b(7) + 120, 'done'],
    [b(8) + 70, 'idle'],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень: пустые поля и единицы" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что вписали в зале: места строк пунктиром, записи — по репликам */}
      <g opacity={log}>
        <Card x={L.x} y={L.y} w={L.w} h={LOG_H} stroke={theme.ink} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 36} anchor="start" size={22} weight={800}>
            Что вписали в зале
          </Label>
          <line x1={L.x + 16} y1={L.y + L.head} x2={L.x + L.w - 16} y2={L.y + L.head} stroke={theme.grid} strokeWidth={2} />
          {[1, 2].map((i) => (
            <line key={i} x1={L.x + 16} y1={rowTop(i)} x2={L.x + L.w - 16} y2={rowTop(i)} stroke={theme.grid} strokeWidth={1.5} />
          ))}
        </Card>
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={log * (1 - appear(frame, rowAt[i], 8))}>
          <Slot x={L.x + 16} y={rowTop(i) + 10} w={L.w - 32} h={L.row - 20} color={theme.grid} />
        </g>
      ))}

      {/* Анна: пустой вес */}
      <g opacity={appear(frame, rowAt[0], 10)}>
        <Label x={L.x + 24} y={rowTop(0) + 30} anchor="start" size={20} color={theme.soft} weight={600}>
          Анна · присед
        </Label>
        <Label x={L.x + 24} y={rowTop(0) + 68} anchor="start" size={26} weight={700}>
          5 ×
        </Label>
        <EmptyBox x={L.x + 82} y={rowTop(0) + 42} color={theme.risk} />
        <Label x={L.x + 160} y={rowTop(0) + 68} anchor="start" size={26} weight={700}>
          кг
        </Label>
      </g>
      <g opacity={nan}>
        <Label x={L.x + L.w - 24} y={rowTop(0) + 38} anchor="end" size={28} color={theme.risk} weight={800}>
          NaN
        </Label>
      </g>
      <g opacity={nanMath}>
        <Mono x={L.x + L.w - 186} y={rowTop(0) + 72} fill={theme.risk}>
          5 × NaN = NaN
        </Mono>
      </g>

      {/* Костя: 135 в зале с фунтами */}
      <g opacity={appear(frame, rowAt[1], 10)}>
        <Label x={L.x + 24} y={rowTop(1) + 30} anchor="start" size={20} color={theme.soft} weight={600}>
          Костя · жим
        </Label>
        <Label x={L.x + 24} y={rowTop(1) + 68} anchor="start" size={26} weight={700}>
          {`5 × ${KOSTYA_LB}`}
        </Label>
      </g>
      <g opacity={lb}>
        <Pill x={L.x + 196} y={rowTop(1) + 59} text="фунты" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <g opacity={fake}>
        <Label x={L.x + L.w - 24} y={rowTop(1) + 38} anchor="end" size={26} color={theme.risk} weight={800}>
          {`${KOSTYA_LB} кг?`}
        </Label>
      </g>
      <g opacity={real}>
        <Label x={L.x + L.w - 24} y={rowTop(1) + 72} anchor="end" size={20} color={theme.ok} weight={700}>
          {`${KOSTYA_LB} фунтов ≈ ${KOSTYA_KG} кг`}
        </Label>
      </g>

      {/* Костя: подтягивания без веса */}
      <g opacity={appear(frame, rowAt[2], 10)}>
        <Label x={L.x + 24} y={rowTop(2) + 30} anchor="start" size={20} color={theme.soft} weight={600}>
          Костя · подтягивания
        </Label>
        <Label x={L.x + 24} y={rowTop(2) + 68} anchor="start" size={26} weight={700}>
          8 ×
        </Label>
        <EmptyBox x={L.x + 82} y={rowTop(2) + 42} color={theme.alt} />
        <Label x={L.x + 160} y={rowTop(2) + 68} anchor="start" size={26} weight={700}>
          кг
        </Label>
      </g>
      <g opacity={own}>
        <Label x={L.x + L.w - 24} y={rowTop(2) + 38} anchor="end" size={26} color={theme.alt} weight={800}>
          свой вес
        </Label>
      </g>
      <g opacity={notForgot}>
        <Label x={L.x + L.w - 24} y={rowTop(2) + 72} anchor="end" size={20} color={theme.soft} weight={600}>
          а не «забыл вписать»
        </Label>
      </g>

      {/* отчёт для Марины: в демо всё сходится, на живых данных — ломается */}
      <g opacity={report}>
        <Card x={R.x} y={R.y} w={R.w} h={REPORT3_H} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 40} anchor="start" size={24} weight={800}>
            Отчёт для Марины
          </Label>
          <line x1={R.x + 16} y1={R1} x2={R.x + R.w - 16} y2={R1} stroke={theme.grid} strokeWidth={2} />
          <line x1={R.x + 16} y1={R2} x2={R.x + R.w - 16} y2={R2} stroke={theme.grid} strokeWidth={1.5} />
          <Label x={R.x + 24} y={R1 + 32} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · объём недели
          </Label>
          <Label x={R.x + 24} y={R2 + 32} anchor="start" size={20} color={theme.soft} weight={600}>
            Костя · рекорд в жиме
          </Label>
        </Card>
      </g>
      <g opacity={demo * (1 - live)}>
        <Pill x={R.x + R.w - 92} y={R.y + 32} w={150} text="демо" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={live}>
        <Pill x={R.x + R.w - 92} y={R.y + 32} w={150} text="живые данные" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      {/* строка Анны: 2202,5 кг ✓ → NaN кг ✗ */}
      <g opacity={demo * (1 - broken1)}>
        <Label x={R.x + 24} y={R1 + 72} anchor="start" size={30} color={theme.ok} weight={800}>
          {`${ru(DEMO_WEEK)} кг`}
        </Label>
        <Mark x={R.x + R.w - 44} y={R1 + 56} ok r={16} />
      </g>
      <g opacity={broken1}>
        <Label x={R.x + 24} y={R1 + 72} anchor="start" size={30} color={theme.risk} weight={800}>
          NaN кг
        </Label>
        <Mark x={R.x + R.w - 44} y={R1 + 56} ok={false} r={16} />
      </g>
      {/* строка Кости: 62,5 кг ✓ → 135 кг ✗, на деле ≈ 61,2 кг */}
      <g opacity={demo * (1 - broken2)}>
        <Label x={R.x + 24} y={R2 + 70} anchor="start" size={30} color={theme.ok} weight={800}>
          {`${ru(KOSTYA_RECORD)} кг`}
        </Label>
        <Mark x={R.x + R.w - 44} y={R2 + 54} ok r={16} />
      </g>
      <g opacity={broken2}>
        <Label x={R.x + 24} y={R2 + 70} anchor="start" size={30} color={theme.risk} weight={800}>
          {`${KOSTYA_LB} кг`}
        </Label>
        <Pill x={R.x + 250} y={R2 + 60} text="новый рекорд?" color={theme.risk} fill={theme.riskTint} size={18} compact />
        <Mark x={R.x + R.w - 44} y={R2 + 54} ok={false} r={16} />
      </g>
      <g opacity={truth}>
        <Label x={R.x + 24} y={R2 + 104} anchor="start" size={20} color={theme.ok} weight={700}>
          {`на деле ≈ ${KOSTYA_KG} кг < ${ru(KOSTYA_RECORD)} — рекорда нет`}
        </Label>
      </g>
      <Arrow x1={L.x + L.w + 6} y1={rowTop(0) + 40} x2={R.x - 8} y2={R1 + 52} color={theme.risk} draw={toR1} />
      <Arrow x1={L.x + L.w + 6} y1={rowTop(1) + 40} x2={R.x - 8} y2={R2 + 52} color={theme.risk} draw={toR2} />
      <Coach x={S3.marina.x} y={S3.marina.y} scale={0.6} label="Марина" enterAt={b(0) + 30} pose={marina[0]} mood={marina[1]} />
      {/* кто что вписал: Анна — на своей записи, Костя — на своих */}
      <Client x={S3.anna.x} y={S3.anna.y} scale={0.55} label="Анна" enterAt={b(1) + 10} pose={anna[0]} mood={anna[1]} />
      <Client x={S3.kostya.x} y={S3.kostya.y} scale={0.55} label="Костя" enterAt={b(3) + 10} pose={kostya[0]} mood={kostya[1]} />

      {/* доска 2: правила решаете вы */}
      <g opacity={1 - rules}>
        <Slot x={RU.x} y={RU.y} w={RU.w} h={RU.head + RULES.length * RU.row + 12} />
      </g>
      <g opacity={rules}>
        <Card x={RU.x} y={RU.y} w={RU.w} h={RU.head + RULES.length * RU.row + 12} stroke={theme.accent} fill={theme.white}>
          <Label x={RU.x + 24} y={RU.y + 40} anchor="start" size={24} weight={800}>
            Правила расчёта
          </Label>
          <line x1={RU.x + 16} y1={RU.y + RU.head - 4} x2={RU.x + RU.w - 16} y2={RU.y + RU.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
        <Pill x={RU.x + RU.w - 100} y={RU.y + 32} w={164} text="решаете вы" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {RULES.map((r, i) => {
        const y = RU.y + RU.head + i * RU.row
        return (
          <g key={r} opacity={appear(frame, ruleAt[i], 12)}>
            <circle cx={RU.x + 40} cy={y + RU.row / 2} r={17} fill={theme.accent} />
            <Label x={RU.x + 40} y={y + RU.row / 2 + 7} size={20} color={theme.white} weight={800}>
              {String(i + 1)}
            </Label>
            <Label x={RU.x + 72} y={y + RU.row / 2 + 8} anchor="start" size={22} weight={600}>
              {r}
            </Label>
          </g>
        )
      })}

      {/* тесты до кода: красные → агент правит код → зелёные */}
      <g opacity={appear(frame, b(6) + 30, 12) * (1 - appear(frame, b(7) + 10, 6))}>
        <Slot x={S3.term.x} y={S3.term.y} w={S3.term.w} h={232} />
      </g>
      {red && (
        <g opacity={redOut}>
          <Terminal x={S3.term.x} y={S3.term.y} w={S3.term.w} at={b(7) + 10} lines={RED} />
        </g>
      )}
      {greenOn && <Terminal x={S3.term.x} y={S3.term.y} w={S3.term.w} at={b(7) + 120} lines={GREEN} />}
      <g opacity={fixing}>
        <Pill x={S3.agent.x} y={S3.term.y + 270} text="правит код, тест — нет" color={theme.alt} fill={theme.white} size={20} compact />
      </g>
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.65} enterAt={b(6) + 60} pose={agent} />

      {/* заплатка «NaN → 0» прячет ошибку */}
      <g opacity={patchSlot}>
        <Slot x={P.x} y={P.y} w={P.w} h={P.h} />
      </g>
      <g opacity={patch}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.risk} fill={theme.white}>
          <Label x={P.x + 24} y={P.y + 38} anchor="start" size={22} color={theme.risk} weight={800}>
            Заплатка: NaN → 0
          </Label>
          <Mono x={P.x + 24} y={P.y + 78} fill={theme.ink}>
            if (isNaN(volume)) volume = 0
          </Mono>
        </Card>
      </g>
      <g opacity={stamp}>
        <Mark x={P.x + P.w - 50} y={P.y + 56} ok={false} r={24} />
      </g>
      <g opacity={hidden}>
        <Label x={P.x + 24} y={P.y + 112} anchor="start" size={20} color={theme.soft} weight={600}>
          ошибка спрятана, а пустой вес остался
        </Label>
      </g>
    </KitScene>
  )
}
