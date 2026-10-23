import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { grow, stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BOARD2, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bolt } from './parts'

const ID = 's3-symptoms'
const FT = S3.features
const A = S3.answer
const W = S3.water
const X = BOARD2

const FEATURES = ['Сохранение', 'Список подходов', 'Подсчёт объёма', 'Вход']
const CODE = 'объём = подходы × вес'
// что прячется под водой (кадры появления — в сцене, по репликам)
const HIDDEN = [
  { text: 'обработка ошибок', x: X + 500, y: 314 },
  { text: 'журналы работы', x: X + 790, y: 314 },
  { text: 'защита от перегрузки', x: X + 450, y: 390 },
  { text: 'резервные копии', x: X + 830, y: 390 },
  { text: 'аккуратные правки базы', x: X + 640, y: 466 },
]
const TIP = `M${X + 540} ${W} L${X + 600} ${W - 80} L${X + 650} ${W - 128} L${X + 700} ${W - 90} L${X + 760} ${W} Z`
const BODY = `M${X + 520} ${W} L${X + 300} ${W + 80} L${X + 260} ${W + 200} L${X + 420} ${W + 280} L${X + 880} ${W + 280} L${X + 1030} ${W + 180} L${X + 980} ${W + 70} L${X + 780} ${W} Z`

