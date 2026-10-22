import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Magnifier, Roller, Sink, Worker } from './parts'

const ID = 's1-repair'
const W = S1.wall
const T = S1.tiles
const C = S1.card

// четыре проверки приёмки: подпись и чем кончилась
const CHECKS = [
  { text: '1 · осмотреть всё', ok: true },
  { text: '2 · спросить мастеров', ok: true },
  { text: '3 · открыть кран', ok: true },
  { text: '4 · оба крана разом', ok: false },
]
const ACTS = ['спросить', 'запустить', 'пройти сценарий']

// Сцена 1 (метафора): приёмка ремонта. Плитка и свежая краска радуют, но проверяют другое: осмотреть
// всё, спросить мастеров, открыть кран, пустить оба крана — и найти течь. С кодом от ИИ так же: строки
// читать не обязательно, а отвечаете за код вы.
export function S1Repair() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // плитка над раковиной кладётся по одной; «Готово!» мастера
  const tileAt = (i: number) => b(0) + 20 + i * 3
  const done = appear(frame, b(0) + 30) * interpolate(frame, [b(1) - 10, b(1)], [1, 0], CLAMP)
  const accept = appear(frame, b(0) + 110) * interpolate(frame, [b(1) + 4, b(1) + 14], [1, 0], CLAMP)

  // свежая краска: валик проходит стену сверху вниз
  const paint = interpolate(frame, [b(1) + 10, b(1) + 100], [0, 1], CLAMP)
  const rollerOn = frame >= b(1) + 6 && frame < b(1) + 110
  const rollerY = W.y + 20 + paint * (W.h - 40)
  const rollerX = W.x + W.w / 2 + Math.sin(frame / 5) * 90
  const pretty = appear(frame, b(1) + 110)

  // осмотр лупой и вопрос мастерам
  const lens = trackAt(frame, [
    [b(2) + 30, 410, 330],
    [b(2) + 60, 620, 400],
    [b(2) + 90, 900, 250],
  ])
  const lensOn = frame >= b(2) + 26 && frame < b(2) + 96
  const lensFade = Math.min(appear(frame, b(2) + 26, 6), interpolate(frame, [b(2) + 88, b(2) + 96], [1, 0], CLAMP))
  const ask = appear(frame, b(2) + 96) * interpolate(frame, [b(3), b(3) + 10], [1, 0], CLAMP)
  const answer = appear(frame, b(2) + 122) * interpolate(frame, [b(3), b(3) + 10], [1, 0], CLAMP)
  const checkAt = [b(2) + 34, b(2) + 104, b(3) + 50, b(3) + 128]

  // кран: холодный, вода идёт куда надо; потом оба — и течь
  const cold = interpolate(frame, [b(3) + 8, b(3) + 20], [0, 1], CLAMP)
  const flow = interpolate(frame, [b(3) + 16, b(3) + 30], [0, 1], CLAMP)
  const hot = interpolate(frame, [b(3) + 92, b(3) + 104], [0, 1], CLAMP)
  const leak = interpolate(frame, [b(3) + 106, b(3) + 150], [0, 1], CLAMP)
  const leakTag = appear(frame, b(3) + 118)

  // доска 2: изменения от агента становятся вашими
  const card = appear(frame, b(4) + 18)
  const handed = interpolate(frame, [b(4) + 30, b(4) + 44], [0, 1], CLAMP)
  const yours = frame >= b(4) + 62
  const strike = interpolate(frame, [b(4) + 84, b(4) + 96], [0, 1], CLAMP)
  const actAt = ACTS.map((_, i) => b(4) + 96 + i * 12)
  const owner = appear(frame, b(4) + 134)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 40, ['think', 'neutral']],
    [b(0) + 110, ['point', 'neutral']],
    [b(1) + 30, ['stand', 'happy']],
    [b(1) + 120, ['think', 'neutral']],
    [b(2) + 90, ['point', 'neutral']],
    [b(3) + 4, ['stand', 'neutral']],
    [b(3) + 46, ['cheer', 'happy']],
    [b(3) + 110, ['surprised', 'worried']],
  ])
  const worker = stepAt<[Pose, Mood]>(frame, [
    [0, ['cheer', 'happy']],
    [b(0) + 70, ['stand', 'happy']],
    [b(2) + 118, ['point', 'happy']],
    [b(3) + 10, ['stand', 'happy']],
    [b(3) + 116, ['surprised', 'worried']],
  ])
  const you2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 44, ['think', 'neutral']],
    [b(4) + 96, ['point', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(4) + 30, 'done'],
    [b(4) + 70, 'idle'],
  ])

  return (
    <KitScene chip="1 / 7 · Приёмка ремонта" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* комната: пол, стены, стена под покраску */}
      <rect x={S1.room.x - 20} y={S1.floorY} width={S1.room.w + 40} height={18} rx={4} fill={theme.desk} />
      <rect x={S1.room.x} y={S1.room.y} width={S1.room.w} height={S1.room.h} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <rect x={W.x} y={W.y} width={W.w} height={W.h} rx={6} fill={theme.codeBg} />
      <rect x={W.x} y={W.y} width={W.w} height={W.h * paint} rx={6} fill={theme.alt} opacity={0.3} />
      {rollerOn && <Roller x={rollerX} y={rollerY} />}
      <g opacity={pretty}>
        <Pill x={W.x + W.w / 2} y={W.y + 70} text="красиво ≠ исправно" color={theme.risk} fill={theme.paper} size={22} />
      </g>

      {/* плитка над раковиной */}
      {Array.from({ length: T.cols * T.rows }, (_, i) => {
        const cx = T.x + (i % T.cols) * T.size
        const cy = T.y + Math.floor(i / T.cols) * T.size
        return <rect key={i} x={cx + 2} y={cy + 2} width={T.size - 4} height={T.size - 4} rx={3} fill={theme.white} stroke={theme.grid} strokeWidth={2} opacity={appear(frame, tileAt(i), 6)} />
      })}

      <Sink x={S1.sink.x} top={S1.sink.top} w={S1.sink.w} floorY={S1.floorY} joint={S1.joint} cold={cold} hot={hot} flow={flow} leak={leak} frame={frame} />

      {/* лупа: осмотр всего целиком */}
      {lensOn && (
        <g opacity={lensFade}>
          <Magnifier x={lens.x} y={lens.y} />
        </g>
      )}

      {/* вы и мастер */}
      <Actor x={S1.you.x} y={S1.you.y} scale={0.85} label="Вы" enterAt={0}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Worker x={S1.worker.x} y={S1.worker.y} scale={0.85} label="Мастер" enterAt={6} pose={worker[0]} mood={worker[1]} />
      {/* реплики: пузырь из набора, указка — к макушке говорящего */}
      <g opacity={done}>
        <Callout x={S1.worker.x} y={S1.worker.y - 132} tx={S1.worker.x - 4} ty={S1.worker.y - 84} text="Готово!" />
      </g>
      <g opacity={accept}>
        <Callout x={S1.you.x} y={S1.you.y - 126} tx={S1.you.x + 2} ty={S1.you.y - 70} text="Принимаю" />
      </g>
      <g opacity={ask}>
        <Callout x={S1.you.x + 20} y={S1.you.y - 126} tx={S1.you.x + 2} ty={S1.you.y - 70} text="Что поменяли?" />
      </g>
      <g opacity={answer}>
        <Callout x={S1.worker.x - 30} y={S1.worker.y - 132} tx={S1.worker.x - 4} ty={S1.worker.y - 84} text="Трубы и кран" />
      </g>

      {/* четыре проверки приёмки */}
      {CHECKS.map((c, i) => {
        const g = appear(frame, checkAt[i])
        const tagged = i === 3 ? leakTag : appear(frame, checkAt[i] + 14)
        const x = S1.checksX[i]
        const red = i === 3 && leakTag > 0
        return (
          <g key={c.text} opacity={g} transform={`translate(0 ${(1 - g) * 10})`}>
            <Pill x={x} y={S1.checksY} text={c.text} color={red ? theme.risk : theme.accent} fill={red ? theme.riskTint : theme.paper} size={20} compact />
            <g opacity={tagged}>
              <Mark x={x + c.text.length * 5.6 + 34} y={S1.checksY} ok={c.ok} r={13} />
            </g>
          </g>
        )
      })}
      <g opacity={leakTag}>
        <Pill x={S1.joint.x - 120} y={S1.joint.y + 2} text="течёт!" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* доска 2: код от ИИ — теперь ваш */}
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.85} enterAt={b(4) - 20} pose={agent} />
      <Arrow x1={S1.agent.x + 60} y1={S1.agent.y - 60} x2={C.x - 12} y2={C.y + C.h / 2} color={theme.accent} draw={handed} />
      <g opacity={card}>
        <Card x={C.x} y={C.y} w={C.w} h={C.h} stroke={yours ? theme.accent : theme.line} fill={yours ? theme.accentTint : theme.paper}>
          <Label x={C.x + 24} y={C.y + 42} anchor="start" size={24} weight={700} color={yours ? theme.accent : theme.soft}>
            {yours ? 'Ваш код' : 'Код от ИИ'}
          </Label>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={C.x + 24 + (i % 2) * 28} y={C.y + 72 + i * 30} width={C.w - 90 - (i % 3) * 40} height={12} rx={6} fill={theme.grid} />
          ))}
        </Card>
      </g>
      <Arrow x1={C.x + C.w + 12} y1={C.y + C.h / 2} x2={S1.you2.x - 70} y2={S1.you2.y - 70} color={theme.accent} draw={interpolate(frame, [b(4) + 64, b(4) + 78], [0, 1], CLAMP)} />
      <g opacity={appear(frame, b(4) + 80)}>
        <Pill x={C.x + C.w / 2} y={C.y + C.h + 34} text="читать каждую строку" color={theme.soft} fill={theme.paper} size={20} compact />
        <line x1={C.x + C.w / 2 - 110} y1={C.y + C.h + 34} x2={C.x + C.w / 2 - 110 + 220 * strike} y2={C.y + C.h + 34} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>
      {ACTS.map((t, i) => (
        <g key={t} opacity={appear(frame, actAt[i])} transform={`translate(0 ${(1 - appear(frame, actAt[i])) * 10})`}>
          <Pill x={S1.actsX[i]} y={S1.actsY} text={t} color={theme.ok} fill={theme.okTint} size={22} />
        </g>
      ))}
      <Actor x={S1.you2.x} y={S1.you2.y} scale={0.85} label="Вы" enterAt={b(4) - 16}>
        <Person color={theme.soft} pose={you2[0]} mood={you2[1]} />
      </Actor>
      <g opacity={owner}>
        <Pill x={S1.you2.x} y={S1.you2.y - 120} text="отвечаете вы" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
    </KitScene>
  )
}
