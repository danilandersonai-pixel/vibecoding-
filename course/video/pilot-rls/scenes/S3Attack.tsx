import { interpolate, useCurrentFrame } from 'remotion'
import { Database } from '../../actors/Database'
import { Hacker } from '../../actors/Hacker'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Card, Label } from '../../kit/parts'
import { PhoneScreen } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { DB_ROWS, L, PHONE_FONT, PHONE_SCALE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's3-attack'
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Сцена 3: тот же запрос с подменённым номером — база отдаёт чужое (IDOR).
export function S3Attack() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const swapped = frame >= b(2) + 25
  const out = useTrack([
    [b(4) + 10, L.phone.x, L.outY],
    [b(4) + 45, L.server.x, L.outY],
    [b(4) + 80, L.db.x, L.outY],
  ])
  const back = useTrack([
    [b(5) + 10, L.db.x, L.backY],
    [b(5) + 70, L.phone.x, L.backY],
  ])
  // повтор в конце: запрос снова уходит, кнопка ему не нужна
  const again = useTrack([
    [b(8) + 70, L.phone.x, L.outY],
    [b(8) + 110, L.server.x, L.outY],
  ])
  const flash = interpolate(frame, [b(6), b(6) + 8, b(6) + 30], [0, 0.35, 0], clamp)
  const account = useAppear(b(1)) * interpolate(frame, [b(4), b(4) + 10], [1, 0], clamp)
  const leak = useAppear(b(6))
  // IDOR уходит до наезда на телефон, чтобы надпись не резалась краем кадра
  const idor = useAppear(b(7)) * interpolate(frame, [b(8) - 10, b(8)], [1, 0], clamp)
  const idorWords = useAppear(b(7) + 60)
  const noButton = useAppear(b(8) + 10)
  const olegRow = frame >= b(4) + 80 && frame < b(7)

  // думает → жмёт кнопку → меняет номер → радуется чужим данным → показывает на телефон
  const hacker = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1), ['think', 'neutral']],
    [b(1) + 70, ['point', 'neutral']],
    [b(1) + 100, ['think', 'neutral']],
    [b(2), ['point', 'neutral']],
    [b(4), ['stand', 'neutral']],
    [b(6), ['cheer', 'happy']],
    [b(7), ['stand', 'neutral']],
    [b(8), ['point', 'happy']],
  ])

  return (
    <KitScene chip="3 / 5 · Подмена номера" duration={sceneDuration(ID)} {...STAGING[ID]} overlay={<rect width={1280} height={720} fill={theme.risk} opacity={flash} />}>
      <Hacker x={L.person.x} y={L.person.y} scale={0.6} label="Кто-то" enterAt={b(0)} pose={hacker[0]} mood={hacker[1]} />
      <g opacity={account}>
        <Card x={10} y={268} w={150} h={76} stroke={theme.ok}>
          <Label x={85} y={298} size={20} color={theme.soft} weight={500}>
            аккаунт
          </Label>
          <Label x={85} y={328} size={22} color={theme.ok}>
            обычный ✓
          </Label>
        </Card>
      </g>
      <Phone x={L.phone.x} y={L.phone.y} scale={PHONE_SCALE}>
        <PhoneScreen tapAt={b(1) + 72} listAt={b(5) + 70} list={['присед 90 кг', 'вес 84 кг', 'болит колено']} listColor={theme.risk}>
          {/* кнопки «Олег» в приложении нет — пунктирный контур и красный крестик */}
          <g opacity={noButton}>
            <rect x={-50} y={52} width={100} height={28} rx={7} fill="none" stroke={theme.soft} strokeWidth={2} strokeDasharray="5 4" />
            <text x={-8} y={71} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${PHONE_FONT}px ${theme.font}` }}>
              Олег
            </text>
            <path d="M28 60 L40 72 M40 60 L28 72" stroke={theme.risk} strokeWidth={3} strokeLinecap="round" />
          </g>
        </PhoneScreen>
      </Phone>
      <Server x={L.server.x} y={L.server.y} />
      <g opacity={useAppear(b(4) + 40) * (frame < b(6) ? 1 : 0)}>
        <Label x={L.server.x} y={L.server.y - 120} color={theme.ok} size={22}>
          ✓ запрос корректный
        </Label>
      </g>
      <Database x={L.db.x} y={L.db.y} rows={DB_ROWS.map((r, i) => ({ ...r, dim: olegRow && i !== 1 }))} />
      <Arrow x1={370} y1={300} x2={555} y2={300} dashed />
      <Arrow x1={725} y1={300} x2={925} y2={300} dashed />
      {frame >= b(2) && frame < b(4) + 10 && (
        <Packet x={L.phone.x} y={L.outY} text={swapped ? 'client/18' : 'client/17'} color={swapped ? theme.risk : theme.accent} highlight={swapped} enterAt={b(2)} />
      )}
      {frame >= b(4) + 10 && frame < b(5) && <Packet x={out.x} y={out.y} text="client/18" color={theme.risk} />}
      {frame >= b(5) + 10 && frame < b(6) + 10 && <Packet x={back.x} y={back.y} text="тренировки Олега" color={theme.risk} />}
      {frame >= b(8) + 70 && <Packet x={again.x} y={again.y} text="client/18" color={theme.risk} enterAt={b(8) + 70} />}
      <g opacity={useAppear(b(3)) * (frame < b(4) ? 1 : 0)}>
        <Label x={L.phone.x + 150} y={L.outY + 8} anchor="start" color={theme.alt} size={22}>
          18 — Олег, подопечный Димы
        </Label>
      </g>
      <g opacity={leak * (frame < b(7) ? 1 : 0)}>
        <Label x={640} y={480} size={34} color={theme.risk} weight={700}>
          так утекают данные
        </Label>
      </g>
      <g opacity={idor}>
        <rect x={500} y={60} width={280} height={56} rx={28} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
        <Label x={640} y={97} size={28} color={theme.risk} weight={700}>
          IDOR
        </Label>
        <g opacity={idorWords}>
          <Label x={640} y={152} size={20} color={theme.soft} weight={500}>
            небезопасное прямое обращение к объекту
          </Label>
        </g>
      </g>
      <g opacity={noButton}>
        <Label x={L.phone.x + 110} y={470} anchor="start" size={22} color={theme.soft} weight={500}>
          кнопки «Олег» не было
        </Label>
      </g>
    </KitScene>
  )
}
