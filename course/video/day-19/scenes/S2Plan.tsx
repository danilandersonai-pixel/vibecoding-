import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BETA, LIST, LIST_H, PEOPLE_X, PLAN, PLAN_H, PLAN_VALUE_X, PLAN_Y, rowY, S2, SCATTER, TASKS, WATCH_SLOT } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bubble, EmptyRow, Eye, ListFrame } from './parts'

const ID = 's2-plan'
const P = PLAN
const Y = PLAN_Y
const VX = P.x + PLAN_VALUE_X

// Сцена 2 (что строим сегодня): короткий план бета-теста — кто (3–5 тренеров, приложение не видели; у нас —
// из других залов: Полина, Кирилл, Тимур, Ксения), срок (неделя; когда пройдёт — день 20, разбор), задачи
// (настоящие дела); замечания — в один общий список, как отзывы в день 8, с колонками «кто, задача,
// где застрял, что ожидал»; хотя бы одна сессия — вживую и молча. Рядом с планом с самого начала —
// подписанные места списка и наблюдения.
export function S2Plan() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // план: карточка, заголовок, строки «кто / срок / задачи» с местами под значения
  const card = appear(frame, b(0) + 6, 12)
  const rowAt = [b(0) + 118, b(0) + 150, b(0) + 176]
  const whoText = typed('3–5 тренеров', frame, b(1) + 16, 30)
  const unseen = appear(frame, b(1) + 90, 10)
  const halls = appear(frame, b(1) + 170, 10)
  const peopleAt = BETA.map((_, i) => b(2) + 6 + i * 16)
  const term = appear(frame, b(2) + 80, 10)
  const toDay20 = appear(frame, b(2) + 110, 12)
  const day20 = appear(frame, b(2) + 120, 10)
  const taskAt = [b(3) + 60, b(3) + 112, b(3) + 162]
  // место гаснет до того, как появится значение: подпись и текст не накладываются
  const placeOut = (at: number) => 1 - appear(frame, at - 8, 8)
  const places = appear(frame, b(0) + 30, 12)

  // список замечаний: сначала подписанное место; сообщения из разных мест появляются поверх и уходят в список
  const list = appear(frame, b(4) + 96, 12)
  const day8 = appear(frame, b(4) + 120, 10)
  const bubbleAt = SCATTER.map((_, i) => b(4) + 30 + i * 8)
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
        <Slot x={VX - 6} y={P.y + Y.who - 26} w={P.w - PLAN_VALUE_X - 18} h={36} r={8} text="сколько и какие тренеры" />
      </g>
      <g opacity={places * placeOut(peopleAt[0])}>
        <Slot x={VX - 6} y={P.y + Y.people - 44} w={P.w - PLAN_VALUE_X - 18} h={112} r={8} text="кто именно" />
      </g>
      <g opacity={places * placeOut(b(2) + 80)}>
        <Slot x={VX - 6} y={P.y + Y.term - 24} w={P.w - PLAN_VALUE_X - 18} h={34} r={8} text="на какой срок" />
      </g>
      {TASKS.map((t, i) => (
        <g key={t} opacity={places * placeOut(taskAt[i])}>
          <Slot x={VX - 6} y={P.y + Y.tasks - 23 + i * Y.step} w={P.w - PLAN_VALUE_X - 18} h={29} r={8} text={`задача ${i + 1}`} />
        </g>
      ))}

      {/* кто: приложение ещё не видели; у нас — из других залов */}
      <Label x={VX} y={P.y + Y.who} anchor="start" size={22} weight={800}>
        {whoText}
      </Label>
      <g opacity={unseen}>
        <Pill x={VX + 115} y={P.y + Y.pills} text="не видели приложение" color={theme.ink} fill={theme.white} size={18} compact />
      </g>
      <g opacity={halls}>
        <Pill x={VX + 262} y={P.y + Y.who - 7} text="из других залов" color={theme.alt} fill={theme.altTint} size={18} compact />
      </g>
      {BETA.map((name, i) => (
        <Coach key={name} x={P.x + PEOPLE_X[i]} y={P.y + Y.people} scale={0.42} label={name} color={theme.ink} enterAt={peopleAt[i]} />
      ))}

      {/* срок: неделя, а когда пройдёт — день 20, разбор замечаний */}
      <g opacity={term}>
        <Label x={VX} y={P.y + Y.term} anchor="start" size={22} weight={800}>
          неделя
        </Label>
      </g>
      <Arrow x1={VX + 92} y1={P.y + Y.term - 7} x2={VX + 140} y2={P.y + Y.term - 7} color={theme.ok} draw={toDay20} />
      <g opacity={day20}>
        <Pill x={VX + 244} y={P.y + Y.term - 7} text="день 20 — разбор" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>

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

      {/* замечания — в одно место: подписанное место с самого начала, потом общий список с колонками */}
      <g opacity={places * (1 - list)}>
        <Slot x={LIST.x} y={LIST.y} w={LIST.w} h={LIST_H} r={12} text="список замечаний" />
      </g>
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

      {/* место под наблюдение вживую: пунктиром, пока реплика до него не дошла */}
      <g opacity={places * (1 - appear(frame, b(6) + 12, 10))}>
        <Slot x={WATCH_SLOT.x} y={WATCH_SLOT.y} w={WATCH_SLOT.w} h={WATCH_SLOT.h} r={12} text="наблюдение вживую" />
      </g>

      {/* вживую: тренер работает, вы молча смотрите */}
      <Actor x={S2.you.x} y={S2.you.y} scale={0.6} label="Вы" enterAt={b(6) + 16}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Coach x={S2.polina.x} y={S2.polina.y} scale={0.6} label="Полина" color={theme.ink} enterAt={b(6) + 30} pose={polina[0]} mood={polina[1]} />
      {/* телефон в поднятой руке Полины */}
      <g opacity={appear(frame, b(6) + 34, 8)}>
        <rect x={S2.polina.x + 84 * 0.6} y={S2.polina.y - 62 * 0.6} width={34 * 0.6} height={56 * 0.6} rx={4} fill={theme.ink} />
        <rect x={S2.polina.x + 89 * 0.6} y={S2.polina.y - 55 * 0.6} width={24 * 0.6} height={40 * 0.6} rx={2} fill={theme.white} />
      </g>
      <line x1={S2.you.x + 40} y1={S2.you.y - 26} x2={S2.you.x + 40 + (S2.polina.x - 100 - S2.you.x) * sight} y2={S2.you.y - 26} stroke={theme.line} strokeWidth={3} strokeDasharray="8 8" opacity={sight > 0 ? 1 : 0} />
      <g opacity={watch}>
        <Eye x={S2.watch.x} y={S2.watch.y - 50} />
        <Pill x={S2.watch.x} y={S2.watch.y + 36} text="вживую, молча" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
    </KitScene>
  )
}
