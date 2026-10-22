import { useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { theme } from '../../theme'
import { CHECK, CHECK_H, DAY20, ERRORS, LIST, REMARKS, rowY, TODAY } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { EmptyRow, ListFrame, RemarkRow } from './parts'

const ID = 's4-check'
const C = CHECK
const E = ERRORS

// Сцена 4 (проверьте у себя): 3–5 тренеров и план, настоящая задача каждому, одна сессия молча с пометками,
// вопрос «что вы ожидали увидеть?», сбои — из отслеживания ошибок (день 14); всё — в один список,
// по нему в день 20 начнутся исправления.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // что сделать у себя: строки по репликам, галочка — к концу реплики
  const card = appear(frame, b(0) + 4, 12)
  const textAt = [b(0) + 40, b(1) + 10, b(2) + 10, b(3) + 10, b(4) + 30, b(5) + 10]
  const doneAt = [b(0) + 150, b(1) + 110, b(2) + 125, b(3) + 120, b(4) + 150, b(5) + 60]

  // список и отслеживание ошибок: когда камера отъехала (b(4) + 24)
  const list = appear(frame, b(4) + 28, 12)
  const rowAt = [b(4) + 34, b(4) + 42, b(4) + 50]
  const errors = appear(frame, b(4) + 56, 12)
  const flyAt = b(4) + 96
  const ksenia = appear(frame, b(4) + 122, 10)
  const toDay20 = appear(frame, b(5) + 56, 14)
  const day20 = appear(frame, b(5) + 70, 12)

  const fly = trackAt(frame, [
    [flyAt, E.x + 20, E.y + 50],
    [flyAt + 26, LIST.x + 10, rowY(3) + 5],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать у себя */}
      <g opacity={card}>
        <Card x={C.x} y={C.y} w={C.w} h={CHECK_H} stroke={theme.ink} fill={theme.white}>
          <Label x={C.x + 24} y={C.y + 40} anchor="start" size={24} weight={800}>
            Проверьте у себя
          </Label>
          <line x1={C.x + 14} y1={C.y + C.head - 4} x2={C.x + C.w - 14} y2={C.y + C.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {TODAY.map((t, i) => {
        const cy = C.y + C.head + C.row / 2 + i * C.row
        const on = appear(frame, textAt[i], 10)
        const done = appear(frame, doneAt[i], 8)
        return (
          <g key={t}>
            <g opacity={card * (1 - on)}>
              <Slot x={C.x + 16} y={cy - 21} w={C.w - 32} h={42} r={8} />
            </g>
            <g opacity={on}>
              <circle cx={C.x + 36} cy={cy} r={15} fill={done > 0 ? theme.ok : theme.accent} />
              <Label x={C.x + 36} y={cy + 7} size={18} weight={800} color={theme.white}>
                {String(i + 1)}
              </Label>
              <Label x={C.x + 64} y={cy + 7} anchor="start" size={21} weight={600}>
                {t}
              </Label>
            </g>
            <g opacity={done}>
              <Mark x={C.x + C.w - 34} y={cy} ok r={14} />
            </g>
          </g>
        )
      })}

      {/* один список замечаний: три строки за неделю и сбой из отслеживания ошибок */}
      <g opacity={list}>
        <ListFrame cols={[1, 1, 1, 1]} />
        {frame < b(4) + 122 && <EmptyRow i={3} />}
      </g>
      {REMARKS.slice(0, 3).map((r, i) => (
        <g key={r.who} opacity={appear(frame, rowAt[i], 10)}>
          <RemarkRow i={i} r={r} />
        </g>
      ))}
      <g opacity={ksenia}>
        <RemarkRow i={3} r={REMARKS[3]} stroke={theme.risk} />
      </g>
      <g opacity={errors}>
        <Card x={E.x} y={E.y} w={E.w} h={E.h} stroke={theme.risk} fill={theme.white}>
          <Label x={E.x + 20} y={E.y + 34} anchor="start" size={20} weight={800} color={theme.risk}>
            Отслеживание ошибок
          </Label>
          <Label x={E.x + E.w - 20} y={E.y + 34} anchor="end" size={18} weight={600} color={theme.soft}>
            день 14
          </Label>
          <Label x={E.x + 20} y={E.y + 68} anchor="start" size={18} weight={700}>
            Ксения · назначить
          </Label>
          <Label x={E.x + 20} y={E.y + 96} anchor="start" size={18} weight={600} color={theme.risk}>
            ошибка сохранения
          </Label>
        </Card>
      </g>
      {frame >= flyAt && frame < b(4) + 128 && (
        <g opacity={1 - appear(frame, flyAt + 22, 6)}>
          <rect x={fly.x} y={fly.y} width={260} height={LIST.row - 10} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2.5} />
          <Label x={fly.x + 14} y={fly.y + 26} anchor="start" size={18} weight={800}>
            Ксения
          </Label>
        </g>
      )}

      {/* по списку — исправления в день 20 */}
      <Arrow x1={DAY20.x} y1={402} x2={DAY20.x} y2={DAY20.y - 22} color={theme.ok} draw={toDay20} />
      <g opacity={day20}>
        <Pill x={DAY20.x} y={DAY20.y} text="день 20 · исправления" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
    </KitScene>
  )
}
