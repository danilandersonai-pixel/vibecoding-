import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Callout, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { FIRST_FEW, GRID_SLOT, S1, WEEK } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Dude, Flag } from './parts'

const ID = 's1-why'
const G = S1.grid
const C = S1.crowd
const W = S1.week

// Сцена 1 (короткое вступление, только зачем): в день 15 Наташа впервые открыла приложение и растерялась
// на пустом экране — но это один человек; до запуска нужны несколько тренеров со стороны и неделя;
// бета-тест похож на канареечный релиз (s55): сначала немногие, потом все.
export function S1Why() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // Наташа из дня 15: пустой экран и вопрос
  const day15 = appear(frame, b(0) + 20, 12)
  const lost = appear(frame, b(0) + 120, 12)

  // одна → несколько тренеров и неделя; места справа — когда камера отъехала
  const one = appear(frame, b(1) + 30, 12)
  const slot = appear(frame, b(1) + 30, 12)
  const crowdAt = C.x.map((_, i) => b(1) + 60 + i * 10)
  const outside = appear(frame, b(1) + 104, 12)
  const dayAt = WEEK.map((_, i) => b(1) + 150 + i * 6)
  const launch = appear(frame, b(1) + 90, 12)

  // сначала немногие, потом все
  const slotText = 1 - appear(frame, b(2), 8)
  const popAt = (i: number) => b(2) + 4 + i * 2
  const few = appear(frame, b(2) + 50, 12)
  const fewPill = appear(frame, b(2) + 60, 12)
  const canary = appear(frame, b(2) + 30, 12)
  const restAt = (i: number) => b(2) + 110 + i
  const arrow = appear(frame, b(2) + 116, 14)
  const allPill = appear(frame, b(2) + 132, 12)

  const nat = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(0) + 110, ['think', 'worried']],
    [b(1) + 30, ['stand', 'neutral']],
  ])
  const crowd = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(2) + 140, 'cheer'],
  ])

  return (
    <KitScene chip="1 / 4 · Зачем" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* Наташа в день 15: первый вход, пустой экран */}
      <Coach x={S1.nat.x} y={S1.nat.y} scale={0.8} label="Наташа" color={theme.ink} enterAt={b(0) + 2} pose={nat[0]} mood={nat[1]} />
      <Phone x={S1.phone.x} y={S1.phone.y} scale={0.6} enterAt={b(0) + 8}>
        <rect x={-46} y={-80} width={92} height={18} rx={4} fill={theme.accentTint} />
      </Phone>
      <g opacity={day15}>
        <Pill x={S1.nat.x + 170} y={196} text="день 15 · первый вход" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
      <g opacity={lost}>
        <Label x={S1.phone.x} y={S1.phone.y + 14} size={34} weight={800} color={theme.risk}>
          ?
        </Label>
        <Callout x={S1.nat.x} y={120} tx={S1.nat.x + 6} ty={S1.nat.y - 74} text="«А что тут делать?»" color={theme.ink} />
      </g>
      <g opacity={one}>
        <Pill x={S1.nat.x + 40} y={480} text="один человек" color={theme.ink} fill={theme.white} size={20} compact />
      </g>

      {/* нужны несколько тренеров со стороны и целая неделя */}
      {C.x.map((x, i) => (
        <Coach key={x} x={x} y={C.y} scale={0.55} color={theme.line} enterAt={crowdAt[i]} pose={crowd} />
      ))}
      <g opacity={outside}>
        <Pill x={(C.x[0] + C.x[3]) / 2} y={250} text="тренеры со стороны" color={theme.ink} fill={theme.white} size={20} compact />
      </g>
      {WEEK.map((d, i) => {
        const x = W.x + i * (W.size + W.gap)
        const on = appear(frame, dayAt[i], 6)
        return (
          <g key={d} opacity={on}>
            <rect x={x} y={W.y} width={W.size} height={W.size} rx={6} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
            <Label x={x + W.size / 2} y={W.y + 21} size={18} weight={700} color={theme.ok}>
              {d.slice(0, 1)}
            </Label>
          </g>
        )
      })}
      <g opacity={appear(frame, dayAt[6] + 4, 10)}>
        <Label x={(C.x[0] + C.x[3]) / 2} y={W.y + 62} size={18} weight={700} color={theme.ok}>
          целая неделя
        </Label>
      </g>

      {/* запуск — день 21 */}
      <g opacity={launch}>
        <Flag x={S1.launch.x - 104} y={S1.launch.y + 22} />
        <Pill x={S1.launch.x + 40} y={S1.launch.y} text="запуск — день 21" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* первые пользователи: место, затем двадцать условных людей */}
      <g opacity={slot}>
        <Slot x={GRID_SLOT.x} y={GRID_SLOT.y} w={GRID_SLOT.w} h={GRID_SLOT.h} r={14} />
      </g>
      <g opacity={slot * slotText}>
        <Label x={GRID_SLOT.x + GRID_SLOT.w / 2} y={GRID_SLOT.y + GRID_SLOT.h / 2 + 7} size={20} weight={600} color={theme.soft}>
          кто увидит первым
        </Label>
      </g>
      <g opacity={canary}>
        <Label x={GRID_SLOT.x + GRID_SLOT.w / 2} y={GRID_SLOT.y + 30} size={18} weight={700} color={theme.soft}>
          похоже на канареечный релиз · глава 8
        </Label>
      </g>
      {Array.from({ length: G.cols * G.rows }, (_, i) => {
        const col = i % G.cols
        const row = Math.floor(i / G.cols)
        const first = FIRST_FEW.includes(i)
        const lit = first ? few : appear(frame, restAt(i), 10)
        return (
          <g key={i} opacity={appear(frame, popAt(i), 8)}>
            <Dude x={G.x + col * G.dx} y={G.y + row * G.dy} lit={lit} color={first ? theme.alt : theme.accent} />
          </g>
        )
      })}
      <g opacity={fewPill}>
        <Pill x={870} y={530} text="бета-тест: немногие" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Arrow x1={990} y1={530} x2={1040} y2={530} color={theme.line} draw={arrow} />
      <g opacity={allPill}>
        <Pill x={1118} y={530} text="запуск: все" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
    </KitScene>
  )
}
