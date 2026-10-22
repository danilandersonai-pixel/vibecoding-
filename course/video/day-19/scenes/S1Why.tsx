import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Callout, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { FIRST_FEW, GRID_SLOT, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Dude, Flag } from './parts'

const ID = 's1-why'
const G = S1.grid
const F = S1.fresh

// Сцена 1 (короткое вступление, только зачем): Марина и Дима привыкли к приложению; новый тренер увидит
// его впервые — узнать, что непонятно, до запуска; сначала немногие, потом все (канареечный релиз, s55).
export function S1Why() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // Марина и Дима: давно с приложением, знают на память
  const since = appear(frame, b(0) + 40, 12)
  const know = appear(frame, b(0) + 104, 12)

  // новый тренер и запуск: места — когда камера отъехала
  const slot = appear(frame, b(1) + 30, 12)
  const askAt = [b(1) + 50, b(1) + 62, b(1) + 74]
  const fresh = appear(frame, b(1) + 86, 12)
  const launch = appear(frame, b(1) + 150, 12)

  // сначала немногие, потом все
  const slotText = 1 - appear(frame, b(2), 8)
  const popAt = (i: number) => b(2) + 4 + i * 2
  const few = appear(frame, b(2) + 50, 12)
  const fewPill = appear(frame, b(2) + 60, 12)
  const canary = appear(frame, b(2) + 80, 12)
  const restAt = (i: number) => b(2) + 110 + i
  const arrow = appear(frame, b(2) + 116, 14)
  const allPill = appear(frame, b(2) + 132, 12)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 40, ['point', 'happy']],
    [b(0) + 104, ['stand', 'happy']],
    [b(1) + 30, ['stand', 'neutral']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 104, ['cheer', 'happy']],
    [b(1) + 10, ['stand', 'happy']],
  ])
  const newbie = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 50, ['surprised', 'worried']],
    [b(1) + 110, ['think', 'worried']],
    [b(2) + 160, ['point', 'neutral']],
  ])

  return (
    <KitScene chip="1 / 4 · Зачем" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* Марина и Дима: с первой версии, знают, где что */}
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.8} label="Марина" color={theme.accent} enterAt={b(0) + 2} pose={marina[0]} mood={marina[1]} />
      <Coach x={S1.dima.x} y={S1.dima.y} scale={0.8} label="Дима" color={theme.alt} enterAt={b(0) + 12} pose={dima[0]} mood={dima[1]} />
      <g opacity={since}>
        <Pill x={(S1.marina.x + S1.dima.x) / 2} y={206} text="с первой версии" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
      <g opacity={know}>
        <Callout x={430} y={142} tx={S1.dima.x + 6} ty={S1.dima.y - 70} text="Где что — знаю" color={theme.alt} />
      </g>

      {/* новый тренер: видит впервые, вопросы */}
      <Coach x={F.x} y={F.y} scale={0.8} label="Новый тренер" color={theme.ink} enterAt={b(1) + 28} pose={newbie[0]} mood={newbie[1]} />
      {askAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <Label x={F.x - 56 + i * 56} y={i === 1 ? 226 : 244} size={34} weight={800} color={theme.risk}>
            ?
          </Label>
        </g>
      ))}
      <g opacity={fresh}>
        <Pill x={F.x} y={174} text="видит впервые" color={theme.ink} fill={theme.white} size={20} compact />
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
          как канареечный релиз · глава 8
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
