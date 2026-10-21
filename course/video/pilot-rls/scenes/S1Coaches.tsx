import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Database } from '../../actors/Database'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { beat, sceneDuration, STAGING } from '../script'
import { KeyGlyph } from './KeyGlyph'

const ID = 's1-coaches'
const MARINA = ['Анна', 'Света', 'Катя']
const DIMA = ['Олег', 'Игорь', 'Макс']
const CLIENT_Y = 440
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Сцена 1: два тренера, шесть подопечных, одна общая база — «общая раздевалка».
export function S1Coaches() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const rowsIn = useAppear(b(2), 30)
  const caption = useAppear(b(3))
  const focus = useAppear(b(4), 15)
  const rows = [...MARINA.map((n) => ({ text: n, color: theme.accent })), ...DIMA.map((n) => ({ text: n, color: theme.alt }))]
  const visible = Math.round(rowsIn * rows.length)
  const people = [...MARINA.map((n, i) => ({ n, x: 200 + i * 100, color: theme.accent })), ...DIMA.map((n, i) => ({ n, x: 880 + i * 100, color: theme.alt }))]

  // позы по репликам: приветствие → показывает на базу → задумались, кто откроет чужой шкафчик
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['cheer', 'happy']],
    [b(0) + 60, ['stand', 'happy']],
    [b(2), ['point', 'neutral']],
    [b(3), ['stand', 'happy']],
    [b(4), ['think', 'worried']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['cheer', 'happy']],
    [b(0) + 68, ['stand', 'happy']],
    [b(4) + 50, ['think', 'neutral']],
  ])

  return (
    <KitScene chip="1 / 5 · Одна база на всех" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <Coach x={250} y={170} color={theme.accent} label="Марина" enterAt={b(0)} pose={marina[0]} mood={marina[1]} />
      <Coach x={1030} y={170} color={theme.alt} label="Дима" enterAt={b(0) + 8} pose={dima[0]} mood={dima[1]} />
      {people.map((p, i) => (
        <Client key={p.n} x={p.x} y={CLIENT_Y} scale={0.55} color={p.color} label={p.n} enterAt={b(1) + i * 5 + (i >= 3 ? 10 : 0)} highlight={p.n === 'Анна' && focus > 0.5} />
      ))}
      <Arrow x1={440} y1={420} x2={512} y2={372} dashed draw={rowsIn} />
      <Arrow x1={840} y1={420} x2={768} y2={372} dashed draw={rowsIn} />
      <g opacity={useAppear(b(2))}>
        <Database x={640} y={300} rows={rows.slice(0, visible).map((r, i) => ({ ...r, dim: focus > 0.5 && i !== 0 }))} />
      </g>
      {/* у каждого подопечного свой ключ — появляются по одному */}
      {people.map((p, i) => {
        const k = interpolate(frame, [b(3) + 30 + i * 6, b(3) + 40 + i * 6], [0, 1], clamp)
        const dim = focus > 0.5 && p.n !== 'Анна'
        return (
          <g key={p.n} opacity={k * (dim ? 0.3 : 1)}>
            <KeyGlyph x={p.x + 30} y={392} color={p.color} />
          </g>
        )
      })}
      <g opacity={caption}>
        <Label x={640} y={110} size={26} color={theme.soft} weight={500}>
          шкафчики рядом, ключи — свои
        </Label>
      </g>
      <g opacity={focus}>
        <text x={800} y={250} textAnchor="middle" style={{ font: `700 56px ${theme.font}` }} fill={theme.risk}>
          ?
        </text>
      </g>
    </KitScene>
  )
}
