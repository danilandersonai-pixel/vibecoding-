import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { BETA, REMARKS, S1, S1_LIST_H, WEEK } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Flag, RemarkRow } from './parts'

const ID = 's1-why'
const W = S1.week
const L = S1.list
const COACH_SCALE = 0.62
// замкнутый круг дня: замечание → исправление → подтверждает тот, кто нашёл
const LOOP = [
  { text: 'замечание', x: 150, color: theme.ink, fill: theme.white },
  { text: 'исправление', x: 336, color: theme.accent, fill: theme.accentTint },
  { text: 'тренер: «исправлено»', x: 580, color: theme.ok, fill: theme.okTint },
]
const rowTop = (i: number) => L.y + L.head + i * L.row

// Сцена 1 (короткое вступление, только «зачем»): неделя бета-теста позади, в списке с дня 19 шесть замечаний
// от четырёх тренеров; до запуска в день 21 главное должно работать, тренеры ждут, что их услышали;
// сегодня исправляем, а «исправлено» говорит тот, кто нашёл.
export function S1Why() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // неделя бета-теста и тренеры — крупно
  const weekLabel = useAppear(b(0) + 2)
  const tickAt = WEEK.map((_, i) => b(0) + 6 + i * 6)
  const enterAt = BETA.map((_, i) => b(0) + 2 + i * 6)

  // список: место и карточка — когда камера отъехала (b(0) + 80)
  const slot = appear(frame, b(0) + 82, 10) * (1 - appear(frame, b(0) + 92, 6))
  const card = useAppear(b(0) + 90)
  const flyAt = REMARKS.map((_, i) => b(0) + 100 + i * 13)
  const count = useAppear(b(0) + 186)

  // до запуска — день 21; тренеры ждут
  const launch = useAppear(b(1) + 10)
  const ask = appear(frame, b(1) + 96, 10) * (1 - appear(frame, b(2) + 4, 8))

  // круг дня
  const loopAt = [b(2) + 10, b(2) + 44, b(2) + 96]

  // тренер показывает на список, пока летит его замечание
  const sending = (i: number) => REMARKS.some((r, k) => r.who === BETA[i] && frame >= flyAt[k] - 2 && frame < flyAt[k] + 20)
  const pose = (i: number): [Pose, Mood] =>
    sending(i)
      ? ['point', 'neutral']
      : stepAt<[Pose, Mood]>(frame, [
          [0, ['stand', 'neutral']],
          [b(1) + 70 + i * 6, ['think', i === 3 ? 'worried' : 'neutral']],
          [b(2) + 104 + i * 4, ['cheer', 'happy']],
        ])

  return (
    <KitScene chip="1 / 4 · Зачем" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* неделя бета-теста позади */}
      <g opacity={weekLabel}>
        <Label x={W.x} y={W.y - 14} anchor="start" size={20} color={theme.soft} weight={700}>
          бета-тест · неделя
        </Label>
      </g>
      {WEEK.map((d, i) => {
        const x = W.x + i * (W.cell + W.gap)
        const done = appear(frame, tickAt[i], 6)
        return (
          <g key={d}>
            <rect x={x} y={W.y} width={W.cell} height={W.h} rx={8} fill={done > 0 ? theme.okTint : theme.white} stroke={done > 0 ? theme.ok : theme.line} strokeWidth={2.5} />
            <Label x={x + W.cell / 2} y={W.y + 24} size={18} weight={700} color={done > 0 ? theme.ok : theme.soft}>
              {d}
            </Label>
          </g>
        )
      })}
      <g opacity={appear(frame, tickAt[6] + 8, 8)}>
        <Mark x={W.x + 7 * (W.cell + W.gap) + 16} y={W.y + W.h / 2} ok r={15} />
      </g>

      {/* четыре тренера бета-теста */}
      {BETA.map((name, i) => {
        const p = pose(i)
        return <Coach key={name} x={S1.coachX[i]} y={S1.coachY} scale={COACH_SCALE} label={name} color={theme.ink} enterAt={enterAt[i]} pose={p[0]} mood={p[1]} />
      })}
      <g opacity={ask}>
        <Callout x={262} y={214} tx={S1.coachX[0] + 10} ty={S1.coachY - 64} text="Нас услышали?" color={theme.ink} />
      </g>

      {/* список замечаний с дня 19 */}
      <g opacity={slot}>
        <Slot x={L.x} y={L.y} w={L.w} h={S1_LIST_H} text="список замечаний" />
      </g>
      <g opacity={card}>
        <Card x={L.x} y={L.y} w={L.w} h={S1_LIST_H} stroke={theme.line} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 38} anchor="start" size={24} weight={800}>
            Список замечаний
          </Label>
          <Label x={L.x + 282} y={L.y + 38} anchor="start" size={20} color={theme.soft} weight={600}>
            с дня 19
          </Label>
          <line x1={L.x + 20} y1={L.y + L.head - 2} x2={L.x + L.w - 20} y2={L.y + L.head - 2} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      <g opacity={count}>
        <Pill x={L.x + L.w - 92} y={L.y + 30} text="6 замечаний" color={theme.ink} fill={theme.paper} size={18} compact />
      </g>
      {REMARKS.map((r, i) => {
        const on = appear(frame, flyAt[i] + 16, 8)
        return (
          <g key={r.id} opacity={on}>
            {i > 0 && <line x1={L.x + 20} y1={rowTop(i)} x2={L.x + L.w - 20} y2={rowTop(i)} stroke={theme.grid} strokeWidth={1.5} />}
            <RemarkRow x={L.x + 24} y={rowTop(i) + 33} who={r.who} text={r.text} nameW={100} />
            {r.late && <Pill x={L.x + L.w - 84} y={rowTop(i) + 26} text="за неделю" color={theme.soft} fill={theme.paper} size={18} compact />}
          </g>
        )
      })}
      {/* замечание летит от тренера в список */}
      {REMARKS.map((r, i) => {
        if (frame < flyAt[i] || frame >= flyAt[i] + 18) return null
        const c = BETA.indexOf(r.who as (typeof BETA)[number])
        const p = trackAt(frame, [
          [flyAt[i], S1.coachX[c] + 40, S1.coachY - 70],
          [flyAt[i] + 16, L.x + 70, rowTop(i) + 26],
        ])
        return (
          <g key={r.id} transform={`translate(${p.x} ${p.y})`}>
            <Pill x={0} y={0} text={r.who} color={theme.ink} fill={theme.white} size={18} compact />
          </g>
        )
      })}

      {/* до запуска — день 21 */}
      <g opacity={launch}>
        <Flag x={S1.launch.x - 120} y={S1.launch.y + 18} />
        <Pill x={S1.launch.x + 30} y={S1.launch.y} text="запуск — день 21" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* круг дня: замечание → исправление → «исправлено» говорит тот, кто нашёл (место — пунктиром) */}
      <g opacity={appear(frame, b(0) + 92, 10) * (1 - appear(frame, loopAt[0] - 4, 8))}>
        <Slot x={S1.loopSlot.x} y={S1.loopSlot.y} w={S1.loopSlot.w} h={S1.loopSlot.h} text="что сегодня" />
      </g>
      {LOOP.map((p, i) => (
        <g key={p.text} opacity={appear(frame, loopAt[i], 10)}>
          <Pill x={p.x} y={S1.loopY} text={p.text} color={p.color} fill={p.fill} size={20} compact />
          {i > 0 && <Arrow x1={LOOP[i - 1].x + (i === 1 ? 66 : 82)} y1={S1.loopY} x2={p.x - (i === 1 ? 82 : 128)} y2={S1.loopY} color={theme.line} draw={appear(frame, loopAt[i] - 6, 10)} />}
        </g>
      ))}
    </KitScene>
  )
}
