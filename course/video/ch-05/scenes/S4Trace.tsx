import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Checklist } from '../../kit/screens/Checklist'
import { Diff, type DiffLine } from '../../kit/screens/Diff'
import { BAR, DIFF_PAD, LH } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { PHONE_FONT, PHONE_SCALE, S4, TRACE_ROW } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { TraceWindow, type TraceLine } from './parts'

const ID = 's4-trace'
const TR = S4.trace

// стектрейс: что случилось, первая строка своего файла, строки чужих библиотек
const TRACE: TraceLine[] = [
  { text: 'TypeError: sets is undefined', kind: 'err' },
  { text: '  at totalVolume (src/volume.ts:2)', kind: 'mine' },
  { text: '  at History (src/history.tsx:21)', kind: 'out' },
  { text: '  at render (node_modules/react/…)', kind: 'lib' },
  { text: '  at run (node_modules/react/…)', kind: 'lib' },
]
// пометки: строка стектрейса (с 0) и пояснение справа
const NOTES = [
  { row: 0, text: '1 · подходов нет' },
  { row: 1, text: '2 · искать здесь' },
  { row: 3, text: '3 · чужое — мимо' },
]
const GIVE = ['текст ошибки целиком', 'что ждали и что вышло', 'шаги до ошибки', 'что уже пробовали', 'недавние правки']
// заплатка: модель прячет симптом вместо поиска причины
const PATCH: DiffLine[] = [
  { text: 'function totalVolume(sets) {', kind: 'same' },
  { text: '  if (!sets) return 0', kind: 'add' },
  { text: "  const reps = sum(sets, 'reps')", kind: 'same' },
]
const CYCLE = ['повторить', 'сузить', 'гипотезы', 'проверить', 'исправить причину']
const CYCLE_W = CYCLE.map((t) => Math.round(t.length * 20 * 0.56 + 28))
const CYCLE_GAP = 44
// центры плашек порядка отладки: ряд по центру доски 3
const CYCLE_LEFT = S4.patch.x + 600 - (CYCLE_W.reduce((sum, w) => sum + w, 0) + CYCLE_GAP * (CYCLE.length - 1)) / 2
const cycleX = CYCLE_W.map((w, i) => CYCLE_LEFT + CYCLE_W.slice(0, i).reduce((sum, v) => sum + v + CYCLE_GAP, 0) + w / 2)

// центр строки стектрейса i (с 0) по вертикали
const rowY = (i: number) => TR.y + BAR + 16 + i * TRACE_ROW + TRACE_ROW / 2

