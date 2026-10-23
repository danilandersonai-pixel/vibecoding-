import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1, S1_CHECK_H, S1_NOTE_H } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Intern, NoteIcon, SunMoon } from './parts'

const ID = 's1-intern'
const N = S1.note
const T = S1.table
const G = S1.grid
const C = S1.check

// записка: что сделать, когда готово, чего не трогать
const NOTE = [
  { tag: 'Сделать', value: 'расписание на неделю' },
  { tag: 'Готово, если', value: 'пн–пт, без накладок' },
  { tag: 'Не трогать', value: 'мои личные часы' },
]
const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт']
const KINDS = ['сила', 'йога', 'бег']
// личные часы Марины: столбец и ряд до правки стажёра и после
const MINE = [
  { col: 1, from: 2, to: 0 },
  { col: 3, from: 2, to: 0 },
]
// в каком порядке стажёр заполняет клетки (столбец, ряд); последние две — места, откуда он сдвинул часы Марины
const FILL: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [1, 1], [2, 0], [2, 1], [2, 2], [3, 1], [4, 0], [4, 1], [4, 2], [1, 2], [3, 2],
]
const CHECKS = ['все дни заполнены', 'накладок нет', 'мои часы на месте']

const cellX = (col: number) => G.x + col * G.col
const cellY = (row: number) => G.y + row * G.row

