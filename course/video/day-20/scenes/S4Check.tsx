import { useCurrentFrame } from 'remotion'
import { Agent } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Cloud, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { levelColor, QUEUE_H, queue, REMARKS, S4, TODAY } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { RemarkRow, TickRow } from './parts'

const ID = 's4-check'
const CK = S4.check
const Q = S4.queue
const CL = S4.cloud
const QUEUE = queue(REMARKS)
const qRowTop = (i: number) => Q.y + Q.head + i * Q.row

type Status = { text: string; color: string; fill: string }
const OK = (text: string): Status => ({ text, color: theme.ok, fill: theme.okTint })

// Сцена 4 (проверьте у себя): тот же круг на своём списке — ступени, шаги до беды, тест красный,
// агенту — до зелёного (можно и фоновому, как в день 8), один коммит и выкладка, тренер повторил —
// следующее. Справа очередь примера: Ксения уже подтвердила, отчёт Кирилла проходит круг, потом — дата.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // что сделать у себя: строки сразу, галочки — по репликам
  const title = useAppear(b(0) + 4)
  const rowIn = TODAY.map((_, i) => b(0) + 10 + i * 8)
  const tickAt = [b(0) + 120, b(1) + 100, b(2) + 120, b(3) + 150, b(4) + 150, b(5) + 20]

  // очередь примера — после отъезда камеры (b(1) + 24)
  const queueIn = useAppear(b(1) + 26)
  const qRowAt = QUEUE.map((_, i) => b(1) + 34 + i * 8)
  const topGlow = appear(frame, b(1) + 60, 10)
  // статус отчёта Кирилла по шагам круга
  const kirillStatus = stepAt<Status | null>(frame, [
    [0, null],
    [b(2) + 44, { text: 'пишем тест', color: theme.soft, fill: theme.paper }],
    [b(2) + 120, { text: 'тест ✗', color: theme.risk, fill: theme.riskTint }],
    [b(3) + 160, OK('тест ✓')],
    [b(4) + 60, OK('выложено')],
    [b(5) + 50, OK('подтвердил')],
  ])
  const kirillDone = appear(frame, b(5) + 50, 14)
  const nextUp = useAppear(b(5) + 84)

  // фоновый агент в облачной сессии
  const cloud = useAppear(b(3) + 20)
  const cloudSub = useAppear(b(3) + 120)
  const kirillSay = useAppear(b(5) + 20)

  const kirill = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(5) + 20, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать сегодня у себя */}
      <g opacity={title}>
        <Label x={CK.x + 4} y={CK.y + 30} anchor="start" size={24} weight={800}>
          Сегодня у себя
        </Label>
      </g>
      {TODAY.map((t, i) => (
        <g key={t} opacity={appear(frame, rowIn[i], 10)}>
          <TickRow x={CK.x + 4} y={CK.y + CK.head + i * CK.row} text={t} at={tickAt[i]} />
        </g>
      ))}

      {/* очередь примера: по ступеням, сверху вниз */}
      <g opacity={queueIn}>
        <Card x={Q.x} y={Q.y} w={Q.w} h={QUEUE_H} stroke={theme.line} fill={theme.white}>
          <Label x={Q.x + 24} y={Q.y + 38} anchor="start" size={24} weight={800}>
            Очередь исправлений
          </Label>
          <line x1={Q.x + 20} y1={Q.y + Q.head - 4} x2={Q.x + Q.w - 20} y2={Q.y + Q.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {QUEUE.map((r, i) => {
        const top = qRowTop(i)
        const c = levelColor(r.level)
        const struck = i === 0 ? 1 : i === 1 ? kirillDone : 0
        const status: Status | null = i === 0 ? OK('подтвердила') : i === 1 ? kirillStatus : i === 2 && nextUp > 0 ? { text: 'в работе', color: theme.accent, fill: theme.accentTint } : null
        const glow = i === 1 ? topGlow * (1 - kirillDone) : i === 2 ? nextUp : 0
        return (
          <g key={r.id} opacity={appear(frame, qRowAt[i], 10)}>
            {i > 0 && <line x1={Q.x + 20} y1={top} x2={Q.x + Q.w - 20} y2={top} stroke={theme.grid} strokeWidth={1.5} />}
            <rect x={Q.x + 8} y={top + 4} width={Q.w - 16} height={Q.row - 8} rx={8} fill={theme.accentTint} opacity={glow} />
            <circle cx={Q.x + 32} cy={top + Q.row / 2} r={13} fill={c.color} />
            <Label x={Q.x + 32} y={top + Q.row / 2 + 6} size={18} weight={800} color={theme.white}>
              {String(r.level)}
            </Label>
            <RemarkRow x={Q.x + 58} y={top + Q.row / 2 + 7} who={r.who} text={r.text} nameW={92} struck={struck} />
            {status && <Pill x={Q.x + Q.w - 84} y={top + Q.row / 2} text={status.text} color={status.color} fill={status.fill} size={18} compact />}
          </g>
        )
      })}

      {/* такую задачу — и фоновому агенту в облачной сессии, как в день 8 */}
      <g opacity={cloud}>
        <Cloud x={CL.x} y={CL.y} w={CL.w} h={CL.h} stroke={theme.accent} fill={theme.accentTint} />
        <Label x={CL.x + 204} y={CL.y + 62} size={20} weight={800} color={theme.accent}>
          облачная сессия
        </Label>
      </g>
      <g opacity={cloudSub}>
        <Label x={CL.x + 204} y={CL.y + 88} size={18} weight={600} color={theme.ink}>
          «готово» — тест зелёный
        </Label>
      </g>
      <Agent x={CL.x + 70} y={CL.y + 66} scale={0.34} label="" enterAt={b(3) + 30} pose={frame >= b(3) + 160 ? 'done' : 'working'} />

      {/* Кирилл повторяет то, что у него ломалось */}
      <Coach x={S4.kirill.x} y={S4.kirill.y} scale={0.5} label="Кирилл" color={theme.ink} enterAt={b(4) + 110} pose={kirill[0]} mood={kirill[1]} />
      <g opacity={kirillSay}>
        <Callout x={S4.kirillSay.x} y={S4.kirillSay.y} tx={S4.kirill.x - 20} ty={S4.kirill.y - 30} text="Отчёт открылся!" color={theme.ok} />
      </g>
    </KitScene>
  )
}
