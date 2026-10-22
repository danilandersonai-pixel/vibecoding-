import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { PHONE_SCALE, readyY, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Builder, LogScreen } from './parts'

const ID = 's1-renovation'
const R = S1.room
const FLOOR = S1.floorY
const WALL = 26
const CEIL = 22
const PANELS = 5
const C = S1.chart
const CARD = S1.card

// строки сметы: сколько времени уходит на каждую часть ремонта
const COSTS = [
  { name: 'Стены', w: 40, color: theme.accent, note: '1 день' },
  { name: 'Проводка', w: 214, color: theme.alt, note: '' },
  { name: 'Трубы', w: 190, color: theme.accent, note: '' },
]

// Сцена 1 (метафора): за день бригада ставит стены — квартира выглядит готовой, но света и воды нет:
// проводка и трубы спрятаны в стенах, на них уходит основная работа. С ИИ так же: 70% набегает
// быстро (тут показывают демо), последние 30% идут медленнее, чем без ИИ, — проблема 70%.
export function S1Renovation() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // стены растут по панели, затем потолок и боковые стены
  const panelAt = Array.from({ length: PANELS }, (_, i) => b(0) + 20 + i * 14)
  const shell = useAppear(b(0) + 92)
  const day = useAppear(b(0) + 60)
  const dayDone = useAppear(b(0) + 140)
  // разрез: стены становятся прозрачными, видны проводка и трубы
  const cut = interpolate(frame, [b(2) + 10, b(2) + 30], [0, 1], CLAMP)
  const wire = interpolate(frame, [b(2) + 30, b(2) + 62], [0, 1], CLAMP)
  const pipe = interpolate(frame, [b(2) + 66, b(2) + 98], [0, 1], CLAMP)
  const noLight = useAppear(b(1) + 34) * (1 - appear(frame, b(2) + 8, 10))
  const noWater = useAppear(b(1) + 118) * (1 - appear(frame, b(2) + 8, 10))
  const swOn = frame >= b(1) + 22
  const tapOn = frame >= b(1) + 108
  const card = useAppear(b(2) + 40)
  const costAt = COSTS.map((_, i) => b(2) + 54 + i * 26)
  const rest = useAppear(b(2) + 136)

  // вы: стоите в комнате → к выключателю → к раковине
  const you = trackAt(frame, [
    [b(1) + 70, S1.you.x, S1.you.y],
    [b(1) + 98, 640, S1.you.y],
  ])
  const youPose = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 130, ['cheer', 'happy']],
    [b(1) + 4, ['point', 'neutral']],
    [b(1) + 36, ['surprised', 'worried']],
    [b(1) + 70, ['stand', 'neutral']],
    [b(1) + 100, ['point', 'neutral']],
    [b(1) + 120, ['surprised', 'worried']],
    [b(2) + 40, ['think', 'worried']],
  ])
  const builder = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 16, ['point', 'happy']],
    [b(0) + 110, ['cheer', 'happy']],
    [b(1) + 40, ['stand', 'neutral']],
    [b(1) + 130, ['think', 'worried']],
    [b(2) + 100, ['point', 'neutral']],
  ])

  // доска 2: агент собирает журнал, кривая готовности
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 14, 'working'],
    [b(3) + 96, 'done'],
    [b(5) + 20, 'working'],
  ])
  const phoneTag = useAppear(b(3) + 110)
  const almost = frame >= b(5) + 60
  const axes = useAppear(b(4) + 2)
  const steep = interpolate(frame, [b(4) + 20, b(4) + 60], [0, 1], CLAMP)
  const seventy = useAppear(b(4) + 60)
  const fast = useAppear(b(4) + 72)
  const demo = usePop(b(4) + 122)
  const slow = interpolate(frame, [b(5) + 10, b(5) + 140], [0, 1], CLAMP)
  const slowLabel = useAppear(b(5) + 40)
  const problem = usePop(b(5) + 150)

  const x0 = C.x0
  const y70 = readyY(0.7)
  const steepPath = `M${x0} ${C.y1} C${x0 + 50} ${C.y1 - 90} ${x0 + 100} ${y70 + 16} ${x0 + 150} ${y70}`
  const slowPath = `M${x0 + 150} ${y70} C${x0 + 300} ${y70 - 20} ${x0 + 480} ${readyY(0.92)} ${C.x1 - 10} ${readyY(0.97)}`

  return (
    <KitScene chip="1 / 6 · Ремонт: стены есть, а света нет" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* пол */}
      <rect x={150} y={FLOOR} width={750} height={14} rx={4} fill={theme.desk} />

      {/* задняя стена из панелей; в разрезе — полупрозрачная */}
      {panelAt.map((at, i) => {
        const pw = (R.w - 2 * WALL) / PANELS
        const h = (FLOOR - R.y - CEIL) * grow(frame, at, 16)
        const x = R.x + WALL + i * pw
        return (
          <g key={at} opacity={1 - cut * 0.6}>
            <rect x={x} y={FLOOR - h} width={pw} height={h} fill={theme.codeBg} stroke={theme.grid} strokeWidth={2} />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
              const ly = FLOOR - k * 34
              return ly > FLOOR - h ? <line key={k} x1={x + 4} y1={ly} x2={x + pw - 4} y2={ly} stroke={theme.grid} strokeWidth={1.5} /> : null
            })}
          </g>
        )
      })}
      {/* боковые стены и потолок */}
      <g opacity={shell}>
        <rect x={R.x} y={R.y} width={WALL} height={FLOOR - R.y} fill={theme.soft} />
        <rect x={R.x + R.w - WALL} y={R.y} width={WALL} height={FLOOR - R.y} fill={theme.soft} />
        <rect x={R.x} y={R.y} width={R.w} height={CEIL} fill={theme.soft} />
      </g>

      {/* спрятанная проводка и трубы */}
      <path d={`M${S1.sw.x} ${S1.sw.y - 18} V190 H${S1.lamp.x} V${S1.lamp.y + 30} M${S1.sw.x} ${S1.sw.y + 18} V452 H${R.x + WALL}`} fill="none" stroke={theme.alt} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - wire} opacity={wire > 0 ? 1 : 0} />
      <path d={`M${R.x + R.w - WALL - 14} 296 V448 H600 V${FLOOR + 12}`} fill="none" stroke={theme.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pipe} opacity={pipe > 0 ? 1 : 0} />
      <g opacity={appear(frame, b(2) + 50)}>
        <Pill x={300} y={232} text="проводка" color={theme.alt} size={20} compact />
      </g>
      <g opacity={appear(frame, b(2) + 92)}>
        <Pill x={706} y={244} text="трубы" color={theme.accent} size={20} compact />
      </g>

      {/* выключатель */}
      <g opacity={shell}>
        <rect x={S1.sw.x - 13} y={S1.sw.y - 19} width={26} height={38} rx={5} fill={theme.white} stroke={theme.ink} strokeWidth={2.5} />
        <rect x={S1.sw.x - 5} y={swOn ? S1.sw.y - 12 : S1.sw.y} width={10} height={12} rx={3} fill={theme.ink} />
      </g>
      {/* лампа: не горит */}
      <g opacity={shell}>
        <line x1={S1.lamp.x} y1={S1.lamp.y} x2={S1.lamp.x} y2={S1.lamp.y + 24} stroke={theme.ink} strokeWidth={3} />
        {/* абажур и лампочка без света */}
        <path d={`M${S1.lamp.x - 10} ${S1.lamp.y + 24} H${S1.lamp.x + 10} L${S1.lamp.x + 30} ${S1.lamp.y + 50} H${S1.lamp.x - 30} Z`} fill={theme.soft} stroke={theme.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={S1.lamp.x} cy={S1.lamp.y + 58} r={10} fill={theme.paper} stroke={theme.ink} strokeWidth={2.5} />
      </g>
      <g opacity={noLight}>
        <Mark x={S1.lamp.x + 46} y={S1.lamp.y + 50} ok={false} />
        <Pill x={S1.lamp.x} y={S1.lamp.y + 104} text="света нет" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      {/* раковина и кран: воды нет */}
      <g opacity={shell}>
        <path d={`M${R.x + R.w - WALL} 296 H${S1.sink.x + 20} V${314}`} fill="none" stroke={theme.soft} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={S1.sink.x + 44} y={tapOn ? 276 : 282} width={8} height={14} rx={2} fill={theme.ink} transform={tapOn ? `rotate(40 ${S1.sink.x + 48} 290)` : undefined} />
        <path d={`M${S1.sink.x - 60} ${S1.sink.y} H${S1.sink.x + 60} L${S1.sink.x + 50} ${S1.sink.y + 28} H${S1.sink.x - 50} Z`} fill={theme.white} stroke={theme.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={S1.sink.x} y1={S1.sink.y + 28} x2={S1.sink.x} y2={FLOOR} stroke={theme.ink} strokeWidth={3} />
      </g>
      <g opacity={noWater}>
        <Mark x={S1.sink.x + 20} y={334} ok={false} />
        <Pill x={S1.sink.x} y={250} text="воды нет" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* день первый: стены готовы */}
      <g opacity={day}>
        <Pill x={530} y={112} text={dayDone > 0 ? 'День 1: стены ✓' : 'День 1'} color={dayDone > 0 ? theme.ok : theme.accent} fill={dayDone > 0 ? theme.okTint : theme.paper} size={22} />
      </g>

      {/* бригада и вы */}
      <Builder x={S1.builder.x} y={S1.builder.y} scale={0.7} label="Бригада" enterAt={2} pose={builder[0]} mood={builder[1]} />
      <Actor x={you.x} y={you.y} scale={0.7} label="Вы" enterAt={b(0) + 100}>
        <Person color={theme.soft} pose={youPose[0]} mood={youPose[1]} />
      </Actor>

      {/* смета: где уходит время */}
      <g opacity={card}>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={290}>
          <Label x={CARD.x + 22} y={CARD.y + 40} anchor="start" size={22} weight={700}>
            Где уходит время
          </Label>
          {COSTS.map((c, i) => {
            const y = CARD.y + 84 + i * 70
            const g = grow(frame, costAt[i], i === 0 ? 8 : 40)
            return (
              <g key={c.name} opacity={appear(frame, costAt[i], 8)}>
                <Label x={CARD.x + 22} y={y} anchor="start" size={20} weight={600}>
                  {c.name}
                </Label>
                <rect x={CARD.x + 22} y={y + 12} width={c.w * g} height={22} rx={6} fill={c.color} opacity={i === 0 ? 1 : 0.85} />
                {c.note !== '' && (
                  <Label x={CARD.x + 22 + c.w + 12} y={y + 30} anchor="start" size={20} color={theme.ok} weight={700}>
                    {`${c.note} ✓`}
                  </Label>
                )}
                {c.note === '' && g >= 1 && (
                  <Label x={CARD.x + 22 + c.w + 12} y={y + 30} anchor="start" size={20} color={theme.risk} weight={700}>
                    …
                  </Label>
                )}
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={rest}>
        <Pill x={CARD.x + CARD.w / 2} y={CARD.y + 330} text="остальная работа — тут" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>

      {/* доска 2: за первые часы — работающее с виду приложение */}
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.85} enterAt={b(3) + 4} pose={agent} />
      <Phone x={S1.phone.x} y={S1.phone.y} scale={PHONE_SCALE} enterAt={b(3) + 22}>
        <LogScreen
          rows={[
            { text: 'присед 60×8', at: b(3) + 52 },
            { text: 'жим 40×10', at: b(3) + 68 },
            { text: 'тяга 80×5', at: b(3) + 84 },
          ]}
        />
      </Phone>
      <g opacity={phoneTag}>
        <Pill x={S1.phone.x} y={500} text={almost ? 'почти готово…' : 'работает с виду'} color={almost ? theme.alt : theme.ok} fill={almost ? theme.altTint : theme.okTint} size={20} compact />
      </g>

      {/* кривая готовности: 70% быстро, 30% медленно */}
      <g opacity={axes}>
        <line x1={x0} y1={C.y0 - 10} x2={x0} y2={C.y1} stroke={theme.line} strokeWidth={3} />
        <line x1={x0} y1={C.y1} x2={C.x1} y2={C.y1} stroke={theme.line} strokeWidth={3} />
        <Label x={x0 + 10} y={C.y0 - 18} anchor="start" size={20} color={theme.soft} weight={600}>
          готовность
        </Label>
        <Label x={(x0 + C.x1) / 2} y={C.y1 + 34} size={20} color={theme.soft} weight={600}>
          усилия и время →
        </Label>
        {[
          { p: 1, t: '100%' },
          { p: 0, t: '0%' },
        ].map((k) => (
          <Label key={k.t} x={x0 - 12} y={readyY(k.p) + 7} anchor="end" size={20} color={theme.soft} weight={600}>
            {k.t}
          </Label>
        ))}
      </g>
      <path d={steepPath} fill="none" stroke={theme.accent} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - steep} opacity={steep > 0 ? 1 : 0} />
      <path d={slowPath} fill="none" stroke={theme.risk} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - slow} opacity={slow > 0 ? 1 : 0} />
      <g opacity={seventy}>
        <line x1={x0} y1={y70} x2={x0 + 150} y2={y70} stroke={theme.accent} strokeWidth={2} strokeDasharray="6 6" />
        <Label x={x0 - 12} y={y70 + 8} anchor="end" size={22} color={theme.accent} weight={800}>
          70%
        </Label>
      </g>
      <g opacity={fast}>
        <Label x={x0 + 90} y={380} anchor="start" size={20} color={theme.accent} weight={700}>
          первые 70% — быстро
        </Label>
      </g>
      {frame >= b(4) + 122 && (
        <g transform={`translate(${x0 + 150} ${y70}) scale(${demo}) translate(${-(x0 + 150)} ${-y70})`}>
          <line x1={x0 + 150} y1={y70} x2={x0 + 150} y2={y70 - 52} stroke={theme.ink} strokeWidth={3} />
          <Pill x={x0 + 196} y={y70 - 52} text="демо" color={theme.ok} fill={theme.okTint} size={20} compact />
        </g>
      )}
      <g opacity={slowLabel}>
        <Label x={x0 + 330} y={300} anchor="start" size={20} color={theme.risk} weight={700}>
          последние 30% — медленно
        </Label>
      </g>
      {frame >= b(5) + 150 && (
        <g transform={`translate(${x0 + 440} 414) scale(${problem}) translate(${-(x0 + 440)} -414)`}>
          <Pill x={x0 + 440} y={414} w={250} text="Проблема 70%" color={theme.risk} fill={theme.riskTint} size={28} weight={800} />
        </g>
      )}
    </KitScene>
  )
}
