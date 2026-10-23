import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Cloud, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { ACCEPT, ACCEPT_H, S4, TODAY } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Sheet, TickRow } from './parts'

const ID = 's4-check'
const L = S4.list
const CL = S4.cloud
const A = S4.accept

// Сцена 4 (проверьте у себя): отзывы дословно и три стопки; одна задача в четыре части — агенту
// в облачной сессии, которая идёт и без вас; пока — уточнить второй отзыв; приёмка пул-реквеста.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // что сделать у себя: строки сразу, галочки — по репликам
  const title = useAppear(b(0) + 6)
  const rowIn = TODAY.map((_, i) => b(0) + 14 + i * 10)
  const todayAt = [b(0) + 70, b(0) + 150, b(1) + 60, b(1) + 150]

  // облачная сессия
  const cloud = useAppear(b(1) + 40)
  const cloudText = useAppear(b(1) + 54)
  const always = [b(2) + 10, b(2) + 24]
  const ask = useAppear(b(2) + 96)
  // задача в четыре части уходит агенту в облако
  const sendOn = frame >= b(1) + 110 && frame < b(1) + 142
  const send = useTrack([
    [b(1) + 110, L.x + 470, L.y + 8 + 2 * L.row + 15],
    [b(1) + 140, CL.x + 120, CL.y + 112],
  ])
  const place = appear(frame, b(1) + 40, 12) * (1 - appear(frame, b(3) + 26, 8))

  // пул-реквест пришёл → приёмка
  const flyOn = frame >= b(3) && frame < b(3) + 40
  const fly = useTrack([
    [b(3), CL.x + 300, CL.y + CL.h - 14],
    [b(3) + 34, A.x + A.w - 80, A.y + 38],
  ])
  const card = useAppear(b(3) + 26)
  const tagIn = frame >= b(3) + 34
  const rowsIn = ACCEPT.map((_, i) => b(3) + 44 + i * 12)
  const acceptAt = [b(3) + 130, b(4) + 20, b(4) + 84, b(5) + 30]

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 30, ['think', 'neutral']],
    [b(0) + 160, ['stand', 'neutral']],
    [b(1) + 100, ['point', 'happy']],
    [b(2) + 90, ['think', 'neutral']],
    [b(3), ['stand', 'neutral']],
    [b(4), ['think', 'neutral']],
    [b(5) + 40, ['cheer', 'happy']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 110, ['think', 'neutral']],
    [b(3) + 20, ['point', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 120, 'working'],
    [b(3), 'done'],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать сегодня у себя */}
      <g opacity={title}>
        <Label x={L.x + 4} y={L.y - 18} anchor="start" size={24} weight={800}>
          Сегодня у себя
        </Label>
      </g>
      {TODAY.map((t, i) => (
        <g key={t} opacity={appear(frame, rowIn[i], 10)}>
          <TickRow x={L.x + 4} y={L.y + 8 + i * L.row} text={t} at={todayAt[i]} />
        </g>
      ))}

      {/* вы и Дима: второй отзыв — уточнить */}
      <Actor x={S4.you.x} y={S4.you.y} scale={0.6} label="Вы" enterAt={4}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Coach x={S4.dima.x} y={S4.dima.y} scale={0.6} label="Дима" color={theme.alt} enterAt={b(2) + 60} pose={dima[0]} mood={dima[1]} />
      <g opacity={ask}>
        <Callout x={(S4.you.x + S4.dima.x) / 2 + 60} y={S4.you.y - 82} tx={S4.you.x + 14} ty={S4.you.y - 50} text="что считать пропуском?" color={theme.soft} />
      </g>

      {/* облачная сессия: агент работает, даже если закрыть приложение */}
      <g opacity={cloud}>
        <Cloud x={CL.x} y={CL.y} w={CL.w} h={CL.h} stroke={theme.accent} fill={theme.accentTint} />
      </g>
      <g opacity={cloudText}>
        <Label x={CL.x + 320} y={CL.y + 92} size={22} color={theme.accent} weight={800}>
          облачная сессия
        </Label>
      </g>
      <g opacity={appear(frame, always[0], 10)}>
        <Label x={CL.x + 320} y={CL.y + 122} size={20} color={theme.ink} weight={600}>
          идёт, даже если
        </Label>
      </g>
      <g opacity={appear(frame, always[1], 10)}>
        <Label x={CL.x + 320} y={CL.y + 148} size={20} color={theme.ink} weight={600}>
          закрыть приложение
        </Label>
      </g>
      <Agent x={CL.x + 120} y={CL.y + 112} scale={0.45} label="" enterAt={b(1) + 60} pose={agent} />

      {sendOn && <Sheet x={send.x} y={send.y} />}

      {/* приёмка пул-реквеста: место — заранее, пунктиром */}
      <g opacity={place}>
        <Slot x={A.x} y={A.y} w={A.w} h={ACCEPT_H} text="приёмка" />
      </g>
      {flyOn && (
        <g transform={`translate(${fly.x} ${fly.y})`}>
          <Pill x={0} y={0} text="пул-реквест" color={theme.ok} fill={theme.white} size={18} compact />
        </g>
      )}
      <g opacity={card}>
        <Card x={A.x} y={A.y} w={A.w} h={ACCEPT_H} stroke={theme.ok} fill={theme.white}>
          <Label x={A.x + 24} y={A.y + 38} anchor="start" size={24} weight={800}>
            Приёмка пул-реквеста
          </Label>
          <line x1={A.x + 20} y1={A.y + A.head - 6} x2={A.x + A.w - 20} y2={A.y + A.head - 6} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {tagIn && <Pill x={A.x + A.w - 80} y={A.y + 30} text="пул-реквест" color={theme.ok} fill={theme.okTint} size={18} compact />}
      {ACCEPT.map((t, i) => (
        <g key={t} opacity={appear(frame, rowsIn[i], 10)}>
          <TickRow x={A.x + 24} y={A.y + A.head + 6 + i * A.row} text={t} at={acceptAt[i]} size={20} />
        </g>
      ))}
    </KitScene>
  )
}
