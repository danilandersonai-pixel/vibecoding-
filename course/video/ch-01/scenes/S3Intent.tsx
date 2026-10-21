import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import type { Mood, Pose } from '../../actors/Person'
import { Mark } from '../../ch-abc/scenes/parts'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { appear, clamp } from './motion'
import { Tag } from './parts'

const ID = 's3-intent'
const G = S3.gaps
const P = S3.prompt
const K = S3.skills

// чего вы не сказали — ИИ достроит сам
const GAPS = ['где хранить пароли', 'кто что видит', 'что при ошибке']
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Сделай вход' },
  { from: 'agent', text: 'Готово! Пароли храню как в типичном примере.' },
]
const TINT: Record<string, string> = { [theme.accent]: theme.accentTint, [theme.alt]: theme.altTint, [theme.risk]: theme.riskTint, [theme.ok]: theme.okTint }
const SKILLS = [
  { title: 'Постановка задачи', lines: ['из «хочу как у них» —', 'в понятное и', 'проверяемое описание'] },
  { title: 'Декомпозиция', lines: ['разбить задачу на части,', 'с которыми ИИ', 'справится надёжно'] },
  { title: 'Проверка', lines: ['читать, запускать,', 'тестировать и пытаться', 'сломать сделанное ИИ'] },
  { title: 'Интеграция', lines: ['собрать части', 'в систему, которую', 'можно развивать годами'] },
]
const SKILL_H = 220

