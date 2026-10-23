import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { BAR, EDITOR_PAD, LH } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Stars, Wall } from './parts'

const ID = 's4-describe'
const SP = S4.spec
const RV = S4.reviews
const FL = S4.file

// разделы шаблона спецификации (как в книге)
const TEMPLATE = ['Для кого и зачем', 'Чем отличается', 'Сущности', 'Сценарии', 'Правила и крайние случаи', 'Не в первой версии']
const ROW_Y = [218, 270, 322, 374, 426, 478]
const BINS = [
  { title: 'Берём', color: theme.ok, tint: theme.okTint },
  { title: 'Меняем', color: theme.accent, tint: theme.accentTint },
  { title: 'Откладываем', color: theme.soft, tint: theme.zone },
]
// карточки возможностей: корзина, место в ней, текст (вторая строка — если есть), кадр вылета от реплики
type Feature = { bin: number; slot: number; text: string[]; line: number; at: number }
const FEATURES: Feature[] = [
  { bin: 0, slot: 0, text: ['тренировки'], line: 2, at: 10 },
  { bin: 0, slot: 1, text: ['подходы'], line: 2, at: 45 },
  { bin: 0, slot: 2, text: ['история'], line: 2, at: 80 },
  { bin: 1, slot: 0, text: ['тренер видит', 'подходы сразу'], line: 4, at: 10 },
  { bin: 2, slot: 0, text: ['питание'], line: 5, at: 10 },
  { bin: 2, slot: 1, text: ['фото прогресса'], line: 5, at: 40 },
  { bin: 2, slot: 2, text: ['рейтинги'], line: 5, at: 70 },
]
const CARD_W = 196
const SPEC = [
  '# Тренер и подопечный',
  'Для кого: тренер и подопечные',
  'Отличие: тренер видит подходы',
  'Сущности: тренер, подход',
  'Кнопка: «Жми, как в Эталоне А!»',
  'Цвета: как у Эталона А',
  'Не в v1: питание, фото, рейтинги',
]
const FIXED: Record<number, string> = { 4: 'Кнопка: «Сохранить подход»', 5: 'Цвета: свои, см. дизайн' }

