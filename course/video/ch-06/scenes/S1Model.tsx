import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Calendar, House, MiniHouse, Moon } from './parts'

const ID = 's1-model'
const H = S1.house
const P = S1.proto
const W = S1.weeks

// чего в макете нет и что он проверяет
const MISSING = ['трубы', 'проводка', 'фундамент']

// Сцена 1 (метафора): архитектор клеит картонный макет, хозяин двигает стенку за минуту; жить в макете
// нельзя — он проверяет планировку. Прототип — такой же макет: ради ответа, за вечер; его легко спутать с домом.
export function S1Model() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // макет собирается по деталям: пол, задняя стена, боковые, стенка, крыша
  const built = interpolate(frame, [b(0) + 20, b(0) + 120], [0, 6], CLAMP)
  const lift = interpolate(frame, [b(1) + 6, b(1) + 26], [0, 1], CLAMP)
  const wall = interpolate(frame, [b(1) + 86, b(1) + 116], [S1.wallFrom, S1.wallTo], CLAMP)
  const tight = appear(frame, b(1) + 40) * interpolate(frame, [b(1) + 84, b(1) + 92], [1, 0], CLAMP)
  const roomy = appear(frame, b(1) + 116)
  const minute = appear(frame, b(1) + 124)
  const kitchenX = (H.x + wall) / 2

  // чего нет — справа; что проверяет
  const missAt = MISSING.map((_, i) => b(2) + 30 + i * 16)
  const plan = appear(frame, b(2) + 116)

  // доска 2: макет = прототип; ради ответа; недели → вечер; спутать с домом
  const mini = appear(frame, b(3) + 30)
  const same = appear(frame, b(3) + 44)
  const proto = b(3) + 52
  const answer = appear(frame, b(3) + 96)
  const launch = appear(frame, b(3) + 140)
  const strike = interpolate(frame, [b(3) + 150, b(3) + 164], [0, 1], CLAMP)
  const cal = appear(frame, b(4) + 8)
  const flip = interpolate(frame, [b(4) + 20, b(4) + 70], [0, 3], CLAMP)
  const cross = interpolate(frame, [b(4) + 74, b(4) + 86], [0, 1], CLAMP)
  const toMoon = interpolate(frame, [b(4) + 84, b(4) + 100], [0, 1], CLAMP)
  const moon = appear(frame, b(4) + 96)
  const ready = appear(frame, b(5) + 20)
  const sag = interpolate(frame, [b(5) + 64, b(5) + 84], [0, 1], CLAMP)
  const wrong = appear(frame, b(5) + 84)

  const architect = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 14, ['point', 'neutral']],
    [b(0) + 124, ['stand', 'happy']],
    [b(2) + 20, ['think', 'neutral']],
    [b(2) + 116, ['point', 'happy']],
  ])
  const owner = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 30, ['think', 'worried']],
    [b(1) + 118, ['cheer', 'happy']],
    [b(2) + 10, ['stand', 'happy']],
  ])

  return (
    <KitScene chip="1 / 7 · Картонный макет дома" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* стол */}
      <rect x={S1.table.x} y={S1.table.y} width={S1.table.w} height={18} rx={5} fill={theme.desk} />
      <rect x={S1.table.x + 30} y={S1.table.y + 18} width={14} height={40} fill={theme.desk} />
      <rect x={S1.table.x + S1.table.w - 44} y={S1.table.y + 18} width={14} height={40} fill={theme.desk} />

      {/* картонный макет */}
      <House x={H.x} y={H.y} w={H.w} h={H.h} wall={wall} built={built} lift={lift} />
      <g opacity={tight}>
        <Pill x={kitchenX} y={H.y - H.h - 22} text="тесно" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={roomy}>
        <Pill x={kitchenX} y={H.y - H.h - 22} text="в самый раз" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={minute}>
        <Pill x={(wall + H.x + H.w) / 2 + 20} y={H.y - H.h - 22} text="1 минута" color={theme.alt} fill={theme.paper} size={20} compact />
      </g>

      {/* архитектор и хозяин */}
      <Actor x={S1.architect.x} y={S1.architect.y} scale={0.8} label="Архитектор" enterAt={0}>
        <Person color={theme.ink} pose={architect[0]} mood={architect[1]} />
      </Actor>
      <Actor x={S1.owner.x} y={S1.owner.y} scale={0.8} label="Хозяин" enterAt={b(1)}>
        <Person color={theme.soft} pose={owner[0]} mood={owner[1]} />
      </Actor>

      {/* чего в макете нет и что он проверяет */}
      {MISSING.map((m, i) => (
        <g key={m} opacity={appear(frame, missAt[i])}>
          <Mark x={S1.missing.x} y={S1.missing.y + i * S1.missing.row} ok={false} r={16} />
          <Label x={S1.missing.x + 30} y={S1.missing.y + i * S1.missing.row + 8} anchor="start" size={24} weight={600} color={theme.soft}>
            {m}
          </Label>
        </g>
      ))}
      <g opacity={plan}>
        <line x1={S1.missing.x - 20} y1={S1.missing.y + 3 * S1.missing.row - 26} x2={S1.missing.x + 200} y2={S1.missing.y + 3 * S1.missing.row - 26} stroke={theme.grid} strokeWidth={3} />
        <Mark x={S1.missing.x} y={S1.missing.y + 3 * S1.missing.row + 10} ok r={16} />
        <Label x={S1.missing.x + 30} y={S1.missing.y + 3 * S1.missing.row + 18} anchor="start" size={24} weight={700} color={theme.ok}>
          планировка
        </Label>
      </g>

      {/* доска 2: прототип — такой же макет */}
      <g opacity={mini}>
        <MiniHouse x={S1.mini.x} y={S1.mini.y} sag={sag} />
        <Label x={S1.mini.x} y={S1.mini.y + 44} size={24} weight={700} color={theme.alt}>
          макет дома
        </Label>
      </g>
      <g opacity={same}>
        <Label x={(S1.mini.x + 96 + P.x) / 2} y={P.y + P.h / 2 + 20} size={64} weight={700} color={theme.soft}>
          =
        </Label>
      </g>
      {frame >= proto && (
        <Browser x={P.x} y={P.y} w={P.w} h={P.h} at={proto} url="прототип">
          <text x={20} y={80} fill={theme.ink} style={{ font: `700 22px ${theme.font}` }}>
            Подопечные
          </text>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={20} y={100 + i * 40} width={P.w - 40 - (i % 2) * 60} height={26} rx={6} fill={theme.grid} opacity={appear(frame, proto + 14 + i * 8)} />
          ))}
        </Browser>
      )}
      <g opacity={appear(frame, proto + 10)}>
        <Label x={P.x + P.w / 2} y={S1.mini.y + 44} size={24} weight={700} color={theme.accent}>
          прототип
        </Label>
      </g>
      <g opacity={answer}>
        <Pill x={S1.mini.x} y={S1.why.y} text="ради ответа" color={theme.ok} fill={theme.okTint} size={22} />
        <Mark x={S1.mini.x + 104} y={S1.why.y - 24} ok r={16} />
      </g>
      <g opacity={launch}>
        <Pill x={P.x + P.w / 2} y={S1.why.y} text="ради запуска" color={theme.risk} fill={theme.paper} size={22} />
        <line x1={P.x + P.w / 2 - 84} y1={S1.why.y} x2={P.x + P.w / 2 - 84 + 168 * strike} y2={S1.why.y} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>

      {/* недели → вечер */}
      <g opacity={cal}>
        <Calendar x={W.x} y={W.y} w={W.w} h={W.h} flip={flip} />
        <line x1={W.x - 14} y1={W.y + W.h + 10} x2={W.x - 14 + (W.w + 28) * cross} y2={W.y + W.h + 10 - (W.h + 20) * cross} stroke={theme.risk} strokeWidth={6} strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
        <Label x={W.x + W.w / 2} y={S1.mini.y + 44} size={24} weight={700} color={theme.risk}>
          недели
        </Label>
      </g>
      <Arrow x1={W.x + W.w + 24} y1={S1.evening.y} x2={S1.evening.x - 66} y2={S1.evening.y} color={theme.accent} draw={toMoon} />
      <g opacity={moon}>
        <Moon x={S1.evening.x} y={S1.evening.y} r={40} />
        <Label x={S1.evening.x} y={S1.mini.y + 44} size={24} weight={700} color={theme.ok}>
          один вечер
        </Label>
      </g>

      {/* легко спутать с настоящим домом */}
      <g opacity={ready}>
        <Pill x={S1.mini.x} y={S1.mini.y - 214} text="уже можно жить?" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={wrong}>
        <Mark x={S1.mini.x + 116} y={S1.mini.y - 130} ok={false} r={18} />
      </g>
    </KitScene>
  )
}
