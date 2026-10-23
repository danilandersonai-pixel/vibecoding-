import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S7 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { NoteIcon } from './parts'

const ID = 's7-tools'
const CD = S7.cards
const SM = S7.sum

// семь возможностей Claude Code (раздел s83): название, команда или файл, зачем; risky — выполняет команды у вас
const TOOLS = [
  { title: 'Навыки', code: 'SKILL.md', text: 'порядок частых дел', risky: false },
  { title: 'Хуки', code: 'до и после шага', text: 'гарантия, а не просьба', risky: true, plain: true },
  { title: 'Подагенты', code: '.claude/agents/', text: 'свой чистый контекст', risky: false },
  { title: 'Плагины', code: '/plugin', text: 'готовые наборы', risky: true },
  { title: 'По расписанию', code: '/schedule', text: 'не чаще раза в час', risky: false },
  { title: 'Remote Control', code: '/remote-control', text: 'продолжить с телефона', risky: false },
  { title: 'Claude in Chrome', code: 'claude --chrome', text: 'ваш браузер Chrome', risky: false },
]
// итог: четыре правила
const SUM = [
  ['ясная', 'задача'],
  ['узкие', 'права'],
  ['маленький', 'пул-реквест'],
  ['внимательная', 'приёмка'],
]

// левый верхний угол карточки i: четыре в первом ряду, три по центру во втором
const cardPos = (i: number) => {
  if (i < 4) return { x: CD.x + i * (CD.w + CD.gap), y: CD.y }
  return { x: CD.x + (CD.w + CD.gap) / 2 + (i - 4) * (CD.w + CD.gap), y: CD.y + CD.h + CD.gapY }
}

