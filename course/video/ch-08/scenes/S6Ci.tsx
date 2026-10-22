import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Diff } from '../../kit/screens/Diff'
import { Editor } from '../../kit/screens/Editor'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bug, Padlock } from './parts'

const ID = 's6-ci'
const PR = S6.pr
const CO = S6.cols

// проверки пул-реквеста (рис. 8.8): красная — тесты
const CHECKS = ['Стиль кода (Lint)', 'Типы (Types)', 'Тесты (Tests)', 'Безопасность', 'Сборка (Build)']
const RED = 2
// негативный тест: чужой тренер не получает тренировки Анны
const TEST = ["it('Дима не видит тренировки Анны',", '  async () => {', '    const res = await getAs(dima, anna)', '    expect(res.status).toBe(404)', '  })']
// регрессионные тесты: каждый найденный баг остаётся тестом
const REGRESS = ['тест: пустая неделя — без ошибки', 'тест: чужие тренировки — 404', 'тест: вес с запятой считается']
// кто что проверяет (таблица s54)
const COLUMNS = [
  { title: 'Автоматика', color: theme.accent, lines: ['стиль и типы — линтер', 'и компилятор', 'уязвимости — SAST, SCA,', 'сканер секретов'] },
  { title: 'ИИ-проверяющий', color: theme.alt, lines: ['первый проход:', 'очевидные ошибки', 'и забытые редкие', 'случаи'] },
  { title: 'Человек', color: theme.ok, lines: ['решает ли правка задачу', 'логика и права доступа', 'качество тестов'] },
]

