import { interpolate, useCurrentFrame } from 'remotion'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow } from '../../kit/reveal'
import { theme } from '../../theme'
import { S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's4-practice'
const G = S4.grid
const BR = S4.bars
const BT = S4.boot
const IT = S4.iter

// опрос Stack Overflow 2026 (s21): доли — как в книге
const BARS = [
  { label: 'работают с ИИ-ассистентами и агентами', value: 0.66, text: '66%', color: theme.accent },
  { label: 'из них — каждый день', value: 0.73, text: '73%', color: theme.accent },
  { label: 'верят, лишь если легко проверить', value: 0.48, text: '48%', color: theme.alt },
  { label: 'доверят ИИ важные решения', value: 0.07, text: '≈ 7%', color: theme.risk },
]
const USERS = 66
// из 66 пользующихся каждый день — 73%, то есть 48 кружков
const DAILY = 48
const ITER_CHIPS = ['подсказки', 'тесты', 'порядок в коде', 'объяснения']
const STEPS = 6
const CHIP = 20
const chipW = (t: string) => Math.round(t.length * CHIP * 0.56 + 28)

// Сцена 4: как разработчики используют ИИ на самом деле (s21): опрос Stack Overflow 2026 — пользуются
// массово, доверяют с оглядкой; ИИ ошибается уверенно, поэтому его перепроверяют. Две схемы работы:
// запуск с нуля (быстрый прототип, который часто переписывают) и итерации в живом проекте.
export function S4Practice() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: опрос
  const title = useAppear(b(0) + 6)
  const count = Math.round(interpolate(frame, [b(0) + 40, b(0) + 90], [0, 30000], CLAMP) / 1000) * 1000
  const sub = useAppear(b(0) + 36)
  const countries = useAppear(b(0) + 110)
  const legend = useAppear(b(0) + 140)
  const dotAt = (i: number) => b(0) + 60 + Math.floor(i / 10) * 6
  const userAt = (i: number) => b(1) + 20 + i * 0.6
  const dailyAt = (i: number) => b(1) + 100 + i * 0.8
  const barAt = [b(1) + 20, b(1) + 96, b(2) + 46, b(2) + 135]
  const verdictAt = [b(3) + 10, b(3) + 50, b(3) + 100, b(3) + 120]

  // доска 2: две схемы
  const boot = useAppear(b(4) + 20)
  const sketch = useAppear(b(4) + 60)
  const toProto = interpolate(frame, [b(4) + 96, b(4) + 116], [0, 1], CLAMP)
  const proto = useAppear(b(4) + 116)
  const hours = useAppear(b(4) + 150)
  const plus = useAppear(b(5) + 20)
  const minus = useAppear(b(5) + 120)
  const rewrite = appear(frame, b(5) + 130, 10)
  const spin = interpolate(frame, [b(5) + 130, b(5) + 190], [0, 360], CLAMP)
  const iter = useAppear(b(6) + 2)
  const chipAt = ITER_CHIPS.map((_, i) => b(6) + 16 + i * 14)
  const stepAtF = Array.from({ length: STEPS }, (_, i) => b(6) + 72 + i * 16)
  const human = useAppear(b(6) + 150)
  const grows = useAppear(b(6) + 180)

  // плашки итераций: два ряда слева направо
  const chips = ITER_CHIPS.map((t, i) => {
    const row = i < 2 ? 0 : 1
    const before = ITER_CHIPS.slice(row * 2, i).reduce((s, x) => s + chipW(x) + 12, 0)
    return { t, x: IT.x + 24 + before + chipW(t) / 2, y: IT.y + 84 + row * 46, at: chipAt[i] }
  })
  // вывод в одну строку: «ускоряет», «ошибается уверенно» → «профи перепроверяют»
  const vw = ['ускоряет', 'ошибается уверенно', 'профи перепроверяют'].map(chipW)
  const arrowX = BR.x + vw[0] + 16 + vw[1] + 8
  const vx = [BR.x + vw[0] / 2, BR.x + vw[0] + 16 + vw[1] / 2, arrowX + 52 + vw[2] / 2]

  return (
    <KitScene chip="4 / 6 · Как работают с ИИ на самом деле" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* опрос: кто, сколько, откуда */}
      <g opacity={title}>
        <Label x={S4.title.x} y={S4.title.y} anchor="start" size={26} weight={800}>
          Опрос Stack Overflow, 2026
        </Label>
      </g>
      <g opacity={sub}>
        <Label x={S4.title.x} y={S4.title.y + 34} anchor="start" size={22} color={theme.soft} weight={600}>
          {`≈ ${count.toLocaleString('ru-RU')} разработчиков`}
        </Label>
      </g>
      <g opacity={countries}>
        <Pill x={S4.title.x + 360} y={S4.title.y + 27} text="169 стран" color={theme.accent} size={20} compact />
      </g>
      <g opacity={legend}>
        <Label x={G.x - 10} y={G.y - 22} anchor="start" size={18} color={theme.soft} weight={600}>
          кружок — 1% опрошенных
        </Label>
      </g>
      {Array.from({ length: 100 }, (_, i) => {
        const cx = G.x + (i % 10) * G.step
        const cy = G.y + Math.floor(i / 10) * G.step
        const user = i < USERS ? appear(frame, userAt(i), 6) : 0
        const daily = i < DAILY ? appear(frame, dailyAt(i), 6) : 0
        return (
          <g key={i} opacity={appear(frame, dotAt(i), 8)}>
            <circle cx={cx} cy={cy} r={10} fill={user > 0.5 ? theme.accent : theme.grid} />
            {daily > 0 && <circle cx={cx} cy={cy} r={4} fill={theme.white} opacity={daily} />}
          </g>
        )
      })}

      {/* столбики опроса */}
      {BARS.map((r, i) => {
        const y = BR.y + i * BR.row
        const g = grow(frame, barAt[i], 26)
        return (
          <g key={r.label} opacity={appear(frame, barAt[i] - 6, 8)}>
            {/* у «каждый день» — значок, как у кружков слева */}
            {i === 1 && (
              <g>
                <circle cx={BR.x + 10} cy={y - 7} r={10} fill={theme.accent} />
                <circle cx={BR.x + 10} cy={y - 7} r={4} fill={theme.white} />
              </g>
            )}
            <Label x={BR.x + (i === 1 ? 28 : 0)} y={y} anchor="start" size={20} weight={600}>
              {r.label}
            </Label>
            <rect x={BR.x} y={y + 12} width={BR.w} height={30} rx={8} fill={theme.codeBg} />
            <rect x={BR.x} y={y + 12} width={Math.max(8, BR.w * r.value * g)} height={30} rx={8} fill={r.color} />
            <Label x={BR.x + Math.max(8, BR.w * r.value * g) + 12} y={y + 36} anchor="start" size={24} color={r.color} weight={800}>
              {r.text}
            </Label>
          </g>
        )
      })}

      {/* ускоряет, но ошибается уверенно → перепроверяют */}
      <g opacity={appear(frame, verdictAt[0])}>
        <Pill x={vx[0]} y={S4.verdict.y} text="ускоряет" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>
      <g opacity={appear(frame, verdictAt[1])}>
        <Pill x={vx[1]} y={S4.verdict.y} text="ошибается уверенно" color={theme.risk} fill={theme.riskTint} size={CHIP} compact />
      </g>
      <Arrow x1={arrowX} y1={S4.verdict.y} x2={arrowX + 44} y2={S4.verdict.y} color={theme.accent} draw={interpolate(frame, [verdictAt[2], verdictAt[2] + 12], [0, 1], CLAMP)} />
      <g opacity={appear(frame, verdictAt[3])}>
        <Pill x={vx[2]} y={S4.verdict.y} text="профи перепроверяют" color={theme.accent} fill={theme.accentTint} size={CHIP} compact />
      </g>

      {/* доска 2: запуск с нуля */}
      <g opacity={boot}>
        <Card x={BT.x} y={BT.y} w={BT.w} h={BT.h} stroke={theme.accent}>
          <Label x={BT.x + 24} y={BT.y + 40} anchor="start" size={24} color={theme.accent} weight={700}>
            Запуск с нуля
          </Label>
          <text x={BT.x + BT.w - 24} y={BT.y + 39} textAnchor="end" fill={theme.soft} style={{ font: `500 18px ${theme.mono}` }}>
            bootstrap
          </text>
        </Card>
      </g>
      <g opacity={sketch}>
        <rect x={BT.x + 40} y={BT.y + 80} width={150} height={180} rx={8} fill={theme.white} stroke={theme.line} strokeWidth={3} />
        <path d={`M${BT.x + 60} ${BT.y + 110} q20 -10 40 0 t40 0 M${BT.x + 60} ${BT.y + 140} q25 10 50 0 t40 0 M${BT.x + 60} ${BT.y + 170} h60 M${BT.x + 60} ${BT.y + 200} q20 -12 40 0 t50 0 M${BT.x + 70} ${BT.y + 232} h40`} fill="none" stroke={theme.soft} strokeWidth={3} strokeLinecap="round" />
        <Label x={BT.x + 115} y={BT.y + 290} size={20} color={theme.soft} weight={600}>
          набросок
        </Label>
      </g>
      <Arrow x1={BT.x + 202} y1={BT.y + 170} x2={BT.x + 304} y2={BT.y + 170} color={theme.accent} draw={toProto} />
      <g opacity={hours}>
        <Pill x={BT.x + 253} y={BT.y + 136} text="за часы" color={theme.accent} size={CHIP} compact />
      </g>
      <g opacity={proto}>
        <g opacity={1 - rewrite * 0.55}>
          <rect x={BT.x + 316} y={BT.y + 80} width={190} height={180} rx={10} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
          <rect x={BT.x + 316} y={BT.y + 80} width={190} height={30} rx={10} fill={theme.accent} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={BT.x + 332} y={BT.y + 126 + k * 32} width={158 - k * 30} height={18} rx={6} fill={theme.grid} />
          ))}
          <rect x={BT.x + 332} y={BT.y + 222} width={90} height={24} rx={8} fill={theme.ok} />
        </g>
        <Label x={BT.x + 411} y={BT.y + 290} size={20} color={theme.soft} weight={600}>
          прототип
        </Label>
      </g>
      <g opacity={rewrite} transform={`rotate(${spin} ${BT.x + 411} ${BT.y + 170})`}>
        <path d={`M${BT.x + 411 + 34} ${BT.y + 170} A34 34 0 1 1 ${BT.x + 411} ${BT.y + 136}`} fill="none" stroke={theme.risk} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${BT.x + 411} ${BT.y + 124} l14 12 l-14 12 Z`} fill={theme.risk} />
      </g>
      <g opacity={plus}>
        <Pill x={BT.x + 24 + chipW('+ идея проверена быстро') / 2} y={BT.y + 330} text="+ идея проверена быстро" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>
      <g opacity={minus}>
        <Pill x={BT.x + 24 + chipW('− прототип часто пишут заново') / 2} y={BT.y + 380} text="− прототип часто пишут заново" color={theme.risk} fill={theme.riskTint} size={CHIP} compact />
      </g>

      {/* доска 2: итерации в живом проекте */}
      <g opacity={iter}>
        <Card x={IT.x} y={IT.y} w={IT.w} h={IT.h} stroke={theme.ok}>
          <Label x={IT.x + 24} y={IT.y + 40} anchor="start" size={24} color={theme.ok} weight={700}>
            Итерации в проекте
          </Label>
        </Card>
      </g>
      {chips.map((c) => (
        <g key={c.t} opacity={appear(frame, c.at)}>
          <Pill x={c.x} y={c.y} text={c.t} color={theme.ok} size={CHIP} compact />
        </g>
      ))}
      {stepAtF.map((at, i) => {
        const h = 24 + i * 24
        const x = IT.x + 40 + i * 78
        const bottom = IT.y + 360
        const g = grow(frame, at, 12)
        return (
          <g key={at} opacity={g > 0 ? 1 : 0}>
            <rect x={x} y={bottom - h * g} width={70} height={h * g} rx={6} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />
            <g opacity={appear(frame, at + 12, 6)}>
              <Mark x={x + 35} y={bottom - h - 18} ok r={12} />
            </g>
          </g>
        )
      })}
      <g opacity={human}>
        <Pill x={IT.x + 170} y={IT.y + 210} text="правку смотрит человек" color={theme.ok} fill={theme.white} size={CHIP} compact />
      </g>
      <g opacity={grows}>
        <Pill x={IT.x + 24 + chipW('+ копится, долга почти нет') / 2} y={IT.y + 400} text="+ копится, долга почти нет" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>
    </KitScene>
  )
}
