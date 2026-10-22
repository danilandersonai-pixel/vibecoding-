import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mono } from '../../kit/screens/Window'
import { Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BUILT, BUILT_Y, DOMAIN, HEROES_Y, IDEA, MILESTONES, PATH, PLAN, PLAN_CARD, PLAN_H, SITE, TEST_CARD, WEEKS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Flag, MiniPhone, Padlock, Shield } from './parts'

const ID = 's4-next'
const P = PLAN_CARD
const T = TEST_CARD
const FIRST = MILESTONES[0].x
const LAST = MILESTONES[MILESTONES.length - 1].x

// ширины плашек «что построено» и их центры: ряд по центру кадра, зазор 12
const BUILT_W = BUILT.map((t) => Math.round(t.length * 18 * 0.56 + 28))
const BUILT_TOTAL = BUILT_W.reduce((s, w) => s + w, 0) + (BUILT.length - 1) * 12
const builtX = (i: number) => 640 - BUILT_TOTAL / 2 + BUILT_W.slice(0, i).reduce((s, w) => s + w + 12, 0) + BUILT_W[i] / 2

// герои курса: тренеры, их подопечные и вы
const HEROES = [
  { name: 'Марина', x: 100, kind: 'coach', color: theme.accent },
  { name: 'Анна', x: 220, kind: 'client', color: theme.ok },
  { name: 'Дима', x: 340, kind: 'coach', color: theme.alt },
  { name: 'Олег', x: 460, kind: 'client', color: theme.alt },
  { name: 'Вы', x: 580, kind: 'you', color: theme.soft },
] as const