// Сцена 1 (метафора): Марина пишет стажёру записку, стажёр сам заполняет расписание, пока Марина тренирует Анну;
// вечером — приёмка по чек-листу: личные часы сдвинуты, работа уходит на доработку. Фоновый агент — такой же стажёр.
export function S1Intern() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // записка: строки пишутся по очереди, потом листок улетает стажёру
  const note = appear(frame, b(0) + 14) * interpolate(frame, [b(1) - 24, b(1) - 12], [1, 0], CLAMP)
  const rowAt = NOTE.map((_, i) => b(0) + 36 + i * 38)
  const fly = trackAt(frame, [
    [b(1) - 22, N.x + N.w / 2, N.y + S1_NOTE_H / 2],
    [b(1) - 2, S1.intern.x + 44, S1.intern.y + 34],
  ])
  const flyOn = frame >= b(1) - 22 && frame < b(2) + 10
  const inHand = interpolate(frame, [b(2), b(2) + 10], [1, 0], CLAMP)

  // расписание: стажёр заполняет клетки, потом сдвигает часы Марины вверх
  const table = appear(frame, b(1) + 10)
  const fillAt = FILL.map((_, i) => (i < 11 ? b(1) + 34 + i * 9 : b(1) + 176 + (i - 11) * 8))
  const moved = interpolate(frame, [b(1) + 150, b(1) + 170], [0, 1], CLAMP)

  // утро → вечер
  const sun = appear(frame, b(1) + 20)
  const night = interpolate(frame, [b(2), b(2) + 30], [0, 1], CLAMP)
  const anna = interpolate(frame, [b(2), b(2) + 14], [1, 0], CLAMP)
  const walk = trackAt(frame, [
    [b(2) + 6, S1.marina.x, S1.marina.y],
    [b(2) + 46, S1.marinaEvening.x, S1.marinaEvening.y],
  ])

  // чек-лист приёмки: две галочки и крестик
  const check = appear(frame, b(2) + 50)
  const markAt = [b(3) + 16, b(3) + 56, b(3) + 100]
  const wrong = appear(frame, markAt[2])
  const back = appear(frame, b(3) + 132)

  // стажёр → агент
  const swap = interpolate(frame, [b(4) + 8, b(4) + 20], [1, 0], CLAMP)
  const mine = appear(frame, b(4) + 64)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 20, ['think', 'neutral']],
    [b(0) + 120, ['point', 'happy']],
    [b(1) + 40, ['point', 'neutral']],
    [b(1) + 70, ['cheer', 'happy']],
    [b(1) + 120, ['point', 'happy']],
    [b(2) + 6, ['stand', 'neutral']],
    [b(2) + 60, ['think', 'neutral']],
    [b(3) + 10, ['point', 'happy']],
    [b(3) + 96, ['think', 'worried']],
    [b(3) + 126, ['point', 'neutral']],
    [b(4) + 30, ['stand', 'happy']],
    [b(4) + 64, ['point', 'happy']],
  ])
  const intern = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) - 4, ['stand', 'happy']],
    [b(1) + 24, ['point', 'neutral']],
    [b(1) + 140, ['think', 'neutral']],
    [b(1) + 176, ['point', 'happy']],
    [b(2) + 20, ['stand', 'happy']],
    [b(3) + 104, ['surprised', 'worried']],
    [b(3) + 140, ['think', 'neutral']],
  ])
  // Анна поднимает гантель: вверх и вниз каждые 22 кадра
  const lift = frame >= b(1) + 56 && Math.floor((frame - b(1) - 56) / 22) % 2 === 0
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(4) + 30, 'working'],
    [b(4) + 110, 'done'],
  ])

  return (
    <KitScene chip="1 / 7 · Стажёр и чек-лист" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* пол зала */}
      <rect x={40} y={470} width={1200} height={14} rx={6} fill={theme.desk} />

      {/* записка стажёру */}
      <g opacity={note}>
        <Card x={N.x} y={N.y} w={N.w} h={S1_NOTE_H} stroke={theme.accent} fill={theme.white}>
          <Label x={N.x + 24} y={N.y + 40} anchor="start" size={24} weight={700} color={theme.accent}>
            Записка стажёру
          </Label>
          {NOTE.map((r, i) => {
            const cy = N.y + 64 + i * N.row + N.row / 2
            return (
              <g key={r.tag} opacity={appear(frame, rowAt[i] - 8, 8)}>
                <line x1={N.x + 20} y1={cy - N.row / 2} x2={N.x + N.w - 20} y2={cy - N.row / 2} stroke={theme.grid} strokeWidth={2} />
                <Label x={N.x + 24} y={cy + 7} anchor="start" size={19} color={theme.soft} weight={600}>
                  {r.tag}
                </Label>
                <Label x={N.x + 172} y={cy + 8} anchor="start" size={21} weight={700}>
                  {typed(r.value, frame, rowAt[i], 30)}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>

      {/* солнце → луна */}
      <g opacity={sun}>
        <SunMoon x={S1.sun.x} y={S1.sun.y} t={night} />
        <Pill x={S1.sun.x + 92} y={S1.sun.y} w={96} text={night > 0.5 ? 'вечер' : 'утро'} color={night > 0.5 ? theme.accent : theme.alt} size={20} compact />
      </g>

      {/* расписание зала */}
      <g opacity={table}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.line} fill={theme.white}>
          <Label x={T.x + 20} y={T.y + 38} anchor="start" size={22} weight={700}>
            Расписание зала
          </Label>
          {DAYS.map((d, i) => (
            <Label key={d} x={cellX(i) + G.cellW / 2} y={G.y - 14} size={20} weight={600} color={theme.soft}>
              {d}
            </Label>
          ))}
          {/* пустые клетки — пунктиром */}
          {DAYS.flatMap((d, col) =>
            [0, 1, 2].map((row) => <rect key={`${d}${row}`} x={cellX(col)} y={cellY(row)} width={G.cellW} height={G.cellH} rx={8} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="6 5" />),
          )}
          {FILL.map(([col, row], i) => {
            const g = appear(frame, fillAt[i], 8)
            const kind = KINDS[(col + row) % 3]
            return (
              <g key={`${col}-${row}`} opacity={g}>
                <rect x={cellX(col)} y={cellY(row)} width={G.cellW} height={G.cellH} rx={8} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
                <Label x={cellX(col) + G.cellW / 2} y={cellY(row) + G.cellH / 2 + 7} size={18} weight={600} color={theme.accent}>
                  {kind}
                </Label>
              </g>
            )
          })}
          {/* личные часы Марины: стажёр сдвинул их наверх */}
          {MINE.map((m) => {
            const y = cellY(m.from) + (cellY(m.to) - cellY(m.from)) * moved
            return (
              <g key={m.col}>
                <g opacity={wrong}>
                  <rect x={cellX(m.col) + 3} y={cellY(m.from) + 3} width={G.cellW - 6} height={G.cellH - 6} rx={7} fill="none" stroke={theme.risk} strokeWidth={2.5} strokeDasharray="5 5" />
                </g>
                <rect x={cellX(m.col)} y={y} width={G.cellW} height={G.cellH} rx={8} fill={wrong > 0 ? theme.riskTint : theme.altTint} stroke={wrong > 0 ? theme.risk : theme.alt} strokeWidth={wrong > 0 ? 3 : 2} />
                <Label x={cellX(m.col) + G.cellW / 2} y={y + G.cellH / 2 + 7} size={18} weight={700} color={wrong > 0 ? theme.risk : theme.alt}>
                  Марина
                </Label>
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={wrong}>
        <Pill x={T.x + T.w / 2} y={T.y + T.h + 34} text="личные часы сдвинуты" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* чек-лист приёмки */}
      <g opacity={check}>
        <Card x={C.x} y={C.y} w={C.w} h={S1_CHECK_H} stroke={theme.ok} fill={theme.white}>
          <Label x={C.x + 22} y={C.y + 40} anchor="start" size={22} weight={700} color={theme.ok}>
            Чек-лист приёмки
          </Label>
          {CHECKS.map((t, i) => {
            const cy = C.y + 64 + i * C.row + C.row / 2
            const done = appear(frame, markAt[i], 8)
            return (
              <g key={t} opacity={appear(frame, b(2) + 64 + i * 12, 8)}>
                <line x1={C.x + 18} y1={cy - C.row / 2} x2={C.x + C.w - 18} y2={cy - C.row / 2} stroke={theme.grid} strokeWidth={2} />
                <Label x={C.x + 22} y={cy + 7} anchor="start" size={21} weight={600}>
                  {t}
                </Label>
                <circle cx={C.x + C.w - 36} cy={cy} r={15} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="4 4" />
                <g opacity={done}>
                  <Mark x={C.x + C.w - 36} y={cy} ok={i < 2} r={15} />
                </g>
              </g>
            )
          })}
        </Card>
      </g>

      {/* на доработку: от Марины к стажёру */}
      <g opacity={back * swap}>
        <Pill x={585} y={384} w={176} text="на доработку" color={theme.risk} fill={theme.riskTint} size={20} compact />
        <Arrow x1={676} y1={384} x2={708} y2={384} color={theme.risk} />
      </g>

      {/* Марина, Анна, стажёр */}
      <Coach x={walk.x} y={walk.y} scale={0.85} label="Марина" enterAt={0} pose={marina[0]} mood={marina[1]} />
      {frame >= b(1) + 40 && anna > 0 && (
        <g opacity={anna}>
          <Client x={S1.anna.x} y={S1.anna.y} scale={0.72} label="Анна" enterAt={b(1) + 40} pose={lift ? 'cheer' : 'stand'} mood="happy" />
        </g>
      )}
      <g opacity={swap}>
        <Intern x={S1.intern.x} y={S1.intern.y} scale={0.85} label="Стажёр" enterAt={8} pose={intern[0]} mood={intern[1]} />
      </g>
      {frame >= b(4) + 14 && <Agent x={S1.intern.x} y={S1.intern.y} scale={0.85} enterAt={b(4) + 14} pose={agent} />}

      {/* листок записки летит к стажёру и остаётся у него в руке */}
      {flyOn && (
        <g opacity={inHand * swap}>
          <NoteIcon x={fly.x} y={fly.y} />
        </g>
      )}

      {/* стажёр — это агент: за Мариной задача и проверка */}
      <g opacity={mine}>
        <Callout x={268} y={304} tx={S1.marinaEvening.x + 2} ty={S1.marinaEvening.y - 66} text="задача и проверка — мои" color={theme.accent} />
      </g>
    </KitScene>
  )
}
