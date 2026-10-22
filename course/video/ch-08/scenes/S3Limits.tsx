import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Hacker } from '../../actors/Hacker'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bug, Padlock } from './parts'

const ID = 's3-limits'
const SH = S3.shelf
const ST = S3.study
const CD = S3.card

const PKG = 'super-login-helper'
// реестр на полке: два известных пакета и выдуманный
const SHELF = [
  { name: 'react', w: 110 },
  { name: 'express', w: 130 },
  { name: PKG, w: 220 },
]
// какие пакеты из 20 в ответах моделей выдуманы — почти каждый пятый
const GHOSTS = [3, 7, 12, 18]
// страница пакета: четыре вопроса перед установкой
const QUESTIONS = [
  { q: 'Существует?', a: 'да — но недавно', ok: null },
  { q: 'Кто автор?', a: 'неизвестен', ok: false },
  { q: 'Загрузок в неделю?', a: '12', ok: false },
  { q: 'Когда появился?', a: 'на прошлой неделе', ok: false },
]

/** Строка терминала, которая появляется на кадре at (до него — пустая, высота окна не меняется). */
const at = (frame: number, from: number, line: TermLine): TermLine => (frame >= from ? line : { text: '', kind: 'out' })

// Сцена 3: вход без лимита попыток — бот перебирает пароли и угадывает; с лимитом — пять неудач и пауза
// 15 минут. Выдуманные пакеты: ИИ советует несуществующий, в исследовании 2025 года почти каждый пятый
// выдуман; злоумышленник занимает имя (slopsquatting); перед установкой — четыре вопроса.
export function S3Limits() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: перебор без лимита
  const openAt = b(0) + 10
  const rolling = Math.round(interpolate(frame, [b(0) + 84, b(1) + 40], [3, 999], CLAMP))
  const openLines: TermLine[] = [
    { text: 'перебор паролей: anna', kind: 'cmd' },
    at(frame, b(0) + 60, { text: 'попытка 1: неверно', kind: 'out' }),
    at(frame, b(0) + 72, { text: 'попытка 2: неверно', kind: 'out' }),
    at(frame, b(0) + 84, { text: `… попытка ${rolling}: неверно`, kind: 'out' }),
    at(frame, b(1) + 48, { text: 'попытка 1000: пароль подошёл', kind: 'err' }),
  ]
  const fast = appear(frame, b(0) + 100)
  // пока второго терминала нет, первый стоит по центру
  const slideOpen = interpolate(frame, [b(1) + 44, b(1) + 64], [S3.center, 0], CLAMP)
  const cracked = appear(frame, b(1) + 56)

  // доска 1: тот же перебор с лимитом
  const limitAt = b(1) + 64
  const limitLines: TermLine[] = [
    { text: 'перебор паролей: anna', kind: 'cmd' },
    at(frame, limitAt + 52, { text: 'попытка 1: неверно', kind: 'out' }),
    at(frame, limitAt + 64, { text: '… попытка 5: неверно', kind: 'out' }),
    at(frame, limitAt + 80, { text: 'Слишком много попыток.', kind: 'err' }),
    at(frame, limitAt + 90, { text: 'Повторите через 15 минут.', kind: 'err' }),
  ]
  const pause = appear(frame, limitAt + 96)
  const useless = appear(frame, limitAt + 116)

  // доска 2: ИИ советует пакет, которого нет
  const chatAt = b(2) + 30
  const shelf = appear(frame, b(2) + 90)
  const ghostTag = appear(frame, b(2) + 120)
  // пока исследования нет, чат и реестр стоят по центру доски
  const slideChat = interpolate(frame, [b(3) - 16, b(3) + 4], [S3.chatCenter, 0], CLAMP)
  const studyIn = appear(frame, b(3))
  const boxes = Math.min(20, Math.max(0, Math.floor((frame - b(3) - 10) / 2)))
  const ghostsOn = frame >= b(3) + 60
  const fifth = appear(frame, b(3) + 90)
  const taken = frame >= b(4) + 50
  const squat = appear(frame, b(4) + 60)

  // доска 3: страница пакета
  const card = appear(frame, b(5) + 14)
  const rowAt = QUESTIONS.map((_, i) => b(5) + 46 + i * 18)
  const stamp = appear(frame, b(5) + 126)
  const ask = appear(frame, b(5) + 150)

  const bot = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 20, ['point', 'neutral']],
    [b(1) + 50, ['cheer', 'happy']],
    [b(1) + 150, ['think', 'worried']],
  ])
  const hacker = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 30, ['point', 'happy']],
    [b(4) + 90, ['cheer', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 160, 'working'],
  ])

  return (
    <KitScene chip="3 / 7 · Лимиты и выдуманные пакеты" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: без лимита */}
      <g transform={`translate(${slideOpen} 0)`}>
        <g opacity={appear(frame, b(0))}>
          <Pill x={S3.open.x + S3.open.w / 2} y={S3.pillY} text="вход без лимита" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
        <Hacker x={S3.bot.x} y={S3.bot.y} scale={0.65} label="бот" enterAt={b(0) + 4} pose={bot[0]} mood={bot[1]} />
        {frame >= openAt && <Terminal x={S3.open.x} y={S3.open.y} w={S3.open.w} at={openAt} lines={openLines} />}
        <g opacity={fast}>
          <Pill x={S3.open.x + S3.open.w / 2} y={S3.outY[0]} text="тысячи попыток в минуту" color={theme.risk} fill={theme.paper} compact />
        </g>
        <g opacity={cracked}>
          <Pill x={S3.open.x + S3.open.w / 2} y={S3.outY[1]} text="слабый пароль Анны угадан" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>

      {/* доска 1: с лимитом */}
      <g opacity={appear(frame, limitAt)}>
        <Pill x={S3.limited.x + S3.limited.w / 2} y={S3.pillY} text="вход с лимитом" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {frame >= limitAt && <Terminal x={S3.limited.x} y={S3.limited.y} w={S3.limited.w} at={limitAt} lines={limitLines} />}
      <g opacity={pause}>
        <Pill x={S3.limited.x + S3.limited.w / 2} y={S3.outY[0]} text="5 неудач → пауза 15 минут" color={theme.ok} fill={theme.paper} compact />
      </g>
      <g opacity={useless}>
        <Padlock x={S3.limited.x + S3.limited.w / 2 - 150} y={S3.outY[1] + 4} scale={0.7} />
        <Pill x={S3.limited.x + S3.limited.w / 2 + 30} y={S3.outY[1]} text="перебор бессмыслен" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* доска 2: ИИ советует пакет */}
      <g transform={`translate(${slideChat} 0)`}>
        {frame >= chatAt && (
          <AgentChat
            x={S3.chat.x}
            y={S3.chat.y}
            w={S3.chat.w}
            at={chatAt}
            messages={[
              { from: 'me', text: 'Нужен вход по почте' },
              { from: 'agent', text: `Поставь пакет ${PKG}` },
            ]}
          />
        )}
        <g opacity={shelf}>
          <Card x={SH.x} y={SH.y} w={SH.w} h={SH.h}>
            <Label x={SH.x + 20} y={SH.y + 36} anchor="start" size={20} weight={700}>
              Реестр пакетов
            </Label>
          </Card>
          {SHELF.map((p, i) => {
            const x = SH.x + 20 + SHELF.slice(0, i).reduce((s, q) => s + q.w + 12, 0)
            const ghost = p.name === PKG
            const bad = ghost && taken
            return (
              <g key={p.name}>
                <rect x={x} y={SH.y + 56} width={p.w} height={46} rx={8} fill={bad ? theme.riskTint : ghost ? theme.paper : theme.okTint} stroke={ghost ? theme.risk : theme.ok} strokeWidth={3} strokeDasharray={ghost && !bad ? '8 6' : undefined} />
                <text x={x + p.w / 2} y={SH.y + 86} textAnchor="middle" fill={ghost && !bad ? theme.soft : theme.ink} style={{ font: `600 18px ${theme.mono}` }}>
                  {p.name}
                </text>
                {bad && <Bug x={x + p.w - 8} y={SH.y + 54} s={0.45} />}
              </g>
            )
          })}
        </g>
        <g opacity={ghostTag}>
          <Label x={SH.x + 20 + 110 + 12 + 130 + 12 + 110} y={SH.y + 132} size={20} weight={600} color={theme.risk}>
            {taken ? 'имя занял злоумышленник' : 'такого пакета нет'}
          </Label>
        </g>
        <g opacity={squat}>
          <Pill x={SH.x + SH.w / 2} y={SH.y - 34} text="slopsquatting: внутри вредный код" color={theme.risk} fill={theme.paper} size={20} compact />
        </g>
      </g>
      {frame >= b(4) + 10 && (
        <g transform={`translate(${2 * S3.hacker.x} 0) scale(-1 1)`}>
          <Hacker x={S3.hacker.x} y={S3.hacker.y} scale={0.6} enterAt={b(4) + 10} pose={hacker[0]} mood={hacker[1]} />
        </g>
      )}

      {/* доска 2: исследование 2025 года */}
      <g opacity={studyIn}>
        <Label x={ST.x} y={ST.y - 22} anchor="start" size={22} weight={700}>
          2025: пакеты в ответах 16 моделей
        </Label>
      </g>
      {Array.from({ length: boxes }, (_, i) => {
        const x = ST.x + (i % ST.cols) * (ST.w + ST.gap)
        const y = ST.y + Math.floor(i / ST.cols) * (ST.h + ST.gap)
        const ghost = ghostsOn && GHOSTS.includes(i)
        return (
          <g key={i}>
            <rect x={x} y={y} width={ST.w} height={ST.h} rx={8} fill={ghost ? theme.paper : theme.okTint} stroke={ghost ? theme.risk : theme.ok} strokeWidth={3} strokeDasharray={ghost ? '8 6' : undefined} />
            <text x={x + ST.w / 2} y={y + ST.h / 2 + 8} textAnchor="middle" fill={ghost ? theme.risk : theme.ok} style={{ font: `700 22px ${theme.font}` }}>
              {ghost ? '?' : '✓'}
            </text>
          </g>
        )
      })}
      <g opacity={fifth}>
        <Pill x={ST.x + (ST.cols * (ST.w + ST.gap) - ST.gap) / 2} y={ST.y + ST.rows * (ST.h + ST.gap) + 30} w={390} text="почти каждый пятый — выдуман" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* доска 3: страница пакета и четыре вопроса */}
      <g opacity={card}>
        <Card x={CD.x} y={CD.y} w={CD.w} h={CD.h} stroke={theme.line}>
          <text x={CD.x + 28} y={CD.y + 46} fill={theme.ink} style={{ font: `700 26px ${theme.mono}` }}>
            {PKG}
          </text>
          <Label x={CD.x + 28} y={CD.y + 78} anchor="start" size={20} weight={500} color={theme.soft}>
            страница пакета в реестре
          </Label>
        </Card>
      </g>
      {QUESTIONS.map((r, i) => {
        const y = CD.y + 98 + i * CD.row
        return (
          <g key={r.q} opacity={appear(frame, rowAt[i], 10)}>
            <line x1={CD.x + 20} y1={y} x2={CD.x + CD.w - 20} y2={y} stroke={theme.grid} strokeWidth={2} />
            <Label x={CD.x + 28} y={y + 44} anchor="start" size={22} weight={600}>
              {r.q}
            </Label>
            <Label x={CD.x + CD.w - 80} y={y + 44} anchor="end" size={22} weight={700} color={r.ok === null ? theme.alt : theme.risk}>
              {r.a}
            </Label>
            {r.ok !== null && <Mark x={CD.x + CD.w - 44} y={y + 36} ok={r.ok} r={16} />}
          </g>
        )
      })}
      <g opacity={stamp} transform={`rotate(-5 ${CD.x + CD.w / 2} ${CD.y + CD.h - 40})`}>
        <Pill x={CD.x + CD.w / 2} y={CD.y + CD.h - 40} text="не устанавливать" color={theme.risk} fill={theme.riskTint} size={24} />
      </g>
      {frame >= b(5) + 40 && <Agent x={S3.agent.x} y={S3.agent.y} scale={0.75} enterAt={b(5) + 40} pose={agent} />}
      <g opacity={ask}>
        <Callout x={S3.ask.x} y={S3.ask.y} tx={S3.agent.x} ty={S3.agent.y - 70} text="Дай ссылку на страницу пакета" color={theme.accent} />
      </g>
    </KitScene>
  )
}
