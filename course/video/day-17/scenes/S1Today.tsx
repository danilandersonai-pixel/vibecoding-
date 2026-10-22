import { useCurrentFrame } from 'remotion'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1, s1CardX, WEIGHT } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Padlock, PhotoThumb, Scales, Someone, Tape } from './parts'

const ID = 's1-today'
const C = S1.cards
const SC = S1.scale

// план дня: три карточки
const CARDS = [
  { title: 'Замеры', sub: 'вес, талия, бёдра' },
  { title: 'Фото прогресса', sub: 'раз в две недели' },
  { title: 'Приватность', sub: 'кто увидит фото' },
]
const fmt = (v: number) => v.toFixed(1).replace('.', ',')

// Сцена 1 (короткое вступление): вес почти стоит, а тело меняется; сегодня — замеры и фото прогресса;
// фото тела — личные данные, поэтому так же важна приватность.
export function S1Today() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // весы: вес по неделям почти не меняется
  const weekAt = WEIGHT.map((_, i) => b(0) + 16 + i * 22)
  const week = stepAt(frame, weekAt.map((at, i) => [at, i] as [number, number]))
  const card = a(b(0) + 6)
  const still = a(b(0) + 110)
  const tape = grow(frame, b(0) + 124, 18)
  const changes = a(b(0) + 145)

  // план дня: места — после отъезда камеры, карточки — по реплике
  const slots = a(b(1) + 2)
  const cardAt = [b(1) + 24, b(1) + 64, b(2) + 12]
  const lockFly = trackAt(frame, [
    [b(2) + 60, s1CardX(2) + 290, C.y + 80],
    [b(2) + 90, s1CardX(1) + 294, C.y + 92],
  ])
  const flying = frame >= b(2) + 60
  const personal = a(b(2) + 100)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 80, ['stand', 'worried']],
    [b(0) + 140, ['stand', 'happy']],
    [b(1) + 30, ['point', 'happy']],
    [b(1) + 110, ['cheer', 'happy']],
    [b(2) + 20, ['think', 'neutral']],
    [b(2) + 130, ['stand', 'happy']],
  ])

  return (
    <KitScene chip="1 / 4 · Зачем замеры и фото" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* план дня: пунктирные места и карточки */}
      {CARDS.map((c, i) => {
        const x = s1CardX(i)
        const on = a(cardAt[i])
        return (
          <g key={c.title}>
            <g opacity={slots * (1 - on)}>
              <Slot x={x} y={C.y} w={C.w} h={C.h} text={i === 2 ? '?' : c.title.toLowerCase()} />
            </g>
            <g opacity={on}>
              <Card x={x} y={C.y} w={C.w} h={C.h} stroke={i === 2 ? theme.ok : theme.line} fill={theme.white}>
                <circle cx={x + 40} cy={C.y + 48} r={22} fill={i === 2 ? theme.ok : theme.accent} />
                <Label x={x + 40} y={C.y + 56} size={22} color={theme.white} weight={800}>
                  {String(i + 1)}
                </Label>
                <Label x={x + 76} y={C.y + 56} anchor="start" size={22} weight={800}>
                  {c.title}
                </Label>
                <Label x={x + 76} y={C.y + 92} anchor="start" size={20} color={theme.soft} weight={600}>
                  {c.sub}
                </Label>
              </Card>
            </g>
          </g>
        )
      })}
      {/* значки карточек: линия замеров идёт вниз, фото-заглушка, замок */}
      <g opacity={a(cardAt[0])}>
        <path d={`M${s1CardX(0) + 272} ${C.y + 40} V${C.y + 120} H${s1CardX(0) + 324}`} fill="none" stroke={theme.line} strokeWidth={3} strokeLinecap="round" />
        <path
          d={`M${s1CardX(0) + 282} ${C.y + 58} L${s1CardX(0) + 296} ${C.y + 70} L${s1CardX(0) + 308} ${C.y + 86} L${s1CardX(0) + 320} ${C.y + 96}`}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - grow(frame, cardAt[0] + 16, 20)}
          fill="none"
          stroke={theme.accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[
          [282, 58],
          [296, 70],
          [308, 86],
          [320, 96],
        ].map(([dx, dy], i) => (
          <circle key={dx} cx={s1CardX(0) + dx} cy={C.y + dy} r={4.5} fill={theme.white} stroke={theme.accent} strokeWidth={3} opacity={grow(frame, cardAt[0] + 16 + i * 6, 4)} />
        ))}
      </g>
      <g opacity={a(cardAt[1] + 10)}>
        <PhotoThumb x={s1CardX(1) + 266} y={C.y + 52} w={56} h={72} />
      </g>
      <g opacity={a(cardAt[2]) * (flying ? 0.35 : 1)}>
        <Padlock x={s1CardX(2) + 290} y={C.y + 80} scale={1.1} />
      </g>
      {flying && <Padlock x={lockFly.x} y={lockFly.y} scale={0.8} />}
      <g opacity={personal}>
        <Pill x={s1CardX(1) + C.w / 2} y={C.y + C.h + 37} text="очень личное" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* вес по неделям: табло весов и карточка */}
      <g opacity={card}>
        <Card x={SC.x} y={SC.y} w={SC.w} h={SC.h} fill={theme.white}>
          <Label x={SC.x + 20} y={SC.y + 36} anchor="start" size={20} color={theme.soft} weight={600}>
            вес
          </Label>
          <Label x={SC.x + SC.w - 20} y={SC.y + 36} anchor="end" size={20} color={theme.soft} weight={600}>
            {`неделя ${week + 1}`}
          </Label>
          <Label x={SC.x + 20} y={SC.y + 92} anchor="start" size={40} weight={800}>
            {`${fmt(WEIGHT[week])} кг`}
          </Label>
        </Card>
      </g>
      <g opacity={still}>
        <Pill x={SC.x + SC.w / 2} y={SC.y + SC.h + 28} text="почти стоит" color={theme.soft} fill={theme.white} size={20} compact />
      </g>

      {/* Анна на весах: лента на талии — тело меняется */}
      <Scales x={S1.anna.x} y={S1.anna.y + 64} value={fmt(WEIGHT[week])} />
      <Someone x={S1.anna.x} y={S1.anna.y} scale={0.9} enterAt={2} color={theme.ok} pose={anna[0]} mood={anna[1]} />
      <Tape x={S1.anna.x} y={S1.anna.y + 22} w={96} draw={tape} />
      <Pill x={S1.anna.x} y={S1.anna.y + 132} text="Анна" color={theme.ok} fill={theme.white} size={20} compact />
      <g opacity={changes}>
        <Pill x={S1.body.x} y={S1.body.y} text="а тело меняется" color={theme.alt} fill={theme.altTint} size={20} compact />
        <Arrow x1={S1.body.x - 104} y1={S1.body.y + 12} x2={S1.anna.x + 62} y2={S1.anna.y + 22} color={theme.alt} draw={changes} />
      </g>
    </KitScene>
  )
}
