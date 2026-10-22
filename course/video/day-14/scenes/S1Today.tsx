import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { colX, COLUMNS, S1, WEEK_DAYS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Caution, Column, CopyDoc, Watch } from './parts'

const ID = 's1-today'
const R = S1.roof
const W = S1.week
const C = S1.cols
const B = S1.base

// Сцена 1 (короткое вступление): тренеры пользуются приложением каждый день — это крыша;
// надёжность — четыре колонны под ней: тесты, скорость, ошибки, копии. Пока всё работает,
// колонн не видно; ударил сбой — крыша держится на них.
export function S1Today() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // приложение и неделя: каждый день
  const roof = appear(frame, b(0) + 4, 12)
  const dayAt = WEEK_DAYS.map((_, i) => b(0) + 30 + i * 9)
  const sayM = appear(frame, b(0) + 70, 10) * (1 - appear(frame, b(1), 10))
  const sayA = appear(frame, b(0) + 96, 10) * (1 - appear(frame, b(1), 10))

  // колонны: места — сразу под крышей, сами колонны — по словам реплики
  const slots = appear(frame, b(0) + 40, 12)
  const baseIn = appear(frame, b(1) + 36, 12)
  const colAt = [b(1) + 56, b(1) + 80, b(1) + 108, b(1) + 142]

  // не видно, пока всё работает; удар сбоя — колонны держат
  const ghost = interpolate(frame, [b(2) + 20, b(2) + 44], [0, 1], CLAMP) * (1 - appear(frame, b(2) + 104, 10))
  const unseen = appear(frame, b(2) + 30, 10) * (1 - appear(frame, b(2) + 100, 8))
  const strike = appear(frame, b(2) + 92, 4) * (1 - appear(frame, b(2) + 112, 10))
  const shake = frame >= b(2) + 94 && frame < b(2) + 110 ? Math.sin(frame * 2.4) * 5 : 0
  const glow = appear(frame, b(2) + 106, 10)
  const fail = appear(frame, b(2) + 96, 8)
  const held = appear(frame, b(2) + 124, 10)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 66, ['point', 'happy']],
    [b(1), ['stand', 'neutral']],
    [b(1) + 60, ['think', 'neutral']],
    [b(2) + 96, ['surprised', 'worried']],
    [b(2) + 124, ['cheer', 'happy']],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 92, ['stand', 'happy']],
    [b(2) + 96, ['surprised', 'worried']],
    [b(2) + 128, ['cheer', 'happy']],
  ])

  // рисунки внутри колонн
  const icon = (i: number, x: number, y: number) =>
    i === 0 ? <Mark x={x} y={y} ok r={20} /> : i === 1 ? <Watch x={x} y={y} r={19} t={0.3} color={theme.accent} /> : i === 2 ? <Caution x={x} y={y} s={1.1} /> : <CopyDoc x={x} y={y} s={0.9} />

  return (
    <KitScene chip="1 / 4 · Зачем надёжность" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* колонны надёжности: места пунктиром, потом колонны по словам */}
      {COLUMNS.map((name, i) => {
        const x = colX(i)
        const on = appear(frame, colAt[i], 12)
        return (
          <g key={name}>
            <g opacity={slots * (1 - on)}>
              <Slot x={x - 8} y={C.top} w={C.w + 16} h={C.bottom - C.top} text={name.toLowerCase()} />
            </g>
            <g opacity={on} transform={`translate(0 ${(1 - on) * 20})`}>
              <Column x={x} top={C.top} bottom={C.bottom} w={C.w} label={name} ghost={ghost} glow={glow * (1 - held * 0.5)}>
                {icon(i, x + C.w / 2, C.top + 74)}
              </Column>
            </g>
          </g>
        )
      })}
      <g opacity={baseIn}>
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={6} fill={held > 0 ? theme.okTint : theme.white} stroke={held > 0 ? theme.ok : theme.accent} strokeWidth={3} />
        <Label x={B.x + B.w / 2} y={B.y + 25} size={20} weight={800} color={held > 0 ? theme.ok : theme.accent}>
          надёжность
        </Label>
      </g>
      <g opacity={unseen}>
        <Pill x={640} y={C.top + 140} text="не видно, пока всё работает" color={theme.soft} fill={theme.paper} size={20} compact />
      </g>

      {/* крыша — само приложение, которым пользуются каждый день */}
      <g opacity={roof} transform={`translate(${shake} 0)`}>
        <path d={`M${R.x - 12} ${R.y} L640 ${R.apex} L${R.x + R.w + 12} ${R.y} Z`} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" />
        <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={6} fill={theme.white} stroke={fail > 0 && glow < 1 ? theme.risk : theme.accent} strokeWidth={3} />
        <Label x={R.x + 20} y={R.y + 41} anchor="start" size={24} weight={800} color={theme.accent}>
          Приложение тренера
        </Label>
        {WEEK_DAYS.map((d, i) => {
          const x = W.x + i * (W.cell + W.gap)
          const on = appear(frame, dayAt[i], 6)
          return (
            <g key={d}>
              <rect x={x} y={W.y} width={W.cell} height={W.h} rx={7} fill={on > 0 ? theme.okTint : theme.white} stroke={on > 0 ? theme.ok : theme.line} strokeWidth={2.5} />
              <Label x={x + W.cell / 2} y={W.y + 23} size={18} weight={700} color={on > 0 ? theme.ok : theme.soft}>
                {d}
              </Label>
            </g>
          )
        })}
      </g>

      {/* сбой: молния бьёт в крышу */}
      <g opacity={strike}>
        <path d={`M1010 38 L968 82 L992 86 L944 118`} fill="none" stroke={theme.risk} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g opacity={fail * (1 - held)}>
        <Pill x={1060} y={110} text="сбой" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={held}>
        <Pill x={1060} y={110} text="держится" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* тренер и подопечная пользуются им каждый день */}
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.75} label="Марина" color={theme.accent} enterAt={b(0) + 10} pose={marina[0]} mood={marina[1]} />
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.75} label="Анна" enterAt={b(0) + 20} pose={anna[0]} mood={anna[1]} />
      <g opacity={sayM}>
        <Callout x={214} y={226} tx={S1.marina.x + 8} ty={S1.marina.y - 62} text="назначаю тренировки" color={theme.accent} />
      </g>
      <g opacity={sayA}>
        <Callout x={1056} y={226} tx={S1.anna.x - 8} ty={S1.anna.y - 62} text="записываю подходы" color={theme.ok} />
      </g>
    </KitScene>
  )
}
