import { interpolate, useCurrentFrame } from 'remotion'
import { Database } from '../../actors/Database'
import { Hacker } from '../../actors/Hacker'
import { Packet } from '../../actors/Packet'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { theme } from '../../theme'
import { DB_ROWS, L } from '../layout'
import { beat, sceneDuration } from '../script'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Label } from '../../kit/parts'
import { useAppear, useTrack } from '../../kit/hooks'
import { PhoneScreen } from './S2Request'

const ID = 's3-attack'

// Сцена 3: тот же запрос с подменённым номером — база отдаёт чужое (IDOR).
export function S3Attack() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const swapped = frame >= b(2) + 25
  const out = useTrack([
    [b(4), L.packetAbovePhone.x, L.packetAbovePhone.y],
    [b(4) + 35, L.server.x, L.packetAbovePhone.y],
    [b(4) + 70, L.db.x, L.packetAbovePhone.y],
  ])
  const back = useTrack([
    [b(5) + 10, L.db.x, 520],
    [b(5) + 70, L.phone.x, 520],
  ])
  const flash = interpolate(frame, [b(6), b(6) + 8, b(6) + 30], [0, 0.35, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const leak = useAppear(b(6))
  const idor = useAppear(b(7))
  const noButton = useAppear(b(8))
  const rowHi = frame >= b(3) && frame < b(7)

  return (
    <KitScene chip="3 / 5 · Подмена номера" duration={sceneDuration(ID)}>
      <Hacker x={90} y={430} scale={0.6} label="Кто-то" enterAt={b(0)} />
      <Phone x={L.phone.x} y={L.phone.y}>
        <PhoneScreen tapAt={b(2)} listAt={b(5) + 70} list={['Олег: присед 90', 'Олег: вес 84 кг', 'Олег: колено']} listColor={theme.risk} />
      </Phone>
      <Server x={L.server.x} y={L.server.y} />
      <g opacity={useAppear(b(4) + 30)}>
        <Label x={L.server.x} y={L.server.y - 120} color={theme.ok} size={22}>
          ✓ запрос корректный
        </Label>
      </g>
      <Database x={L.db.x} y={L.db.y} rows={DB_ROWS.map((r, i) => ({ ...r, dim: rowHi && i !== 1 }))} highlight={rowHi} />
      <Arrow x1={330} y1={300} x2={555} y2={300} dashed />
      <Arrow x1={725} y1={300} x2={925} y2={300} dashed />
      {frame >= b(2) && frame < b(4) && <Packet x={L.packetAbovePhone.x} y={L.packetAbovePhone.y} text={swapped ? 'client/18' : 'client/17'} color={swapped ? theme.risk : theme.accent} highlight={swapped} />}
      {frame >= b(4) && frame < b(5) && <Packet x={out.x} y={out.y} text="client/18" color={theme.risk} />}
      {frame >= b(5) + 10 && frame < b(6) + 30 && <Packet x={back.x} y={back.y} text="тренировки Олега" color={theme.risk} />}
      <g opacity={useAppear(b(3)) * (frame < b(4) ? 1 : 0)}>
        <Label x={L.packetAbovePhone.x + 150} y={L.packetAbovePhone.y + 8} anchor="start" color={theme.alt} size={22}>
          18 — Олег, подопечный Димы
        </Label>
      </g>
      <g opacity={leak * (frame < b(7) ? 1 : 0)}>
        <Label x={640} y={480} size={34} color={theme.risk} weight={700}>
          так утекают данные
        </Label>
      </g>
      <g opacity={idor}>
        <rect x={500} y={70} width={280} height={56} rx={28} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
        <Label x={640} y={107} size={28} color={theme.risk} weight={700}>
          IDOR
        </Label>
      </g>
      <g opacity={noButton}>
        <Label x={L.phone.x} y={L.phone.y + 170} size={20} color={theme.soft} weight={500}>
          кнопки «Олег» не было
        </Label>
      </g>
      <rect x={0} y={0} width={1280} height={720} fill={theme.risk} opacity={flash} />
    </KitScene>
  )
}
