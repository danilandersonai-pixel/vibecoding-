import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { dayTotal, diaryCols, diaryRowY, diaryTotalY, OATS, OATS_G, OATS_KJ, rowKcal, rowProtein, RULES, RULES_H, ru, S2, TARGETS, TUESDAY, TUESDAY_KJ, TUESDAY_PER100 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { DiaryCard, Steps, Terms, ValueSlot, type Step } from './parts'

const ID = 's2-units'
const D = S2.diary
const F = S2.form
const P = S2.pack
const K = S2.coach
const R = S2.rules
const TM = S2.terms

// числа сцены — из данных и расчётов layout.ts
const PER100 = rowKcal(TUESDAY_PER100)
const RIGHT = rowKcal(TUESDAY)
const KJ = rowKcal(TUESDAY_KJ)
const SUM_PER100 = PER100.reduce((s, v) => s + v, 0)
const SUM_RIGHT = Math.round(dayTotal(TUESDAY, 'kcal'))
const SUM_KJ = Math.round(dayTotal(TUESDAY_KJ, 'kcal'))
const ROUNDED = rowProtein.map((v) => String(Math.round(v)))
const EXACT = rowProtein.map(ru)
const ROUNDED_SUM = ROUNDED.reduce((s, v) => s + Number(v), 0)
const EXACT_SUM = dayTotal(TUESDAY, 'protein')
const CHANGED = rowProtein.map((v, i) => (Math.round(v) === v ? -1 : i)).filter((i) => i >= 0)
const COL = diaryCols(D.x, D.w)
const TOTAL_TOP = diaryTotalY(D.y)
const FIELD = { x: F.x + 20, y: F.y + 90, w: F.w - 40, h: 62 }

// подсказки внизу средней колонки: текст, цвет, с какого кадра и до какого
type Hint = { text: string; color: string; fill: string; from: number; to: number; w: number }

// Сцена 2 (подводный камень): на доске 1 — единицы: число с этикетки взято как вся порция (1159 вместо 1456),
// потом килоджоули вместо ккал (овсянка 878, день 2124) — сводка Марины врёт; на доске 2 — округление:
// экран Анны округляет строки (110 г, цель выполнена), сводка — точные числа (109,4 → 109, не добрала); правила.
export function S2Units() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: дневник, форма, пачка, сводка Марины
  const diaryAt = b(0) + 10
  const rowAt = TUESDAY.map((_, i) => b(0) + 24 + i * 6)
  const formAt = b(0) + 40
  const packAt = b(0) + 60
  const badAt = TUESDAY.map((_, i) => b(1) + 70 + i * 12)
  const fixAt = TUESDAY.map((_, i) => b(3) + 10 + i * 6)
  const kjAt = b(4) + 46
  const sumBad = b(2) + 40
  const need = appear(frame, b(2) + 120, 10) * (1 - appear(frame, b(3) + 40, 8))
  const fieldBad = appear(frame, b(1) + 20, 10) * (1 - appear(frame, b(3) + 6, 8))
  const fieldFixed = appear(frame, b(3) + 6, 8)
  const fieldKj = appear(frame, b(4) + 36, 8)
  const ring = useAppear(b(3) + 110)
  const fly = trackAt(frame, [
    [b(4) + 10, P.x + 70, P.y + 120],
    [b(4) + 34, F.x + F.w - 70, FIELD.y + 46],
  ])
  const flyOn = frame >= b(4) + 10 && frame < b(4) + 36
  const coachAt = [b(2) + 80, b(3) + 60, b(4) + 80]

  const hints: Hint[] = [
    { text: 'на 100 г или вся порция?', color: theme.risk, fill: theme.riskTint, from: b(1) + 30, to: b(2) + 10, w: 270 },
    { text: 'будто съела по 100 г', color: theme.risk, fill: theme.riskTint, from: b(2) + 20, to: b(3), w: 240 },
    { text: 'поле: ккал на 100 г', color: theme.ok, fill: theme.okTint, from: b(3) + 10, to: b(3) + 100, w: 230 },
    { text: '1464 — это кДж', color: theme.alt, fill: theme.altTint, from: b(3) + 110, to: sceneDuration(ID), w: 190 },
  ]

  // доска 2: белок на двух экранах и правила
  const annaCard = appear(frame, b(5) + 50, 12)
  const annaTerms = TUESDAY.map((_, i) => b(5) + 70 + i * 10)
  const annaResult = useAppear(b(5) + 140)
  const sumCard = appear(frame, b(6) + 10, 12)
  const sumTerms = TUESDAY.map((_, i) => b(6) + 24 + i * 10)
  const sumResult = useAppear(b(6) + 100)
  const hl = useAppear(b(6) + 130)
  const two = appear(frame, b(6) + 150, 10)
  const oneRule = b(9) + 60
  const agreed = appear(frame, oneRule, 10)
  const ask = appear(frame, b(6) + 160, 10) * (1 - appear(frame, b(9) + 80, 10))
  const rules = appear(frame, b(7) + 10, 12)
  const ruleAt = [b(7) + 70, b(8) + 30, b(9) + 30]

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 90, ['think', 'worried']],
    [b(3) + 60, ['stand', 'neutral']],
    [b(4) + 84, ['surprised', 'worried']],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 110, ['surprised', 'worried']],
    [b(6) + 170, ['think', 'worried']],
    [b(7) + 60, ['point', 'neutral']],
    [b(8) + 100, ['think', 'neutral']],
    [b(9) + 100, ['stand', 'happy']],
  ])
  const anna2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 150, ['cheer', 'happy']],
    [b(6) + 120, ['stand', 'happy']],
    [b(8) + 60, ['surprised', 'neutral']],
    [b(8) + 150, ['stand', 'neutral']],
    [b(9) + 80, ['think', 'neutral']],
  ])

  return (
    <KitScene chip="2 / 3 · Подводный камень: единицы и округление" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* дневник Анны: ккал строк меняются — на 100 г вместо порции, верно, кДж у овсянки */}
      <DiaryCard x={D.x} y={D.y} w={D.w} at={diaryAt} title="Дневник Анны · вторник" foods={TUESDAY} rowAt={rowAt}>
        {TUESDAY.map((f, i) => {
          const y = diaryRowY(D.y, i) + 30
          const steps: Step[] = [
            { at: badAt[i], text: String(PER100[i]), color: theme.risk },
            { at: fixAt[i], text: String(RIGHT[i]) },
          ]
          if (i === 0) steps.push({ at: kjAt, text: String(KJ[0]), color: theme.risk })
          return (
            <g key={f.name}>
              <ValueSlot x={COL.kcal} y={y} opacity={appear(frame, rowAt[i], 10) * (1 - appear(frame, badAt[i], 8))} />
              <Steps x={COL.kcal} y={y} steps={steps} />
            </g>
          )
        })}
        <g opacity={appear(frame, diaryAt, 12) * (1 - appear(frame, sumBad, 10))}>
          <Slot x={D.x + 16} y={TOTAL_TOP + 8} w={D.w - 32} h={48} text="итог дня" />
        </g>
        <g opacity={appear(frame, sumBad, 10)}>
          <line x1={D.x + 16} y1={TOTAL_TOP + 4} x2={D.x + D.w - 16} y2={TOTAL_TOP + 4} stroke={theme.ink} strokeWidth={2.5} />
          <Label x={COL.name} y={TOTAL_TOP + 32} anchor="start" size={22} color={theme.accent} weight={800}>
            Итого
          </Label>
          <Label x={COL.name} y={TOTAL_TOP + 56} anchor="start" size={18} color={theme.soft} weight={600}>
            {`цель ${TARGETS.kcal} ккал`}
          </Label>
          <Steps
            x={COL.kcal}
            y={TOTAL_TOP + 44}
            size={26}
            weight={800}
            steps={[
              { at: sumBad, text: `${SUM_PER100} ккал`, color: theme.risk },
              { at: b(3) + 40, text: `${SUM_RIGHT} ккал` },
              { at: kjAt + 20, text: `${SUM_KJ} ккал`, color: theme.risk },
            ]}
          />
        </g>
        <g opacity={need}>
          <Label x={D.x + 296} y={TOTAL_TOP + 44} anchor="end" size={20} color={theme.ok} weight={700}>
            {`нужно ${SUM_RIGHT}`}
          </Label>
        </g>
      </DiaryCard>

      {/* форма Анны: поле «ккал» без единицы → «ккал на 100 г» → в нём кДж */}
      <g opacity={appear(frame, formAt, 12)}>
        <Card x={F.x} y={F.y} w={F.w} h={F.h} stroke={theme.line} fill={theme.white}>
          <Label x={F.x + 24} y={F.y + 38} anchor="start" size={22} weight={800}>
            Форма Анны
          </Label>
          <Label x={F.x + 24} y={F.y + 74} anchor="start" size={20} color={theme.soft} weight={600}>
            {`Овсянка · ${OATS_G} г`}
          </Label>
          <rect x={FIELD.x} y={FIELD.y} width={FIELD.w} height={FIELD.h} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2.5} />
        </Card>
        <rect x={FIELD.x} y={FIELD.y} width={FIELD.w} height={FIELD.h} rx={8} fill="none" stroke={theme.risk} strokeWidth={3} opacity={Math.max(fieldBad, fieldKj)} />
        <rect x={FIELD.x} y={FIELD.y} width={FIELD.w} height={FIELD.h} rx={8} fill="none" stroke={theme.ok} strokeWidth={3} opacity={fieldFixed * (1 - fieldKj)} />
        <Steps x={FIELD.x + 14} y={FIELD.y + 26} size={18} anchor="start" steps={[{ at: formAt, text: 'ккал', color: theme.soft }, { at: b(3) + 6, text: 'ккал на 100 г', color: theme.ok }]} />
        <Steps x={FIELD.x + FIELD.w - 14} y={FIELD.y + 48} size={26} weight={800} steps={[{ at: formAt, text: String(OATS.kcal) }, { at: b(4) + 36, text: String(OATS_KJ), color: theme.risk }]} />
      </g>
      {flyOn && (
        <Label x={fly.x} y={fly.y} size={26} color={theme.risk} weight={800}>
          {String(OATS_KJ)}
        </Label>
      )}

      {/* пачка овсянки: на 100 г — и ккал, и кДж */}
      <g opacity={appear(frame, packAt, 12)}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.alt} fill={theme.white}>
          <Label x={P.x + 24} y={P.y + 38} anchor="start" size={22} weight={800}>
            Пачка овсянки
          </Label>
          <Pill x={P.x + P.w - 74} y={P.y + 80} w={100} text="на 100 г" color={theme.alt} fill={theme.altTint} compact />
          <Label x={P.x + 24} y={P.y + 88} anchor="start" size={24} color={theme.alt} weight={800}>
            {`${OATS.kcal} ккал`}
          </Label>
          <Label x={P.x + 24} y={P.y + 130} anchor="start" size={24} color={theme.soft} weight={800}>
            {`${OATS_KJ} кДж`}
          </Label>
        </Card>
        <rect x={P.x + 12} y={P.y + 102} width={140} height={40} rx={20} fill="none" stroke={theme.risk} strokeWidth={3} opacity={ring} />
      </g>

      {/* сводка Марины: верит дневнику */}
      <g opacity={appear(frame, b(0) + 80, 12)}>
        <Card x={K.x} y={K.y} w={K.w} h={K.h} stroke={theme.accent} fill={theme.white}>
          <Label x={K.x + 24} y={K.y + 38} anchor="start" size={22} weight={800}>
            Сводка Марины
          </Label>
          <Label x={K.x + 24} y={K.y + 66} anchor="start" size={20} color={theme.soft} weight={600}>
            Анна · вторник
          </Label>
        </Card>
        <g opacity={1 - appear(frame, coachAt[0], 10)}>
          <Slot x={K.x + 16} y={K.y + 82} w={K.w - 32} h={80} text="итог дня" />
        </g>
      </g>
      {[
        { at: coachAt[0], until: coachAt[1], value: `${SUM_PER100} ккал`, note: `из ${TARGETS.kcal} · недобор?`, color: theme.risk },
        { at: coachAt[1], until: coachAt[2], value: `${SUM_RIGHT} ккал`, note: `из ${TARGETS.kcal}`, color: theme.ink },
        { at: coachAt[2], until: sceneDuration(ID), value: `${SUM_KJ} ккал`, note: `из ${TARGETS.kcal} · перебор?`, color: theme.risk },
      ].map((s) => (
        <g key={s.value} opacity={appear(frame, s.at, 10) * (1 - appear(frame, s.until, 10))}>
          <Label x={K.x + 24} y={K.y + 118} anchor="start" size={30} color={s.color} weight={800}>
            {s.value}
          </Label>
          <Label x={K.x + 24} y={K.y + 154} anchor="start" size={20} color={s.color} weight={700}>
            {s.note}
          </Label>
        </g>
      ))}
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.75} label="Марина" enterAt={b(0) + 30} pose={marina[0]} mood={marina[1]} />

      {/* подсказки внизу средней колонки */}
      <g opacity={appear(frame, b(0) + 110, 10) * (1 - appear(frame, b(1) + 10, 10))}>
        <Pill x={S2.pills.x[0]} y={S2.pills.y} text="единицы" color={theme.accent} fill={theme.accentTint} compact />
      </g>
      <g opacity={appear(frame, b(0) + 140, 10) * (1 - appear(frame, b(1) + 10, 10))}>
        <Pill x={S2.pills.x[1]} y={S2.pills.y} text="округления" color={theme.accent} fill={theme.accentTint} compact />
      </g>
      {hints.map((h) => (
        <g key={h.text} opacity={appear(frame, h.from, 10) * (1 - appear(frame, h.to, 10))}>
          <Pill x={(S2.pills.x[0] + S2.pills.x[1]) / 2} y={S2.pills.y} w={h.w} text={h.text} color={h.color} fill={h.fill} compact />
        </g>
      ))}

      {/* доска 2: экран Анны округляет строки, сводка Марины — точные числа */}
      <g opacity={1 - annaCard}>
        <Slot x={S2.anna.x} y={S2.anna.y} w={S2.anna.w} h={S2.anna.h} text="экран Анны" />
      </g>
      <g opacity={1 - sumCard}>
        <Slot x={S2.sum.x} y={S2.sum.y} w={S2.sum.w} h={S2.sum.h} text="сводка Марины" />
      </g>
      <g opacity={annaCard}>
        <Card x={S2.anna.x} y={S2.anna.y} w={S2.anna.w} h={S2.anna.h} stroke={theme.ok} fill={theme.white}>
          <Label x={S2.anna.x + 24} y={S2.anna.y + 38} anchor="start" size={22} weight={800}>
            Экран Анны · белки за вторник
          </Label>
        </Card>
      </g>
      <Terms x={S2.anna.x} y={S2.anna.y + TM.y} x0={TM.x0} step={TM.step} terms={frame < oneRule ? ROUNDED : EXACT} at={annaTerms} hl={hl * (1 - agreed)} hlCols={CHANGED} />
      <g opacity={annaResult * (1 - agreed)}>
        <Label x={S2.anna.x + 24} y={S2.anna.y + TM.result} anchor="start" size={24} weight={800}>
          {`= ${ROUNDED_SUM} г`}
        </Label>
        <Mark x={S2.anna.x + 140} y={S2.anna.y + TM.result - 8} ok r={13} />
        <Label x={S2.anna.x + 162} y={S2.anna.y + TM.result} anchor="start" size={20} color={theme.ok} weight={700}>
          цель выполнена
        </Label>
      </g>
      <g opacity={sumCard}>
        <Card x={S2.sum.x} y={S2.sum.y} w={S2.sum.w} h={S2.sum.h} stroke={theme.accent} fill={theme.white}>
          <Label x={S2.sum.x + 24} y={S2.sum.y + 38} anchor="start" size={22} weight={800}>
            Сводка Марины · точные числа
          </Label>
        </Card>
      </g>
      <Terms x={S2.sum.x} y={S2.sum.y + TM.y} x0={TM.x0} step={TM.step} terms={EXACT} at={sumTerms} hl={hl * (1 - agreed)} hlCols={CHANGED} />
      {[
        { y: S2.sum.y, show: sumResult },
        { y: S2.anna.y, show: agreed },
      ].map((r) => (
        <g key={r.y} opacity={r.show}>
          <Label x={S2.sum.x + 24} y={r.y + TM.result} anchor="start" size={24} weight={800}>
            {`= ${ru(EXACT_SUM)} → ${Math.round(EXACT_SUM)} г`}
          </Label>
          <Mark x={S2.sum.x + 240} y={r.y + TM.result - 8} ok={false} r={13} />
          <Label x={S2.sum.x + 262} y={r.y + TM.result} anchor="start" size={20} color={theme.risk} weight={700}>
            не добрала
          </Label>
        </g>
      ))}
      <g opacity={two * (1 - agreed)}>
        <Pill x={S2.twoPill.x} y={S2.twoPill.y} w={340} text="день один — ответа два" color={theme.risk} fill={theme.riskTint} />
      </g>
      <g opacity={agreed}>
        <Pill x={S2.twoPill.x} y={S2.twoPill.y} w={340} text="одно правило — один ответ" color={theme.ok} fill={theme.okTint} />
      </g>

      {/* Марина и Анна: у одной «не добрала», у другой «выполнена» */}
      <Coach x={S2.marina2.x} y={S2.marina2.y} scale={0.75} label="Марина" enterAt={b(5) + 80} pose={marina2[0]} mood={marina2[1]} />
      <Client x={S2.anna2.x} y={S2.anna2.y} scale={0.75} label="Анна" enterAt={b(5) + 60} pose={anna2[0]} mood={anna2[1]} />
      <g opacity={ask}>
        <Callout x={S2.marina2.x} y={112} tx={S2.marina2.x + 4} ty={S2.marina2.y - 62} text="кому верить?" color={theme.accent} />
      </g>

      {/* правила расчёта: решает человек */}
      <g opacity={1 - rules}>
        <Slot x={R.x} y={R.y} w={R.w} h={RULES_H} text="правила расчёта" />
      </g>
      <g opacity={rules}>
        <Card x={R.x} y={R.y} w={R.w} h={RULES_H} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 36} anchor="start" size={22} weight={800}>
            Правила расчёта
          </Label>
          <Pill x={R.x + R.w - 89} y={R.y + 28} w={130} text="решаете вы" color={theme.accent} fill={theme.accentTint} compact />
          <line x1={R.x + 16} y1={R.y + R.head} x2={R.x + R.w - 16} y2={R.y + R.head} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {RULES.map((text, i) => {
        const y = R.y + R.head + i * R.row + 28
        return (
          <g key={text}>
            <g opacity={rules * (1 - appear(frame, ruleAt[i], 10))}>
              <Slot x={R.x + 20} y={y - 27} w={R.w - 40} h={36} r={8} />
            </g>
            <g opacity={appear(frame, ruleAt[i], 10)}>
              <Mark x={R.x + 38} y={y - 7} ok r={13} />
              <Label x={R.x + 62} y={y} anchor="start" size={20} weight={600}>
                {text}
              </Label>
            </g>
          </g>
        )
      })}
    </KitScene>
  )
}