// Сцена 4 (итог курса): от идеи в двух абзацах (день 1) до приложения на своём домене (день 21); что построено
// за три недели; план развития на месяц (пример: отложенные отзывы, забота по расписанию, одна область —
// агенту, s76); итоговый тест курса и удачного запуска.
export function S4Next() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // путь 21 дня рисуется слева направо, пока камера крупно
  const drawFrom = b(0) + 20
  const drawLen = 130
  const tip = interpolate(frame, [drawFrom, drawFrom + drawLen], [FIRST, LAST], CLAMP)
  const reachAt = (x: number) => drawFrom + Math.round(((x - FIRST) / (LAST - FIRST)) * drawLen)
  const flag = appear(frame, reachAt(LAST) + 6, 10)
  const idea = appear(frame, b(0) + 14, 12)
  const site = appear(frame, reachAt(LAST) + 2, 12)

  // место «что построено» — сразу (видно и крупно); план и герои — когда камера отъехала (b(1) + 24), тест — с реплики 3
  const builtPlace = appear(frame, b(0) + 10, 12)
  const places = appear(frame, b(1) + 26, 12)
  const builtAt = [b(1) + 30, b(1) + 48, b(1) + 70, b(1) + 88, b(1) + 100, b(1) + 112, b(1) + 136]
  const builtSlot = 1 - appear(frame, b(1) + 26, 8)
  const plan = appear(frame, b(2) + 16, 12)
  const planAt = PLAN.map((_, i) => b(2) + 30 + i * 18)
  const test = appear(frame, b(3) + 10, 12)
  const bannerRoom = appear(frame, b(3) + 124, 10)
  const banner = appear(frame, b(3) + 140, 14)

  const pose = (i: number) =>
    stepAt<[Pose, Mood]>(frame, [
      [0, ['stand', 'happy']],
      [b(2) + 4 + i * 6, [i === HEROES.length - 1 ? 'point' : 'think', 'neutral']],
      [b(3) + 56 + i * 4, ['cheer', 'happy']],
    ])

  return (
    <KitScene chip="4 / 4 · Итог курса" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* путь 21 дня: от идеи до запуска */}
      <line x1={FIRST} y1={PATH.y} x2={LAST} y2={PATH.y} stroke={theme.grid} strokeWidth={6} strokeLinecap="round" opacity={appear(frame, b(0), 10)} />
      {frame >= drawFrom && <line x1={FIRST} y1={PATH.y} x2={tip} y2={PATH.y} stroke={theme.accent} strokeWidth={6} strokeLinecap="round" />}
      {MILESTONES.map((m, i) => {
        const on = appear(frame, reachAt(m.x), 8)
        const last = i === MILESTONES.length - 1
        return (
          <g key={m.day} opacity={i === 0 ? appear(frame, b(0) + 6, 10) : on}>
            <circle cx={m.x} cy={PATH.y} r={14} fill={last ? theme.ok : theme.accent} />
            <circle cx={m.x} cy={PATH.y} r={5} fill={theme.white} />
            <Label x={m.x} y={PATH.label} size={20} weight={800} color={last ? theme.ok : theme.ink}>
              {m.day}
            </Label>
            <Label x={m.x} y={PATH.sub} size={18} color={theme.soft}>
              {m.sub}
            </Label>
          </g>
        )
      })}
      {WEEKS.map((w, i) => {
        const mid = (MILESTONES[i].x + MILESTONES[i + 1].x) / 2
        return (
          <g key={w} opacity={appear(frame, reachAt(mid), 10)}>
            <Label x={mid} y={PATH.week} size={18} weight={600} color={theme.soft}>
              {w}
            </Label>
          </g>
        )
      })}

      {/* над началом пути — идея в двух абзацах, над концом — свой адрес */}
      <g opacity={idea}>
        <Card x={IDEA.x} y={IDEA.y} w={IDEA.w} h={IDEA.h} stroke={theme.accent} fill={theme.white}>
          {[0, 1].map((p) =>
            [0, 1].map((k) => <rect key={`${p}${k}`} x={IDEA.x + 14} y={IDEA.y + 12 + p * 20 + k * 8} width={IDEA.w - 28 - k * 22} height={5} rx={2.5} fill={theme.accent} opacity={0.5} />),
          )}
        </Card>
      </g>
      {/* телефон и щит уступают место «Удачного запуска!» в самом конце */}
      <g opacity={appear(frame, reachAt(MILESTONES[1].x) + 2, 10) * (1 - bannerRoom)}>
        <MiniPhone x={MILESTONES[1].x - 18} y={IDEA.y} w={36} h={58} />
      </g>
      <g opacity={appear(frame, reachAt(MILESTONES[2].x) + 2, 10) * (1 - bannerRoom)}>
        <Shield x={MILESTONES[2].x} y={IDEA.y + IDEA.h / 2} />
      </g>
      <g opacity={site}>
        <Card x={SITE.x} y={SITE.y} w={SITE.w} h={SITE.h} stroke={theme.ok} fill={theme.white}>
          <Padlock x={SITE.x + 20} y={SITE.y + SITE.h / 2 - 2} />
          <Mono x={SITE.x + 36} y={SITE.y + SITE.h / 2 + 6} size={18} fill={theme.ink}>
            {DOMAIN}
          </Mono>
        </Card>
      </g>
      <g opacity={flag}>
        <Flag x={SITE.x + SITE.w + 4} y={PATH.y - 8} />
      </g>

      {/* что построено за три недели: место — заранее */}
      <g opacity={builtPlace * builtSlot}>
        <Slot x={640 - BUILT_TOTAL / 2} y={BUILT_Y - 18} w={BUILT_TOTAL} h={36} r={18} text="что построено" />
      </g>
      {BUILT.map((t, i) => (
        <g key={t} opacity={appear(frame, builtAt[i], 10)}>
          <Pill x={builtX(i)} y={BUILT_Y} w={BUILT_W[i]} text={t} color={theme.accent} fill={theme.accentTint} size={18} compact />
        </g>
      ))}

      {/* итоговый тест курса — с последней реплики: место коротко, затем карточка */}
      <g opacity={appear(frame, b(3), 6) * (1 - test)}>
        <Slot x={T.x} y={T.y} w={T.w} h={T.h} r={14} text="итоговый тест курса" />
      </g>
      <g opacity={test}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={T.x + T.w / 2} y={T.y + 40} size={22} weight={800} color={theme.accent}>
            Итоговый тест курса →
          </Label>
        </Card>
      </g>

      {/* герои курса */}
      {HEROES.map((h, i) => {
        const [p, m] = pose(i)
        const at = b(1) + 32 + i * 8
        if (h.kind === 'coach') return <Coach key={h.name} x={h.x} y={HEROES_Y} scale={0.6} label={h.name} color={h.color} enterAt={at} pose={p} mood={m} />
        if (h.kind === 'client') return <Client key={h.name} x={h.x} y={HEROES_Y} scale={0.6} label={h.name} color={h.color} enterAt={at} pose={p} mood={m} />
        return (
          <Actor key={h.name} x={h.x} y={HEROES_Y} scale={0.6} label={h.name} enterAt={at}>
            <Person color={h.color} pose={p} mood={m} />
          </Actor>
        )
      })}

      {/* план развития на месяц */}
      <g opacity={places * (1 - plan)}>
        <Slot x={P.x} y={P.y} w={P.w} h={PLAN_H} r={14} text="план на месяц" />
      </g>
      <g opacity={plan}>
        <Card x={P.x} y={P.y} w={P.w} h={PLAN_H} stroke={theme.ok} fill={theme.white}>
          <Label x={P.x + 24} y={P.y + 38} anchor="start" size={22} weight={800}>
            План на месяц
          </Label>
          <line x1={P.x + 14} y1={P.y + P.head - 4} x2={P.x + P.w - 14} y2={P.y + P.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {PLAN.map((t, i) => {
        const cy = P.y + P.head + P.row / 2 + i * P.row
        return (
          <g key={t} opacity={appear(frame, planAt[i], 6)}>
            <circle cx={P.x + 32} cy={cy} r={6} fill={i < 2 ? theme.accent : i < 4 ? theme.ok : theme.alt} />
            <Label x={P.x + 50} y={cy + 7} anchor="start" size={20}>
              {typed(t, frame, planAt[i], 40)}
            </Label>
          </g>
        )
      })}

      {/* удачного запуска! */}
      <g opacity={banner} transform={`translate(0 ${(1 - banner) * 12})`}>
        <Label x={640} y={100} size={34} weight={800} color={theme.ok}>
          Удачного запуска!
        </Label>
      </g>
    </KitScene>
  )
}