// Сцена 4: шаг 3 — спецификация своими словами. Возможности эталона — в три корзины: берём, меняем, откладываем;
// отличие подсказывают жалобы в отзывах; из спецификации вычищают чужое — через стену идёт только она.
export function S4Describe() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  const spec = appear(frame, b(0) + 6)
  const subtitle = appear(frame, b(0) + 70)
  const rowIn = TEMPLATE.map((_, i) => appear(frame, b(0) + 24 + i * 12))
  const tickAt = [b(0) + 100, b(4) + 70, b(2) + 110, b(2) + 125, b(5) + 120, b(5) + 100]
  const binIn = BINS.map((_, i) => appear(frame, b(1) + 10 + i * 20))
  const pile = appear(frame, b(1) + 80) * interpolate(frame, [b(5) + 100, b(5) + 112], [1, 0], CLAMP)
  const reviews = appear(frame, b(3) + 10)
  const reviewRow = [appear(frame, b(3) + 25), appear(frame, b(3) + 55)]
  const top = appear(frame, b(3) + 100)
  // от жалобы — к отличию
  const toBin = interpolate(frame, [b(4) + 80, b(4) + 100], [0, 1], CLAMP)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'worried']],
    [b(3) + 110, ['think', 'worried']],
    [b(4) + 50, ['cheer', 'happy']],
    [b(4) + 110, ['stand', 'happy']],
  ])

  // доска 2: проверка на чужое и стена
  const lens = trackAt(frame, [
    [b(6) + 30, FL.x + 470, FL.y + BAR + EDITOR_PAD + 16],
    [b(6) + 70, FL.x + 470, FL.y + BAR + EDITOR_PAD + 6 * LH + 16],
  ])
  const lensIn = appear(frame, b(6) + 26) * interpolate(frame, [b(6) + 74, b(6) + 82], [1, 0], CLAMP)
  const bad = [appear(frame, b(6) + 46, 6), appear(frame, b(6) + 56, 6)]
  const fixedAt = [b(6) + 78, b(6) + 90]
  const lines = SPEC.map((l, i) => (FIXED[i] && frame >= fixedAt[i - 4] ? FIXED[i] : l))
  const doc = trackAt(frame, [
    [b(6) + 100, FL.x + 300, S4.slotY + 100],
    [b(6) + 118, S4.wall.x - 70, S4.slotY],
    [b(6) + 138, S4.wall.x + S4.wall.w / 2, S4.slotY],
    [b(6) + 156, S4.agent.x - 120, S4.slotY],
  ])
  const docIn = appear(frame, b(6) + 96)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(6) + 156, 'working'],
  ])
  const only = appear(frame, b(6) + 140)

  const binX = (i: number) => S4.bins[i]
  const slotY = (bin: number, slot: number) => S4.binY + 70 + slot * 52 + (bin === 1 ? 10 : 0)

  return (
    <KitScene chip="4 / 7 · Описать своими словами" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* спецификация по шаблону */}
      <g opacity={spec}>
        <Card x={SP.x} y={SP.y} w={SP.w} h={SP.h} stroke={theme.accent} />
        <path d={`M${SP.x + 24} ${SP.y + 22} h22 l10 10 v30 h-32 Z`} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" />
        <Label x={SP.x + 72} y={SP.y + 50} anchor="start" size={26} weight={700}>
          Спецификация
        </Label>
        <g opacity={subtitle}>
          <Label x={SP.x + 24} y={SP.y + 84} anchor="start" size={18} weight={500} color={theme.soft}>
            своими словами, по разбору эталона
          </Label>
        </g>
      </g>
      {TEMPLATE.map((t, i) => {
        const done = appear(frame, tickAt[i], 8)
        const y = ROW_Y[i]
        return (
          <g key={t} opacity={rowIn[i]}>
            <rect x={SP.x + 24} y={y - 20} width={26} height={26} rx={6} fill={theme.okTint} fillOpacity={done} stroke={done > 0 ? theme.ok : theme.line} strokeWidth={3} />
            <path d={`M${SP.x + 29} ${y - 7} l6 6 l11 -12`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - done} fill="none" stroke={theme.ok} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            <Label x={SP.x + 64} y={y} anchor="start" size={22} weight={500}>
              {t}
            </Label>
          </g>
        )
      })}

      {/* отзывы об эталонах: самая частая жалоба — наше отличие */}
      <g opacity={reviews}>
        <Card x={RV.x} y={RV.y} w={RV.w} h={RV.h} stroke={top > 0 ? theme.risk : theme.line} />
        <Label x={RV.x + 20} y={RV.y + 28} anchor="start" size={18} weight={600} color={theme.soft}>
          Отзывы об эталонах
        </Label>
        {[
          { n: 1, text: '«Тренер не видит, что я сделал»' },
          { n: 2, text: '«Тренеру не видно мои подходы»' },
        ].map((r, i) => (
          <g key={r.text} opacity={reviewRow[i]}>
            <Stars x={RV.x + 32} y={RV.y + 56 + i * 36} n={r.n} size={9} />
            <Label x={RV.x + 140} y={RV.y + 63 + i * 36} anchor="start" size={20} weight={500}>
              {r.text}
            </Label>
          </g>
        ))}
        <g opacity={top}>
          <Pill x={RV.x + RV.w - 100} y={RV.y + 74} text="чаще всего" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>

      {/* возможности эталона и три корзины */}
      <g opacity={pile}>
        <Label x={S4.inbox.x} y={S4.inbox.y - 30} size={18} weight={600} color={theme.soft}>
          возможности эталона
        </Label>
        {[8, 4, 0].map((d) => (
          <rect key={d} x={S4.inbox.x - CARD_W / 2 + d} y={S4.inbox.y - 18 + d} width={CARD_W} height={40} rx={10} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
        ))}
      </g>
      {BINS.map((bn, i) => (
        <g key={bn.title} opacity={binIn[i]} transform={`translate(0 ${(1 - binIn[i]) * 16})`}>
          <rect x={binX(i)} y={S4.binY} width={S4.binW} height={S4.binH} rx={16} fill={bn.tint} stroke={bn.color} strokeWidth={3} />
          <Label x={binX(i) + S4.binW / 2} y={S4.binY + 36} size={24} weight={700} color={bn.color}>
            {bn.title}
          </Label>
        </g>
      ))}
      {FEATURES.map((f) => {
        const at = b(f.line) + f.at
        if (frame < at) return null
        const tx = binX(f.bin) + S4.binW / 2
        const ty = slotY(f.bin, f.slot)
        const p = trackAt(frame, [
          [at + 12, S4.inbox.x, S4.inbox.y],
          [at + 32, tx, ty],
        ])
        const h = f.text.length > 1 ? 64 : 40
        const color = BINS[f.bin].color
        return (
          <g key={f.text[0]} opacity={appear(frame, at, 8)}>
            <rect x={p.x - CARD_W / 2} y={p.y - h / 2} width={CARD_W} height={h} rx={10} fill={theme.paper} stroke={color} strokeWidth={2.5} />
            {f.text.map((t, j) => (
              <Label key={t} x={p.x} y={p.y + 7 - (f.text.length - 1) * 12 + j * 24} size={20} weight={600}>
                {t}
              </Label>
            ))}
          </g>
        )
      })}
      <Arrow x1={RV.x + RV.w - 110} y1={RV.y + RV.h + 6} x2={S4.bins[1] + S4.binW - 14} y2={S4.binY - 8} color={theme.risk} dashed draw={toBin} />
      {frame >= b(3) + 60 && <Coach x={S4.marina.x} y={S4.marina.y} scale={0.6} label="Марина" enterAt={b(3) + 60} pose={marina[0]} mood={marina[1]} />}

      {/* доска 2: вычистить чужое — через стену идёт только спецификация */}
      {frame >= b(6) && <Editor x={FL.x} y={FL.y} w={FL.w} at={b(6) + 4} file="spec.md" lines={lines} />}
      {[4, 5].map((n, k) => {
        const y = FL.y + BAR + EDITOR_PAD + n * LH
        const fixed = frame >= fixedAt[k]
        return (
          <g key={n} opacity={bad[k]}>
            <rect x={FL.x + 3} y={y} width={FL.w - 6} height={LH} fill={fixed ? theme.okTint : theme.riskTint} />
            <rect x={FL.x + 3} y={y} width={5} height={LH} fill={fixed ? theme.ok : theme.risk} />
          </g>
        )
      })}
      {lensIn > 0 && (
        <g opacity={lensIn}>
          <circle cx={lens.x} cy={lens.y} r={26} fill={theme.accentTint} stroke={theme.ink} strokeWidth={4} />
          <line x1={lens.x + 19} y1={lens.y + 19} x2={lens.x + 38} y2={lens.y + 38} stroke={theme.ink} strokeWidth={7} strokeLinecap="round" />
        </g>
      )}
      <g opacity={frame >= b(6) ? 1 : 0}>
        <Wall x={S4.wall.x} y={S4.wall.y} w={S4.wall.w} h={S4.wall.h} slotY={S4.slotY} />
        <Label x={S4.wall.x + S4.wall.w / 2} y={S4.wall.y - 8} size={20} weight={700} color={theme.alt}>
          стена
        </Label>
        <Agent x={S4.agent.x} y={S4.agent.y} scale={0.75} pose={agent} />
      </g>
      {frame >= b(6) + 96 && (
        <g opacity={docIn}>
          <Pill x={doc.x} y={doc.y} text="spec.md" color={theme.ok} fill={theme.okTint} size={20} mono compact />
        </g>
      )}
      <g opacity={only}>
        <Label x={S4.agent.x - 40} y={S4.slotY - 60} size={22} weight={700} color={theme.ok}>
          дальше — только она
        </Label>
        <Mark x={S4.agent.x + 102} y={S4.slotY - 67} ok />
      </g>
    </KitScene>
  )
}
