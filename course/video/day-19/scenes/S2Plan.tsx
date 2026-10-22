import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BETA, LIST, PEOPLE_X, PLAN, PLAN_H, PLAN_VALUE_X, PLAN_Y, rowY, S2, SCATTER, TASKS, WATCH_SLOT, WEEK, WEEK_CELL } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bubble, EmptyRow, Eye, ListFrame } from './parts'

const ID = 's2-plan'
const P = PLAN
const Y = PLAN_Y
const VX = P.x + PLAN_VALUE_X

// Сцена 2 (что строим сегодня): короткий план бета-теста — кто (3–5 тренеров со стороны: Полина, Кирилл,
// Тимур, Ксения), срок (неделя), задачи (настоящие дела); замечания — в один общий список, как отзывы
// в день 8, с колонками «кто, задача, где застрял, что ожидал»; хотя бы одна сессия — вживую и молча.
export function S2Plan() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // план: карточка, заголовок, строки «кто / срок / задачи» с местами под значения
  const card = appear(frame, b(0) + 6, 12)
  const rowAt = [b(0) + 118, b(0) + 150, b(0) + 176]
  const whoText = typed('3–5 тренеров со стороны', frame, b(1) + 16, 30)
  const unseen = appear(frame, b(1) + 90, 10)
  const notFriends = appear(frame, b(1) + 170, 10)
  const peopleAt = BETA.map((_, i) => b(2) + 6 + i * 16)
  const term = appear(frame, b(2) + 96, 10)
  const dayAt = WEEK.map((_, i) => b(2) + 110 + i * 8)
  const taskAt = [b(3) + 60, b(3) + 112, b(3) + 162]
  const placeOut = (at: number) => 1 - appear(frame, at, 8)
  const places = appear(frame, b(0) + 30, 12)

  // список замечаний: появляется, когда камера отъехала; сообщения из разных мест уходят в него
  const list = appear(frame, b(4) + 28, 12)
  const day8 = appear(frame, b(4) + 64, 10)
  const bubbleAt = SCATTER.map((_, i) => b(4) + 40 + i * 8)
  const flyAt = SCATTER.map((_, i) => b(4) + 110 + i * 6)
  const colAt = [b(5) + 40, b(5) + 62, b(5) + 96, b(5) + 128]

  // наблюдение вживую: тренер работает, вы молча смотрите
  const watch = appear(frame, b(6) + 90, 12)
  const sight = appear(frame, b(6) + 120, 20)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 110, ['think', 'neutral']],
  ])
  const polina = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(6) + 100, ['point', 'worried']],
  ])

  return (
    <KitScene chip="2 / 4 · План бета-теста" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* план бета-теста */}
      <g opacity={card}>
        <Card x={P.x} y={P.y} w={P.w} h={PLAN_H} stroke={theme.ink} fill={theme.white}>
          <Label x={P.x + 24} y={P.y + Y.title} anchor="start" size={26} weight={800}>
            {typed('План бета-теста', frame, b(0) + 16, 30)}
          </Label>
          <line x1={P.x + 14} y1={P.y + Y.rule} x2={P.x + P.w - 14} y2={P.y + Y.rule} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {(['Кто', 'Срок', 'Задачи'] as const).map((t, i) => (
        <g key={t} opacity={appear(frame, rowAt[i], 10)}>
          <Label x={P.x + 24} y={P.y + [Y.who, Y.term, Y.tasks][i]} anchor="start" size={20} weight={700} color={theme.soft}>
            {t}
          </Label>
        </g>
      ))}
      {/* места значений: пунктиром, пока реплика до них не дошла */}
      <g opacity={places * placeOut(b(1) + 16)}>
        <Slot x={VX - 6} y={P.y + Y.who - 26} w={P.w - PLAN_VALUE_X - 18} h={36} r={8} />
      </g>
      <g opacity={places * placeOut(peopleAt[0])}>
        <Slot x={VX - 6} y={P.y + Y.people - 44} w={P.w - PLAN_VALUE_X - 18} h={112} r={8} text="кто именно" />
      </g>
      <g opacity={places * placeOut(b(2) + 96)}>
        <Slot x={VX - 6} y={P.y + Y.term - 24} w={P.w - PLAN_VALUE_X - 18} h={34} r={8} />
      </g>
      {TASKS.map((t, i) => (
        <g key={t} opacity={places * placeOut(taskAt[i])}>
          <Slot x={VX - 6} y={P.y + Y.tasks - 23 + i * Y.step} w={P.w - PLAN_VALUE_X - 18} h={29} r={8} />
        </g>
      ))}

      {/* кто: тренеры со стороны */}
      <Label x={VX} y={P.y + Y.who} anchor="start" size={22} weight={800}>
        {whoText}
      </Label>
      <g opacity={unseen}>
        <Pill x={VX + 115} y={P.y + Y.pills} text="не видели приложение" color={theme.ink} fill={theme.white} size={18} compact />
      </g>
      <g opacity={notFriends}>
        <Pill x={VX + 305} y={P.y + Y.pills} text="не друзья" color={theme.alt} fill={theme.altTint} size={18} compact />
      </g>
      {BETA.map((name, i) => (
        <Coach key={name} x={P.x + PEOPLE_X[i]} y={P.y + Y.people} scale={0.42} label={name} color={theme.ink} enterAt={peopleAt[i]} />
      ))}

      {/* срок: неделя */}
      <g opacity={term}>
        <Label x={VX} y={P.y + Y.term} anchor="start" size={22} weight={800}>
          неделя
        </Label>
      </g>
      {WEEK.map((d, i) => {
        const x = P.x + WEEK_CELL.x + i * (WEEK_CELL.size + WEEK_CELL.gap)
        const on = appear(frame, dayAt[i], 6)
        return (
          <g key={d} opacity={term}>
            <rect x={x} y={P.y + Y.term - 22} width={WEEK_CELL.size} height={WEEK_CELL.size} rx={6} fill={on > 0 ? theme.okTint : theme.white} stroke={on > 0 ? theme.ok : theme.grid} strokeWidth={2} />
            <rect x={x + 7} y={P.y + Y.term - 15} width={WEEK_CELL.size - 14} height={WEEK_CELL.size - 14} rx={3} fill={theme.ok} opacity={on * 0.7} />
          </g>
        )
      })}

      {/* задачи: настоящие дела тренера */}
      {TASKS.map((t, i) => {
        const y = P.y + Y.tasks + i * Y.step
        return (
          <g key={t} opacity={appear(frame, taskAt[i], 10)}>
            <circle cx={VX + 12} cy={y - 7} r={13} fill={theme.accent} />
            <Label x={VX + 12} y={y} size={18} weight={800} color={theme.white}>
              {String(i + 1)}
            </Label>
            <Label x={VX + 34} y={y} anchor="start" size={20} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}

      {/* замечания — в одно место: общий список с колонками */}
      <g opacity={list}>
        <ListFrame cols={colAt.map((at) => appear(frame, at, 10))} />
        {[0, 1, 2, 3].map((i) => (
          <EmptyRow key={i} i={i} />
        ))}
      </g>
      <g opacity={day8}>
        <Label x={LIST.x + 178} y={LIST.y + 35} anchor="start" size={18} weight={600} color={theme.soft}>
          как отзывы в день 8
        </Label>
      </g>
      {SCATTER.map((m, i) => {
        if (frame >= flyAt[i] + 24) return null
        const p = trackAt(frame, [
          [flyAt[i], m.x, m.y],
          [flyAt[i] + 22, LIST.x + LIST.w / 2, rowY(0) + 24],
        ])
        const going = appear(frame, flyAt[i] + 10, 12)
        return (
          <g key={m.text} opacity={appear(frame, bubbleAt[i], 10) * (1 - going)}>
            <Bubble x={p.x} y={p.y} text={m.text} />
          </g>
        )
      })}

      {/* место под наблюдение вживую: пунктиром, пока сообщения ушли в список, а реплика до него не дошла */}
      <g opacity={appear(frame, b(4) + 160, 12) * (1 - appear(frame, b(6) + 12, 10))}>
        <Slot x={WATCH_SLOT.x} y={WATCH_SLOT.y} w={WATCH_SLOT.w} h={WATCH_SLOT.h} r={12} text="наблюдение вживую" />
      </g>

      {/* вживую: тренер работает, вы молча смотрите */}
      <Actor x={S2.you.x} y={S2.you.y} scale={0.6} label="Вы" enterAt={b(6) + 16}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Actor x={S2.polina.x} y={S2.polina.y} scale={0.6} label="Полина" enterAt={b(6) + 30}>
        <Person color={theme.ink} pose={polina[0]} mood={polina[1]} />
        <rect x={84} y={-62} width={34} height={56} rx={6} fill={theme.ink} />
        <rect x={89} y={-55} width={24} height={40} rx={3} fill={theme.white} />
      </Actor>
      <line x1={S2.you.x + 40} y1={S2.you.y - 26} x2={S2.you.x + 40 + (S2.polina.x - 100 - S2.you.x) * sight} y2={S2.you.y - 26} stroke={theme.line} strokeWidth={3} strokeDasharray="8 8" opacity={sight > 0 ? 1 : 0} />
      <g opacity={watch}>
        <Eye x={S2.watch.x} y={S2.watch.y - 50} />
        <Pill x={S2.watch.x} y={S2.watch.y + 36} text="вживую, молча" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
    </KitScene>
  )
}
