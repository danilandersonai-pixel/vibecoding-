import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Database } from '../../actors/Database'
import { theme } from '../../theme'
import { beat } from '../script'
import { Arrow, Label, Stage } from '../kit'
import { useAppear } from '../hooks'

const ID = 's1-coaches'
const MARINA = ['Анна', 'Света', 'Катя']
const DIMA = ['Олег', 'Игорь', 'Макс']

// Сцена 1: два тренера, шесть подопечных, одна общая база — «общая раздевалка».
export function S1Coaches() {
  const b = (i: number) => beat(ID, i)
  const rowsIn = useAppear(b(2), 30)
  const lockers = useAppear(b(3), 15)
  const focus = useAppear(b(4), 15)
  const rows = [...MARINA.map((n) => ({ text: n, color: theme.accent })), ...DIMA.map((n) => ({ text: n, color: theme.alt }))]
  const visible = Math.round(rowsIn * rows.length)

  return (
    <Stage chip="1 / 5 · Одна база на всех">
      <Coach x={250} y={170} color={theme.accent} label="Марина" enterAt={b(0)} />
      <Coach x={1030} y={170} color={theme.alt} label="Дима" enterAt={b(0) + 8} />
      {MARINA.map((n, i) => (
        <Client key={n} x={130 + i * 120} y={440} scale={0.55} color={theme.accent} label={n} enterAt={b(1) + i * 5} highlight={n === 'Анна' && focus > 0.5} />
      ))}
      {DIMA.map((n, i) => (
        <Client key={n} x={910 + i * 120} y={440} scale={0.55} color={theme.alt} label={n} enterAt={b(1) + 15 + i * 5} />
      ))}
      <g opacity={useAppear(b(2))}>
        <Arrow x1={400} y1={420} x2={510} y2={360} dashed progress={rowsIn} />
        <Arrow x1={880} y1={420} x2={770} y2={360} dashed progress={rowsIn} />
        <Database x={640} y={300} scale={0.95} rows={rows.slice(0, visible).map((r, i) => ({ ...r, dim: focus > 0.5 && i !== 0 }))} />
      </g>
      <g opacity={lockers}>
        <Label x={640} y={590} size={26} color={theme.soft} weight={500}>
          общая раздевалка: шкафчики рядом, ключи — свои
        </Label>
      </g>
      <g opacity={focus}>
        <text x={1120} y={180} textAnchor="middle" style={{ font: `700 64px ${theme.font}` }} fill={theme.risk}>
          ?
        </text>
      </g>
    </Stage>
  )
}
