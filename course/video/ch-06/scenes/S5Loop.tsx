import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { theme } from '../../theme'
import { S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { ClientList, Speech } from './parts'

const ID = 's5-loop'
const BR = S5.browser
const SH = S5.shot
const SW = S5.stepW
const SHH = S5.stepH

// витки прототипа (рис. 6.4): что делаем и с чем
const STEPS = [
  ['Описание', 'что проверяем'],
  ['Вариант от ИИ', 'рабочая версия'],
  ['Показ людям', 'без подсказок'],
  ['Правка', 'где растерялись'],
]
const LOG = ['Решили: пропавших — красным', 'Почему: по датам не нашла', 'Отвергли: отдельную вкладку']

// центр карточки цикла i
const mid = (i: number) => ({ x: S5.steps[i].x + SW / 2, y: S5.steps[i].y + SHH / 2 })

// Сцена 5: короткие витки — описание, вариант, показ, правка; ранний показ Марине без подсказок,
// скриншот с пометкой, следующий виток; журнал решений и коммит; выход из цикла.
export function S5Loop() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: цикл собирается, точка обходит его
  const stepIn = STEPS.map((_, i) => appear(frame, b(0) + 10 + i * 14))
  const arrows = [0, 1, 2, 3].map((i) => interpolate(frame, [b(0) + 22 + i * 14, b(0) + 34 + i * 14], [0, 1], CLAMP))
  // точка идёт по серединам стрелок, не заслоняя подписи карточек
  const legs = [
    [S5.steps[0].x + SW + 30, mid(0).y],
    [mid(1).x, (S5.steps[1].y + SHH + S5.steps[2].y) / 2],
    [S5.steps[2].x - 30, mid(2).y],
    [mid(3).x, (S5.steps[0].y + SHH + S5.steps[3].y) / 2],
    [S5.steps[0].x + SW + 30, mid(0).y],
  ]
  const tour = legs.map(([x, y], k) => [b(0) + 80 + k * 26, x, y] as [number, number, number])
  const dot = trackAt(frame, tour)
  const dotOn = frame >= b(0) + 80 && frame <= b(0) + 80 + 4 * 26 + 10
  const lit = dotOn ? (Math.min(3, Math.floor((frame - (b(0) + 80)) / 26)) + 1) % 4 : -1
  const version = frame >= b(4) + 30 ? 2 : 1
  const verIn = appear(frame, b(0) + 120)

  // доска 2: показ Марине, молчим; застряла; скриншот с пометкой; новый виток
  const pageAt = b(1) + 10
  // Марина читает список сверху вниз — строка под взглядом подсвечена
  const readRow = frame >= b(1) + 60 && frame < b(1) + 160 ? Math.floor((frame - (b(1) + 60)) / 20) : -1
  const silent = appear(frame, b(1) + 60) * interpolate(frame, [b(3), b(3) + 10], [1, 0], CLAMP)
  const lost = appear(frame, b(2) + 24) * interpolate(frame, [b(4) + 30, b(4) + 40], [1, 0], CLAMP)
  const count = appear(frame, b(2) + 80) * interpolate(frame, [b(3), b(3) + 10], [1, 0], CLAMP)
  const flash = interpolate(frame, [b(3) + 6, b(3) + 10, b(3) + 22], [0, 0.85, 0], CLAMP)
  const shot = trackAt(frame, [
    [b(3) + 14, BR.x + BR.w / 2, BR.y + BR.h / 2],
    [b(3) + 40, SH.x + SH.w / 2, SH.y + SH.h / 2],
  ])
  const shotScale = interpolate(frame, [b(3) + 14, b(3) + 40], [1, 0.5], CLAMP)
  const ring = interpolate(frame, [b(3) + 44, b(3) + 64], [0, 1], CLAMP)
  const caption = appear(frame, b(3) + 66)
  const send = interpolate(frame, [b(3) + 84, b(3) + 98], [0, 1], CLAMP)
  const shotDim = interpolate(frame, [b(4) + 40, b(4) + 52], [1, 0.45], CLAMP)
  const mark = interpolate(frame, [b(4) + 24, b(4) + 40], [0, 1], CLAMP)
  const found = appear(frame, b(4) + 50)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 96, 'working'],
    [b(4) + 20, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 60, ['think', 'neutral']],
    [b(2) + 20, ['think', 'worried']],
    [b(3) + 10, ['stand', 'neutral']],
    [b(4) + 44, ['cheer', 'happy']],
  ])

  // доска 1 справа: журнал решений, коммит, выход из цикла
  const commit = appear(frame, b(5) + 100)
  const exit = interpolate(frame, [b(6) + 10, b(6) + 30], [0, 1], CLAMP)
  const exitPill = appear(frame, b(6) + 26)
  const runOut = trackAt(frame, [
    [b(6) + 30, S5.steps[2].x + SW + 6, mid(2).y + 10],
    [b(6) + 56, S5.exit.x - 210, S5.exit.y],
  ])
  const runOn = frame >= b(6) + 30 && frame < b(6) + 60

  return (
    <KitScene chip="5 / 7 · Виток за витком" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* цикл прототипа */}
      {STEPS.map(([t, sub], i) => {
        const s = S5.steps[i]
        const on = lit === i
        return (
          <g key={t} opacity={stepIn[i]}>
            <Card x={s.x} y={s.y} w={SW} h={SHH} stroke={on ? theme.accent : theme.line} fill={on ? theme.accentTint : theme.paper} />
            <Label x={s.x + 20} y={s.y + 32} anchor="start" size={22} weight={700}>
              {t}
            </Label>
            <Label x={s.x + 20} y={s.y + 60} anchor="start" size={18} weight={600} color={theme.soft}>
              {sub}
            </Label>
          </g>
        )
      })}
      <Arrow x1={S5.steps[0].x + SW + 4} y1={mid(0).y} x2={S5.steps[1].x - 6} y2={mid(1).y} color={theme.accent} draw={arrows[0]} />
      <Arrow x1={mid(1).x} y1={S5.steps[1].y + SHH + 4} x2={mid(2).x} y2={S5.steps[2].y - 6} color={theme.accent} draw={arrows[1]} />
      <Arrow x1={S5.steps[2].x - 4} y1={mid(2).y} x2={S5.steps[3].x + SW + 6} y2={mid(3).y} color={theme.accent} draw={arrows[2]} />
      <Arrow x1={mid(3).x} y1={S5.steps[3].y - 4} x2={mid(0).x} y2={S5.steps[0].y + SHH + 6} color={theme.accent} dashed draw={arrows[3]} />
      <g opacity={arrows[3]}>
        <Label x={mid(3).x - 14} y={S5.center.y + 8} anchor="end" size={18} weight={600} color={theme.soft}>
          новый виток
        </Label>
      </g>
      {dotOn && <circle cx={dot.x} cy={dot.y} r={12} fill={theme.alt} stroke={theme.paper} strokeWidth={3} />}
      <g opacity={verIn}>
        <Pill x={S5.center.x + 30} y={S5.center.y} text={`версия ${version} работает`} color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>

      {/* доска 2: показ Марине */}
      {frame >= pageAt && (
        <Browser x={BR.x} y={BR.y} w={BR.w} h={BR.h} at={pageAt} url="прототип">
          <ClientList w={BR.w} mark={mark} />
          {readRow >= 0 && <rect x={14} y={102 + readRow * 52 - 2} width={BR.w - 28} height={48} rx={9} fill="none" stroke={theme.accent} strokeWidth={3} />}
          {flash > 0 && <rect x={0} y={0} width={BR.w} height={BR.h} rx={12} fill={theme.white} opacity={flash} />}
        </Browser>
      )}
      <g opacity={silent}>
        <Pill x={BR.x + BR.w / 2} y={BR.y + BR.h + 36} text="мы молчим и не подсказываем" color={theme.soft} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={lost}>
        <Speech x={S5.marina.x - 10} y={S5.marina.y - 150} text="кто пропал?" tx={S5.marina.x} ty={S5.marina.y - 102} color={theme.risk} />
      </g>
      <g opacity={count}>
        <Pill x={S5.marina.x - 20} y={S5.marina.y - 214} text="считает в уме: 9, 12…" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>
      <g opacity={found}>
        <Speech x={S5.marina.x - 40} y={S5.marina.y - 150} text="нашла за 2 секунды!" tx={S5.marina.x} ty={S5.marina.y - 102} color={theme.ok} />
      </g>
      <Coach x={S5.marina.x} y={S5.marina.y} scale={0.8} label="Марина" enterAt={b(1) + 16} pose={marina[0]} mood={marina[1]} />

      {/* скриншот с пометкой → агенту */}
      {frame >= b(3) + 14 && (
        <g opacity={shotDim} transform={`translate(${shot.x} ${shot.y}) scale(${shotScale})`}>
          <rect x={-BR.w / 2} y={-BR.h / 2} width={BR.w} height={BR.h} rx={14} fill={theme.paper} stroke={theme.ink} strokeWidth={4} />
          <rect x={-BR.w / 2} y={-BR.h / 2} width={BR.w} height={40} rx={14} fill={theme.codeBg} />
          <rect x={-BR.w / 2 + 24} y={-BR.h / 2 + 64} width={180} height={22} rx={6} fill={theme.ink} opacity={0.5} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x={-BR.w / 2 + 24} y={-BR.h / 2 + 104 + i * 52} width={110} height={18} rx={6} fill={theme.grid} />
              <rect x={BR.w / 2 - 200} y={-BR.h / 2 + 104 + i * 52} width={170} height={18} rx={6} fill={theme.line} />
            </g>
          ))}
          {ring > 0 && <ellipse cx={BR.w / 2 - 115} cy={40} rx={130} ry={190} fill="none" stroke={theme.risk} strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} />}
        </g>
      )}
      <g opacity={caption * shotDim}>
        <Pill x={SH.x + SH.w / 2} y={SH.y + SH.h + 30} text="выдели, кого нет неделю" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>
      <Arrow x1={SH.x + SH.w / 2} y1={SH.y + SH.h + 52} x2={S5.agent.x} y2={S5.agent.y - 60} color={theme.accent} draw={send} />
      {frame >= b(3) + 70 && <Agent x={S5.agent.x} y={S5.agent.y} scale={0.6} enterAt={b(3) + 70} pose={agent} />}

      {/* доска 1 справа: журнал решений и коммит */}
      {frame >= b(5) + 24 && <Editor x={S5.log.x} y={S5.log.y} w={S5.log.w} at={b(5) + 24} file="решения.md" lines={LOG} />}
      <g opacity={commit}>
        <line x1={S5.commit.x + 20} y1={S5.commit.y} x2={S5.commit.x + 200} y2={S5.commit.y} stroke={theme.line} strokeWidth={4} />
        <circle cx={S5.commit.x + 30} cy={S5.commit.y} r={12} fill={theme.paper} stroke={theme.line} strokeWidth={4} />
        <circle cx={S5.commit.x + 190} cy={S5.commit.y} r={12} fill={theme.ok} stroke={theme.ok} strokeWidth={4} />
        <Label x={S5.commit.x + 30} y={S5.commit.y + 40} size={20} weight={600} color={theme.soft}>
          версия 1
        </Label>
        <Label x={S5.commit.x + 190} y={S5.commit.y + 40} size={20} weight={700} color={theme.ok}>
          версия 2
        </Label>
        <Pill x={S5.commit.x + 380} y={S5.commit.y} text="коммит после удачной версии" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* выход из цикла */}
      <Arrow x1={S5.steps[2].x + SW + 6} y1={mid(2).y + 10} x2={S5.exit.x - 210} y2={S5.exit.y} color={theme.alt} draw={exit} />
      {runOn && <circle cx={runOut.x} cy={runOut.y} r={12} fill={theme.alt} stroke={theme.paper} strokeWidth={3} />}
      <g opacity={exitPill}>
        <Pill x={S5.exit.x} y={S5.exit.y} text="выход: время вышло или ответ есть" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
    </KitScene>
  )
}