// Сцена 3: три приметы проблемы 70%. Шаг вперёд — два назад (правки ломают соседнее); парадокс
// знаний (опытный видит промах сразу, новичок принимает всё); скрытые 30% — айсберг под водой.
export function S3Symptoms() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // 1: шаг вперёд — два назад
  const head1 = useAppear(b(0) + 6)
  const card = useAppear(b(0) + 20)
  const rowAt = FEATURES.map((_, i) => b(0) + 50 + i * 16)
  // состояние функций: ✓ / ✗ по кадрам
  const broken = (i: number) => {
    if (i === 0) return frame < b(1) + 70
    if (i === 1) return frame >= b(1) + 88 && frame < b(2) + 40
    if (i === 2) return frame >= b(1) + 104 && frame < b(2) + 40
    return frame >= b(2) + 58
  }
  const ask1 = appear(frame, b(1) + 8) * (1 - appear(frame, b(2), 10))
  const ask2 = useAppear(b(2) + 6)
  const there = interpolate(frame, [b(1) + 20, b(1) + 34], [0, 1], CLAMP)
  const back = interpolate(frame, [b(1) + 60, b(1) + 74], [0, 1], CLAMP)
  const loop = frame >= b(2) + 140
  const score1 = useAppear(b(1) + 110) * (1 - appear(frame, b(2) + 56, 8))
  const score2 = useAppear(b(2) + 62)
  const hour = useAppear(b(2) + 100)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 30, 'working'],
    [b(1) + 70, 'done'],
    [b(1) + 104, 'idle'],
    [b(2) + 12, 'working'],
    [b(2) + 40, 'done'],
    [b(2) + 58, 'idle'],
  ])

  // 2: парадокс знаний
  const head2 = useAppear(b(3) + 20)
  const meters = useAppear(b(3) + 60) * (1 - appear(frame, b(4) + 30, 10))
  const fillMarina = grow(frame, b(3) + 90, 30)
  const fillNovice = grow(frame, b(3) + 110, 20)
  const answer = useAppear(b(4) + 2)
  const underline = interpolate(frame, [b(4) + 40, b(4) + 52], [0, 1], CLAMP)
  const sayMarina = useAppear(b(4) + 48)
  const fastTag = useAppear(b(4) + 62)
  const sayNovice = useAppear(b(4) + 92)
  const learn = frame >= b(4) + 150
  const noviceTag = useAppear(b(4) + 100)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 90, ['stand', 'happy']],
    [b(4) + 20, ['think', 'neutral']],
    [b(4) + 44, ['point', 'neutral']],
    [b(4) + 120, ['stand', 'happy']],
  ])
  const novice = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 88, ['cheer', 'happy']],
    [b(4) + 150, ['think', 'neutral']],
    [b(4) + 176, ['stand', 'happy']],
  ])

  // 3: айсберг
  const head3 = useAppear(b(5) + 6)
  const sea = useAppear(b(5) + 10)
  const tip = usePop(b(5) + 24)
  const looks = useAppear(b(5) + 52)
  const body = useAppear(b(5) + 76)
  const hiddenAt = [b(5) + 104, b(5) + 154, b(6) + 12, b(6) + 60, b(6) + 96]
  const strike = frame >= b(6) + 160
  const bolt = usePop(b(6) + 156)

  const codeX = A.x + 18
  return (
    <KitScene chip="3 / 6 · Три приметы проблемы 70%" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* 1: шаг вперёд — два назад */}
      <g opacity={head1}>
        <Pill x={S3.head1.x} y={S3.head1.y} text="1 · Шаг вперёд — два назад" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      <g opacity={card}>
        <Card x={FT.x} y={FT.y} w={FT.w} h={50 + FEATURES.length * FT.row + 10}>
          <Label x={FT.x + 20} y={FT.y + 34} anchor="start" size={20} color={theme.soft} weight={700}>
            Журнал: что работает
          </Label>
          {FEATURES.map((f, i) => {
            const y = FT.y + 50 + i * FT.row
            const bad = broken(i)
            return (
              <g key={f} opacity={appear(frame, rowAt[i], 8)}>
                <rect x={FT.x + 12} y={y + 4} width={FT.w - 24} height={FT.row - 8} rx={10} fill={bad ? theme.riskTint : theme.paper} stroke={bad ? theme.risk : theme.grid} strokeWidth={2} />
                <Label x={FT.x + 30} y={y + FT.row / 2 + 8} anchor="start" size={22} weight={600}>
                  {f}
                </Label>
                <Mark x={FT.x + FT.w - 40} y={y + FT.row / 2} ok={!bad} />
              </g>
            )
          })}
        </Card>
      </g>
      {/* петля: просьба → правка */}
      <Arrow x1={FT.x + FT.w + 8} y1={236} x2={S3.agent.x - 60} y2={262} color={loop ? theme.risk : theme.accent} draw={there} />
      <Arrow x1={S3.agent.x - 60} y1={360} x2={FT.x + FT.w + 8} y2={386} color={loop ? theme.risk : theme.ok} draw={back} />
      <g opacity={loop ? 1 : 0}>
        <Pill x={S3.agent.x - 92} y={312} text="петля" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={ask1}>
        <Pill x={S3.agent.x + 15} y={196} text="почини сохранение" color={theme.ink} fill={theme.white} size={20} compact />
      </g>
      <g opacity={ask2}>
        <Pill x={S3.agent.x + 15} y={196} text="почини список и объём" color={theme.ink} fill={theme.white} size={20} compact />
      </g>
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.8} enterAt={b(0) + 30} pose={agent} />
      <g opacity={score1}>
        <Pill x={S3.agent.x + 10} y={470} text="починил 1 — сломал 2" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={score2}>
        <Pill x={S3.agent.x + 10} y={470} text="починил 2 — сломал 1" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={hour}>
        <Pill x={S3.hour.x} y={S3.hour.y} text="что работало час назад?" color={theme.risk} size={20} compact />
      </g>

      {/* 2: парадокс знаний */}
      <g opacity={head2}>
        <Pill x={S3.head2.x} y={S3.head2.y} text="2 · Парадокс знаний" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      <g opacity={answer}>
        <Card x={A.x} y={A.y} w={A.w} h={A.h} fill={theme.codeBg}>
          <Label x={codeX} y={A.y + 26} anchor="start" size={18} color={theme.soft} weight={600}>
            Ответ ИИ
          </Label>
          <text x={codeX} y={A.y + 56} fill={theme.ink} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre' }}>
            {typed(CODE, frame, b(4) + 6, 40)}
          </text>
          {/* промах: забыты повторы */}
          <line x1={codeX + 8 * 12} y1={A.y + 64} x2={codeX + 8 * 12 + 13 * 12 * underline} y2={A.y + 64} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={underline > 0 ? 1 : 0} />
        </Card>
      </g>
      {[
        { x: S3.marina.x, fill: fillMarina * 0.9, color: theme.ok },
        { x: S3.novice.x, fill: fillNovice * 0.3, color: theme.alt },
      ].map((m) => (
        <g key={m.x} opacity={meters}>
          <Label x={m.x} y={278} size={18} color={theme.soft} weight={600}>
            польза от ИИ
          </Label>
          <rect x={m.x - 80} y={290} width={160} height={18} rx={9} fill={theme.grid} />
          <rect x={m.x - 80} y={290} width={160 * m.fill} height={18} rx={9} fill={m.color} />
        </g>
      ))}
      <g opacity={sayMarina}>
        <Callout x={S3.marina.x} y={292} tx={S3.marina.x + 6} ty={S3.marina.y - 70} text="А повторы где?" color={theme.ok} fill={theme.okTint} />
      </g>
      <g opacity={sayNovice}>
        <Callout x={S3.novice.x} y={292} tx={S3.novice.x - 6} ty={S3.novice.y - 70} text="Всё верно!" />
      </g>
      <Coach x={S3.marina.x} y={S3.marina.y} scale={0.75} label="Марина" enterAt={b(3) + 30} pose={marina[0]} mood={marina[1]} />
      <Actor x={S3.novice.x} y={S3.novice.y} scale={0.75} label="Новичок" enterAt={b(3) + 42}>
        <Person color={theme.soft} pose={novice[0]} mood={novice[1]} />
      </Actor>
      <g opacity={fastTag}>
        <Pill x={S3.marina.x} y={530} text="заметила за секунды" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={noviceTag}>
        <Pill x={S3.novice.x} y={530} text={learn ? 'проверке учатся ✓' : 'принял целиком'} color={learn ? theme.ok : theme.risk} fill={learn ? theme.okTint : theme.riskTint} size={20} compact />
      </g>

      {/* 3: скрытые 30% — айсберг */}
      <g opacity={head3}>
        <Pill x={X + 250} y={112} text="3 · Скрытые 30%" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      <g opacity={sea}>
        <rect x={X + 40} y={W} width={1200} height={290} rx={14} fill={theme.accentTint} />
        <path d={`M${X + 40} ${W} H${X + 1240}`} stroke={theme.accent} strokeWidth={3} strokeDasharray="14 8" />
        <Label x={X + 60} y={W - 14} anchor="start" size={20} color={theme.soft} weight={600}>
          видно в демо
        </Label>
        <Label x={X + 60} y={W + 34} anchor="start" size={20} color={theme.accent} weight={600}>
          скрыто под водой
        </Label>
      </g>
      <g opacity={body}>
        <path d={BODY} fill={theme.paper} fillOpacity={0.7} stroke={theme.line} strokeWidth={3} strokeDasharray="10 8" strokeLinejoin="round" />
      </g>
      {frame >= b(5) + 24 && (
        <g transform={`translate(${S3.tip.x} ${W}) scale(${tip}) translate(${-S3.tip.x} ${-W})`}>
          <path d={TIP} fill={theme.white} stroke={theme.ink} strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
      <g opacity={looks}>
        <Pill x={X + 960} y={180} text="выглядит готовым" color={strike ? theme.risk : theme.ok} fill={strike ? theme.riskTint : theme.okTint} size={20} compact />
      </g>
      {HIDDEN.map((h, i) => (
        <g key={h.text} opacity={appear(frame, hiddenAt[i])}>
          <Pill x={h.x} y={h.y} text={h.text} color={strike ? theme.risk : theme.soft} fill={strike ? theme.riskTint : theme.paper} size={20} compact />
        </g>
      ))}
      {frame >= b(6) + 156 && (
        <g transform={`translate(${X + 1130} 230) scale(${bolt}) translate(${-(X + 1130)} -230)`}>
          <Bolt x={X + 1130} y={232} />
          <Pill x={X + 1130} y={290} text="сбой" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      )}
    </KitScene>
  )
}
