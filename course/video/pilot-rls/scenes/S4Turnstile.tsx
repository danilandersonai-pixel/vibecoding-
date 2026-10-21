import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Hacker } from '../../actors/Hacker'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Turnstile } from '../../actors/Turnstile'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Card, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { theme } from '../../theme'
import { L } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's4-turnstile'
const ROWS = [
  { text: '17 · Анна', color: theme.accent },
  { text: '18 · Олег', color: theme.alt },
  { text: '19 · Игорь', color: theme.alt },
]
// Политика в Supabase: RLS включается для таблицы, правило пускает только владельца строки.
const POLICY = ['alter table workouts', '  enable row level security;', 'create policy "свои тренировки"', '  on workouts for select', '  using (auth.uid() = user_id);']
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Сцена 4: RLS — турникет перед каждой строкой базы сверяет пропуск с владельцем; в конце — как это пишут на SQL.
export function S4Turnstile() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const pass = useAppear(b(3) + 40)
  const compare = useAppear(b(4))
  const annaGo = useTrack([
    [b(5), 330, L.s4rowsY[0]],
    [b(5) + 45, L.s4gateX - 70, L.s4rowsY[0]],
    [b(5) + 75, L.s4db.x - 160, L.s4rowsY[0]],
  ])
  const annaOpen = interpolate(frame, [b(5) + 40, b(5) + 55, b(6) - 10, b(6)], [0, 1, 1, 0], clamp)
  const attack = useTrack([
    [b(6), 330, L.s4rowsY[1]],
    [b(6) + 45, L.s4gateX - 75, L.s4rowsY[1]],
  ])
  const shake = frame > b(6) + 45 && frame < b(6) + 75 ? Math.sin((frame - b(6)) * 1.6) * 6 : 0
  const empty = useAppear(b(7))
  const layers = useAppear(b(8))
  const bypass = interpolate(frame, [b(8) + 30, b(8) + 70], [0, 1], clamp)
  const finale = useAppear(b(9))
  const inBase = useAppear(b(9) + 50)
  // к коду политики левая часть уходит, остаются база и турникеты
  const people = interpolate(frame, [b(10) - 6, b(10) + 6], [1, 0], clamp)
  const link = interpolate(frame, [b(10) + 70, b(10) + 95], [0, 1], clamp)
  const gatesLit = frame >= b(2) && frame < b(3)

  // Анна радуется открытому турникету; «кто-то» удивлён закрытому
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 55, ['cheer', 'happy']],
    [b(6), ['stand', 'neutral']],
  ])
  const hacker = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(6) + 50, ['surprised', 'worried']],
    [b(8), ['stand', 'worried']],
  ])

  return (
    <KitScene chip="4 / 5 · RLS — турникет у строки" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <g opacity={useAppear(b(0))}>
        <rect x={L.s4db.x - 170} y={L.s4rowsY[0] - 70} width={340} height={L.s4rowsY[2] - L.s4rowsY[0] + 140} rx={18} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <Label x={L.s4db.x} y={L.s4rowsY[2] + 110} size={22}>
          База данных
        </Label>
        {ROWS.map((r, i) => {
          const lit = (i === 0 && frame >= b(5) + 75 && frame < b(6)) || finale > 0.5
          const rowIn = interpolate(frame, [b(0) + 15 + i * 12, b(0) + 27 + i * 12], [0, 1], clamp)
          return (
            <g key={r.text} opacity={rowIn}>
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
        <Turnstile key={r.text} x={L.s4gateX} y={L.s4rowsY[i]} scale={0.42} label="" open={i === 0 ? annaOpen : 0} enterAt={b(1) + i * 6} highlight={gatesLit || (frame >= b(4) && frame < b(5) && i === 0)} />
      ))}
      <g opacity={useAppear(b(1))}>
        <Label x={L.s4gateX} y={L.s4rowsY[0] - 75} size={22} color={theme.accent}>
          RLS
        </Label>
      </g>
      <g opacity={inBase}>
        {/* рамка «всё это — в базе»: турникеты и строки */}
        <rect x={L.s4gateX - 60} y={L.s4rowsY[0] - 95} width={L.s4db.x + 185 - (L.s4gateX - 60)} height={L.s4rowsY[2] - L.s4rowsY[0] + 180} rx={22} fill="none" stroke={theme.ok} strokeWidth={4} />
      </g>
      <g opacity={people}>
        <Client x={120} y={L.s4rowsY[0] + 20} scale={0.55} color={theme.accent} label="Анна" enterAt={b(3)} pose={anna[0]} mood={anna[1]} />
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
            <Hacker x={120} y={L.s4rowsY[1] + 150} scale={0.5} label="Кто-то" enterAt={b(6)} pose={hacker[0]} mood={hacker[1]} />
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
          <path d={`M 400 ${L.s4rowsY[1]} C 430 40, 580 40, 610 ${L.s4rowsY[1]}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - bypass} fill="none" stroke={theme.risk} strokeWidth={3} />
          <g opacity={bypass}>
            <Label x={500} y={L.s4rowsY[2] + 110} size={20} color={theme.risk} weight={600}>
              обходится
            </Label>
          </g>
        </g>
      </g>
      <g opacity={finale}>
        <Label x={L.s4gateX + 70} y={L.s4rowsY[0] - 115} size={24} color={theme.ok} weight={700}>
          правило в базе — для любого запроса
        </Label>
      </g>
      {frame >= b(10) && <Editor x={L.s4code.x} y={L.s4code.y} w={L.s4code.w} at={b(10)} file="rls.sql" lines={POLICY} highlight={[3, 4, 5]} />}
      <Arrow x1={L.s4code.x + L.s4code.w + 10} y1={L.s4code.y + 196} x2={L.s4gateX - 48} y2={L.s4rowsY[1] + 10} color={theme.accent} draw={link} />
    </KitScene>
  )
}
