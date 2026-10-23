import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Packet } from '../../actors/Packet'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { editorHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { PARITY, S4, SLICE, SPEC, TABLE_H, tableRowY, TODAY, TODAY_ROW } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniPhone, StepRow } from './parts'

const ID = 's4-check'
const L = S4.list
const SC = S4.screen
const T = S4.table

// Сцена 4 (проверьте у себя): жалобы дословно, стопки, та же боль у своих тренеров, один сценарий целиком
// (подход Анны → правка Марины → новый вес у Анны),
// отличие — в спецификацию и таблицу паритета («наше отличие»), показ тренерам без подсказок.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // что сделать у себя: строки сразу, галочки — по репликам
  const title = useAppear(b(0) + 6)
  const rowIn = TODAY.map((_, i) => b(0) + 14 + i * 15)
  const tickAt = [b(0) + 150, b(1) + 40, b(2) + 90, b(3) + 100, b(5) + 56, b(6) + 20]

  // тренеры: та же боль?
  const coachesSlot = appear(frame, b(0) + 30, 12) * (1 - appear(frame, b(2) + 6, 8))
  const yes = appear(frame, b(2) + 50, 10) * (1 - appear(frame, b(3), 10))
  const next = appear(frame, b(2) + 100, 10) * (1 - appear(frame, b(3), 10))

  // срез: от записи подхода до экрана тренера
  const sliceSlot = appear(frame, b(0) + 24, 12) * (1 - appear(frame, b(3) + 6, 8))
  const slice = useAppear(b(3) + 6)
  // Марина меняет вес следующего подхода → правка летит на телефон Анны
  const editAt = b(3) + 40
  const edit = appear(frame, editAt, 8)
  const flyOn = frame >= editAt + 8 && frame < editAt + 36
  const fly = useTrack([
    [editAt + 8, SC.x - 20, S4.phone.y],
    [editAt + 34, S4.phone.x + 60, S4.phone.y],
  ])
  const pingAt = editAt + 36
  const got = appear(frame, pingAt + 4, 10)

  // доска 2: спецификация и таблица паритета
  const places = appear(frame, b(4) - 20, 10)
  const table = useAppear(b(4) + 60)
  const heads = useAppear(b(4) + 66)
  const rowAt = PARITY.map((_, i) => b(4) + 66 + i * 8)
  const decideAt = PARITY.map((_, i) => b(4) + 76 + i * 6)
  const ours = appear(frame, b(4) + 96, 12)

  // показ тренерам: молча → нашли сами; запнулись → правка и снова показ
  const quiet = appear(frame, b(5) + 66, 10) * (1 - appear(frame, b(6) + 10, 10))
  const found = useAppear(b(6) + 14)
  const again = useAppear(b(6) + 100)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 40, ['stand', 'worried']],
    [b(3), ['stand', 'neutral']],
    [b(5) + 60, ['think', 'neutral']],
    [b(6) + 14, ['cheer', 'happy']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 60, ['think', 'worried']],
    [b(3), ['stand', 'neutral']],
    [b(5) + 60, ['think', 'neutral']],
    [b(6) + 30, ['stand', 'happy']],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать сегодня у себя */}
      <g opacity={title}>
        <Label x={L.x + 4} y={L.y - 26} anchor="start" size={24} weight={800}>
          Сегодня у себя
        </Label>
      </g>
      {TODAY.map((t, i) => (
        <g key={t} opacity={appear(frame, rowIn[i], 10)}>
          <StepRow x={L.x + 18} y={L.y + 15 + i * L.row} n={i + 1} text={t} at={tickAt[i]} />
        </g>
      ))}

      {/* срез: место — пунктиром, потом один сценарий целиком */}
      <g opacity={sliceSlot}>
        <Slot x={S4.slice.x} y={S4.slice.y} w={S4.slice.w} h={S4.slice.h} text="срез: правка веса на тренировке" />
      </g>
      <g opacity={slice}>
        <Card x={S4.slice.x} y={S4.slice.y} w={S4.slice.w} h={S4.slice.h} stroke={theme.line} fill={theme.white}>
          <Label x={S4.slice.x + 24} y={S4.slice.y + 32} anchor="start" size={20} weight={800}>
            Срез: один сценарий целиком
          </Label>
        </Card>
        <MiniPhone x={S4.phone.x} y={S4.phone.y} tapAt={pingAt} />
        <Label x={S4.phone.x} y={S4.phone.y + 92} size={18} weight={700} color={theme.ok}>
          Анна
        </Label>
        <g opacity={got}>
          <Pill x={S4.phone.x + 92} y={S4.phone.y - 36} text={`${SLICE.to} кг`} color={theme.accent} fill={theme.accentTint} compact />
        </g>
        <Arrow x1={SC.x - 10} y1={S4.phone.y} x2={S4.phone.x + 46} y2={S4.phone.y} color={theme.accent} dashed draw={appear(frame, editAt + 4, 16)} />
        <Card x={SC.x} y={SC.y} w={SC.w} h={SC.h} stroke={theme.accent} fill={theme.white}>
          <Label x={SC.x + 20} y={SC.y + 34} anchor="start" size={20} weight={800}>
            Экран Марины
          </Label>
          <line x1={SC.x + 16} y1={SC.y + 48} x2={SC.x + SC.w - 16} y2={SC.y + 48} stroke={theme.grid} strokeWidth={2} />
          <Label x={SC.x + 20} y={SC.y + 76} anchor="start" size={18} weight={700} color={theme.ok}>
            Анна · присед
          </Label>
          <Mark x={SC.x + 34} y={SC.y + 105} ok r={11} />
          <Label x={SC.x + 54} y={SC.y + 112} anchor="start" size={20} weight={600}>
            {`подход 2 · ${SLICE.reps} × ${SLICE.from} кг`}
          </Label>
        </Card>
        {/* следующий подход: вес меняется с from на to */}
        <rect x={SC.x + 10} y={SC.y + 128} width={SC.w - 20} height={36} rx={8} fill={theme.accentTint} opacity={edit} />
        <circle cx={SC.x + 34} cy={SC.y + 146} r={10} fill="none" stroke={theme.accent} strokeWidth={2.5} />
        <Label x={SC.x + 54} y={SC.y + 153} anchor="start" size={20} weight={600}>
          {`подход 3 · ${SLICE.reps} ×`}
        </Label>
        <rect x={SC.x + 226} y={SC.y + 131} width={56} height={30} rx={7} fill={theme.white} stroke={edit > 0 ? theme.accent : theme.grid} strokeWidth={2.5} />
        <Label x={SC.x + 254} y={SC.y + 153} size={20} weight={800} color={frame >= editAt ? theme.accent : theme.ink}>
          {String(frame >= editAt ? SLICE.to : SLICE.from)}
        </Label>
        <Label x={SC.x + 290} y={SC.y + 153} anchor="start" size={20} weight={600}>
          кг
        </Label>
      </g>
      {flyOn && <Packet x={fly.x} y={fly.y} text={`${SLICE.to} кг`} scale={0.9} />}

      {/* ваши тренеры: место — пунктиром, потом Марина и Дима */}
      <g opacity={coachesSlot}>
        <Slot x={S4.coaches.x} y={S4.coaches.y} w={S4.coaches.w} h={S4.coaches.h} text="ваши тренеры" />
      </g>
      {frame >= b(2) + 6 && <Coach x={S4.marina.x} y={S4.marina.y} scale={0.55} label="Марина" color={theme.accent} enterAt={b(2) + 6} pose={marina[0]} mood={marina[1]} />}
      {frame >= b(2) + 18 && <Coach x={S4.dima.x} y={S4.dima.y} scale={0.55} label="Дима" color={theme.alt} enterAt={b(2) + 18} pose={dima[0]} mood={dima[1]} />}
      <g opacity={yes}>
        <Callout x={760} y={388} tx={S4.marina.x + 6} ty={S4.marina.y - 46} text="да, и у нас болит" color={theme.accent} />
      </g>
      <g opacity={next}>
        <Pill x={1060} y={500} text="если нет — следующая стопка" color={theme.soft} size={18} compact />
      </g>
      <g opacity={quiet}>
        <Pill x={1060} y={410} text="смотрим молча" color={theme.soft} size={20} compact />
      </g>
      <g opacity={found}>
        <Pill x={1060} y={410} text="справились сами — понятно" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={again}>
        <Pill x={1060} y={470} text="запнулись → правка и показ" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>

      {/* доска 2: спецификация и таблица паритета; места — пунктиром, пока камера едет */}
      <g opacity={places * (1 - appear(frame, b(4) + 20, 8))}>
        <Slot x={S4.spec.x} y={S4.spec.y} w={S4.spec.w} h={editorHeight(SPEC.length)} text="спецификация" />
      </g>
      <g opacity={places * (1 - appear(frame, b(4) + 60, 8))}>
        <Slot x={T.x} y={T.y} w={T.w} h={TABLE_H} text="таблица паритета" />
      </g>
      {frame >= b(4) + 20 && <Editor x={S4.spec.x} y={S4.spec.y} w={S4.spec.w} at={b(4) + 20} file="спецификация.md" lines={SPEC} highlight={[5]} />}
      <g opacity={table}>
        <Card x={T.x} y={T.y} w={T.w} h={TABLE_H} stroke={theme.line} fill={theme.white}>
          <Label x={T.x + 24} y={T.y + 40} anchor="start" size={24} weight={800}>
            Таблица паритета
          </Label>
        </Card>
      </g>
      <g opacity={heads}>
        <Label x={T.x + 24} y={T.y + 78} anchor="start" size={18} weight={600} color={theme.soft}>
          возможность
        </Label>
        <Label x={T.x + 300} y={T.y + 78} anchor="start" size={18} weight={600} color={theme.soft}>
          у них → у нас
        </Label>
        <Label x={T.x + 600} y={T.y + 78} size={18} weight={600} color={theme.soft}>
          решение
        </Label>
        <line x1={T.x + 20} y1={T.y + T.head} x2={T.x + T.w - 20} y2={T.y + T.head} stroke={theme.grid} strokeWidth={2} />
      </g>
      {PARITY.map((p, i) => {
        const y = tableRowY(i)
        // сегодняшнее отличие — синим, отличие, которое уже есть, — зелёным
        const mine = i === TODAY_ROW
        const had = p.decision === 'наше отличие (уже)'
        const tint = mine ? theme.accentTint : had ? theme.okTint : undefined
        const ink = mine ? theme.accent : had ? theme.ok : theme.ink
        return (
          <g key={p.what}>
            {tint && (
              <g opacity={ours}>
                <rect x={T.x + 10} y={y - 30} width={T.w - 20} height={T.row - 4} rx={8} fill={tint} />
              </g>
            )}
            <g opacity={appear(frame, rowAt[i], 10)}>
              <Label x={T.x + 24} y={y} anchor="start" size={20} weight={mine || had ? 800 : 600} color={ink}>
                {p.what}
              </Label>
              <Label x={T.x + 300} y={y} anchor="start" size={20} weight={600}>
                {p.them}
              </Label>
            </g>
            <g opacity={appear(frame, decideAt[i], 10)}>
              <Pill x={T.x + 600} y={y - 7} w={210} text={p.decision} color={mine ? theme.accent : had || p.decision === 'готово' ? theme.ok : p.decision === 'позже' ? theme.alt : theme.soft} fill={tint ? theme.white : theme.paper} compact />
            </g>
          </g>
        )
      })}
    </KitScene>
  )
}