// Сцена 7: возможности Claude Code для самостоятельной работы — включать по одной; хуки и плагины выполняют
// команды на вашем компьютере. Доска 2: итог главы — задача уходит агенту, пул-реквест возвращается на приёмку.
export function S7Tools() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // карточки появляются, когда их называют
  const cardAt = [b(1) + 10, b(1) + 70, b(2) + 8, b(2) + 22, b(2) + 38, b(2) + 62, b(2) + 92]
  const onAt = b(3) + 10
  const warn = appear(frame, b(3) + 40)
  const warnTag = appear(frame, b(3) + 56)

  // доска 2: итог и путь задачи
  const sumAt = SUM.map((_, i) => b(4) + 20 + i * 18)
  const go = trackAt(frame, [
    [b(4) + 60, S7.marina.x + 110, S7.marina.y - 40],
    [b(4) + 92, S7.agent2.x - 110, S7.agent2.y - 40],
  ])
  const goOn = frame >= b(4) + 56 && frame < b(4) + 96
  const back = trackAt(frame, [
    [b(4) + 112, S7.agent2.x - 110, S7.agent2.y - 40],
    [b(4) + 146, S7.marina.x + 110, S7.marina.y - 40],
  ])
  const backOn = frame >= b(4) + 108 && frame < b(4) + 150
  const accepted = appear(frame, b(4) + 152)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 30, 'done'],
    [b(0) + 80, 'idle'],
    [b(0) + 130, 'done'],
    [b(1), 'working'],
    [b(3), 'idle'],
    [b(3) + 120, 'done'],
  ])
  const agent2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(4) + 92, 'working'],
    [b(4) + 110, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 50, ['point', 'happy']],
    [b(4) + 100, ['think', 'neutral']],
    [b(4) + 150, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="7 / 7 · Возможности Claude Code" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* места карточек — пунктиром, карточки появляются по очереди */}
      {TOOLS.map((t, i) => {
        const p = cardPos(i)
        const g = appear(frame, cardAt[i], 10)
        // включаем по одной: сейчас — только навыки
        const on = i === 0 && frame >= onAt
        const risky = t.risky && warn > 0
        return (
          <g key={t.title}>
            <g opacity={appear(frame, b(0) + 12 + i * 10) * (1 - g)}>
              <rect x={p.x} y={p.y} width={CD.w} height={CD.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
              <Label x={p.x + 20} y={p.y + 40} anchor="start" size={22} weight={700} color={theme.line}>
                {t.title}
              </Label>
            </g>
            <g opacity={g} transform={`translate(0 ${(1 - g) * 12})`}>
              <Card x={p.x} y={p.y} w={CD.w} h={CD.h} stroke={risky ? theme.risk : theme.accent} fill={risky ? theme.riskTint : theme.white}>
                <Label x={p.x + 20} y={p.y + 40} anchor="start" size={22} weight={700} color={risky ? theme.risk : theme.accent}>
                  {t.title}
                </Label>
                <g opacity={appear(frame, cardAt[i] + 12, 8)}>
                  {t.plain ? (
                    <Label x={p.x + 20} y={p.y + 80} anchor="start" size={19} weight={600}>
                      {t.code}
                    </Label>
                  ) : (
                    <Mono x={p.x + 20} y={p.y + 80} size={19} fill={theme.ink}>
                      {t.code}
                    </Mono>
                  )}
                </g>
                <g opacity={appear(frame, cardAt[i] + (i < 2 ? 40 : 22), 8)}>
                  <Label x={p.x + 20} y={p.y + 118} anchor="start" size={18} weight={500} color={theme.soft}>
                    {t.text}
                  </Label>
                </g>
                {/* переключатель: включаем по одной */}
                <rect x={p.x + CD.w - 62} y={p.y + 22} width={42} height={24} rx={12} fill={on ? theme.ok : theme.grid} />
                <circle cx={on ? p.x + CD.w - 32 : p.x + CD.w - 50} cy={p.y + 34} r={9} fill={theme.white} />
              </Card>
              {risky && (
                <g>
                  <circle cx={p.x + CD.w - 26} cy={p.y + CD.h - 28} r={15} fill={theme.risk} />
                  <text x={p.x + CD.w - 26} y={p.y + CD.h - 20} textAnchor="middle" fill={theme.white} style={{ font: `800 22px ${theme.font}` }}>
                    !
                  </text>
                </g>
              )}
            </g>
          </g>
        )
      })}
      <g opacity={appear(frame, onAt + 10)}>
        <Pill x={232} y={CD.y + 2 * CD.h + CD.gapY + 50} w={264} text="по одной, когда нужна" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={warnTag}>
        <Pill x={694} y={CD.y + 2 * CD.h + CD.gapY + 50} w={620} text="хуки и плагины запускают команды на вашем компьютере" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <Agent x={S7.agent.x} y={S7.agent.y} scale={0.6} label="" enterAt={4} pose={agent} />

      {/* доска 2: итог главы */}
      {SUM.map((s, i) => {
        const g = appear(frame, sumAt[i], 10)
        const x = SM.x + i * (SM.w + SM.gap)
        return (
          <g key={s[1]} opacity={g} transform={`translate(0 ${(1 - g) * 12})`}>
            <Card x={x} y={SM.y} w={SM.w} h={SM.h} stroke={theme.accent} fill={theme.white}>
              <Label x={x + 26} y={SM.y + 50} size={30} weight={800} color={theme.accent}>
                {i + 1}
              </Label>
              <Label x={x + 50} y={SM.y + 52} anchor="start" size={24} weight={700}>
                {s[0]}
              </Label>
              <Label x={x + 50} y={SM.y + 88} anchor="start" size={24} weight={700}>
                {s[1]}
              </Label>
            </Card>
          </g>
        )
      })}
      <line x1={S7.marina.x + 60} y1={S7.marina.y - 40} x2={S7.agent2.x - 60} y2={S7.agent2.y - 40} stroke={theme.grid} strokeWidth={3} strokeDasharray="8 8" opacity={appear(frame, b(4) + 30)} />
      <Coach x={S7.marina.x} y={S7.marina.y} scale={0.85} label="Марина" enterAt={b(4) - 10} pose={marina[0]} mood={marina[1]} />
      <Agent x={S7.agent2.x} y={S7.agent2.y} scale={0.85} enterAt={b(4) - 4} pose={agent2} />
      {goOn && (
        <g>
          <NoteIcon x={go.x} y={go.y} />
          <Pill x={go.x} y={go.y - 52} w={110} text="задача" color={theme.accent} fill={theme.accentTint} size={18} compact />
        </g>
      )}
      {backOn && (
        <g>
          <NoteIcon x={back.x} y={back.y} color={theme.ok} />
          <Pill x={back.x} y={back.y - 52} w={150} text="пул-реквест" color={theme.ok} fill={theme.okTint} size={18} compact />
        </g>
      )}
      <g opacity={accepted}>
        <Mark x={S7.marina.x + 90} y={S7.marina.y - 40} ok r={18} />
        <Callout x={S7.marina.x + 160} y={S7.marina.y - 120} tx={S7.marina.x + 4} ty={S7.marina.y - 66} text="принято" color={theme.ok} fill={theme.okTint} />
      </g>
    </KitScene>
  )
}
