import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Database } from '../../actors/Database'
import { Packet } from '../../actors/Packet'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { CLIENTS, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Snail, Stopwatch } from './parts'

const ID = 's5-n1'
const SM = S5.small
const BG = S5.big
const LS = S5.list
const LN = S5.lane
const TR = S5.traps

// поход в базу: кадры на дорогу туда и шаг между походами
const TRIP = 12
const EVERY = 16
// ещё ловушки производительности (s52)
const TRAPS = [
  { bad: 'Вся таблица в памяти', fix: ['показывать', 'страницами'] },
  { bad: 'Нет индексов', fix: ['индекс — как', 'оглавление книги'] },
  { bad: 'Нет кэша', fix: ['хранить', 'готовые ответы'] },
]
const TOOLS = ['профилировщик', 'EXPLAIN ANALYZE', 'время ответа']

// Сцена 5: на десяти записях код работает, на миллионе тормозит — ИИ не знает объёмов. Список подопечных
// Марины ходит в базу за каждым отдельно (N+1: 10 подопечных — 11 походов); исправление — один запрос.
// Ещё ловушки: вся таблица в памяти, нет индексов, нет кэша. Сначала замер.
export function S5N1() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: десять записей и миллион
  const small = appear(frame, b(0))
  const smallRows = Math.min(10, Math.max(0, Math.floor((frame - b(0) - 10) / 3)))
  const works = appear(frame, b(0) + 46)
  const big = appear(frame, b(0) + 56)
  const bigRows = Math.min(26, Math.max(0, Math.floor((frame - b(0) - 64) / 2)))
  const million = Math.round(interpolate(frame, [b(0) + 64, b(0) + 120], [10, 1000000], CLAMP))
  const slow = appear(frame, b(0) + 120)
  const unknown = appear(frame, b(0) + 150)

  // доска 2: список, программа, база; походы по одному
  const listAt = b(1) + 20
  const tripsAt = Array.from({ length: CLIENTS.length + 1 }, (_, k) => b(1) + 44 + k * EVERY)
  const reset = frame >= b(3)
  const oneAt = b(3) + 24
  const n1Trips = tripsAt.filter((t) => frame >= t).length
  const trips = reset ? (frame >= oneAt ? 1 : 0) : n1Trips
  const counter = appear(frame, tripsAt[0])
  const verdict = appear(frame, b(2) + 50) * (1 - appear(frame, b(3), 8))
  const plates = appear(frame, b(2) + 96) * (1 - appear(frame, b(3), 8))
  const same = appear(frame, b(3) + 56)
  const tray = appear(frame, b(3) + 76)
  // данные подопечного k пришли: при N+1 — после его похода, после исправления — все сразу
  const arrived = (k: number) => (reset ? frame >= oneAt + TRIP : frame >= tripsAt[k + 1] + TRIP)

  // доска 3: ещё ловушки и замер
  const trapAt = TRAPS.map((_, i) => b(4) + 56 + i * 22)
  const first = appear(frame, b(5) + 4)
  // пока замера нет, карточки ловушек стоят по центру доски
  const trapsDown = interpolate(frame, [b(5) - 12, b(5) + 6], [S5.trapsDown, 0], CLAMP)
  const toolAt = TOOLS.map((_, i) => b(5) + 30 + i * 16)
  const toAgent = interpolate(frame, [b(5) + 84, b(5) + 100], [0, 1], CLAMP)
  const numbers = appear(frame, b(5) + 104)
  const tick = interpolate(frame, [b(5), b(5) + 160], [0, 1], CLAMP)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 100, 'working'],
  ])

  return (
    <KitScene chip="5 / 7 · Тормоза: N+1" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: 10 записей */}
      <g opacity={small}>
        <Card x={SM.x} y={SM.y} w={SM.w} h={SM.h} />
        <Label x={SM.x + 24} y={SM.y + 44} anchor="start" size={26} weight={700}>
          10 записей
        </Label>
        {Array.from({ length: smallRows }, (_, i) => (
          <rect key={i} x={SM.x + 24} y={SM.y + 70 + i * 26} width={SM.w - 48 - (i % 3) * 40} height={18} rx={5} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
        ))}
      </g>
      <g opacity={works}>
        <Pill x={SM.x + SM.w / 2 - 20} y={SM.y + SM.h + 36} text="работает" color={theme.ok} fill={theme.okTint} size={20} compact />
        <Mark x={SM.x + SM.w / 2 + 70} y={SM.y + SM.h + 36} ok r={16} />
      </g>
      {/* доска 1: миллион */}
      <g opacity={big}>
        <Card x={BG.x} y={BG.y} w={BG.w} h={BG.h} />
        <Label x={BG.x + 24} y={BG.y + 44} anchor="start" size={26} weight={700}>
          {`${million.toLocaleString('ru-RU')} записей`}
        </Label>
        {Array.from({ length: bigRows }, (_, i) => (
          <rect key={i} x={BG.x + 24 + (i % 2) * ((BG.w - 48) / 2)} y={BG.y + 68 + Math.floor(i / 2) * 20} width={(BG.w - 60) / 2} height={13} rx={4} fill={theme.grid} />
        ))}
      </g>
      <g opacity={slow}>
        <rect x={BG.x + BG.w / 2 - 110} y={BG.y + 200} width={220} height={110} rx={14} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
        <Snail x={BG.x + BG.w / 2 - 6} y={BG.y + 290} s={1.1} />
        <Pill x={BG.x + BG.w / 2} y={BG.y + BG.h + 36} text="тормозит" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={unknown}>
        <Pill x={S5.unknown.x} y={S5.unknown.y} text="объёмов ваших данных ИИ не знает" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* доска 2: список подопечных Марины */}
      {frame >= listAt && (
        <Browser x={LS.x} y={LS.y} w={LS.w} h={LS.h} at={listAt} url="подопечные">
          <text x={24} y={82} fill={theme.ink} style={{ font: `700 24px ${theme.font}` }}>
            Подопечные Марины
          </text>
          {CLIENTS.map((name, k) => {
            const x = 20 + (k % 2) * ((LS.w - 52) / 2 + 12)
            const y = 104 + Math.floor(k / 2) * 52
            const got = arrived(k)
            return (
              <g key={name}>
                <rect x={x} y={y} width={(LS.w - 52) / 2} height={42} rx={8} fill={got ? theme.okTint : theme.paper} stroke={got ? theme.ok : theme.grid} strokeWidth={2} />
                <text x={x + 14} y={y + 28} fill={theme.ink} style={{ font: `600 20px ${theme.font}` }}>
                  {name}
                </text>
                <circle cx={x + (LS.w - 52) / 2 - 20} cy={y + 21} r={7} fill={got ? theme.ok : theme.grid} />
              </g>
            )
          })}
        </Browser>
      )}
      <Arrow x1={LS.x + LS.w + 8} y1={S5.server.y} x2={S5.server.x - 56} y2={S5.server.y} color={theme.line} draw={appear(frame, listAt + 10)} />
      <g opacity={appear(frame, b(1) + 26)}>
        <Server x={S5.server.x} y={S5.server.y} scale={0.65} label="Программа" />
        <Database x={S5.db.x} y={S5.db.y} scale={0.7} label="База" />
        <line x1={LN.from} y1={LN.y + 30} x2={LN.to} y2={LN.y + 30} stroke={theme.grid} strokeWidth={3} strokeDasharray="8 8" />
      </g>
      {/* походы в базу: при N+1 — по одному на подопечного, после исправления — один */}
      {!reset &&
        tripsAt.map((t, k) => {
          const p = interpolate(frame, [t, t + TRIP], [0, 1], CLAMP)
          if (frame < t || p >= 1) return null
          return <Packet key={t} x={LN.from + (LN.to - LN.from) * p} y={LN.y} scale={0.6} text={k === 0 ? 'список' : CLIENTS[k - 1]} color={theme.risk} />
        })}
      {reset && frame >= oneAt && frame < oneAt + TRIP * 2 && <Packet x={LN.from + (LN.to - LN.from) * interpolate(frame, [oneAt, oneAt + TRIP * 2], [0, 1], CLAMP)} y={LN.y} scale={0.6} text="все 10 сразу" color={theme.ok} />}
      <g opacity={counter}>
        <Pill x={S5.counter.x} y={S5.counter.y} text={`походов в базу: ${trips}`} color={trips > 1 ? theme.risk : theme.ok} fill={trips > 1 ? theme.riskTint : theme.okTint} size={22} />
      </g>
      <g opacity={verdict}>
        <Pill x={S5.verdict.x} y={S5.verdict.y} text="N+1: 1 за списком + 10 по одному" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={plates}>
        {Array.from({ length: 10 }, (_, i) => (
          <ellipse key={i} cx={S5.plates.x - 162 + i * 36} cy={S5.plates.y} rx={14} ry={7} fill={theme.paper} stroke={theme.soft} strokeWidth={3} />
        ))}
        <Label x={S5.plates.x} y={S5.plates.y + 38} size={20} weight={600} color={theme.soft}>
          как носить тарелки по одной
        </Label>
      </g>
      <g opacity={same}>
        <Pill x={S5.verdict.x} y={S5.verdict.y} text="один запрос — ответ тот же" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={tray}>
        <rect x={S5.plates.x - 130} y={S5.plates.y - 4} width={260} height={12} rx={6} fill={theme.alt} />
        {Array.from({ length: 5 }, (_, i) => (
          <ellipse key={i} cx={S5.plates.x - 96 + i * 48} cy={S5.plates.y - 10} rx={18} ry={8} fill={theme.paper} stroke={theme.soft} strokeWidth={3} />
        ))}
        <Label x={S5.plates.x} y={S5.plates.y + 38} size={20} weight={600} color={theme.ok}>
          а это поднос: всё за раз
        </Label>
      </g>

      {/* доска 3: ещё ловушки */}
      <g transform={`translate(0 ${trapsDown})`}>
        {TRAPS.map((t, i) => {
          const x = TR.x + i * (TR.w + TR.gap)
          const a = appear(frame, trapAt[i], 10)
          return (
            <g key={t.bad} opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
              <Card x={x} y={TR.y} w={TR.w} h={TR.h} stroke={theme.risk} />
              <Mark x={x + TR.w - 30} y={TR.y + 32} ok={false} r={14} />
              <Label x={x + 22} y={TR.y + 44} anchor="start" size={23} weight={700} color={theme.risk}>
                {t.bad}
              </Label>
              <line x1={x + 22} y1={TR.y + 70} x2={x + TR.w - 22} y2={TR.y + 70} stroke={theme.grid} strokeWidth={2} />
              {t.fix.map((line, j) => (
                <Label key={line} x={x + 22} y={TR.y + 112 + j * 32} anchor="start" size={22} weight={600} color={theme.ok}>
                  {j === 0 ? `→ ${line}` : `   ${line}`}
                </Label>
              ))}
            </g>
          )
        })}
      </g>

      {/* доска 3: сначала замер */}
      <g opacity={first}>
        <Stopwatch x={S5.watch.x} y={S5.watch.y} r={66} t={tick} />
        <Pill x={S5.tools.x + 330} y={S5.tools.y - 52} text="сначала замер, потом правка" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      {TOOLS.map((t, i) => (
        <g key={t} opacity={appear(frame, toolAt[i], 10)}>
          <Pill x={S5.tools.x + 90 + i * 240} y={S5.tools.y + 10} w={220} text={t} color={theme.ink} fill={theme.paper} mono={i === 1} size={i === 1 ? 18 : 20} compact />
        </g>
      ))}
      <Arrow x1={S5.tools.x + 90 + 2 * 240 + 116} y1={S5.tools.y + 10} x2={S5.agent.x - 60} y2={S5.agent.y - 20} color={theme.accent} draw={toAgent} />
      {frame >= b(5) + 70 && <Agent x={S5.agent.x} y={S5.agent.y} scale={0.65} enterAt={b(5) + 70} pose={agent} />}
      <g opacity={numbers}>
        <Pill x={S5.tools.x + 330} y={S5.tools.y + 90} text="ИИ — цифры, а не «сделай быстрее»" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}
