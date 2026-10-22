import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S3, TICKET, TICKET_H, TICKET_ROW, ticketPartY } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Sheet, Slot } from './parts'

const ID = 's3-vague'
const PR = S3.pr
const T = S3.ticket
const P2 = S3.pr2

// расплывчатая задача: ни критерия «готово», ни ограничений
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Почини форму подхода, сделай получше' },
  { from: 'agent', text: 'Понял! Сделаю лучше.' },
]
// догадки агента — что значит «получше»
const GUESSES = ['новый дизайн?', 'новая библиотека?', 'другой график?']
// расползшийся пул-реквест: строки по порядку появления
const SPRAWL = [
  { text: 'новая форма подхода', color: theme.alt },
  { text: 'новая библиотека форм', color: theme.alt },
  { text: 'другой вид графика', color: theme.alt },
  { text: 'старый тест ослаблен', color: theme.risk },
  { text: 'вес 52,5 → ?', color: theme.risk },
]
// маленький пул-реквест: изменённые файлы
const FILES = ['parseWeight.ts', 'parseWeight.test.ts', 'SetForm.tsx']
const VALUE_X = 300

// Сцена 3 (подводный камень): «Почини форму, сделай получше» без критерия «готово» — агент решает сам,
// пул-реквест расползается, тест ослаблен, а запятая неизвестно. Задача как заявка новичку в четыре части —
// и в ответ маленький пул-реквест ровно по задаче.
export function S3Vague() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: расплывчатая задача и догадки агента
  const chatAt = b(0) + 8
  const noCrit = useAppear(b(0) + 120)
  const away = interpolate(frame, [b(1) + 6, b(1) + 36], [0, 1], CLAMP)
  const gone = useAppear(b(1) + 30)
  const guessAt = [b(1) + 50, b(1) + 76, b(1) + 102]
  const sure = frame >= b(1) + 140

  // расползшийся пул-реквест
  const pr = useAppear(b(2) + 30)
  const statsAt = b(2) + 40
  const rowAt = [b(2) + 54, b(2) + 76, b(2) + 98, b(3) + 24, b(3) + 120]

  // доска 2: задача в четыре части и маленький пул-реквест
  const ticket = useAppear(b(4) + 30)
  const tagAt = [b(4) + 44, b(4) + 56, b(4) + 68, b(4) + 80]
  const valueAt = [[b(4) + 96], [b(4) + 136], [b(5) + 12, b(5) + 56, b(5) + 100], [b(6) + 12, b(6) + 44]]
  const flyOn = frame >= b(7) && frame < b(7) + 26
  const fly = useTrack([
    // лист вылетает от края задачи, не заходя в её рамку: там открыта горячая точка
    [b(7), T.x + T.w + 36, T.y + 60],
    [b(7) + 24, S3.agent2.x - 60, S3.agent2.y],
  ])
  const pr2In = usePop(b(7) + 50)
  const fileAt = [b(7) + 64, b(7) + 76, b(7) + 88]
  const green = useAppear(b(7) + 104)
  const timer = useAppear(b(7) + 140)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(0) + 70, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 140, 'working'],
    [b(2) + 30, 'done'],
    [b(3) + 110, 'idle'],
  ])
  const agent2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(7) + 24, 'working'],
    [b(7) + 50, 'done'],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень: «сделай получше»" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* расплывчатая задача */}
      {frame >= chatAt && <AgentChat x={S3.chat.x} y={S3.chat.y} w={S3.chat.w} at={chatAt} messages={CHAT} />}
      <g opacity={noCrit}>
        <Pill x={S3.chat.x + 235} y={348} text="нет критерия «готово»" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* вас рядом нет: вы уходите, остаётся пустое место */}
      <g opacity={gone}>
        <circle cx={S3.you.x} cy={S3.you.y - 36} r={17} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="6 5" />
        <path d={`M${S3.you.x - 31} ${S3.you.y + 49} V${S3.you.y + 7} Q${S3.you.x - 31} ${S3.you.y - 14} ${S3.you.x} ${S3.you.y - 14} Q${S3.you.x + 31} ${S3.you.y - 14} ${S3.you.x + 31} ${S3.you.y + 7} V${S3.you.y + 49}`} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="6 5" />
        <Label x={S3.you.x} y={S3.you.y + 74} size={20} color={theme.soft} weight={600}>
          вас нет рядом
        </Label>
      </g>
      <g opacity={1 - away} transform={`translate(${-away * 120} 0)`}>
        <Actor x={S3.you.x} y={S3.you.y} scale={0.7} label="Вы" enterAt={2}>
          <Person color={theme.soft} pose={you[0]} mood={you[1]} />
        </Actor>
      </g>

      {/* агент решает сам, что значит «получше» */}
      {GUESSES.map((g, i) => (
        <g key={g} opacity={appear(frame, guessAt[i], 10) * (1 - appear(frame, b(2) + 10, 12))}>
          <Pill x={S3.agent.x} y={S3.guessY[i]} text={sure ? `✓ ${g.replace('?', '')}` : g} color={theme.alt} fill={sure ? theme.altTint : theme.paper} size={20} compact />
        </g>
      ))}
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.8} enterAt={6} pose={agent} />

      {/* утром — пул-реквест на 14 файлов */}
      <g opacity={pr}>
        <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} stroke={theme.risk} fill={theme.white}>
          <Label x={PR.x + 24} y={PR.y + 42} anchor="start" size={22} weight={800}>
            Пул-реквест: «Улучшил форму»
          </Label>
          <line x1={PR.x + 20} y1={PR.y + 62} x2={PR.x + PR.w - 20} y2={PR.y + 62} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {frame >= statsAt && (
        <g opacity={appear(frame, statsAt, 8)}>
          <Mono x={PR.x + 24} y={PR.y + 100} fill={theme.ink}>
            <tspan>14 файлов  </tspan>
            <tspan fill={theme.ok}>+412</tspan>
            <tspan fill={theme.risk}> −96</tspan>
          </Mono>
        </g>
      )}
      {SPRAWL.map((r, i) => {
        const y = PR.y + 150 + i * 48
        const bad = r.color === theme.risk
        return (
          <g key={r.text} opacity={appear(frame, rowAt[i], 10)}>
            {bad ? <Mark x={PR.x + 40} y={y - 7} ok={false} r={13} /> : <circle cx={PR.x + 40} cy={y - 7} r={6} fill={r.color} />}
            <Label x={PR.x + 66} y={y} anchor="start" size={22} color={bad ? theme.risk : theme.ink} weight={bad ? 700 : 600}>
              {r.text}
            </Label>
          </g>
        )
      })}

      {/* доска 2: задача как заявка новичку — четыре части */}
      <g opacity={ticket}>
        <Card x={T.x} y={T.y} w={T.w} h={TICKET_H} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 42} anchor="start" size={24} color={theme.accent} weight={800}>
            Задача для агента
          </Label>
          <line x1={T.x + 20} y1={T.y + 58} x2={T.x + T.w - 20} y2={T.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {TICKET.map((part, i) => {
        const top = ticketPartY(i)
        const tagW = Math.round(part.tag.length * 20 * 0.56 + 28)
        return (
          <g key={part.tag} opacity={appear(frame, tagAt[i], 10)}>
            <Pill x={T.x + 24 + tagW / 2} y={top + TICKET_ROW / 2} text={part.tag} color={i === 2 ? theme.ok : theme.accent} fill={i === 2 ? theme.okTint : theme.accentTint} size={20} compact />
            {part.values.map((v, k) => {
              const y = top + k * TICKET_ROW
              const at = valueAt[i][k]
              return (
                <g key={v}>
                  {frame < at + 4 && <Slot x={T.x + VALUE_X} y={y + 6} w={T.w - VALUE_X - 24} h={TICKET_ROW - 10} color={theme.grid} />}
                  <Label x={T.x + VALUE_X + 6} y={y + 25} anchor="start" size={20} weight={600}>
                    {typed(v, frame, at, 40)}
                  </Label>
                </g>
              )
            })}
          </g>
        )
      })}

      {/* агент получает задачу — пул-реквест ровно по ней */}
      {flyOn && <Sheet x={fly.x} y={fly.y} />}
      <Agent x={S3.agent2.x} y={S3.agent2.y} scale={0.7} enterAt={b(4) + 60} pose={agent2} />
      <g opacity={timer}>
        <Pill x={S3.agent2.x + 150} y={S3.agent2.y - 10} text="20–30 минут" color={theme.ok} fill={theme.okTint} size={20} compact />
        <Label x={S3.agent2.x + 150} y={S3.agent2.y + 30} size={20} color={theme.soft} weight={600}>
          на проверку
        </Label>
      </g>
      {/* место будущего пул-реквеста — пунктиром, пока агент ждёт задачу */}
      <g opacity={appear(frame, b(4) + 60, 12) * (1 - appear(frame, b(7) + 50, 6))}>
        <Slot x={P2.x} y={P2.y} w={P2.w} h={P2.h} />
      </g>
      {frame >= b(7) + 50 && (
        <g transform={`translate(${P2.x + P2.w / 2} ${P2.y + P2.h / 2}) scale(${pr2In}) translate(${-(P2.x + P2.w / 2)} ${-(P2.y + P2.h / 2)})`}>
          <Card x={P2.x} y={P2.y} w={P2.w} h={P2.h} stroke={theme.ok} fill={theme.white}>
            <Label x={P2.x + 24} y={P2.y + 40} anchor="start" size={22} weight={800}>
              Пул-реквест: вес с запятой
            </Label>
            <Mono x={P2.x + 24} y={P2.y + 76} fill={theme.ink}>
              <tspan>3 файла  </tspan>
              <tspan fill={theme.ok}>+26</tspan>
              <tspan fill={theme.risk}> −2</tspan>
            </Mono>
          </Card>
        </g>
      )}
      {FILES.map((f, i) => (
        <g key={f} opacity={appear(frame, fileAt[i], 8)}>
          <Mono x={P2.x + 24} y={P2.y + 112 + i * 30} fill={theme.soft}>
            {f}
          </Mono>
        </g>
      ))}
      <g opacity={green}>
        <Mark x={P2.x + 38} y={P2.y + P2.h - 22} ok r={13} />
        <Label x={P2.x + 62} y={P2.y + P2.h - 15} anchor="start" size={20} color={theme.ok} weight={700}>
          проверки зелёные
        </Label>
      </g>
    </KitScene>
  )
}
