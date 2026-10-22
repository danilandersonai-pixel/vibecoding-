import { useCurrentFrame } from 'remotion'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { AgentChat } from '../../kit/screens/AgentChat'
import { PHONE_SCALE, terminalHeight } from '../../kit/screens/layout'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { CHECKS, LIST_H, PHONE_CHECKS, QUESTIONS, QUESTIONS_H, S4, TERM_LINES } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { PhoneList, PhoneMsg, Stranger, TickRow } from './parts'

const ID = 's4-check'
const LS = S4.list
const Q = S4.questions

// что говорит подпись под телефоном на каждой реплике
const UNDER: { text: string; color: string }[] = [
  { text: 'у Марины +1 подопечный', color: theme.ok },
  { text: 'отказ — так и нужно', color: theme.ok },
  { text: 'список Марины не изменился', color: theme.ok },
  { text: 'двое суток ждать не нужно', color: theme.alt },
  { text: 'тренировок Анны не видно', color: theme.ok },
]

const TESTS: TermLine[] = [
  { kind: 'cmd', text: 'npm test' },
  { kind: 'ok', text: 'PASS ссылка второй раз — отказ' },
  { kind: 'ok', text: 'PASS через 49 часов — отказ' },
  { kind: 'ok', text: 'PASS чужие тренировки не видны' },
  { kind: 'out', text: '3 passed' },
]

// Сцена 4 (проверьте у себя): тестовые аккаунты — принять, второй раз, отозванное, срок тестом,
// только свои тренировки; затем повторный аудит агентом по шести вопросам главы 8 и тесты.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // доска 1: проверки по репликам 1–5
  const step = stepAt(frame, [
    [0, 0],
    [b(1), 1],
    [b(2), 2],
    [b(3), 3],
    [b(4), 4],
  ])
  const tickAt = [b(0) + 96, b(1) + 96, b(2) + 110, b(3) + 110, b(4) + 36]
  const screenAt = [b(0) + 40, b(1) + 40, b(2) + 40, b(3) + 40, b(4) + 20]
  const shown = frame >= screenAt[step]
  const check = PHONE_CHECKS[Math.min(step, PHONE_CHECKS.length - 1)]
  const under = a(screenAt[step] + 30)
  const note = a(b(step) + 6)
  const who = step === 4 ? 'тест 1' : check.who

  // доска 2: вопросы, чат, тесты
  const qHead = a(b(5) + 110)
  const qAt = QUESTIONS.map((_, i) => b(6) + 10 + i * 16)
  const termIn = a(b(7) + 6)

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* пять проверок: отметка ставится по реплике, текущая строка подсвечена */}
      <Card x={LS.x} y={LS.y} w={LS.w} h={LIST_H} stroke={theme.ok} fill={theme.paper}>
        <Label x={LS.x + 24} y={LS.y + 42} anchor="start" size={24} weight={700} color={theme.ok}>
          Проверьте у себя
        </Label>
        {CHECKS.map((c, i) => {
          const y = LS.y + LS.head + i * LS.row
          const on = frame < b(5) && step === i ? a(b(i), 8) : 0
          return (
            <g key={c}>
              <rect x={LS.x + 12} y={y} width={LS.w - 24} height={LS.row - 6} rx={10} fill={theme.accentTint} opacity={on} />
              <TickRow x={LS.x + 24} y={y + (LS.row - 6 - 30) / 2} text={c} at={tickAt[i]} />
            </g>
          )
        })}
      </Card>

      {/* телефон тестового аккаунта: что ответило приложение */}
      <Phone x={S4.phone.x} y={S4.phone.y} scale={PHONE_SCALE}>
        {!shown && <PhoneMsg lines={step === 4 ? ['Вход…'] : ['Открываю', 'ссылку…']} color={theme.soft} />}
        {shown && step < 4 && <PhoneMsg lines={check.screen} color={check.result === 'ok' ? theme.ok : theme.risk} ok={check.result === 'ok'} />}
        {shown && step === 4 && <PhoneList title="Мои тренировки" rows={['Пн · присед', 'Ср · жим']} note="только свои" />}
      </Phone>
      <Stranger x={S4.tester.x} y={S4.tester.y} scale={0.7} label={who} pose={step === 0 && shown ? 'cheer' : 'stand'} />
      <g opacity={note}>
        <Pill x={S4.note.x} y={S4.note.y} text={step === 4 ? 'вход: тест 1' : check.note} color={step === 3 ? theme.alt : step === 1 || step === 2 ? theme.risk : theme.ok} fill={theme.white} size={20} compact />
      </g>
      <g opacity={under}>
        <Pill x={S4.under.x} y={S4.under.y} text={UNDER[step].text} color={UNDER[step].color} fill={theme.white} size={18} compact />
      </g>

      {/* доска 2: повторный аудит — шесть вопросов, чат с агентом, тесты */}
      <g opacity={a(b(5) - 4, 14)}>
        <Card x={Q.x} y={Q.y} w={Q.w} h={QUESTIONS_H} stroke={theme.accent} fill={theme.paper}>
          <g opacity={qHead}>
            <Label x={Q.x + 24} y={Q.y + 42} anchor="start" size={22} weight={700} color={theme.accent}>
              Шесть вопросов · глава 8
            </Label>
          </g>
          {QUESTIONS.map((q, i) => {
            const y = Q.y + Q.head + i * Q.row
            const v = a(qAt[i])
            return (
              <g key={q}>
                <g opacity={1 - v}>
                  <Slot x={Q.x + 20} y={y} w={Q.w - 40} h={Q.row - 10} r={10} />
                </g>
                <g opacity={v}>
                  <circle cx={Q.x + 42} cy={y + (Q.row - 10) / 2} r={14} fill={theme.accent} />
                  <Label x={Q.x + 42} y={y + (Q.row - 10) / 2 + 7} size={18} weight={700} color={theme.white}>
                    {String(i + 1)}
                  </Label>
                  <Label x={Q.x + 70} y={y + (Q.row - 10) / 2 + 8} anchor="start" size={22} weight={600}>
                    {q}
                  </Label>
                </g>
              </g>
            )
          })}
        </Card>
        <g opacity={1 - termIn}>
          <Slot x={S4.term.x} y={S4.term.y} w={S4.term.w} h={terminalHeight(TERM_LINES)} r={12} text="тесты" />
        </g>
      </g>
      <AgentChat
        x={S4.chat.x}
        y={S4.chat.y}
        w={S4.chat.w}
        at={b(5) + 26}
        messages={[
          { from: 'me', text: 'Проведи заново аудит безопасности. Код не меняй, только отчёт.' },
          { from: 'agent', text: 'Иду по шести вопросам главы 8.' },
        ]}
      />
      <Terminal x={S4.term.x} y={S4.term.y} w={S4.term.w} at={b(7) + 6} lines={TESTS} />
    </KitScene>
  )
}