// Сцена 6: CI сам проверяет каждый пул-реквест; красная строка закрывает слияние, текст ошибки — ИИ.
// Негативный тест: Дима не получает тренировки Анны; правка без проверки владельца краснеет.
// Каждый баг — в тест; ревью делят автоматика, ИИ и человек.
export function S6Ci() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: проверки пул-реквеста
  const card = appear(frame, b(0))
  // пока ошибки и агента нет, пул-реквест стоит по центру
  const prShift = interpolate(frame, [b(1) + 20, b(1) + 40], [S6.prCenter, 0], CLAMP)
  const testShift = interpolate(frame, [b(3) - 6, b(3) + 10], [S6.testDown, 0], CLAMP)
  const bugShift = interpolate(frame, [b(5) - 4, b(5) + 14], [S6.bugDown, 0], CLAMP)
  const rowAt = CHECKS.map((_, i) => b(0) + 12 + i * 8)
  const doneAt = CHECKS.map((_, i) => b(0) + 64 + i * 20)
  const errAt = b(1) + 40
  const toAgent = interpolate(frame, [b(1) + 70, b(1) + 86], [0, 1], CLAMP)
  const fixedAt = b(1) + 140
  const showAi = appear(frame, b(1) + 50)

  // доска 2: негативный тест и правка, которая его ломает
  const testAt = b(2) + 30
  const go1 = interpolate(frame, [b(2) + 70, b(2) + 96], [0, 1], CLAMP)
  const deny = appear(frame, b(2) + 100)
  const pass = appear(frame, b(2) + 120)
  const diffAt = b(3) + 10
  const noCheck = frame >= b(3) + 50
  const go2 = interpolate(frame, [b(3) + 60, b(3) + 86], [0, 1], CLAMP)
  const leak = appear(frame, b(3) + 90)
  const red = frame >= b(3) + 104
  const closed = appear(frame, b(3) + 126)

  // доска 3: баг → тест; кто что проверяет
  const bug = appear(frame, b(4) + 10)
  const toTest = interpolate(frame, [b(4) + 26, b(4) + 42], [0, 1], CLAMP)
  const caught = appear(frame, b(4) + 56)
  const testsAt = REGRESS.map((_, i) => b(4) + 40 + i * 16)
  const never = appear(frame, b(4) + 110)
  // колонки и их строки готовы к b(5) + 96, когда открывается горячая точка
  const colAt = COLUMNS.map((_, i) => b(5) + 14 + i * 18)
  // человеку — самое важное: его колонка выделяется, когда все строки на месте
  const human = appear(frame, b(5) + 80)

  const status = (i: number): 'wait' | 'ok' | 'fail' => {
    if (frame < doneAt[i]) return 'wait'
    if (i === RED && frame < fixedAt) return 'fail'
    return 'ok'
  }
  const anyRed = CHECKS.some((_, i) => status(i) === 'fail')
  const mergeOk = frame >= fixedAt + 10

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 86, 'working'],
    [fixedAt, 'done'],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 60, ['point', 'happy']],
    [b(2) + 100, ['surprised', 'worried']],
    [b(3) + 56, ['point', 'happy']],
    [b(3) + 90, ['cheer', 'happy']],
  ])
  const pkt = (p: number) => S6.dima.x + 80 + (S6.server.x - 160 - S6.dima.x - 80) * p

  return (
    <KitScene chip="6 / 7 · Проверки в CI" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: пул-реквест и его проверки */}
      <g transform={`translate(${prShift} 0)`}>
        <g opacity={card}>
          <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} />
          <Label x={PR.x + 24} y={PR.y + 42} anchor="start" size={23} weight={700}>
            Пул-реквест № 21 · график прогресса
          </Label>
        </g>
        {CHECKS.map((c, i) => {
          const y = PR.y + 66 + i * PR.row
          const s = status(i)
          const spin = (frame * 12) % 360
          return (
            <g key={c} opacity={appear(frame, rowAt[i], 8)}>
              <rect x={PR.x + 16} y={y} width={PR.w - 32} height={PR.row - 10} rx={8} fill={s === 'fail' ? theme.riskTint : s === 'ok' ? theme.okTint : theme.paper} stroke={s === 'fail' ? theme.risk : theme.grid} strokeWidth={2} />
              {s === 'wait' ? (
                <circle cx={PR.x + 44} cy={y + (PR.row - 10) / 2} r={12} fill="none" stroke={theme.line} strokeWidth={4} strokeDasharray="20 56" transform={`rotate(${spin} ${PR.x + 44} ${y + (PR.row - 10) / 2})`} />
              ) : (
                <Mark x={PR.x + 44} y={y + (PR.row - 10) / 2} ok={s === 'ok'} r={14} />
              )}
              <Label x={PR.x + 72} y={y + (PR.row - 10) / 2 + 8} anchor="start" size={22} weight={600}>
                {c}
              </Label>
              <Label x={PR.x + PR.w - 32} y={y + (PR.row - 10) / 2 + 7} anchor="end" size={20} weight={600} color={s === 'fail' ? theme.risk : s === 'ok' ? theme.ok : theme.soft}>
                {s === 'wait' ? 'идёт…' : s === 'ok' ? 'пройдено' : 'не пройдено'}
              </Label>
            </g>
          )
        })}
        <g opacity={appear(frame, doneAt[CHECKS.length - 1])}>
          <rect x={PR.x + 16} y={PR.y + PR.h - 74} width={PR.w - 32} height={54} rx={10} fill={mergeOk ? theme.accent : theme.grid} />
          {!mergeOk && <Padlock x={PR.x + 56} y={PR.y + PR.h - 44} scale={0.6} />}
          <Label x={PR.x + PR.w / 2 + (mergeOk ? 0 : 20)} y={PR.y + PR.h - 39} size={22} weight={700} color={mergeOk ? theme.white : theme.soft}>
            {mergeOk ? 'Слить изменения' : anyRed ? 'Слить — недоступно, есть красное' : 'Слить изменения'}
          </Label>
        </g>
      </g>
      {frame >= errAt && (
        <Terminal
          x={S6.error.x}
          y={S6.error.y}
          w={S6.error.w}
          at={errAt}
          lines={[
            { text: 'FAIL progress.test.ts', kind: 'err' },
            { text: 'ждали 3 точки графика, пришло 2', kind: 'out' },
          ]}
        />
      )}
      <g opacity={showAi}>
        <Pill x={S6.agent.x} y={S6.error.y + 196} text="покажите ИИ текст ошибки" color={theme.accent} fill={theme.accentTint} compact />
      </g>
      <Arrow x1={S6.error.x + S6.error.w / 2 - 120} y1={S6.error.y + 216} x2={S6.agent.x - 40} y2={S6.agent.y - 70} color={theme.accent} draw={toAgent} />
      {frame >= b(1) + 60 && <Agent x={S6.agent.x} y={S6.agent.y} scale={0.75} enterAt={b(1) + 60} pose={agent} />}

      {/* доска 2: негативный тест */}
      <g transform={`translate(0 ${testShift})`}>
        {frame >= testAt && <Editor x={S6.test.x} y={S6.test.y} w={S6.test.w} at={testAt} file="progress.test.ts" lines={TEST} highlight={[3, 4]} />}
        <g opacity={pass}>
          <Pill x={S6.badge.x} y={S6.badge.y} text={red ? 'тест упал — правку не пустит' : 'тест пройден'} color={red ? theme.risk : theme.ok} fill={red ? theme.riskTint : theme.okTint} size={20} compact />
        </g>
      </g>
      {frame >= diffAt && (
        <Diff
          x={S6.diff.x}
          y={S6.diff.y}
          w={S6.diff.w}
          at={diffAt}
          lines={[
            { text: 'if (row.owner !== user.id) return 404', kind: 'del' },
            { text: 'return row', kind: 'same' },
          ]}
        />
      )}
      {frame >= b(2) + 36 && <Coach x={S6.dima.x} y={S6.dima.y} scale={0.7} color={theme.alt} label="Дима" enterAt={b(2) + 36} pose={dima[0]} mood={dima[1]} />}
      {frame >= b(2) + 40 && (
        <g>
          <Server x={S6.server.x} y={S6.server.y} scale={0.6} enterAt={b(2) + 40} />
          <g opacity={noCheck ? 0.25 : 1}>
            <Padlock x={S6.server.x + 56} y={S6.server.y - 66} scale={0.55} />
          </g>
        </g>
      )}
      {go1 > 0 && go1 < 1 && <Packet x={pkt(go1)} y={S6.dima.y - 40} scale={0.55} text="тренировки Анны" color={theme.alt} />}
      {go2 > 0 && go2 < 1 && <Packet x={pkt(go2)} y={S6.dima.y - 40} scale={0.55} text="тренировки Анны" color={theme.alt} />}
      <g opacity={deny * (1 - leak)}>
        <Pill x={S6.reply.x} y={S6.reply.y} text="404 · отказ — так и надо" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={leak}>
        <Pill x={S6.reply.x} y={S6.reply.y} text="200 · тренировки Анны отданы" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={closed}>
        <Padlock x={S6.verdict.x - 150} y={S6.verdict.y} scale={0.6} />
        <Pill x={S6.verdict.x + 20} y={S6.verdict.y} text="слияние закрыто" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>

      {/* доска 3: баг становится тестом */}
      <g transform={`translate(0 ${bugShift})`}>
        <g opacity={bug * (1 - caught * 0.6)}>
          <Bug x={S6.bug.x} y={S6.bug.y} s={1.3} />
        </g>
        <g opacity={caught}>
          <Mark x={S6.bug.x + 30} y={S6.bug.y + 30} ok r={16} />
        </g>
        <Arrow x1={S6.bug.x + 50} y1={S6.bug.y} x2={S6.tests.x - 10} y2={S6.bug.y} color={theme.accent} draw={toTest} />
        {REGRESS.map((t, i) => {
          const a = appear(frame, testsAt[i], 10)
          const y = S6.tests.y - 40 + i * 40
          return (
            <g key={t} opacity={a}>
              <rect x={S6.tests.x + (2 - i) * 10} y={y} width={S6.tests.w} height={S6.tests.h - 10} rx={10} fill={theme.paper} stroke={theme.ok} strokeWidth={3} />
              <Label x={S6.tests.x + (2 - i) * 10 + 20} y={y + 31} anchor="start" size={21} weight={600} color={theme.ok}>
                {t}
              </Label>
            </g>
          )
        })}
        <g opacity={never}>
          <Pill x={S6.never.x} y={S6.never.y} text="баг не вернётся" color={theme.ok} fill={theme.okTint} size={22} />
        </g>
      </g>

      {/* доска 3: кто что проверяет */}
      {COLUMNS.map((c, i) => {
        const x = CO.x + i * (CO.w + CO.gap)
        const a = appear(frame, colAt[i], 10)
        return (
          <g key={c.title} opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
            <Card x={x} y={CO.y} w={CO.w} h={CO.h} stroke={c.color} fill={i === 2 && human > 0 ? theme.okTint : theme.paper} />
            <rect x={x} y={CO.y} width={CO.w} height={54} rx={12} fill={c.color} />
            <Label x={x + CO.w / 2} y={CO.y + 36} size={24} weight={700} color={theme.white}>
              {c.title}
            </Label>
            {c.lines.map((line, j) => (
              <Label key={line} x={x + 24} y={CO.y + 96 + j * 40} anchor="start" size={21} weight={500} opacity={appear(frame, colAt[i] + 6 + j * 7, 8)}>
                {line}
              </Label>
            ))}
          </g>
        )
      })}
    </KitScene>
  )
}