// Сцена 3: программирование с намерением. Недосказанное ИИ достраивает «как чаще всего»;
// запрос с намерением — цель, контекст, рамки, критерий «готово»; в цене четыре навыка, и все — про мышление.
export function S3Intent() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // пробелы: «?» → «как чаще всего»
  const head = useAppear(b(0) + 4)
  const gapIn = GAPS.map((_, i) => appear(frame, b(0) + 18 + i * 12))
  const filled = GAPS.map((_, i) => frame >= b(0) + 80 + i * 15)
  const left = interpolate(frame, [b(2) - 10, b(2)], [1, 0], clamp)
  const unsafe = useAppear(b(1) + 105)

  // запрос с намерением
  const card = useAppear(b(2) + 8)
  const main = typed('Сделай вход для тренеров.', frame, b(2) + 26, 40)
  const rows = [
    { tag: 'Цель', text: 'тренер видит только своих подопечных', color: theme.accent, at: b(3) + 10 },
    { tag: 'Контекст', text: 'проверка пароля уже в auth.ts', color: theme.alt, at: b(3) + 58 },
    { tag: 'Рамки', text: 'пароль не пишем в журнал', color: theme.risk, at: b(3) + 100 },
    { tag: 'Готово', text: 'чужой подопечный не открывается', color: theme.ok, at: b(4) + 8 },
  ]
  const tagIn = rows.map((_, i) => appear(frame, b(2) + 70 + i * 14))
  const minute = useAppear(b(4) + 70)
  const hour = useAppear(b(4) + 100)

  // доска 2: четыре навыка по очереди и круг «проект растёт»
  const skillIn = [35, 70, 100, 130].map((d) => appear(frame, b(5) + d))
  const loop = interpolate(frame, [b(5) + 145, b(5) + 175], [0, 1], clamp)
  const typing = useAppear(b(6) + 15)
  const strike = interpolate(frame, [b(6) + 35, b(6) + 50], [0, 1], clamp)
  const think = useAppear(b(6) + 62)
  const train = useAppear(b(6) + 112)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(6) + 62, ['stand', 'happy']],
    [b(6) + 112, ['cheer', 'happy']],
  ])

  const skillX = (i: number) => K.x + i * (K.w + K.gap)
  const c1 = skillX(0) + K.w / 2
  const c4 = skillX(3) + K.w / 2
  const bottom = K.y + SKILL_H

  return (
    <KitScene chip="3 / 6 · Программирование с намерением" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* чего вы не сказали — ИИ достроил самым частым вариантом */}
      <g opacity={left}>
        <g opacity={head}>
          <Label x={G.x} y={G.y + 6} anchor="start" size={22} weight={700}>
            Вы не сказали:
          </Label>
        </g>
        {GAPS.map((g, i) => {
          const cy = G.y + 48 + i * G.row
          const risky = i === 0 && unsafe > 0
          return (
            <g key={g} opacity={gapIn[i]}>
              <rect x={G.x} y={cy - 23} width={260} height={46} rx={10} fill={theme.paper} stroke={theme.line} strokeWidth={2} strokeDasharray="7 6" />
              <Label x={G.x + 130} y={cy + 7} size={20} weight={600}>
                {g}
              </Label>
              <path d={`M${G.x + 268} ${cy} H${G.x + 296} m-10 -7 l10 7 l-10 7`} fill="none" stroke={theme.soft} strokeWidth={3} />
              <rect x={G.x + 306} y={cy - 23} width={234} height={46} rx={23} fill={filled[i] ? (risky ? theme.riskTint : theme.altTint) : theme.paper} stroke={filled[i] ? (risky ? theme.risk : theme.alt) : theme.risk} strokeWidth={2.5} />
              <Label x={G.x + 423} y={cy + (filled[i] ? 7 : 9)} size={filled[i] ? 20 : 26} color={filled[i] ? theme.ink : theme.risk} weight={700}>
                {filled[i] ? 'как чаще всего' : '?'}
              </Label>
            </g>
          )
        })}
        <g opacity={unsafe}>
          <Tag x={G.x + 650} y={G.y + 48} text="а это безопасно?" color={theme.risk} fill={theme.riskTint} />
        </g>
        {frame >= b(1) && <AgentChat x={S3.chat.x} y={S3.chat.y} w={S3.chat.w} at={b(1) + 4} messages={CHAT} />}
      </g>

      {/* запрос с намерением */}
      <g opacity={card}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.accent} />
        <Label x={P.x + 22} y={P.y + 40} anchor="start" size={20} color={theme.soft} weight={600}>
          Запрос с намерением
        </Label>
        <Label x={P.x + 22} y={P.y + 82} anchor="start" size={24} weight={700}>
          {main}
        </Label>
        <line x1={P.x + 22} y1={P.y + 104} x2={P.x + P.w - 22} y2={P.y + 104} stroke={theme.grid} strokeWidth={2} />
        {rows.map((r, i) => {
          const cy = P.y + 132 + i * 52
          return (
            <g key={r.tag} opacity={tagIn[i]}>
              <rect x={P.x + 22} y={cy - 17} width={112} height={34} rx={17} fill={TINT[r.color]} stroke={r.color} strokeWidth={2} />
              <Label x={P.x + 78} y={cy + 7} size={18} color={r.color} weight={700}>
                {r.tag}
              </Label>
              <Label x={P.x + 150} y={cy + 7} anchor="start" size={20} weight={500}>
                {frame >= r.at ? typed(r.text, frame, r.at, 40) : '…'}
              </Label>
            </g>
          )
        })}
        <g opacity={minute}>
          <Tag x={P.x + 150} y={P.y + P.h - 34} text="+1 минута на запрос" color={theme.accent} />
        </g>
        <g opacity={hour}>
          <Tag x={P.x + 420} y={P.y + P.h - 34} text="−1 час переделок" color={theme.ok} fill={theme.okTint} />
        </g>
      </g>

      {/* доска 2: четыре навыка вместо набора кода */}
      {SKILLS.map((s, i) => {
        const x = skillX(i)
        return (
          <g key={s.title} opacity={skillIn[i]} transform={`translate(0 ${(1 - skillIn[i]) * 16})`}>
            <Card x={x} y={K.y} w={K.w} h={SKILL_H} stroke={theme.accent} />
            <circle cx={x + 34} cy={K.y + 36} r={18} fill={theme.accent} />
            <Label x={x + 34} y={K.y + 43} size={20} color={theme.paper} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={x + 18} y={K.y + 92} anchor="start" size={22} weight={700}>
              {s.title}
            </Label>
            {s.lines.map((l, j) => (
              <Label key={l} x={x + 18} y={K.y + 128 + j * 26} anchor="start" size={18} color={theme.soft} weight={500}>
                {l}
              </Label>
            ))}
          </g>
        )
      })}
      <path d={`M${c4} ${bottom + 8} C ${c4} ${bottom + 60}, ${c1} ${bottom + 60}, ${c1} ${bottom + 14}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - loop} fill="none" stroke={theme.accent} strokeWidth={3} opacity={loop > 0 ? 1 : 0} />
      <g opacity={loop >= 1 ? 1 : 0}>
        <path d={`M${c1} ${bottom + 8} l-8 14 h16 Z`} fill={theme.accent} />
        <Label x={(c1 + c4) / 2} y={bottom + 72} size={20} color={theme.accent} weight={700}>
          проект растёт — и всё повторяется
        </Label>
      </g>

      {/* печатать код не обязательно — нужно ясно думать */}
      {frame >= b(6) && <Client x={S3.you.x} y={S3.you.y} scale={0.7} color={theme.soft} label="Вы" enterAt={b(6)} pose={you[0]} mood={you[1]} />}
      <g opacity={typing}>
        <Tag x={S3.you.x - 250} y={S3.you.y - 10} text="печатать код" color={theme.soft} size={20} />
        <line x1={S3.you.x - 330} y1={S3.you.y - 10} x2={S3.you.x - 330 + 160 * strike} y2={S3.you.y - 10} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>
      <g opacity={think}>
        <Tag x={S3.you.x + 240} y={S3.you.y - 10} text="ясно думать" color={theme.ok} fill={theme.okTint} size={20} />
        <Mark x={S3.you.x + 350} y={S3.you.y - 10} ok />
      </g>
      <g opacity={train}>
        <Tag x={S3.you.x + 240} y={S3.you.y + 42} text="это тренируется" color={theme.accent} size={20} />
      </g>
    </KitScene>
  )
}
