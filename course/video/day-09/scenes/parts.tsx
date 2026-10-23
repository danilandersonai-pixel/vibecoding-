import { useCurrentFrame } from 'remotion'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { theme } from '../../theme'
import { CYCLE, S1, S1_CAL_H, S1_CAL_W, S1_TABLE_H } from '../layout'

// Детали сцен ролика дня 9: зритель («Вы»), листок-шаблон в полёте, зачёркивание,
// таблица модели данных и календарь подопечного. Плашка, галочка и реплика — Pill, Mark и Callout из kit/props.tsx.

/** Зритель — тот, кто строит приложение: фигура без аксессуаров с подписью «Вы». */
export function You({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor label="Вы" {...props}>
      <Person color={theme.soft} pose={pose} mood={mood} />
    </Actor>
  )
}

/** Маленький листок шаблона «Сила» (летит к календарю при назначении); (x, y) — центр. */
export function TemplateChip({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-40} y={-24} width={80} height={48} rx={8} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
      <text y={7} textAnchor="middle" fill={theme.accent} style={{ font: `700 20px ${theme.font}` }}>
        Сила
      </text>
    </g>
  )
}

/** Зачёркивание слева направо: draw 0…1. */
export function Strike({ x, y, w, draw, color = theme.risk }: { x: number; y: number; w: number; draw: number; color?: string }) {
  if (draw <= 0) return null
  return <line x1={x} y1={y} x2={x + w * draw} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" />
}

/** Таблица модели данных: название и два поля; mark — номер поля, которое подсвечено вопросом. */
export function Table({ x, y, title, fields, at, mark = -1, markAt = 0 }: { x: number; y: number; title: string; fields: string[]; at: number; mark?: number; markAt?: number }) {
  const frame = useCurrentFrame()
  const a = appear(frame, at)
  const w = S1.tableW
  const lit = appear(frame, markAt, 10)
  return (
    <g opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
      <Card x={x} y={y} w={w} h={S1_TABLE_H} stroke={theme.accent} fill={theme.white}>
        <path d={`M${x} ${y + 12} Q${x} ${y} ${x + 12} ${y} H${x + w - 12} Q${x + w} ${y} ${x + w} ${y + 12} V${y + 52} H${x} Z`} fill={theme.accentTint} />
        <Label x={x + 20} y={y + 35} anchor="start" size={22} weight={700} color={theme.accent}>
          {title}
        </Label>
        {fields.map((f, i) => {
          const fy = y + 60 + i * 36
          const hot = i === mark && lit > 0
          return (
            <g key={f}>
              {hot && <rect x={x + 10} y={fy + 4} width={w - 20} height={32} rx={6} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} opacity={lit} />}
              <Label x={x + 20} y={fy + 27} anchor="start" size={20} weight={hot ? 700 : 500} color={hot ? theme.alt : theme.ink}>
                {f}
              </Label>
            </g>
          )
        })}
      </Card>
    </g>
  )
}

/** Календарь подопечного: Пн и Чт × четыре недели цикла; клетка k заполняется на кадре fillAt[k] (пусто — пунктир). */
export function Calendar({ cx, at, fillAt }: { cx: number; at: number; fillAt: number[] }) {
  const frame = useCurrentFrame()
  const C = S1.cal
  const left = cx - S1_CAL_W / 2
  const filled = fillAt.length > 0 && frame >= fillAt[0]
  return (
    <g opacity={appear(frame, at)}>
      <rect x={left} y={C.y} width={S1_CAL_W} height={S1_CAL_H} rx={12} fill={theme.white} stroke={filled ? theme.accent : theme.line} strokeWidth={3} />
      {['Пн', 'Чт'].map((d, j) => (
        <Label key={d} x={left + C.pad + C.labelW + j * (C.cellW + C.gap) + C.cellW / 2} y={C.y + 25} size={18} weight={600} color={theme.soft}>
          {d}
        </Label>
      ))}
      {CYCLE.map((wk, i) => {
        const cy = C.y + C.head + i * (C.cellH + C.gap)
        return (
          <g key={wk.week}>
            <Label x={left + C.pad + C.labelW / 2 - 2} y={cy + C.cellH / 2 + 7} size={18} weight={600} color={theme.soft}>
              {wk.week}
            </Label>
            {[0, 1].map((j) => {
              const k = i * 2 + j
              const g = fillAt[k] === undefined ? 0 : appear(frame, fillAt[k], 8)
              const x = left + C.pad + C.labelW + j * (C.cellW + C.gap)
              return (
                <g key={j}>
                  <rect x={x} y={cy} width={C.cellW} height={C.cellH} rx={6} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="5 4" />
                  <g opacity={g}>
                    <rect x={x} y={cy} width={C.cellW} height={C.cellH} rx={6} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
                    <Label x={x + C.cellW / 2} y={cy + C.cellH / 2 + 6} size={18} weight={700} color={theme.accent}>
                      {`${wk.sets}×${wk.reps}`}
                    </Label>
                  </g>
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}
