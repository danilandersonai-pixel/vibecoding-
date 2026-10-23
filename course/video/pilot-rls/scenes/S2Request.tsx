import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Database } from '../../actors/Database'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { CLAMP } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { PhoneScreen } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { DB_ROWS, L, PHONE_SCALE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's2-request'

// Сцена 2: обычный запрос от кнопки до базы и обратно; что такое запрос и ответ.
export function S2Request() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const out = useTrack([
    [b(3), L.phone.x, L.outY],
    [b(3) + 25, L.server.x, L.outY],
    [b(3) + 60, L.db.x, L.outY],
  ])
  const back = useTrack([
    [b(4) + 10, L.db.x, L.backY],
    [b(4) + 70, L.phone.x, L.backY],
  ])
  const outVisible = frame >= b(1) + 6 && frame < b(4)
  const backVisible = frame >= b(4) + 10 && frame < b(5) + 10
  // строка Анны: «17 — это она», затем «база её нашла»
  const annaRow = (frame >= b(2) && frame < b(3)) || (frame >= b(4) && frame < b(6))
  // запрос и ответ: стрелки рисуются по очереди и уходят перед наездом на телефон
  const arrowsOut = interpolate(frame, [b(6) - 8, b(6)], [1, 0], CLAMP)
  const request = interpolate(frame, [b(5), b(5) + 24], [0, 1], CLAMP)
  const answer = interpolate(frame, [b(5) + 60, b(5) + 84], [0, 1], CLAMP)
  const callout = useAppear(b(7))
  const warn = useAppear(b(8))

  // нажимает кнопку → радуется списку → «можно подменить» — удивлена и задумалась
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 20, ['point', 'neutral']],
    [b(1), ['stand', 'neutral']],
    [b(6) + 10, ['cheer', 'happy']],
    [b(7), ['stand', 'neutral']],
    [b(8), ['surprised', 'worried']],
    [b(8) + 70, ['think', 'worried']],
  ])

  return (
    <KitScene chip="2 / 5 · Как ходит запрос" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <Client x={L.person.x} y={L.person.y} scale={0.6} label="Анна" color={theme.accent} enterAt={b(0) - 6} pose={anna[0]} mood={anna[1]} />
      <Phone x={L.phone.x} y={L.phone.y} scale={PHONE_SCALE}>
        <PhoneScreen tapAt={b(0) + 40} listAt={b(6)} list={['жим 45 кг', 'присед 60 кг', 'тяга 70 кг']} />
      </Phone>
      <Server x={L.server.x} y={L.server.y} />
      <Database x={L.db.x} y={L.db.y} rows={DB_ROWS.map((r, i) => ({ ...r, dim: annaRow && i !== 0 }))} />
      <Arrow x1={370} y1={300} x2={555} y2={300} dashed />
      <Arrow x1={725} y1={300} x2={925} y2={300} dashed />
      {outVisible && <Packet x={out.x} y={out.y} text="client/17" enterAt={b(1) + 6} />}
      {backVisible && <Packet x={back.x} y={back.y} text="тренировки Анны" color={theme.ok} />}
      <g opacity={useAppear(b(2)) * (frame < b(3) ? 1 : 0)}>
        <Label x={L.phone.x + 150} y={L.outY + 8} anchor="start" color={theme.accent} size={22}>
          17 — номер Анны
        </Label>
      </g>
      <g opacity={arrowsOut}>
        <Arrow x1={370} y1={L.outY} x2={935} y2={L.outY} color={theme.accent} draw={request} />
        <g opacity={request}>
          <Label x={650} y={L.outY - 16} color={theme.accent} size={24} weight={700}>
            запрос: «дай тренировки 17»
          </Label>
        </g>
        <Arrow x1={935} y1={L.backY} x2={370} y2={L.backY} color={theme.ok} draw={answer} />
        <g opacity={answer}>
          <Label x={650} y={L.backY - 16} color={theme.ok} size={24} weight={700}>
            ответ: строки Анны
          </Label>
        </g>
      </g>
      <g opacity={callout}>
        <rect x={L.callout.x - 170} y={L.callout.y - 45} width={340} height={90} rx={14} fill={theme.paper} stroke={theme.risk} strokeWidth={3} />
        <text x={L.callout.x} y={L.callout.y + 12} textAnchor="middle" style={{ font: `600 34px ${theme.mono}` }} fill={theme.ink}>
          client/<tspan fill={theme.risk}>17</tspan>
        </text>
        <Label x={L.callout.x} y={L.callout.y + 78} size={20} color={theme.soft} weight={500}>
          собран на телефоне
        </Label>
      </g>
      <g opacity={warn}>
        <Label x={L.callout.x + 230} y={L.callout.y + 10} anchor="start" size={24} color={theme.risk}>
          ✎ можно подменить
        </Label>
      </g>
    </KitScene>
  )
}
