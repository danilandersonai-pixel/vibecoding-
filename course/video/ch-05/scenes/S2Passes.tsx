import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { BAR, EDITOR_PAD, LH } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { PHONE_SCALE, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { PassTab, type TabState } from './parts'

const ID = 's2-passes'
const F = S2.files
const I = S2.iface
const E = S2.editor

const TABS = ['1 · Обзор', '2 · Интерфейс', '3 · Трассировка', '4 · Края']
// изменённые файлы: что в них и по задаче ли это
const FILES = [
  { name: 'volume.ts', note: 'подсчёт объёма', ok: true },
  { name: 'package.json', note: '+ библиотека', ok: false },
  { name: 'lint.config', note: 'проверка выкл.', ok: false },
]
// интерфейс функции: три вопроса
const IFACE = ['берёт: список подходов', 'отдаёт: объём в кг', 'побочных эффектов: нет']
// код от агента: все повторы × средний вес с учётом повторов (kg — сумма «повторы × вес» по подходам);
// считает верно, но на пустой тренировке средний вес — это 0 / 0
const CODE = ['function totalVolume(sets) {', "  const reps = sum(sets, 'reps')", '  const kg = sets.reduce(addLoad, 0)', '  const avg = kg / reps', '  return reps * avg', '}']
// значения по строкам 2–5: у Анны и у пустой тренировки
const ANNA = ['30', '1500', '50', '1500']
const EMPTY = ['0', '0', '0 / 0', 'NaN']
const EDGES = ['пусто', '1000 кг', 'вес: ничего', 'нажал дважды']

// центр строки n редактора (с 1) по вертикали
const lineY = (n: number) => E.y + BAR + EDITOR_PAD + (n - 1) * LH + LH / 2

// Сцена 2: четыре прохода по изменению агента (рис. 5.1): обзор файлов, интерфейс функции,
// трассировка сценария Анны (1500 кг — сошлось) и края: пустая тренировка даёт «не число».
export function S2Passes() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // плашки проходов: какая сейчас идёт
  const tabStart = [b(1), b(2), b(3), b(5)]
  const tabEnd = [b(2), b(3), b(5), b(6) + 60]
  const tabState = (i: number): TabState => (frame >= tabEnd[i] ? 'done' : frame >= tabStart[i] ? 'now' : 'wait')

  // доска 1: агент и задача, список файлов, проверка обзора
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(0) + 70, 'done'],
  ])
  const agentOut = interpolate(frame, [b(2) - 4, b(2) + 8], [1, 0], CLAMP)
  const task = appear(frame, b(0) + 40)
  const rowAt = FILES.map((_, i) => b(0) + 60 + i * 10)
  const verdictAt = [b(1) + 24, b(1) + 60, b(1) + 92]
  const offTask = appear(frame, b(1) + 120)

  // интерфейс: вход → функция → выход, три вопроса
  const ioIn = [b(2) + 10, b(2) + 22, b(2) + 34].map((at) => appear(frame, at))
  const ioArrows = [b(2) + 18, b(2) + 30].map((at) => interpolate(frame, [at, at + 10], [0, 1], CLAMP))
  const askAt = IFACE.map((_, i) => b(2) + 50 + i * 26)

  // доска 2: телефон Анны, данные летят в код, проход по строкам
  const tapAt = b(3) + 50
  const packet = trackAt(frame, [
    [tapAt + 6, S2.phone.x, S2.phone.y - 110],
    [tapAt + 30, E.x + E.w / 2, E.y - 22],
  ])
  const packetOn = frame >= tapAt + 4 && frame < tapAt + 44
  const expect = appear(frame, tapAt + 40, 8)
  const stepAtLine = [b(4) + 10, b(4) + 38, b(4) + 66, b(4) + 94]
  const traceOn = frame >= stepAtLine[0] && frame < b(4) + 128
  const traceLine = stepAt(frame, stepAtLine.map((at, i) => [at, i + 2] as [number, number]))
  const sum = appear(frame, b(4) + 120)

  // края: четыре пробы, пустая тренировка ломает расчёт
  const edgeAt = EDGES.map((_, i) => b(5) + 20 + i * 16)
  const emptyOn = frame >= b(6) + 4
  const emptyAt = [b(6) + 20, b(6) + 34, b(6) + 48, b(6) + 62]
  const toCode = interpolate(frame, [b(6) + 6, b(6) + 18], [0, 1], CLAMP)
  const nan = appear(frame, b(6) + 72)
  const drip = (frame % 24) / 24

  // какие значения сейчас справа от кода
  const values = emptyOn ? EMPTY : ANNA
  const valueAt = emptyOn ? emptyAt : stepAtLine

  return (
    <KitScene
      chip="2 / 7 · Четыре прохода"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        <g>
          {TABS.map((t, i) => (
            <g key={t} opacity={appear(frame, b(0) + 20 + i * 8)}>
              <PassTab x={S2.tabs.xs[i]} y={S2.tabs.y} w={S2.tabs.w} h={S2.tabs.h} text={t} state={tabState(i)} />
            </g>
          ))}
        </g>
      }
    >
      {/* доска 1: задача и агент */}
      <g opacity={task}>
        <Pill x={S2.task.x} y={S2.task.y} text="задача: подсчёт объёма" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={agentOut}>
        <Agent x={960} y={380} scale={0.85} enterAt={b(0)} pose={agent} />
      </g>

      {/* обзор: какие файлы задеты */}
      {frame >= rowAt[0] - 8 && (
        <Window
          x={F.x}
          y={F.y}
          w={F.w}
          h={BAR + FILES.length * F.row + 12}
          at={rowAt[0] - 8}
          bar={
            <text x={18} y={BAR / 2 + 7} fill={theme.ink} style={{ font: `600 20px ${theme.font}` }}>
              Изменения · 3 файла
            </text>
          }
        >
          {FILES.map((f, i) => {
            const top = BAR + 6 + i * F.row
            const judged = appear(frame, verdictAt[i])
            return (
              <g key={f.name} opacity={appear(frame, rowAt[i])}>
                <rect x={8} y={top} width={F.w - 16} height={F.row - 8} rx={8} fill={f.ok ? theme.okTint : theme.riskTint} opacity={judged} />
                <Mono x={22} y={top + 36} fill={theme.ink}>
                  {f.name}
                </Mono>
                <Label x={F.w - 70} y={top + 35} anchor="end" size={20} weight={600} color={f.ok ? theme.ok : theme.risk}>
                  {f.note}
                </Label>
                <g opacity={judged}>
                  <Mark x={F.w - 38} y={top + (F.row - 8) / 2} ok={f.ok} />
                </g>
              </g>
            )
          })}
        </Window>
      )}
      <g opacity={offTask}>
        <Pill x={F.x + F.w / 2} y={F.y + BAR + FILES.length * F.row + 52} text="два файла — не по задаче" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* интерфейс: что берёт, что отдаёт, что делает попутно */}
      <g opacity={ioIn[0]}>
        <Pill x={I.x + 70} y={I.y + 40} text="подходы" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <Arrow x1={I.x + 128} y1={I.y + 40} x2={I.x + 168} y2={I.y + 40} color={theme.ink} draw={ioArrows[0]} />
      <g opacity={ioIn[1]}>
        <rect x={I.x + 176} y={I.y + 8} width={234} height={64} rx={14} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
        <text x={I.x + 293} y={I.y + 48} textAnchor="middle" fill={theme.accent} style={{ font: `700 21px ${theme.mono}` }}>
          totalVolume
        </text>
      </g>
      <Arrow x1={I.x + 414} y1={I.y + 40} x2={I.x + 454} y2={I.y + 40} color={theme.ink} draw={ioArrows[1]} />
      <g opacity={ioIn[2]}>
        <Pill x={I.x + 500} y={I.y + 40} text="кг" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {IFACE.map((t, i) => (
        <g key={t} opacity={appear(frame, askAt[i])}>
          <Label x={I.x + 30} y={I.y + 150 + i * 56} anchor="start" size={22} weight={600}>
            {typed(t, frame, askAt[i], 40)}
          </Label>
          <g opacity={appear(frame, askAt[i] + 22)}>
            <Mark x={I.x + I.w - 20} y={I.y + 143 + i * 56} ok />
          </g>
        </g>
      ))}
      <g opacity={appear(frame, askAt[2] + 34)}>
        <Label x={I.x + 30} y={I.y + 150 + 3 * 56} anchor="start" size={18} weight={500} color={theme.soft}>
          побочный эффект — скажем, запись в файл
        </Label>
      </g>

      {/* доска 2: трассировка — Анна сохраняет три подхода */}
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} enterAt={b(3) + 10}>
        <PhoneScreen tapAt={tapAt} listAt={b(3) + 30} list={['1 · 10 × 50', '2 · 10 × 50', '3 · 10 × 50']} label="Сохранить" />
      </Phone>
      <g opacity={appear(frame, b(3) + 20)}>
        <Pill x={S2.phone.x} y={528} text="Анна" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {frame >= b(3) + 30 && <Editor x={E.x} y={E.y} w={E.w} at={b(3) + 30} file="volume.ts" lines={CODE} />}
      {packetOn && <Pill x={packet.x} y={packet.y} text="3 × 10 × 50 кг" color={theme.accent} fill={theme.paper} size={20} compact />}
      <g opacity={expect * (emptyOn ? 0 : 1)}>
        <Pill x={E.x + E.w / 2} y={E.y - 22} text="ждём 1500 кг" color={theme.accent} fill={theme.paper} size={20} compact />
      </g>
      {/* указатель текущей строки */}
      {traceOn && <path d={`M${E.x - 24} ${lineY(traceLine) - 11} L${E.x - 6} ${lineY(traceLine)} L${E.x - 24} ${lineY(traceLine) + 11} Z`} fill={theme.alt} />}
      {values.map((v, i) => (
        <g key={`${emptyOn}-${i}`} opacity={appear(frame, valueAt[i], 8)}>
          <text x={S2.valueX} y={lineY(i + 2) + 7} fill={emptyOn ? theme.risk : theme.alt} style={{ font: `700 20px ${theme.mono}` }}>
            {`→ ${v}`}
          </text>
        </g>
      ))}
      <g opacity={sum * (emptyOn ? 0 : 1)}>
        <Pill x={E.x + E.w / 2} y={E.y + 290} text="1500 кг — как ждали" color={theme.ok} fill={theme.okTint} size={22} />
      </g>

      {/* края: четыре пробы */}
      {EDGES.map((t, i) => {
        const hot = i === 0 && emptyOn
        return (
          <g key={t} opacity={appear(frame, edgeAt[i])} transform={`translate(0 ${(1 - appear(frame, edgeAt[i])) * 10})`}>
            <Pill x={S2.edges.x} y={S2.edges.y + i * S2.edges.dy} w={S2.edges.w - 70} text={t} color={hot ? theme.risk : theme.accent} fill={hot ? theme.riskTint : theme.paper} size={22} />
          </g>
        )
      })}
      <Arrow x1={S2.edges.x - (S2.edges.w - 70) / 2 - 6} y1={S2.edges.y} x2={S2.valueX + 92} y2={lineY(2) - 4} color={theme.risk} draw={toCode} />
      <g opacity={nan}>
        <Pill x={E.x + E.w / 2} y={E.y + 290} text="NaN — «не число»" color={theme.risk} fill={theme.riskTint} size={22} />
        <path d={`M${E.x + E.w / 2 + 134} ${E.y + 270 + drip * 22} q11 17 0 25 q-11 -8 0 -25 Z`} fill={theme.accent} opacity={1 - drip * 0.5} />
      </g>
    </KitScene>
  )
}
