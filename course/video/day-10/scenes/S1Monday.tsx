import { interpolate, useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { JOURNAL, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Cup } from './parts'

const ID = 's1-monday'
const J = S1.journal
const C = S1.cards

// три вещи дня: зачем они Марине и значок (определения — в сцене 2)
const CARDS = [
  { title: 'Рекорды', sub: 'кто вырос', icon: 'cup' },
  { title: 'Объём', sub: 'сколько сделано', icon: 'bars' },
  { title: 'Отчёт', sub: 'неделя за минуту', icon: 'sheet' },
] as const
// видимая часть журнала (ровно J.shown строк) и сколько его прокрутить, чтобы встать на границу строки
const ROWS_TOP = J.y + J.head + 4
const ROWS_H = J.h - J.head - 8
const SCROLL = (JOURNAL.length - J.shown) * J.row
// голова Марины в масштабе 0,85 — сюда указывает реплика
const headY = S1.marina.y - 70

function Icon({ kind, x, y }: { kind: (typeof CARDS)[number]['icon']; x: number; y: number }) {
  if (kind === 'cup') return <Cup x={x} y={y - 6} scale={0.62} />
  if (kind === 'bars') {
    return (
      <g>
        {[18, 30, 24].map((h, i) => (
          <rect key={i} x={x - 26 + i * 18} y={y + 18 - h} width={14} height={h} rx={3} fill={theme.accent} />
        ))}
        <line x1={x - 32} y1={y + 20} x2={x + 30} y2={y + 20} stroke={theme.line} strokeWidth={3} />
      </g>
    )
  }
  return (
    <g>
      <path d={`M${x - 20} ${y - 26} H${x + 10} L${x + 22} ${y - 14} V${y + 26} H${x - 20} Z`} fill={theme.white} stroke={theme.ok} strokeWidth={3.5} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 12} y={y - 10 + i * 11} width={i === 1 ? 18 : 26} height={5} rx={2.5} fill={theme.ok} opacity={0.7} />
      ))}
    </g>
  )
}

// Сцена 1 (вступление): понедельник, Марина листает журнал подходов Анны и Олега — долго.
// Ей нужны три вещи: рекорды, объём и отчёт — только «зачем», без определений и подводного камня.
export function S1Monday() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // журнал: появляется и листается всю первую половину сцены
  const journal = useAppear(b(0) + 8)
  const scroll = interpolate(frame, [b(0) + 40, b(2) - 40], [0, SCROLL], CLAMP)
  const ask = useAppear(b(1) + 96)

  // три вещи дня: места пунктиром — после отъезда камеры, карточки — когда их называют
  const slots = useAppear(b(2) + 2)
  const cardAt = [b(2) + 80, b(2) + 122, b(2) + 160]
  const flow = appear(frame, b(2) + 20, 20)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 50, ['point', 'neutral']],
    [b(1) + 20, ['think', 'worried']],
    [b(2) + 60, ['point', 'happy']],
    [b(2) + 176, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="1 / 4 · Понедельник у тренера" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <defs>
        <clipPath id="d10-journal">
          <rect x={J.x + 3} y={ROWS_TOP} width={J.w - 6} height={ROWS_H} />
        </clipPath>
      </defs>

      {/* журнал подходов за неделю: строк много, листать долго */}
      <g opacity={journal}>
        <Card x={J.x} y={J.y} w={J.w} h={J.h} stroke={theme.line} fill={theme.white}>
          <Label x={J.x + 24} y={J.y + 36} anchor="start" size={22} weight={800}>
            Журнал подходов
          </Label>
          <Label x={J.x + J.w - 24} y={J.y + 36} anchor="end" size={20} color={theme.soft} weight={600}>
            неделя
          </Label>
          <line x1={J.x + 16} y1={J.y + J.head} x2={J.x + J.w - 16} y2={J.y + J.head} stroke={theme.grid} strokeWidth={2} />
        </Card>
        <g clipPath="url(#d10-journal)">
          {JOURNAL.map(([day, text], i) => {
            const y = ROWS_TOP + 6 + i * J.row - scroll
            return (
              <g key={i}>
                <Pill x={J.x + 48} y={y + J.row / 2 - 4} w={52} text={day} color={day === 'Ср' ? theme.alt : day === 'Пт' ? theme.ok : theme.accent} fill={theme.white} size={18} compact />
                <Label x={J.x + 90} y={y + J.row / 2 + 3} anchor="start" size={20} weight={600}>
                  {text}
                </Label>
              </g>
            )
          })}
        </g>
      </g>

      {/* Марина: кто вырос, а кто буксует? */}
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.85} label="Марина" enterAt={4} pose={marina[0]} mood={marina[1]} />
      <g opacity={ask}>
        <Callout x={S1.marina.x + 10} y={236} tx={S1.marina.x + 6} ty={headY - 8} text="кто вырос, а кто буксует?" color={theme.accent} />
      </g>

      {/* три вещи дня */}
      {C.y.map((y, i) => (
        <g key={y} opacity={slots * (1 - appear(frame, cardAt[i], 8))}>
          <Slot x={C.x} y={y} w={C.w} h={C.h} />
        </g>
      ))}
      <Arrow x1={J.x + J.w + 8} y1={C.y[1] + C.h / 2} x2={C.x - 10} y2={C.y[1] + C.h / 2} color={theme.accent} draw={flow} />
      {CARDS.map((c, i) => {
        const y = C.y[i]
        return (
          <g key={c.title} opacity={appear(frame, cardAt[i], 12)}>
            <Card x={C.x} y={y} w={C.w} h={C.h} stroke={theme.accent} fill={theme.white}>
              <Icon kind={c.icon} x={C.x + 54} y={y + C.h / 2} />
              <Label x={C.x + 104} y={y + 44} anchor="start" size={24} weight={800}>
                {c.title}
              </Label>
              <Label x={C.x + 104} y={y + 76} anchor="start" size={20} color={theme.soft} weight={600}>
                {c.sub}
              </Label>
            </Card>
          </g>
        )
      })}
    </KitScene>
  )
}
