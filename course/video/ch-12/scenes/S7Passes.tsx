import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent } from '../../actors/Agent'
import { Packet } from '../../actors/Packet'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, PHONE_FONT, PHONE_SCALE, S7 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniPhone, Plate } from './parts'

const ID = 's7-passes'
const X2 = BOARD2
const F = PHONE_FONT
const TR = S7.tree

type Group = 'screens' | 'api' | 'db' | 'main' | null
const FILES: { t: string; g: Group }[] = [
  { t: 'src/', g: null },
  { t: '  screens/', g: 'screens' },
  { t: '    SetForm.tsx', g: 'screens' },
  { t: '    Clients.tsx', g: 'screens' },
  { t: '  api/sets.ts', g: 'api' },
  { t: '  db/schema.ts', g: 'db' },
  { t: '  main.ts', g: 'main' },
  { t: 'tests/', g: null },
]
const ROW = 34
const TREE_H = BAR + 16 + FILES.length * ROW + 12
const TINT: Record<string, string> = { screens: theme.accentTint, api: theme.altTint, db: theme.okTint, main: theme.altTint }
const MAP = [
  { title: 'Экраны', sub: 'что видит Анна', color: theme.accent },
  { title: 'API', sub: 'запросы', color: theme.alt },
  { title: 'База', sub: 'данные', color: theme.ok },
]
const PATH = ['screens/SetForm.tsx', 'api/sets.ts', 'db: таблица sets']
const SPEC = ['Умеет: подходы, график, тренер', 'Правила: вес — число больше 0', 'Крайние случаи: нет сети → очередь']

