import { interpolate, useCurrentFrame } from 'remotion'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Card, Label } from '../../kit/parts'
import { stepAt, typed } from '../../kit/reveal'
import { Checklist } from '../../kit/screens/Checklist'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { clamp } from './motion'
import { Plane, Ring, Tag, You } from './parts'

const ID = 's6-pay'
const SUB = S6.sub
const API = S6.api
const W = S6.week
const R = S6.ring
const TM = S6.term
const TP = S6.tip
const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
// расход недельного лимита к концу каждого дня (доля)
const WEEK = [0.1, 0.22, 0.31, 0.44, 0.52, 0.6, 0.66]
const RECAP = ['режим — по цене ошибки', 'за посадку отвечаете вы', 'намерение: цель, рамки, «готово»', 'модель — по карточке', 'бенчмарки — с оговорками', 'мини-набор из 5–10 задач', 'подписка: окно 5 часов и неделя']

// Значок гантели (абонемент в зал) с центром (x, y).
function Dumbbell({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      <rect x={-22} y={-3} width={44} height={6} />
      <rect x={-30} y={-14} width={9} height={28} rx={2} />
      <rect x={21} y={-14} width={9} height={28} rx={2} />
    </g>
  )
}

// Сцена 6: подписка — как абонемент в зал, API — как такси со счётчиком; лимит Claude — окно в пять часов
// и недельный поверх, общий для чата и Claude Code, остаток — /usage; совет; итог ролика.
export function S6Pay() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: два способа платить
  const cards = [useAppear(b(0) + 10), useAppear(b(0) + 24)]
  const gym = useAppear(b(0) + 90)
  const monthly = useAppear(b(1) + 20)
  const pro = useAppear(b(1) + 50)
  const max = useAppear(b(1) + 75)
  const limitFill = interpolate(frame, [b(1) + 100, b(1) + 140], [0, 0.7], clamp)
  const taxi = useAppear(b(2) + 10)
  const meter = interpolate(frame, [b(2) + 30, b(2) + 150], [0, 3.6], clamp)
  const noCap = useAppear(b(2) + 110)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(1) + 50, ['stand', 'happy']],
    [b(2), ['point', 'neutral']],
    [b(2) + 110, ['surprised', 'worried']],
  ])

  // доска 2: окно в пять часов тратится и обновляется; неделя копится поверх
  const frameIn = useAppear(b(3) + 6)
  const used = interpolate(frame, [b(3) + 20, b(3) + 75, b(3) + 95, b(3) + 125], [0, 0.75, 0.75, 0], clamp)
  const refresh = interpolate(frame, [b(3) + 90, b(3) + 98, b(3) + 135, b(3) + 145], [0, 1, 1, 0], clamp)
  const weekIn = useAppear(b(3) + 60)
  const days = Math.max(0, Math.min(7, (frame - b(3) - 70) / 9))
  const weekUsed = days <= 0 ? 0 : WEEK[Math.min(6, Math.ceil(days) - 1)] * Math.min(1, days / Math.ceil(days))
  // общий лимит: чат и Claude Code тратят одно и то же
  const share = useAppear(b(4) + 8) * interpolate(frame, [b(5) - 6, b(5) + 4], [1, 0], clamp)
  const pipes = interpolate(frame, [b(4) + 25, b(4) + 55], [0, 1], clamp)
  const term = b(4) + 75
  const cmd = typed('/usage', frame, term + 16, 14)
  const rows = useAppear(term + 40)
  // совет: две недели наблюдаем
  const tip = useAppear(b(5) + 6)
  const ticks = Math.floor(interpolate(frame, [b(5) + 40, b(5) + 140], [0, 14], clamp))

  // итог: остальное приглушается, поверх — чек-лист и самолёт на полосе
  const rest = interpolate(frame, [b(6), b(6) + 15], [1, 0.1], clamp)
  const plane = useAppear(b(6) + 100)

  const weekX = (i: number) => W.x + (W.w * (i + 1)) / 7

  return (
    <KitScene chip="6 / 6 · Подписка или API" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* подписка — абонемент */}
      <g opacity={cards[0]}>
        <Card x={SUB.x} y={SUB.y} w={SUB.w} h={SUB.h} stroke={gym > 0 ? theme.accent : theme.line} />
        <path d={`M${SUB.x} ${SUB.y + 64} V${SUB.y + 12} Q${SUB.x} ${SUB.y} ${SUB.x + 12} ${SUB.y} H${SUB.x + SUB.w - 12} Q${SUB.x + SUB.w} ${SUB.y} ${SUB.x + SUB.w} ${SUB.y + 12} V${SUB.y + 64} Z`} fill={gym > 0 ? theme.accent : theme.codeBg} />
        <Label x={SUB.x + 24} y={SUB.y + 42} anchor="start" size={26} color={gym > 0 ? theme.paper : theme.ink} weight={800}>
          Подписка
        </Label>
        <g opacity={gym}>
          <Label x={SUB.x + SUB.w - 84} y={SUB.y + 42} anchor="end" size={20} color={theme.paper} weight={600}>
            абонемент в зал
          </Label>
          <Dumbbell x={SUB.x + SUB.w - 38} y={SUB.y + 34} color={theme.paper} />
        </g>
        <g opacity={monthly}>
          <Tag x={SUB.x + 110} y={SUB.y + 104} text="раз в месяц" color={theme.accent} fill={theme.accentTint} size={20} />
        </g>
        <g opacity={pro}>
          <Label x={SUB.x + 24} y={SUB.y + 162} anchor="start" size={24} weight={700}>
            Claude Pro — $20 в месяц
          </Label>
        </g>
        <g opacity={max}>
          <Label x={SUB.x + 24} y={SUB.y + 196} anchor="start" size={20} color={theme.soft} weight={600}>
            Max — $100 и $200
          </Label>
        </g>
        <g opacity={useAppear(b(1) + 95)}>
          <rect x={SUB.x + 24} y={SUB.y + 222} width={SUB.w - 48} height={24} rx={12} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
          <rect x={SUB.x + 24} y={SUB.y + 222} width={(SUB.w - 48) * limitFill} height={24} rx={12} fill={theme.accent} />
          <Label x={SUB.x + 24} y={SUB.y + 276} anchor="start" size={20} color={theme.accent} weight={700}>
            работаете в пределах лимита
          </Label>
        </g>
      </g>

      {/* API — такси со счётчиком */}
      <g opacity={cards[1]}>
        <Card x={API.x} y={API.y} w={API.w} h={API.h} stroke={taxi > 0 ? theme.alt : theme.line} />
        <path d={`M${API.x} ${API.y + 64} V${API.y + 12} Q${API.x} ${API.y} ${API.x + 12} ${API.y} H${API.x + API.w - 12} Q${API.x + API.w} ${API.y} ${API.x + API.w} ${API.y + 12} V${API.y + 64} Z`} fill={taxi > 0 ? theme.alt : theme.codeBg} />
        <Label x={API.x + 24} y={API.y + 42} anchor="start" size={26} color={taxi > 0 ? theme.paper : theme.ink} weight={800}>
          Оплата через API
        </Label>
        <g opacity={taxi}>
          {/* шашечки такси */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={API.x + API.w - 104 + (i % 6) * 12} y={API.y + 20 + Math.floor(i / 6) * 12} width={12} height={12} fill={(i + Math.floor(i / 6)) % 2 ? theme.alt : theme.paper} />
          ))}
          <Label x={API.x + 24} y={API.y + 104} anchor="start" size={20} color={theme.alt} weight={700}>
            такси со счётчиком
          </Label>
          <rect x={API.x + 24} y={API.y + 124} width={API.w - 48} height={72} rx={12} fill={theme.termBg} />
          <Mono x={API.x + 44} y={API.y + 170} size={30} fill={theme.termOk}>
            {`${meter.toFixed(1).replace('.', ',')} млн токенов`}
          </Mono>
          {[0, 1, 2].map((i) => (
            <g key={i} opacity={meter >= i + 1 ? 1 : 0}>
              <circle cx={API.x + 48 + i * 44} cy={API.y + 232} r={17} fill={theme.altTint} stroke={theme.alt} strokeWidth={3} />
              <Label x={API.x + 48 + i * 44} y={API.y + 239} size={20} color={theme.alt} weight={800}>
                $
              </Label>
            </g>
          ))}
          <Label x={API.x + 200} y={API.y + 239} anchor="start" size={20} color={theme.soft} weight={600}>
            за каждый миллион
          </Label>
        </g>
        <g opacity={noCap}>
          <Label x={API.x + 24} y={API.y + 280} anchor="start" size={20} color={theme.risk} weight={700}>
            потолка нет: ставьте лимит расходов
          </Label>
        </g>
      </g>
      <You x={S6.you.x} y={S6.you.y} scale={0.8} label="Вы" enterAt={b(0)} pose={you[0]} mood={you[1]} />

      {/* доска 2: лимиты Claude */}
      <g opacity={rest}>
        <g opacity={frameIn}>
          <Card x={S6.limits.x} y={S6.limits.y} w={S6.limits.w} h={S6.limits.h} />
          <Label x={R.x} y={S6.limits.y + 40} size={22} weight={800}>
            окно 5 часов
          </Label>
          <Ring x={R.x} y={R.y} r={R.r} left={1 - used} color={used > 0.5 ? theme.alt : theme.accent}>
            <g opacity={1 - refresh}>
              <Label x={R.x} y={R.y + 10} size={30} weight={800}>
                5 ч
              </Label>
            </g>
            <g opacity={refresh}>
              <Label x={R.x} y={R.y + 4} size={30} color={theme.ok} weight={800}>
                ↻
              </Label>
              <Label x={R.x} y={R.y + 28} size={18} color={theme.ok} weight={700}>
                обновился
              </Label>
            </g>
          </Ring>
          <g opacity={weekIn}>
            <Label x={W.x} y={S6.limits.y + 40} anchor="start" size={22} weight={800}>
              недельный — поверх (на платных тарифах)
            </Label>
            <rect x={W.x} y={W.y} width={W.w} height={34} rx={17} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
            <rect x={W.x} y={W.y} width={W.w * weekUsed} height={34} rx={17} fill={theme.alt} />
            {DAYS.map((d, i) => (
              <g key={d}>
                {i < 6 && <line x1={weekX(i)} y1={W.y + 4} x2={weekX(i)} y2={W.y + 30} stroke={theme.grid} strokeWidth={2} />}
                <Label x={W.x + (W.w * (i + 0.5)) / 7} y={W.y + 70} size={18} color={days > i ? theme.ink : theme.soft} weight={600}>
                  {d}
                </Label>
              </g>
            ))}
          </g>
        </g>

        {/* чат и Claude Code тратят один лимит */}
        <g opacity={share}>
          {[
            { text: 'Чат', x: TP.x + 120 },
            { text: 'Claude Code', x: TP.x + 380 },
          ].map((c) => (
            <g key={c.text}>
              <Arrow x1={c.x} y1={TP.y + 40} x2={c.x + (TP.x + 250 - c.x) * 0.4} y2={S6.limits.y + S6.limits.h + 6} color={theme.accent} draw={pipes} />
              <Tag x={c.x} y={TP.y + 64} text={c.text} color={theme.accent} fill={theme.accentTint} size={22} />
            </g>
          ))}
          <Label x={TP.x + 250} y={TP.y + 134} size={22} color={theme.accent} weight={700}>
            один общий лимит
          </Label>
        </g>

        {/* остаток — /usage в Claude Code */}
        {frame >= term && (
          <Window
            x={TM.x}
            y={TM.y}
            w={TM.w}
            h={TM.h}
            at={term}
            bodyFill={theme.termBg}
            barFill={theme.termBar}
            stroke={theme.termBar}
            bar={
              <text x={18} y={BAR / 2 + 6} fill={theme.termDim} style={{ font: `500 18px ${theme.font}` }}>
                Claude Code
              </text>
            }
          >
            <Mono x={18} y={BAR + 34} fill={theme.termText}>
              {`> ${cmd}`}
            </Mono>
            <g opacity={rows}>
              {[
                { name: 'окно 5 ч', left: 1 - 0.75 * 0.4 },
                { name: 'неделя', left: 1 - WEEK[6] },
              ].map((r, i) => (
                <g key={r.name}>
                  <Mono x={18} y={BAR + 74 + i * 36} fill={theme.termDim}>
                    {r.name}
                  </Mono>
                  <rect x={150} y={BAR + 58 + i * 36} width={260} height={20} rx={10} fill={theme.termBar} />
                  <rect x={150} y={BAR + 58 + i * 36} width={260 * r.left * rows} height={20} rx={10} fill={theme.termOk} />
                  <Mono x={426} y={BAR + 74 + i * 36} fill={theme.termOk}>
                    осталось
                  </Mono>
                </g>
              ))}
            </g>
          </Window>
        )}

        {/* совет */}
        <g opacity={tip}>
          <Card x={TP.x} y={TP.y} w={TP.w} h={TP.h} stroke={theme.ok} />
          <Label x={TP.x + 24} y={TP.y + 40} anchor="start" size={20} color={theme.ok} weight={800}>
            Совет
          </Label>
          <Label x={TP.x + 24} y={TP.y + 80} anchor="start" size={22} weight={700}>
            Начните с Pro за $20
          </Label>
          <Label x={TP.x + 24} y={TP.y + 112} anchor="start" size={20} color={theme.soft} weight={600}>
            неделю-две следите
          </Label>
          <Label x={TP.x + 24} y={TP.y + 140} anchor="start" size={20} color={theme.soft} weight={600}>
            за расходом лимита
          </Label>
          {Array.from({ length: 14 }, (_, i) => {
            const x = TP.x + 300 + (i % 7) * 32
            const y = TP.y + 66 + Math.floor(i / 7) * 36
            return (
              <g key={i}>
                <rect x={x} y={y} width={26} height={26} rx={6} fill={i < ticks ? theme.okTint : theme.paper} stroke={i < ticks ? theme.ok : theme.line} strokeWidth={2} />
                {i < ticks && <path d={`M${x + 6} ${y + 13} l5 6 l9 -12`} fill="none" stroke={theme.ok} strokeWidth={3} strokeLinecap="round" />}
              </g>
            )
          })}
          <Label x={TP.x + 300} y={TP.y + 40} anchor="start" size={18} color={theme.soft} weight={600}>
            две недели
          </Label>
        </g>
      </g>

      {/* итог */}
      {frame >= b(6) && <Checklist x={S6.recap.x} y={S6.recap.y} w={S6.recap.w} at={b(6) + 8} items={RECAP} done={RECAP.length} />}
      <g opacity={plane}>
        <Plane x={S6.plane.x} y={S6.plane.y} />
        <rect x={S6.plane.x - 100} y={S6.plane.y + 38} width={200} height={10} rx={3} fill={theme.ink} />
        <Tag x={S6.plane.x} y={S6.plane.y + 90} text="посадка — за вами" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
    </KitScene>
  )
}