// Сцена 4: отладка по стектрейсу (рис. 5.2): верхняя строка — что случилось, первая строка своего файла —
// где искать, node_modules — мимо. ИИ — всё целиком и запрет исправлять сразу; причина, а не симптом (рис. 5.3).
export function S4Trace() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: Олег открывает историю — ошибка; кто ведёт отладку
  const tapAt = b(0) + 30
  const crash = appear(frame, tapAt + 14, 6)
  const roles = appear(frame, b(0) + 90)
  const noteAt = [b(1) + 50, b(2) + 20, b(2) + 64]
  const mark = appear(frame, b(2) + 20)
  const traceAt = b(1) - 10
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 100, ['point', 'neutral']],
    [b(1) + 40, ['think', 'neutral']],
    [b(2) + 30, ['point', 'happy']],
  ])
  const helper = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 110, 'working'],
  ])

  // доска 2: что дать ИИ, запрос без исправлений
  const listAt = b(3) + 30
  const chatAt = b(4) + 6
  const pasteAt = b(3) + 56
  const pasteOut = interpolate(frame, [chatAt - 10, chatAt], [1, 0], CLAMP)
  const whole = appear(frame, b(3) + 80)
  const ranked = appear(frame, b(4) + 120)

  // доска 3: заплатка против причины, порядок отладки
  const patchAt = b(5) + 20
  const patchBad = appear(frame, b(5) + 50)
  const cause = appear(frame, b(5) + 70)
  const cycleAt = CYCLE.map((_, i) => b(5) + 96 + i * 12)
  const back = interpolate(frame, [b(5) + 160, b(5) + 176], [0, 1], CLAMP)
  const patchY = S4.patch.y + BAR + DIFF_PAD + LH + LH / 2

  return (
    <KitScene chip="4 / 7 · Стектрейс и причина" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: телефон Олега — экран ошибки */}
      <Phone x={S4.phone.x} y={S4.phone.y} scale={PHONE_SCALE} enterAt={0}>
        <PhoneScreen tapAt={tapAt} listAt={tapAt + 12} list={[]} label="История">
          <g opacity={crash}>
            <rect x={-50} y={-48} width={100} height={130} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} />
            <circle cx={0} cy={-8} r={18} fill={theme.risk} />
            <text y={-1} textAnchor="middle" fill={theme.white} style={{ font: `800 ${PHONE_FONT * 1.6}px ${theme.font}` }}>
              !
            </text>
            <text y={36} textAnchor="middle" fill={theme.risk} style={{ font: `700 ${PHONE_FONT}px ${theme.font}` }}>
              Ошибка
            </text>
          </g>
        </PhoneScreen>
      </Phone>
      <g opacity={appear(frame, 6)}>
        <Pill x={S4.phone.x} y={522} text="Олег" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* стектрейс с пометками */}
      {frame >= traceAt && <TraceWindow x={TR.x} y={TR.y} w={TR.w} at={traceAt} lines={TRACE} row={TRACE_ROW} frame={frame} mark={mark} />}
      {NOTES.map((n, i) => {
        const g = appear(frame, noteAt[i])
        const y = rowY(n.row)
        const color = i === 2 ? theme.soft : i === 1 ? theme.alt : theme.risk
        return (
          <g key={n.text} opacity={g}>
            <circle cx={S4.markX} cy={y} r={15} fill={theme.paper} stroke={color} strokeWidth={3} />
            <text x={S4.markX} y={y + 7} textAnchor="middle" fill={color} style={{ font: `700 19px ${theme.font}` }}>
              {i + 1}
            </text>
            <Label x={S4.notesX} y={y + 7} anchor="start" size={20} weight={700} color={color}>
              {n.text}
            </Label>
          </g>
        )
      })}

      {/* кто ведёт отладку */}
      <g opacity={roles}>
        <Actor x={560} y={484} scale={0.6} label="Вы ведёте">
          <Person color={theme.soft} pose={you[0]} mood={you[1]} />
        </Actor>
        <Agent x={860} y={484} scale={0.6} label="ИИ помогает" pose={helper} />
      </g>

      {/* доска 2: что дать ИИ */}
      <g opacity={appear(frame, listAt - 6)}>
        <Label x={S4.list.x} y={S4.list.y - 18} anchor="start" size={24} weight={700}>
          Что дать ИИ
        </Label>
      </g>
      {frame >= listAt && <Checklist x={S4.list.x} y={S4.list.y} w={S4.list.w} at={listAt} items={GIVE} done={GIVE.length} />}
      {frame >= pasteAt && frame < chatAt && (
        <g opacity={pasteOut}>
          <TraceWindow x={S4.chat.x} y={S4.chat.y + 20} w={S4.chat.w} at={pasteAt} lines={TRACE} row={TRACE_ROW} frame={frame} mark={0} />
          <g opacity={whole}>
            <Pill x={S4.chat.x + S4.chat.w / 2} y={S4.chat.y + 300} text="весь текст, а не пересказ" color={theme.ok} fill={theme.okTint} size={22} />
          </g>
        </g>
      )}
      {frame >= chatAt && (
        <AgentChat
          x={S4.chat.x}
          y={S4.chat.y}
          w={S4.chat.w}
          at={chatAt}
          messages={[
            { from: 'me', text: 'Код пока не трогай. Назови до трёх причин и как проверить каждую' },
            { from: 'agent', text: '1. Поле переименовали — проверю логом. 2. База вернула пусто — тестом. 3. Старая сборка — командой.' },
          ]}
        />
      )}
      <g opacity={ranked}>
        <Pill x={S4.chat.x + S4.chat.w / 2} y={452} text="по вероятности · проверка одним действием" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* доска 3: заплатка на симптом против поиска причины */}
      {frame >= patchAt && <Diff x={S4.patch.x} y={S4.patch.y} w={S4.patch.w} at={patchAt} lines={PATCH} />}
      <g opacity={patchBad}>
        {/* пластырь поверх строки-заплатки */}
        <g transform={`rotate(-8 ${S4.patch.x + 420} ${patchY})`}>
          <rect x={S4.patch.x + 360} y={patchY - 16} width={120} height={32} rx={14} fill={theme.altTint} stroke={theme.alt} strokeWidth={3} />
          <rect x={S4.patch.x + 400} y={patchY - 12} width={40} height={24} rx={4} fill={theme.paper} stroke={theme.alt} strokeWidth={2} />
        </g>
        <Pill x={S4.patch.x + S4.patch.w / 2} y={S4.patch.y + 214} text="заплатка на симптом" color={theme.risk} fill={theme.riskTint} size={22} />
        <Mark x={S4.patch.x + S4.patch.w / 2 + 160} y={S4.patch.y + 214} ok={false} r={16} />
      </g>
      <g opacity={cause}>
        <Card x={S4.cause.x} y={S4.cause.y} w={S4.cause.w} h={S4.cause.h} stroke={theme.ok}>
          <Label x={S4.cause.x + 28} y={S4.cause.y + 50} anchor="start" size={24} weight={700} color={theme.ok}>
            Причина
          </Label>
          <Label x={S4.cause.x + 28} y={S4.cause.y + 100} anchor="start" size={22} weight={600}>
            почему подходов нет?
          </Label>
          <Label x={S4.cause.x + 28} y={S4.cause.y + 140} anchor="start" size={20} weight={500} color={theme.soft}>
            найти, где они пропали, — потом чинить
          </Label>
        </Card>
        <Mark x={S4.cause.x + S4.cause.w - 36} y={S4.cause.y + 42} ok r={16} />
      </g>
      {CYCLE.map((t, i) => {
        const g = appear(frame, cycleAt[i])
        const last = i === CYCLE.length - 1
        return (
          <g key={t} opacity={g}>
            <Pill x={cycleX[i]} y={S4.cycleY} w={CYCLE_W[i]} text={t} color={last ? theme.ok : theme.accent} fill={last ? theme.okTint : theme.paper} size={20} compact />
            {i > 0 && <Arrow x1={cycleX[i - 1] + CYCLE_W[i - 1] / 2 + 6} y1={S4.cycleY} x2={cycleX[i] - CYCLE_W[i] / 2 - 6} y2={S4.cycleY} color={theme.ink} draw={g} />}
          </g>
        )
      })}
      <g opacity={back}>
        <path d={`M${cycleX[4]} ${S4.cycleY + 20} V${S4.cycleY + 46} H${cycleX[0]} V${S4.cycleY + 26}`} fill="none" stroke={theme.risk} strokeWidth={3} strokeDasharray="8 6" />
        <path d={`M${cycleX[0]} ${S4.cycleY + 20} l-7 12 h14 Z`} fill={theme.risk} />
        <Label x={(cycleX[0] + cycleX[4]) / 2} y={S4.cycleY + 74} size={18} weight={600} color={theme.risk}>
          не ушла — новый круг
        </Label>
      </g>
    </KitScene>
  )
}
