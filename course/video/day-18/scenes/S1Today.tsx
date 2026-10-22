import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { DAY_PLAN, LAST30, LAST_H, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Avatar, Barbell, Bars, Panel, SetPacket, Signal } from './parts'

const ID = 's1-today'
const R = S1.room
const C = S1.coach
const L = S1.last
const PL = S1.plan
// телефон Анны в руке: маленький, (x, y) — левый верхний угол
const MINI = { x: 262, y: 300, w: 40, h: 70 }

// Сцена 1 (короткое вступление — только зачем): Анна тренируется в подвальном зале, связь мигает,
// подход не уходит к Марине; пропавший интернет — из последних 30% (глава 3); план дня.
export function S1Today() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // связь мигает: то есть, то нет; когда Анна жмёт «Сохранить», сети нет
  const blink = frame >= b(0) + 10 && Math.floor((frame - b(0) - 10) / 14) % 2 === 1 ? 1 : 0
  const net = frame < b(0) + 66 ? blink : 0
  // подход пробует уйти к Марине и застревает
  const coachIn = appear(frame, b(0) + 26, 12)
  const flyOn = frame >= b(0) + 80
  const fly = trackAt(frame, [
    [b(0) + 80, MINI.x + MINI.w / 2, MINI.y - 24],
    [b(0) + 112, S1.path.x1 + 70, S1.path.y],
  ])
  const stuck = appear(frame, b(0) + 112, 10)
  const waiting = appear(frame, b(0) + 136, 12)

  // доска 2: последние 30% и план дня (места — после переезда камеры)
  const cardIn = appear(frame, b(1) + 22, 12)
  const rowAt = LAST30.map((_, i) => b(1) + 34 + i * 10)
  const hot = appear(frame, b(1) + 90, 12)
  const slots = appear(frame, b(1) + 30, 12)
  const stepAt2 = [b(2) + 10, b(2) + 58]
  const link = appear(frame, b(2) + 44, 14)
  const sendOn = appear(frame, b(2) + 100, 12)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 40, ['cheer', 'happy']],
    [b(0) + 64, ['stand', 'neutral']],
    [b(0) + 84, ['point', 'neutral']],
    [b(0) + 120, ['think', 'worried']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 140, ['think', 'worried']],
  ])

  return (
    <KitScene chip="1 / 4 · Зачем" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* подвальный зал: Анна, штанга, связь мигает */}
      <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={16} fill={theme.zone} stroke={theme.line} strokeWidth={3} />
      <Label x={R.x + 24} y={R.y + 38} anchor="start" size={20} weight={700} color={theme.soft}>
        подвальный зал
      </Label>
      {/* ступени наверх */}
      <path d={`M${R.x + R.w} ${R.y + 150} h-34 v26 h-34 v26 h-34 v26 h-34 v26`} fill="none" stroke={theme.line} strokeWidth={3} />
      <Barbell x={S1.barbell.x} y={S1.barbell.y} />
      <Signal x={S1.signal.x} y={S1.signal.y} on={net} label={net > 0.5 ? 'есть сеть' : 'нет сети'} />
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.9} label="Анна" enterAt={2} pose={anna[0]} mood={anna[1]} />
      <g opacity={appear(frame, 10, 10)}>
        <rect x={MINI.x} y={MINI.y} width={MINI.w} height={MINI.h} rx={8} fill={theme.ink} />
        <rect x={MINI.x + 4} y={MINI.y + 8} width={MINI.w - 8} height={MINI.h - 16} rx={3} fill={theme.white} />
        <Bars x={MINI.x + MINI.w - 6} y={MINI.y + 26} on={net} s={0.8} />
      </g>

      {/* путь к Марине: подход застревает на полпути */}
      <line x1={S1.path.x1} y1={S1.path.y} x2={S1.path.x2} y2={S1.path.y} stroke={theme.line} strokeWidth={3} strokeDasharray="8 8" opacity={coachIn} />
      {flyOn && (
        <g opacity={1 - 0.5 * stuck}>
          <SetPacket x={fly.x} y={fly.y} text="5 × 50 кг" />
        </g>
      )}
      <g opacity={stuck}>
        <path d={`M${S1.path.x1 + 140} ${S1.path.y - 16} l32 32 m0 -32 l-32 32`} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
        <Label x={S1.path.x1 + 156} y={S1.path.y + 48} size={18} weight={700} color={theme.risk}>
          не дошёл
        </Label>
      </g>

      {/* экран Марины ждёт подходы */}
      <g opacity={coachIn}>
        <Panel x={C.x} y={C.y} w={C.w} h={C.h} title="Экран Марины" icon={<Avatar x={C.x + 32} y={C.y + 30} color={theme.accent} letter="М" />}>
          <Label x={C.x + 20} y={C.y + 88} anchor="start" size={20} weight={600} color={theme.soft}>
            Анна · присед · сегодня
          </Label>
          <Slot x={C.x + 20} y={C.y + 110} w={C.w - 40} h={84} text="подходов пока нет" color={waiting > 0 ? theme.risk : theme.line} />
        </Panel>
      </g>
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.9} label="Марина" color={theme.accent} enterAt={b(0) + 34} pose={marina[0]} mood={marina[1]} />

      {/* доска 2: последние 30% — что ИИ часто упускает */}
      <g opacity={cardIn}>
        <Panel x={L.x} y={L.y} w={L.w} h={LAST_H} title="Последние 30%">
          <Label x={L.x + L.w - 20} y={L.y + 38} anchor="end" size={20} weight={600} color={theme.soft}>
            что ИИ часто упускает
          </Label>
          {LAST30.map((name, i) => {
            const y = L.y + L.head + i * L.row
            const on = i === 0 ? hot : 0
            return (
              <g key={name} opacity={appear(frame, rowAt[i], 10)}>
                <rect x={L.x + 16} y={y} width={L.w - 32} height={L.rowH} rx={10} fill={on > 0 ? theme.riskTint : theme.paper} stroke={on > 0 ? theme.risk : theme.grid} strokeWidth={on > 0 ? 3 : 2} />
                <Label x={L.x + 36} y={y + 35} anchor="start" size={22} weight={700} color={on > 0 ? theme.ink : theme.soft}>
                  {name}
                </Label>
              </g>
            )
          })}
          <g opacity={hot}>
            <Pill x={L.x + L.w - 118} y={L.y + L.head + L.rowH / 2} w={186} text="пропал интернет" color={theme.risk} fill={theme.white} size={20} compact />
          </g>
        </Panel>
      </g>

      {/* план дня: места — пунктиром, карточки — по реплике */}
      {DAY_PLAN.map((p, i) => (
        <g key={p.title}>
          <g opacity={slots * (1 - appear(frame, stepAt2[i], 6))}>
            <Slot x={PL.x} y={PL.y[i]} w={PL.w} h={PL.h} text={`шаг ${i + 1}`} />
          </g>
          <g opacity={appear(frame, stepAt2[i], 12)}>
            <Card x={PL.x} y={PL.y[i]} w={PL.w} h={PL.h} stroke={i === 0 ? theme.alt : theme.ok} fill={theme.white}>
              <circle cx={PL.x + 50} cy={PL.y[i] + PL.h / 2} r={26} fill={i === 0 ? theme.alt : theme.ok} />
              <Label x={PL.x + 50} y={PL.y[i] + PL.h / 2 + 9} size={26} weight={800} color={theme.white}>
                {String(i + 1)}
              </Label>
              <Label x={PL.x + 96} y={PL.y[i] + 60} anchor="start" size={26} weight={800}>
                {p.title}
              </Label>
              <Label x={PL.x + 96} y={PL.y[i] + 96} anchor="start" size={20} weight={600} color={theme.soft}>
                {p.sub}
              </Label>
              <Bars x={PL.x + PL.w - 24} y={PL.y[i] + 40} on={i === 0 ? 0 : sendOn} s={1.3} />
            </Card>
          </g>
        </g>
      ))}
      <Arrow x1={PL.x + 50} y1={PL.y[0] + PL.h + 8} x2={PL.x + 50} y2={PL.y[1] - 8} color={theme.ok} draw={link} />
    </KitScene>
  )
}
