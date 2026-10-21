import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Hacker } from '../../actors/Hacker'
import { Packet } from '../../actors/Packet'
import { Turnstile } from '../../actors/Turnstile'
import { theme } from '../../theme'
import { L } from '../layout'
import { beat, sceneDuration } from '../script'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { useAppear, useTrack } from '../../kit/hooks'

const ID = 's4-turnstile'
const ROWS = [
  { text: '17 · Анна', owner: 'Анна', color: theme.accent },
  { text: '18 · Олег', owner: 'Олег', color: theme.alt },
  { text: '19 · Игорь', owner: 'Игорь', color: theme.alt },
]

// Сцена 4: RLS — турникет перед каждой строкой базы сверяет пропуск с владельцем.
export function S4Turnstile() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const dbIn = useAppear(b(0))
  const pass = useAppear(b(3))
  const compare = useAppear(b(4))
  const annaGo = useTrack([
    [b(5), 330, L.s4rowsY[0]],
    [b(5) + 45, L.s4gateX - 70, L.s4rowsY[0]],
    [b(5) + 75, L.s4db.x - 160, L.s4rowsY[0]],
  ])
  const annaOpen = interpolate(frame, [b(5) + 40, b(5) + 55, b(6) - 10, b(6)], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const attack = useTrack([
    [b(6), 330, L.s4rowsY[1]],
    [b(6) + 45, L.s4gateX - 75, L.s4rowsY[1]],
  ])
  const shake = frame > b(6) + 45 && frame < b(6) + 75 ? Math.sin((frame - b(6)) * 1.6) * 6 : 0
  const empty = useAppear(b(7))
  const layers = useAppear(b(8))
  const finale = useAppear(b(9))
  const gateFocus = frame >= b(4) && frame < b(5)

  return (
    <KitScene chip="4 / 5 · RLS — турникет у строки" duration={sceneDuration(ID)}>
      <g opacity={dbIn}>
        <rect x={L.s4db.x - 170} y={L.s4rowsY[0] - 70} width={340} height={L.s4rowsY[2] - L.s4rowsY[0] + 140} rx={18} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <Label x={L.s4db.x} y={L.s4rowsY[2] + 110} size={22}>
          База данных
        </Label>
        {ROWS.map((r, i) => {
          const lit = (i === 0 && frame >= b(5) + 75 && frame < b(6)) || finale > 0.5
          return (
            <g key={r.text}>
              <rect x={L.s4db.x - 130} y={L.s4rowsY[i] - 26} width={260} height={52} rx={8} fill={lit ? theme.okTint : theme.paper} stroke={r.color} strokeWidth={3} />
              <rect x={L.s4db.x - 130} y={L.s4rowsY[i] - 26} width={12} height={52} rx={4} fill={r.color} />
              <text x={L.s4db.x - 105} y={L.s4rowsY[i] + 8} style={{ font: `500 22px ${theme.mono}` }} fill={theme.ink}>
                {r.text}
              </text>
            </g>
          )
        })}
      </g>
      {ROWS.map((r, i) => (
        <Turnstile key={r.text} x={L.s4gateX} y={L.s4rowsY[i]} scale={0.42} label="" open={i === 0 ? annaOpen : 0} enterAt={b(1) + i * 6} highlight={gateFocus && i === 0} />
      ))}
      <g opacity={useAppear(b(1))}>
        <Label x={L.s4gateX} y={L.s4rowsY[0] - 75} size={22} color={theme.accent}>
          RLS
        </Label>
      </g>
      <Client x={120} y={L.s4rowsY[0] + 20} scale={0.55} color={theme.accent} label="Анна" enterAt={b(2)} />
      <g opacity={pass}>
        <Card x={190} y={L.s4rowsY[0] - 45} w={180} h={64} stroke={theme.accent}>
          <Label x={280} y={L.s4rowsY[0] - 17} size={18} color={theme.soft} weight={500}>
            пропуск
          </Label>
          <Label x={280} y={L.s4rowsY[0] + 9} size={22} color={theme.accent}>
            Анна
          </Label>
        </Card>
      </g>
      <g opacity={compare * (frame < b(6) ? 1 : 0)}>
        <Label x={L.s4gateX - 130} y={L.s4rowsY[2] + 80} size={22} color={theme.ink} weight={600}>
          пропуск = владелец строки?
        </Label>
      </g>
      {frame >= b(5) && frame < b(5) + 75 && <Packet x={annaGo.x} y={annaGo.y} scale={0.8} text="client/17" color={theme.ok} />}
      {frame >= b(6) && (
        <g>
          <Hacker x={120} y={L.s4rowsY[1] + 150} scale={0.5} label="Кто-то" enterAt={b(6)} />
          <Card x={190} y={L.s4rowsY[1] + 105} w={180} h={64} stroke={theme.risk}>
            <Label x={280} y={L.s4rowsY[1] + 133} size={18} color={theme.soft} weight={500}>
              пропуск
            </Label>
            <Label x={280} y={L.s4rowsY[1] + 159} size={22} color={theme.risk}>
              не Олег
            </Label>
          </Card>
          {frame < b(8) && <Packet x={attack.x + shake} y={attack.y} scale={0.8} text="client/18" color={theme.risk} />}
        </g>
      )}
      <g opacity={empty * (frame < b(8) ? 1 : 0)}>
        <Card x={430} y={L.s4rowsY[2] + 40} w={200} h={60} stroke={theme.ok}>
          <text x={530} y={L.s4rowsY[2] + 80} textAnchor="middle" style={{ font: `600 26px ${theme.mono}` }} fill={theme.ok}>
            [ ] пусто
          </text>
        </Card>
      </g>
      <g opacity={layers * (finale > 0.5 ? 0.35 : 1)}>
        <rect x={430} y={95} width={140} height={L.s4rowsY[2] - 95 + 60} rx={10} fill="none" stroke={theme.soft} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={500} y={82} size={20} color={theme.soft} weight={500}>
          интерфейс
        </Label>
        <path d={`M 400 ${L.s4rowsY[1]} C 430 40, 580 40, 610 ${L.s4rowsY[1]}`} fill="none" stroke={theme.risk} strokeWidth={3} strokeDasharray="6 6" />
        <Label x={500} y={L.s4rowsY[2] + 110} size={20} color={theme.risk} weight={600}>
          обходится
        </Label>
      </g>
      <g opacity={finale}>
        <Label x={L.s4gateX + 70} y={L.s4rowsY[0] - 105} size={24} color={theme.ok} weight={700}>
          правило в базе — для любого запроса
        </Label>
      </g>
    </KitScene>
  )
}
