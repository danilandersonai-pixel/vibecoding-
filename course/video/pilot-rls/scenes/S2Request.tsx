import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Database } from '../../actors/Database'
import { Packet } from '../../actors/Packet'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { theme } from '../../theme'
import { DB_ROWS, L } from '../layout'
import { beat } from '../script'
import { Arrow, Label, Stage } from '../kit'
import { useAppear, useTrack } from '../hooks'

const ID = 's2-request'

// Экран телефона: кнопка «Мои тренировки», затем список.
export function PhoneScreen({ tapAt, listAt, list, listColor = theme.ok }: { tapAt: number; listAt: number; list: string[]; listColor?: string }) {
  const frame = useCurrentFrame()
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const shown = frame >= listAt
  return (
    <g>
      <rect x={-46} y={-70} width={92} height={30} rx={8} fill={theme.accent} />
      <text y={-50} textAnchor="middle" fill="#fff" style={{ font: `600 11px ${theme.font}` }}>
        Мои тренировки
      </text>
      {ripple > 0 && <circle cx={0} cy={-55} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
      {shown &&
        list.map((t, i) => (
          <g key={t}>
            <rect x={-46} y={-28 + i * 30} width={92} height={24} rx={6} fill={theme.paper} stroke={listColor} strokeWidth={2} />
            <text x={-40} y={-11 + i * 30} fill={theme.ink} style={{ font: `500 11px ${theme.font}` }}>
              {t}
            </text>
          </g>
        ))}
    </g>
  )
}

// Сцена 2: обычный запрос от кнопки до базы и обратно.
export function S2Request() {
  const b = (i: number) => beat(ID, i)
  const out = useTrack([
    [b(1), L.packetAbovePhone.x, L.packetAbovePhone.y],
    [b(3) - 10, L.packetAbovePhone.x, L.packetAbovePhone.y],
    [b(3) + 25, L.server.x, L.packetAbovePhone.y],
    [b(3) + 60, L.db.x, L.packetAbovePhone.y],
  ])
  const back = useTrack([
    [b(4) + 10, L.db.x, 520],
    [b(4) + 70, L.phone.x, 520],
  ])
  const frame = useCurrentFrame()
  const outVisible = frame >= b(1) && frame < b(4)
  const backVisible = frame >= b(4) + 10 && frame < b(5)
  const rowHi = frame >= b(4) && frame < b(5) + 30
  const callout = useAppear(b(6))
  const warn = useAppear(b(7))

  return (
    <Stage chip="2 / 5 · Как ходит запрос">
      <Client x={90} y={430} scale={0.6} label="Анна" color={theme.accent} enterAt={b(0) - 10} />
      <Phone x={L.phone.x} y={L.phone.y}>
        <PhoneScreen tapAt={b(0) + 30} listAt={b(5)} list={['Жим 45 кг × 8', 'Присед 60 × 10', 'Тяга 70 × 6']} />
      </Phone>
      <Server x={L.server.x} y={L.server.y} />
      <Database x={L.db.x} y={L.db.y} rows={DB_ROWS.map((r, i) => ({ ...r, dim: rowHi && i !== 0 }))} highlight={rowHi} />
      <Arrow x1={330} y1={300} x2={555} y2={300} dashed />
      <Arrow x1={725} y1={300} x2={925} y2={300} dashed />
      {outVisible && <Packet x={out.x} y={out.y} text="client/17" />}
      {backVisible && <Packet x={back.x} y={back.y} text="тренировки Анны" color={theme.ok} />}
      <g opacity={useAppear(b(2)) * (frame < b(3) ? 1 : 0)}>
        <Label x={L.packetAbovePhone.x + 150} y={L.packetAbovePhone.y + 8} anchor="start" color={theme.accent} size={22}>
          17 — номер Анны
        </Label>
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
    </Stage>
  )
}
