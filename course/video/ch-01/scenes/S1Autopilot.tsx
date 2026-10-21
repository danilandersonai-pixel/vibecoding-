import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import type { Mood, Pose } from '../../actors/Person'
import { Cloud, Mark } from '../../ch-abc/scenes/parts'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { appear, clamp, trackAt } from './motion'
import { Bubble, Pilot, Plane, Tag, Yoke } from './parts'

const ID = 's1-autopilot'
const N = S1.track.notches
const Y = S1.routeY
const SKY = S1.sky
// облака плывут влево и появляются снова справа
const CLOUDS = [
  { x: 120, y: 92, w: 150, h: 60, v: 0.5 },
  { x: 420, y: 222, w: 120, h: 46, v: 0.8 },
  { x: 700, y: 86, w: 180, h: 70, v: 0.4 },
  { x: 980, y: 206, w: 140, h: 52, v: 0.7 },
  { x: 1190, y: 104, w: 110, h: 44, v: 0.6 },
]
// над делениями — что делает автопилот; под ними — режим
const WHAT = ['подсказка', 'второй пилот', 'автопилот', 'весь рейс сам']
const MODE = ['Автодополнение', 'Чат-ассистент', 'Вайб-кодинг', 'Делегирование']

type Key = [number, number, number]

function cloudX(c: (typeof CLOUDS)[number], frame: number) {
  const span = SKY.w + c.w
  const p = (((c.x - SKY.x + c.w - c.v * frame) % span) + span) % span
  return SKY.x + p - c.w
}