// Сцена 7: свой проект тоже приходится разбирать — три прохода: карта, один сценарий, описание;
// по описанию разросшийся проект можно собрать заново. Итог главы.
export function S7Passes() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: проект, который писал ИИ, и первый проход — карта
  const rowIn = FILES.map((_, i) => appear(frame, b(0) + 14 + i * 6, 8))
  const agentIn = appear(frame, b(0) + 60)
  const byAi = appear(frame, b(0) + 80)
  const doubt = appear(frame, b(0) + 110) * interpolate(frame, [b(1) + 30, b(1) + 40], [1, 0], CLAMP)
  const pass1 = appear(frame, b(1) + 6)
  const start = appear(frame, b(1) + 26)
  const down = interpolate(frame, [b(1) + 36, b(1) + 50], [0, 1], CLAMP)
  const boxIn = [50, 65, 80].map((d) => appear(frame, b(1) + d))
  const links = [0, 1].map((i) => interpolate(frame, [b(1) + 92 + i * 12, b(1) + 104 + i * 12], [0, 1], CLAMP))
  const tint = appear(frame, b(1) + 110)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'worried']],
    [b(1) + 40, ['point', 'neutral']],
    [b(1) + 120, ['stand', 'happy']],
  ])

  // доска 2: второй проход — один сценарий
  const pass2 = appear(frame, b(2) + 20)
  const phone = appear(frame, b(2) + 24)
  const fileIn = [32, 42, 52].map((d) => appear(frame, b(2) + d))
  const tapAt = b(2) + 62
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const fileY = (i: number) => S7.files.ys[i] + S7.files.h / 2
  const fx = S7.files.x + S7.files.w / 2
  // пакет ждёт справа от карточки файла, чтобы не закрывать её подпись
  const px = S7.files.x + S7.files.w + 70
  const packet = trackAt(frame, [
    [tapAt + 6, S7.phone.x + 40, S7.phone.y + 30],
    [tapAt + 28, px, fileY(0)],
    [tapAt + 46, px, fileY(0)],
    [tapAt + 64, px, fileY(1)],
    [tapAt + 82, px, fileY(1)],
    [tapAt + 100, px, fileY(2)],
  ])
  const packetOn = frame >= tapAt + 6 && frame < tapAt + 112
  const packetOut = interpolate(frame, [tapAt + 102, tapAt + 112], [1, 0], CLAMP)
  const hit = [tapAt + 28, tapAt + 64, tapAt + 100].map((at) => frame >= at)

  // третий проход — описание по коду
  const pass3 = appear(frame, b(3) + 6)
  const spec = appear(frame, b(3) + 14)
  const unsure = appear(frame, b(3) + 135)
  // заплатки и сборка заново
  const patches = [0, 1, 2].map((i) => appear(frame, b(4) + 6 + i * 10, 8))
  const rebuild = interpolate(frame, [b(4) + 50, b(4) + 70], [0, 1], CLAMP)
  const fresh = appear(frame, b(4) + 70)
  // итог
  const dim = interpolate(frame, [b(5), b(5) + 14], [0, 0.94], CLAMP)
  const recap = appear(frame, b(5) + 10)
  const stepIn = [20, 50, 80].map((d) => appear(frame, b(5) + d))

  const [w0, w1, w2] = S7.map.boxes
  const mapX = [S7.map.x, S7.map.x + w0 + S7.map.gap, S7.map.x + w0 + w1 + 2 * S7.map.gap]
  const mapW = [w0, w1, w2]
  const RC = S7.recap

  return (
    <KitScene chip="7 / 7 · Три прохода разбора" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: проект, который писал ИИ */}
      {frame >= b(0) && (
        <Window
          x={TR.x}
          y={TR.y}
          w={TR.w}
          h={TREE_H}
          at={b(0) + 4}
          bar={
            <Mono x={20} y={BAR / 2 + 7} fill={theme.ink}>
              trainer-app
            </Mono>
          }
        >
          {FILES.map((f, i) => {
            const y = BAR + 16 + i * ROW
            return (
              <g key={f.t} opacity={rowIn[i]}>
                {f.g && <rect x={8} y={y} width={TR.w - 16} height={ROW - 4} rx={6} fill={TINT[f.g]} opacity={tint} />}
                <Mono x={20} y={y + 22} fill={theme.ink}>
                  {f.t}
                </Mono>
              </g>
            )
          })}
        </Window>
      )}
      <g opacity={agentIn}>
        <Agent x={S7.agent.x} y={S7.agent.y} scale={0.6} pose="done" />
      </g>
      <g opacity={byAi}>
        <Pill x={S7.agent.x} y={S7.agent.y - 90} text="код писал ИИ" color={theme.accent} fill={theme.paper} size={18} compact />
      </g>
      <Actor x={S7.you.x} y={S7.you.y} scale={0.7} label="Вы" enterAt={b(0) + 70}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={doubt}>
        <Label x={S7.you.x + 54} y={S7.you.y - 64} size={44} weight={700} color={theme.risk}>
          ?
        </Label>
      </g>
      {/* первый проход: карта */}
      <g opacity={pass1}>
        <Pill x={955} y={110} text="1 · Карта" color={theme.accent} fill={theme.accentTint} size={24} />
      </g>
      <g opacity={start}>
        <Pill x={955} y={176} text="main.ts — вход" color={theme.alt} fill={theme.paper} size={20} mono compact />
      </g>
      <Arrow x1={955} y1={196} x2={mapX[0] + w0 / 2} y2={S7.map.y - 8} color={theme.alt} draw={down} />
      {MAP.map((m, i) => (
        <g key={m.title} opacity={boxIn[i]} transform={`translate(0 ${(1 - boxIn[i]) * 12})`}>
          <rect x={mapX[i]} y={S7.map.y} width={mapW[i]} height={S7.map.h} rx={14} fill={theme.paper} stroke={m.color} strokeWidth={3} />
          <Label x={mapX[i] + mapW[i] / 2} y={S7.map.y + 50} size={24} weight={700} color={m.color}>
            {m.title}
          </Label>
          <Label x={mapX[i] + mapW[i] / 2} y={S7.map.y + S7.map.h + 32} size={18} weight={500} color={theme.soft}>
            {m.sub}
          </Label>
        </g>
      ))}
      {links.map((p, i) => (
        <Arrow key={i} x1={mapX[i] + mapW[i] + 2} y1={S7.map.y + S7.map.h / 2} x2={mapX[i + 1] - 2} y2={S7.map.y + S7.map.h / 2} color={theme.ink} draw={p} />
      ))}

      {/* доска 2: второй проход — один сценарий, файл за файлом */}
      <g opacity={pass2}>
        <Pill x={X2 + 400} y={110} text="2 · Один сценарий" color={theme.accent} fill={theme.accentTint} size={24} />
      </g>
      <g opacity={phone}>
        <Phone x={S7.phone.x} y={S7.phone.y} scale={PHONE_SCALE}>
          <text y={-62} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
            Жим лёжа
          </text>
          <rect x={-48} y={-46} width={96} height={26} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
          <text y={-28} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${F}px ${theme.font}` }}>
            60 кг × 8
          </text>
          <rect x={-50} y={10} width={100} height={36} rx={8} fill={frame >= tapAt && frame < tapAt + 8 ? theme.ink : theme.accent} />
          <text y={33} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
            Сохранить
          </text>
          {ripple > 0 && <circle cx={0} cy={28} r={12 + ripple * 34} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        </Phone>
        <Pill x={S7.phone.x} y={524} text="Анна" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {PATH.map((p, i) => {
        const y = S7.files.ys[i]
        return (
          <g key={p} opacity={fileIn[i]}>
            <rect x={S7.files.x} y={y} width={S7.files.w} height={S7.files.h} rx={12} fill={hit[i] ? theme.accentTint : theme.paper} stroke={hit[i] ? theme.accent : theme.line} strokeWidth={3} />
            <Mono x={S7.files.x + 20} y={y + 40} fill={theme.ink}>
              {p}
            </Mono>
            {i < 2 && <path d={`M${fx} ${y + S7.files.h + 6} V${S7.files.ys[i + 1] - 8}`} stroke={theme.line} strokeWidth={3} strokeDasharray="6 6" />}
            <g opacity={patches[i]} transform={`rotate(${i % 2 === 0 ? -6 : 5} ${S7.files.x + S7.files.w - 54} ${y + S7.files.h})`}>
              <rect x={S7.files.x + S7.files.w - 104} y={y + S7.files.h - 14} width={100} height={28} rx={4} fill={theme.paper} stroke={theme.alt} strokeWidth={2} strokeDasharray="5 4" />
              <Label x={S7.files.x + S7.files.w - 54} y={y + S7.files.h + 6} size={18} weight={600} color={theme.alt}>
                заплатка
              </Label>
            </g>
          </g>
        )
      })}
      {packetOn && (
        <g opacity={packetOut}>
          <Packet x={packet.x} y={packet.y} text="60 × 8" />
        </g>
      )}

      {/* третий проход: описание по коду */}
      <g opacity={pass3}>
        <Pill x={X2 + 980} y={110} text="3 · Описание" color={theme.accent} fill={theme.accentTint} size={24} />
      </g>
      <g opacity={spec}>
        <Card x={S7.spec.x} y={S7.spec.y} w={S7.spec.w} h={S7.spec.h} stroke={theme.ok} />
        <Label x={S7.spec.x + 24} y={S7.spec.y + 40} anchor="start" size={22} weight={700} color={theme.ok}>
          Спецификация по коду
        </Label>
        {SPEC.map((s, i) => (
          <Label key={s} x={S7.spec.x + 24} y={S7.spec.y + 88 + i * 46} anchor="start" size={20} weight={500}>
            {typed(s, frame, b(3) + 24 + i * 38, 40)}
          </Label>
        ))}
        <g opacity={unsure}>
          <Label x={S7.spec.x + 24} y={S7.spec.y + S7.spec.h - 20} anchor="start" size={18} weight={500} color={theme.soft}>
            где ИИ не уверен — так и пишет
          </Label>
        </g>
      </g>
      <Arrow x1={S7.spec.x + S7.spec.w / 2} y1={S7.spec.y + S7.spec.h + 6} x2={S7.spec.x + S7.spec.w / 2} y2={S7.spec.y + S7.spec.h + 46} color={theme.accent} draw={rebuild} />
      <g opacity={fresh}>
        <Pill x={S7.spec.x + S7.spec.w / 2} y={S7.spec.y + S7.spec.h + 76} text="собрать заново с чистого листа" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* итог главы */}
      <rect x={X2 - 40} y={40} width={1360} height={560} fill={theme.paper} opacity={dim} />
      <g opacity={recap}>
        <Card x={RC.x} y={RC.y} w={RC.w} h={RC.h} stroke={theme.accent} />
        <Label x={RC.x + RC.w / 2} y={RC.y + 46} size={26} weight={700}>
          Своё приложение по образцу
        </Label>
      </g>
      {[
        { label: ['пробуйте', 'эталон'], icon: 'plate' },
        { label: ['описывайте', 'своими словами'], icon: 'note' },
        { label: ['собирайте', 'своё'], icon: 'phone' },
      ].map((s, i) => {
        const cx = RC.x + 140 + i * 280
        const cy = RC.y + 130
        return (
          <g key={s.icon} opacity={stepIn[i]} transform={`translate(0 ${(1 - stepIn[i]) * 12})`}>
            {s.icon === 'plate' && <Plate x={cx} y={cy + 10} scale={0.8} />}
            {s.icon === 'note' && (
              <g>
                <rect x={cx - 34} y={cy - 40} width={68} height={84} rx={6} fill={theme.paper} stroke={theme.ok} strokeWidth={3} />
                {[0, 1, 2, 3].map((k) => (
                  <line key={k} x1={cx - 22} y1={cy - 22 + k * 16} x2={cx + 22 - (k % 2) * 10} y2={cy - 22 + k * 16} stroke={theme.ok} strokeWidth={3} strokeLinecap="round" />
                ))}
              </g>
            )}
            {s.icon === 'phone' && <MiniPhone x={cx} y={cy} w={54} h={88} color={theme.accent} />}
            {s.label.map((l, j) => (
              <Label key={l} x={cx} y={cy + 86 + j * 28} size={j === 0 ? 24 : 20} weight={j === 0 ? 700 : 500} color={j === 0 ? theme.ink : theme.soft}>
                {l}
              </Label>
            ))}
            {i < 2 && <Arrow x1={cx + 70} y1={cy} x2={cx + 210} y2={cy} color={theme.accent} draw={stepIn[i + 1]} />}
          </g>
        )
      })}
    </KitScene>
  )
}
