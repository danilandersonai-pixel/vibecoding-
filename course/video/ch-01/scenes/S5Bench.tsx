import type { ReactNode } from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { Checklist } from '../../kit/screens/Checklist'
import { theme } from '../../theme'
import { S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-bench'
const B = S5.board
const TR = S5.traps
const PY = S5.pyramid
const MI = S5.mini

// таблица лидеров условного бенчмарка: сначала разные результаты, при насыщении — все около 95%
const LEADERS = [
  { name: 'Модель A', from: 71, to: 95 },
  { name: 'Модель B', from: 64, to: 94 },
  { name: 'Модель C', from: 58, to: 93 },
]
const LEVELS = [
  { title: 'Ваш мини-набор', sub: '5–10 ваших задач', fill: theme.accent, ink: theme.paper },
  { title: 'Независимые замеры', sub: 'Artificial Analysis, Arena, Epoch AI', fill: theme.accentTint, ink: theme.ink },
  { title: 'Анонс производителя', sub: 'карточка, блог, презентация', fill: theme.paper, ink: theme.ink },
]
const MINI = ['форма подхода — тест проходит', 'график веса — как на макете', 'объём 60 × 8 = 480 кг', 'вход: чужих подопечных не видно', 'сложный расчёт нагрузки']
const fmt = (v: number) => String(Math.round(v))

// Ловушка: карточка с номером и заголовком; i — её место в сетке 2 × 3 (по строкам).
function Trap({ i, title, shown, children }: { i: number; title: string; shown: number; children: ReactNode }) {
  const x = TR.x + (i % 2) * TR.dx
  const y = TR.y + Math.floor(i / 2) * TR.dy
  return (
    <g opacity={shown} transform={`translate(${x} ${y + (1 - shown) * 14})`}>
      <Card x={0} y={0} w={TR.w} h={TR.h} stroke={theme.risk} />
      <circle cx={30} cy={32} r={16} fill={theme.risk} />
      <Label x={30} y={39} size={18} color={theme.paper} weight={700}>
        {String(i + 1)}
      </Label>
      <Label x={56} y={40} anchor="start" size={22} weight={700}>
        {title}
      </Label>
      {children}
    </g>
  )
}

// Сцена 5: бенчмарки — единый экзамен, но шесть ловушек при чтении цифр;
// доверие в три уровня, и последнее слово — за мини-набором своих задач.
export function S5Bench() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // таблица лидеров
  const board = useAppear(b(0) + 4)
  const bars = LEADERS.map((_, i) => interpolate(frame, [b(0) + 26 + i * 10, b(0) + 56 + i * 10], [0, 1], CLAMP))
  const doubt = useAppear(b(0) + 105)
  const sat = interpolate(frame, [b(2) + 20, b(2) + 60], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) })
  const noise = useAppear(b(2) + 70)

  // ловушки — по одной на реплику
  const trapIn = [1, 2, 3, 4, 5, 6].map((i) => appear(frame, b(i) + 4))
  const line2 = [1, 2, 3, 4, 5, 6].map((i) => appear(frame, b(i) + 40))
  const knob = interpolate(frame, [b(4) + 50, b(4) + 95], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) })
  const cost = [interpolate(frame, [b(6) + 30, b(6) + 70], [0, 1], CLAMP), interpolate(frame, [b(6) + 60, b(6) + 80], [0, 1], CLAMP)]

  // доска 2: пирамида доверия снизу вверх и мини-набор
  const levelIn = [appear(frame, b(7) + 95), appear(frame, b(7) + 52), appear(frame, b(7) + 12)]
  const trust = useAppear(b(7) + 120)
  const miniTitle = useAppear(b(8))
  const first = useAppear(b(8) + 90)
  const flagship = useAppear(b(8) + 120)

  // ширина пирамиды на высоте y
  const widthAt = (y: number) => 140 + ((PY.w - 140) * (y - PY.y)) / PY.h
  const cx = PY.x + PY.w / 2
  const levelH = PY.h / 3

  return (
    <KitScene chip="5 / 6 · Бенчмарки: каким цифрам верить" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* таблица лидеров: один экзамен для всех моделей */}
      <g opacity={board}>
        <Card x={B.x} y={B.y} w={B.w} h={B.h} />
        <Label x={B.x + 24} y={B.y + 44} anchor="start" size={24} weight={800}>
          Бенчмарк: код
        </Label>
        <Label x={B.x + 24} y={B.y + 74} anchor="start" size={18} color={theme.soft} weight={600}>
          одни задачи для всех моделей, %
        </Label>
        {LEADERS.map((l, i) => {
          const v = l.from + (l.to - l.from) * sat
          const y = B.y + 120 + i * 74
          const w = (B.w - 150) * (v / 100) * bars[i]
          return (
            <g key={l.name}>
              <Label x={B.x + 24} y={y} anchor="start" size={20} weight={700}>
                {l.name}
              </Label>
              <rect x={B.x + 24} y={y + 12} width={w} height={26} rx={6} fill={sat > 0.5 ? theme.alt : theme.accent} />
              <Label x={B.x + 34 + w} y={y + 33} anchor="start" size={20} color={sat > 0.5 ? theme.alt : theme.accent} weight={800} opacity={bars[i] >= 1 ? 1 : 0}>
                {fmt(v)}
              </Label>
            </g>
          )
        })}
        <g opacity={doubt * interpolate(frame, [b(2) + 10, b(2) + 20], [1, 0], CLAMP)}>
          <Pill x={B.x + B.w / 2} y={B.y + B.h - 34} text="как это читать?" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
        <g opacity={noise}>
          <Pill x={B.x + B.w / 2} y={B.y + B.h - 34} text="разница в пару пунктов — шум" color={theme.alt} fill={theme.altTint} size={18} compact />
        </g>
      </g>

      {/* шесть ловушек */}
      <Trap i={0} title="Кто мерил" shown={trapIn[0]}>
        <Label x={20} y={82} anchor="start" size={20} weight={500}>
          в анонсе — тесты,
        </Label>
        <g opacity={line2[0]}>
          <Label x={20} y={110} anchor="start" size={20} weight={500}>
            где модель сильна: это реклама
          </Label>
        </g>
      </Trap>
      <Trap i={1} title="Насыщение" shown={trapIn[1]}>
        <Label x={20} y={82} anchor="start" size={20} weight={500}>
          у лидеров 90% и больше —
        </Label>
        <g opacity={line2[1]}>
          <Label x={20} y={110} anchor="start" size={20} weight={500}>
            тест их уже не различает
          </Label>
        </g>
      </Trap>
      <Trap i={2} title="Загрязнение" shown={trapIn[2]}>
        <Label x={20} y={82} anchor="start" size={20} weight={500}>
          задачи попали в обучение —
        </Label>
        <g opacity={line2[2]}>
          <Label x={20} y={110} anchor="start" size={20} weight={500}>
            модель «видела ответы»
          </Label>
        </g>
      </Trap>
      <Trap i={3} title="Условия замера" shown={trapIn[3]}>
        <Label x={20} y={76} anchor="start" size={18} color={theme.soft} weight={600}>
          Opus 5.5, индекс Artificial Analysis
        </Label>
        <line x1={66} y1={110} x2={196} y2={110} stroke={theme.line} strokeWidth={5} strokeLinecap="round" />
        <Label x={20} y={117} anchor="start" size={18} weight={600}>
          low
        </Label>
        <Label x={214} y={117} anchor="start" size={18} weight={600}>
          max
        </Label>
        <circle cx={66 + 130 * knob} cy={110} r={11} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
        <Label x={340} y={124} anchor="end" size={34} color={theme.accent} weight={800}>
          {fmt(42 + 16 * knob)}
        </Label>
      </Trap>
      <Trap i={4} title="Арена ≠ правильность" shown={trapIn[4]}>
        <Label x={20} y={82} anchor="start" size={20} weight={500}>
          голос за ответ, который
        </Label>
        <g opacity={line2[4]}>
          <Label x={20} y={110} anchor="start" size={20} weight={500}>
            понравился: это вкус
          </Label>
        </g>
      </Trap>
      <Trap i={5} title="Цена результата" shown={trapIn[5]}>
        <rect x={20} y={56} width={234 * cost[0]} height={24} rx={6} fill={theme.risk} />
        <Label x={30} y={74} anchor="start" size={18} color={theme.paper} weight={700} opacity={cost[0] >= 1 ? 1 : 0}>
          Opus 5.5
        </Label>
        <Label x={262} y={75} anchor="start" size={18} color={theme.risk} weight={700} opacity={cost[0] >= 1 ? 1 : 0}>
          260 млн
        </Label>
        <rect x={20} y={88} width={77 * cost[1]} height={24} rx={6} fill={theme.line} />
        <Label x={106} y={107} anchor="start" size={18} color={theme.soft} weight={700} opacity={cost[1] >= 1 ? 1 : 0}>
          85 млн — типичная
        </Label>
        <Label x={20} y={136} anchor="start" size={18} color={theme.soft} weight={500} opacity={cost[1]}>
          токенов на прогон тестов индекса
        </Label>
      </Trap>

      {/* доска 2: три уровня доверия */}
      {LEVELS.map((l, i) => {
        const top = PY.y + i * levelH
        const bot = top + levelH - 8
        const wt = widthAt(top)
        const wb = widthAt(bot)
        return (
          <g key={l.title} opacity={levelIn[i]} transform={`translate(0 ${(1 - levelIn[i]) * -18})`}>
            <path d={`M${cx - wt / 2} ${top} H${cx + wt / 2} L${cx + wb / 2} ${bot} H${cx - wb / 2} Z`} fill={l.fill} stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" />
            <Label x={cx} y={top + levelH / 2 + 2} size={22} color={l.ink} weight={800}>
              {l.title}
            </Label>
            <Label x={cx} y={top + levelH / 2 + 30} size={18} color={l.ink === theme.paper ? theme.paper : theme.soft} weight={600}>
              {l.sub}
            </Label>
          </g>
        )
      })}
      <g opacity={trust}>
        <line x1={PY.x - 10} y1={PY.y + PY.h - 10} x2={PY.x - 10} y2={PY.y + 30} stroke={theme.accent} strokeWidth={4} strokeLinecap="round" />
        <path d={`M${PY.x - 10} ${PY.y + 12} l-10 20 h20 Z`} fill={theme.accent} />
        <Label x={PY.x + 16} y={PY.y + 26} anchor="start" size={20} color={theme.accent} weight={700}>
          больше доверия
        </Label>
      </g>

      {/* мини-набор: задачи проекта тренера с критерием «готово» */}
      <g opacity={miniTitle}>
        <Label x={MI.x} y={MI.y - 14} anchor="start" size={22} weight={800}>
          Мини-набор: задача — критерий «готово»
        </Label>
      </g>
      {frame >= b(8) && <Checklist x={MI.x} y={MI.y} w={MI.w} at={b(8) + 2} items={MINI} done={4} />}
      <g opacity={first}>
        <Pill x={MI.x + 150} y={MI.y + 312} text="4 из 5 — с первой попытки" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={flagship}>
        <Pill x={MI.x + 150} y={MI.y + 362} text="пятую — отдать флагману" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
    </KitScene>
  )
}