// Сцена 1 (метафора): работа с ИИ — шкала, как автопилот. Подсказка → второй пилот → автопилот
// (пилот спит — вайб-кодинг; пилот следит — разработка с ИИ) → весь рейс сам; посадка — за пилотом.
export function S1Autopilot() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // самолёт: влетает → принимает подсказку → обходит тучу → уходит с курса → возвращается → летит сам → садится
  const planeKeys: Key[] = [
    [0, 30, Y + 4],
    [b(0) + 45, 190, Y],
    [b(1) + 100, 200, Y],
    [b(1) + 140, 320, Y],
    [b(2) + 110, 330, Y],
    [b(2) + 140, 440, Y - 58],
    [b(2) + 172, 560, Y],
    [b(3) + 70, 570, Y],
    [b(3) + 150, 700, Y - 62],
    [b(4) + 20, 705, Y - 62],
    [b(4) + 75, 790, Y],
    [b(4) + 95, 795, Y],
    [b(4) + 140, 870, Y],
    [b(5) + 25, 875, Y],
    [b(5) + 100, 1030, Y],
    [b(6) + 30, 1035, Y],
    [b(6) + 100, S1.land.x, S1.land.y],
    [b(6) + 130, S1.land.x + 30, S1.land.y],
  ]
  const p = trackAt(frame, planeKeys)
  const p0 = trackAt(frame - 2, planeKeys)
  const p1 = trackAt(frame + 2, planeKeys)
  const tilt = Math.max(-22, Math.min(22, (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI))
  // без присмотра самолёт покачивается
  const drifting = frame >= b(3) + 70 && frame < b(4) + 20
  const wobble = drifting ? Math.sin(frame / 5) * 4 : 0
  const planeIn = interpolate(frame, [0, 12], [0, 1], clamp)

  // выключатель «вкл/выкл» зачёркнут — вместо него шкала
  const toggle = useAppear(b(0) + 40) * interpolate(frame, [b(1) - 10, b(1) + 6], [1, 0], clamp)
  const cross = interpolate(frame, [b(0) + 80, b(0) + 96], [0, 1], clamp)
  const miniScale = useAppear(b(0) + 105)
  const miniKnob = interpolate(frame, [b(0) + 115, b(0) + 150], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })

  // шкала, пилот, автопилот — после отъезда камеры
  const track = interpolate(frame, [b(1) + 6, b(1) + 36], [0, 1], clamp)
  const notchAt = [b(1) + 40, b(2), b(3), b(5)]
  const knob = useTrack([
    [b(1) + 40, N[0], S1.track.y],
    [b(2), N[0], S1.track.y],
    [b(2) + 20, N[1], S1.track.y],
    [b(3), N[1], S1.track.y],
    [b(3) + 20, N[2], S1.track.y],
    [b(5), N[2], S1.track.y],
    [b(5) + 20, N[3], S1.track.y],
  ])
  const assisted = frame >= b(4)
  const knobColor = frame >= b(3) && frame < b(4) ? theme.risk : frame >= b(4) && frame < b(5) ? theme.ok : theme.accent

  // штурвал: у пилота → у автопилота (вайб-кодинг) → снова у пилота на посадке
  const yoke = useTrack([
    [b(3) + 10, S1.yokePilot.x, S1.yokePilot.y],
    [b(3) + 22, S1.yokePilot.x + 60, S1.yokeLane],
    [b(3) + 40, S1.yokeAgent.x - 60, S1.yokeLane],
    [b(3) + 52, S1.yokeAgent.x, S1.yokeAgent.y],
    [b(6) + 10, S1.yokeAgent.x, S1.yokeAgent.y],
    [b(6) + 22, S1.yokeAgent.x - 60, S1.yokeLane],
    [b(6) + 40, S1.yokePilot.x + 60, S1.yokeLane],
    [b(6) + 52, S1.yokePilot.x, S1.yokePilot.y],
  ])
  const yokeIn = useAppear(b(1) + 30)
  const yokeAtAgent = frame >= b(3) + 52 && frame < b(6) + 10

  // подсказка: пунктир впереди → принят — сплошной
  const hint = useAppear(b(1) + 50) * interpolate(frame, [b(2) - 5, b(2) + 5], [1, 0], clamp)
  const accepted = interpolate(frame, [b(1) + 100, b(1) + 112], [0, 1], clamp)
  // второй пилот: вопрос → ответ; туча
  const storm = useAppear(b(2) + 5) * interpolate(frame, [b(3) + 20, b(3) + 40], [1, 0], clamp)
  const ask = useAppear(b(2) + 25) * interpolate(frame, [b(3) - 6, b(3) + 4], [1, 0], clamp)
  const answer = useAppear(b(2) + 70) * interpolate(frame, [b(3) - 6, b(3) + 4], [1, 0], clamp)
  // вайб-кодинг: пилот дремлет, самолёт уходит с курса
  const asleep = frame >= b(3) + 55 && frame < b(4) + 8
  const offCourse = useAppear(b(3) + 120) * interpolate(frame, [b(4) + 20, b(4) + 30], [1, 0], clamp)
  const trail = interpolate(frame, [b(4) + 50, b(4) + 70], [1, 0], clamp)
  const trailPts: string[] = []
  for (let f = b(3) + 70; f <= Math.min(frame, b(4) + 20); f += 4) {
    const q = trackAt(f, planeKeys)
    trailPts.push(`${q.x.toFixed(1)},${(q.y + Math.sin(f / 5) * 4).toFixed(1)}`)
  }
  // разработка с ИИ: каждый манёвр проверен
  const checks = [b(4) + 78, b(4) + 142]
  // делегирование: пилот занят другим, потом проверяет итог
  const pilotDim = interpolate(frame, [b(5) + 10, b(5) + 25, b(5) + 105, b(5) + 118], [1, 0.35, 0.35, 1], clamp)
  const result = useAppear(b(5) + 108) * interpolate(frame, [b(6), b(6) + 10], [1, 0], clamp)
  // посадка
  const banner = useAppear(b(6) + 62)

  // тег над пилотом — что он сейчас делает
  const tags: [number, { text: string; color: string } | null][] = [
    [0, null],
    [b(3) + 60, { text: 'не смотрит на приборы', color: theme.risk }],
    [b(4) + 10, { text: 'следит за приборами', color: theme.ok }],
    [b(5) + 15, { text: 'занят другим', color: theme.soft }],
    [b(5) + 115, { text: 'проверяет итог', color: theme.ok }],
    [b(6), null],
  ]
  const tag = stepAt(frame, tags)
  const tagIn = appear(frame, stepAt(frame, tags.map(([at]) => [at, at] as [number, number])))

  const pilot = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 92, ['point', 'neutral']],
    [b(1) + 140, ['stand', 'happy']],
    [b(2) + 20, ['think', 'neutral']],
    [b(2) + 105, ['point', 'neutral']],
    [b(2) + 172, ['stand', 'happy']],
    [b(4) + 8, ['point', 'neutral']],
    [b(5) + 15, ['stand', 'neutral']],
    [b(5) + 115, ['think', 'neutral']],
    [b(5) + 150, ['stand', 'happy']],
    [b(6) + 100, ['cheer', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 45, 'working'],
    [b(1) + 95, 'idle'],
    [b(2) + 45, 'working'],
    [b(2) + 70, 'done'],
    [b(2) + 110, 'idle'],
    [b(3) + 52, 'working'],
    [b(5) + 100, 'done'],
    [b(6) + 10, 'idle'],
    [b(6) + 100, 'done'],
  ])

  return (
    <KitScene chip="1 / 6 · Автопилот: шкала, а не выключатель" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* небо: облака, курс, полоса */}
      <defs>
        <clipPath id="ch01-s1-sky">
          <rect x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} rx={22} />
        </clipPath>
      </defs>
      <rect x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} rx={22} fill={theme.accentTint} />
      <g clipPath="url(#ch01-s1-sky)">
        {CLOUDS.map((c) => (
          <Cloud key={c.x} x={cloudX(c, frame)} y={c.y} w={c.w} h={c.h} stroke={theme.paper} />
        ))}
        <rect x={SKY.x} y={S1.runway.y + 8} width={SKY.w} height={40} fill={theme.grid} />
      </g>
      <line x1={90} y1={Y} x2={1030} y2={Y} stroke={theme.line} strokeWidth={3} strokeDasharray="10 10" />
      <path d={`M1030 ${Y} Q1100 ${Y} ${S1.land.x} ${S1.runway.y - 4}`} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="10 10" />
      <rect x={S1.runway.x} y={S1.runway.y} width={S1.runway.w} height={10} rx={3} fill={theme.ink} />
      <line x1={S1.runway.x + 10} y1={S1.runway.y + 5} x2={S1.runway.x + S1.runway.w - 10} y2={S1.runway.y + 5} stroke={theme.paper} strokeWidth={2} strokeDasharray="8 8" />

      {/* выключатель → шкала */}
      <g opacity={toggle}>
        <Label x={S1.toggle.x} y={S1.toggle.y - 40} size={20} color={theme.soft} weight={700}>
          вкл / выкл
        </Label>
        <rect x={S1.toggle.x - 45} y={S1.toggle.y - 22} width={90} height={44} rx={22} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
        <circle cx={S1.toggle.x + 22} cy={S1.toggle.y} r={15} fill={theme.ink} />
        <path d={`M${S1.toggle.x - 56} ${S1.toggle.y - 34} L${S1.toggle.x - 56 + 112 * cross} ${S1.toggle.y - 34 + 68 * cross}`} stroke={theme.risk} strokeWidth={6} strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
        <g opacity={miniScale}>
          <line x1={S1.toggle.x + 90} y1={S1.toggle.y} x2={S1.toggle.x + 210} y2={S1.toggle.y} stroke={theme.accent} strokeWidth={5} strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={S1.toggle.x + 90 + i * 40} cy={S1.toggle.y} r={5} fill={theme.accent} />
          ))}
          <circle cx={S1.toggle.x + 90 + 120 * miniKnob} cy={S1.toggle.y} r={13} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
          <Label x={S1.toggle.x + 150} y={S1.toggle.y - 26} size={22} color={theme.accent} weight={700}>
            шкала
          </Label>
        </g>
      </g>

      {/* подсказка курса: пунктир впереди, принят — сплошной */}
      <g opacity={hint}>
        <line x1={215} y1={Y} x2={318} y2={Y} stroke={theme.accent} strokeWidth={5} strokeDasharray={accepted >= 1 ? undefined : '8 7'} strokeLinecap="round" />
        <path d={`M330 ${Y} l-16 -9 v18 Z`} fill={theme.accent} />
      </g>
      <g opacity={interpolate(frame, [b(1) + 140, b(1) + 150], [0, 1], clamp) * hint}>
        <Mark x={330} y={Y - 44} ok />
      </g>

      {/* туча, которую обходят по совету второго пилота */}
      <g opacity={storm}>
        <Cloud x={S1.storm.x - 64} y={S1.storm.y - 32} w={128} h={60} stroke={theme.soft} fill={theme.grid} />
        <path d={`M${S1.storm.x - 6} ${S1.storm.y + 26} l-10 18 h12 l-8 16`} fill="none" stroke={theme.alt} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* след без присмотра и «курс?» */}
      {trailPts.length > 1 && <polyline points={trailPts.join(' ')} fill="none" stroke={theme.risk} strokeWidth={3} strokeDasharray="6 6" opacity={trail} />}
      <g opacity={offCourse}>
        <Tag x={p.x} y={p.y - 52} text="курс?" color={theme.risk} size={20} />
      </g>
      {checks.map((at, i) => (
        <g key={at} opacity={appear(frame, at) * interpolate(frame, [b(5) + 10, b(5) + 20], [1, 0], clamp)}>
          <Mark x={i === 0 ? 790 : 870} y={Y - 46} ok />
        </g>
      ))}
      <g opacity={result}>
        <Tag x={1030} y={Y - 56} text="итог ✓" color={theme.ok} size={20} />
      </g>

      <g opacity={planeIn}>
        <Plane x={p.x} y={p.y + wobble} angle={tilt} />
      </g>

      {/* шкала режимов */}
      <g opacity={track > 0 ? 1 : 0}>
        <line x1={N[0] - 40} y1={S1.track.y} x2={N[0] - 40 + (N[3] - N[0] + 80) * track} y2={S1.track.y} stroke={theme.line} strokeWidth={6} strokeLinecap="round" />
        {N.map((nx, i) => {
          const on = interpolate(frame, [notchAt[i], notchAt[i] + 10], [0, 1], clamp)
          const current = i === 0 ? frame < b(2) : i === 1 ? frame >= b(2) && frame < b(3) : i === 2 ? frame >= b(3) && frame < b(5) : frame >= b(5)
          const tone = (c: string) => (current ? c : theme.soft)
          return (
            <g key={nx}>
              <circle cx={nx} cy={S1.track.y} r={8} fill={on > 0 ? theme.accent : theme.paper} stroke={theme.line} strokeWidth={3} opacity={track >= 1 ? 1 : 0} />
              <g opacity={on}>
                <Label x={nx} y={S1.track.y - 30} size={18} color={theme.soft} weight={600}>
                  {WHAT[i]}
                </Label>
                <Label x={nx} y={S1.track.y + 44} size={20} color={i === 2 ? (frame < b(4) ? tone(theme.risk) : theme.soft) : tone(theme.ink)} weight={700}>
                  {MODE[i]}
                </Label>
              </g>
              {i === 2 && (
                <g opacity={appear(frame, b(4))}>
                  <Label x={nx} y={S1.track.y + 72} size={20} color={assisted && frame < b(5) ? theme.ok : theme.soft} weight={700}>
                    Разработка с ИИ
                  </Label>
                </g>
              )}
            </g>
          )
        })}
        <circle cx={knob.x} cy={knob.y} r={15} fill={knobColor} stroke={theme.paper} strokeWidth={4} opacity={appear(frame, b(1) + 40)} />
      </g>

      {/* реплики пилота и второго пилота */}
      <g opacity={ask}>
        <Bubble x={46} y={294} w={240} text="Как обойти тучу?" tx={140} />
      </g>
      <g opacity={answer}>
        <Bubble x={1010} y={294} w={210} text="Выше на 300 м" tx={1140} color={theme.accent} fill={theme.accentTint} />
      </g>

      {/* пилот и автопилот, штурвал между ними */}
      <g opacity={pilotDim}>
        <Pilot x={S1.pilot.x} y={S1.pilot.y} scale={0.8} label="Вы — пилот" enterAt={b(1) + 8} pose={pilot[0]} mood={pilot[1]} asleep={asleep} />
      </g>
      {asleep &&
        [0, 1, 2].map((i) => {
          const t = ((frame - b(3) - 55 + i * 12) % 36) / 36
          return (
            <text key={i} x={162 + i * 16 + t * 10} y={384 - i * 18 - t * 12} fill={theme.accent} opacity={1 - t * 0.8} style={{ font: `800 ${22 + i * 5}px ${theme.font}` }}>
              z
            </text>
          )
        })}
      {tag && (
        <g opacity={tagIn}>
          <Tag x={S1.pilot.x + 10} y={322} text={tag.text} color={tag.color} />
        </g>
      )}
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.8} label="ИИ — автопилот" enterAt={b(1) + 16} pose={agent} />
      <g opacity={yokeIn}>
        <Yoke x={yoke.x} y={yoke.y} color={yokeAtAgent ? theme.accent : theme.ink} />
      </g>

      {/* посадка — за пилотом */}
      <g opacity={banner}>
        <Card x={330} y={96} w={500} h={54} stroke={theme.accent} fill={theme.paper}>
          <Label x={580} y={132} size={26} color={theme.accent} weight={700}>
            За посадку отвечает пилот
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
