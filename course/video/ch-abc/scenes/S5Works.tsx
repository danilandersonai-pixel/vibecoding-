import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Checklist } from '../../kit/screens/Checklist'
import { chatLayout } from '../../kit/screens/layout'
import { Mono } from '../../kit/screens/Window'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bug, KeyCap } from './parts'

const ID = 's5-works'

const TESTS: { line: TermLine; at: number }[] = [
  { line: { text: 'npm test', kind: 'cmd' }, at: 0 },
  { line: { text: '✓ вес — число', kind: 'ok' }, at: 45 },
  { line: { text: '✓ видны только свои подходы', kind: 'ok' }, at: 55 },
  { line: { text: '✗ объём: ждали 480, а не 68', kind: 'err' }, at: 85 },
]
const NETS = ['тесты', 'логи', 'консоль']
const ERROR = ['Uncaught TypeError: weight is undefined', '    at saveSet (workout.ts:14)']
// письмо агенту: сначала ошибка и «исправил», затем «не помогло — почему?»
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Жму «Сохранить подход» — новой строки нет. Console: TypeError: weight is undefined, workout.ts:14' },
  { from: 'agent', text: 'Исправил. Попробуйте ещё раз.' },
  { from: 'me', text: 'Не помогло. Почему это должно сработать? Как проверим?' },
  { from: 'agent', text: 'Форма шлёт «вес», а код ждёт weight. Проверим: сохраним подход ещё раз.' },
]

// Сцена 5: как понять, что всё работает — система ловит ошибки, тест ловит баг сам,
// в браузере — панель разработчика и красная ошибка в Console, затем письмо ИИ по трём правилам.
export function S5Works() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const Bw = S5.browser
  const C = S5.chat

  // «сеть»: три ловушки для ошибок
  const net = useAppear(b(0)) * interpolate(frame, [b(2) - 10, b(2)], [1, 0], CLAMP)
  const tests = TESTS.filter((t) => frame >= b(1) + t.at).map((t) => t.line)
  const caught = useAppear(b(1) + 90)
  // тесты уходят до наезда на браузер: край кадра резал бы терминал
  const testsOut = interpolate(frame, [b(3) - 10, b(3) + 2], [1, 0], CLAMP)

  // сайт: нажатие — и ничего
  const tapAt = b(2) + 45
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const nothing = useAppear(b(2) + 75)
  // панель разработчика
  const key = useAppear(b(3) + 5)
  const panel = interpolate(frame, [b(3) + 10, b(3) + 30], [0, 1], CLAMP)
  const consoleTab = frame >= b(3) + 60
  const errors = [b(4) + 5, b(4) + 15]
  const copy = useAppear(b(4) + 70)

  // письмо агенту: до b(6) — два сообщения, затем четыре; at подобран так, чтобы третье пришло на b(6) + 14
  const all = chatLayout(CHAT, C.w, 0)
  const firstAt = b(5) + 30
  const secondAt = b(6) + 14 - all.items[2].start
  const chat = frame < b(6) ? CHAT.slice(0, 2) : CHAT
  const stillBroken = useAppear(b(6))
  const blind = useAppear(b(6) + 20)
  const works = useAppear(b(6) + 115)
  const agent1 = all.items[1]

  // Анна нажимает → удивлена → думает, где искать → смотрит на консоль
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [tapAt - 15, ['point', 'neutral']],
    [b(2) + 75, ['surprised', 'worried']],
    [b(3), ['think', 'worried']],
    [b(4) + 20, ['point', 'neutral']],
  ])

  return (
    <KitScene chip="5 / 6 · Как понять, что всё работает" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* система, которая ловит ошибки */}
      <g opacity={net}>
        <Card x={S5.net.x} y={S5.net.y} w={S5.net.w} h={S5.net.h}>
          <Label x={S5.net.x + 24} y={S5.net.y + 38} anchor="start" size={22} weight={700}>
            система, которая ловит ошибки
          </Label>
          {NETS.map((n, i) => {
            const cx = S5.net.x + 90 + i * 170
            const at = b(0) + 40 + i * 20
            const y = interpolate(frame, [at, at + 20], [S5.net.y + 70, S5.net.y + 140], CLAMP)
            const landed = frame >= at + 20
            return (
              <g key={n}>
                <g opacity={interpolate(frame, [at - 6, at], [0, 1], CLAMP)}>
                  <Bug x={cx} y={y} scale={0.9} />
                </g>
                <path d={`M${cx - 50} ${S5.net.y + 120} Q ${cx} ${S5.net.y + 200}, ${cx + 50} ${S5.net.y + 120}`} fill="none" stroke={theme.ink} strokeWidth={4} strokeLinecap="round" />
                {landed && <Mark x={cx + 44} y={S5.net.y + 112} ok />}
                <Label x={cx} y={S5.net.y + 212} size={20} color={theme.soft} weight={600}>
                  {n}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>

      {/* тест ловит баг сам */}
      <g opacity={testsOut}>{frame >= b(1) && <Terminal x={S5.term.x} y={S5.term.y} w={S5.term.w} at={b(1) - 8} lines={tests} />}</g>
      <g opacity={caught * testsOut}>
        <Bug x={S5.term.x + S5.term.w - 34} y={S5.term.y + 40 + 16 + 3 * 32 + 16} scale={0.8} />
      </g>

      {/* сайт и панель разработчика */}
      <Browser x={Bw.x} y={Bw.y} w={Bw.w} h={Bw.h} at={b(2)} url="localhost:3000">
        <text x={32} y={84} fill={theme.ink} style={{ font: `700 26px ${theme.font}` }}>
          Подходы Анны
        </text>
        <rect x={32} y={100} width={300} height={40} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
        <text x={48} y={127} fill={theme.ink} style={{ font: `500 20px ${theme.font}` }}>
          жим · 55 кг × 8
        </text>
        <rect x={32} y={156} width={240} height={46} rx={10} fill={frame >= tapAt && frame < tapAt + 10 ? theme.ink : theme.accent} />
        <text x={152} y={186} textAnchor="middle" fill={theme.paper} style={{ font: `600 20px ${theme.font}` }}>
          Сохранить подход
        </text>
        {ripple > 0 && <circle cx={152} cy={179} r={14 + ripple * 40} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        <g opacity={nothing}>
          <text x={290} y={186} fill={theme.soft} style={{ font: `500 20px ${theme.font}` }}>
            … и ничего
          </text>
        </g>
        <g opacity={key}>
          <KeyCap x={470} y={64} label="F12" />
          <text x={510} y={160} textAnchor="middle" fill={theme.soft} style={{ font: `500 18px ${theme.font}` }}>
            Ctrl+Shift+I
          </text>
        </g>
        <g opacity={panel} transform={`translate(0 ${(1 - panel) * 40})`}>
          <rect x={3} y={S5.devTop} width={Bw.w - 6} height={Bw.h - S5.devTop - 3} fill={theme.codeBg} />
          <line x1={3} y1={S5.devTop} x2={Bw.w - 3} y2={S5.devTop} stroke={theme.line} strokeWidth={2} />
          {['Elements', 'Console', 'Network'].map((t, i) => {
            const on = t === 'Console' && consoleTab
            return (
              <g key={t}>
                <text x={24 + i * 130} y={S5.devTop + 28} fill={on ? theme.accent : theme.soft} style={{ font: `${on ? 700 : 500} 18px ${theme.font}` }}>
                  {t}
                </text>
                {on && <rect x={20 + i * 130} y={S5.devTop + 36} width={90} height={4} rx={2} fill={theme.accent} />}
              </g>
            )
          })}
          {ERROR.map((t, i) => (
            <g key={t} opacity={interpolate(frame, [errors[i], errors[i] + 8], [0, 1], CLAMP)}>
              <rect x={10} y={S5.devTop + 56 + i * 36} width={Bw.w - 20} height={32} fill={theme.riskTint} />
              <Mono x={20} y={S5.devTop + 79 + i * 36} fill={theme.risk}>
                {t}
              </Mono>
            </g>
          ))}
          <g opacity={copy}>
            <Pill x={Bw.w - 150} y={S5.devTop + 160} w={250} text="скопировать целиком" size={20} color={theme.accent} fill={theme.paper} />
          </g>
        </g>
      </Browser>
      {frame >= b(2) - 6 && <Client x={500} y={445} scale={0.75} color={theme.accent} label="Анна" enterAt={b(2) - 6} pose={anna[0]} mood={anna[1]} />}

      {/* доска 2: письмо агенту по трём правилам */}
      {frame >= b(5) && <AgentChat x={C.x} y={C.y} w={C.w} at={frame < b(6) ? firstAt : secondAt} messages={chat} />}
      <g opacity={stillBroken}>
        <Pill x={C.x + 16 + agent1.bubbleW + 110} y={C.y + agent1.top + 26} w={200} text="ошибка осталась" size={18} color={theme.risk} fill={theme.riskTint} />
      </g>
      {frame >= b(5) && <Checklist x={S5.list.x} y={S5.list.y} w={S5.list.w} at={b(5) + 70} items={['весь текст ошибки', 'что делали', 'что ждали и что вышло']} done={3} />}
      <g opacity={blind}>
        <Card x={S5.list.x} y={S5.list.y + 206} w={S5.list.w} h={140} stroke={theme.risk}>
          <Label x={S5.list.x + 24} y={S5.list.y + 244} anchor="start" size={22} color={theme.risk} weight={700}>
            не правьте вслепую
          </Label>
          <Label x={S5.list.x + 24} y={S5.list.y + 282} anchor="start" size={20} weight={500}>
            спросите: почему должно сработать?
          </Label>
          <Label x={S5.list.x + 24} y={S5.list.y + 316} anchor="start" size={20} weight={500}>
            и как мы это проверим?
          </Label>
        </Card>
      </g>
      <g opacity={works}>
        <Pill x={S5.list.x + S5.list.w / 2} y={S5.list.y + 386} w={360} text="✓ проверили — строка появилась" size={20} color={theme.ok} fill={theme.okTint} />
      </g>
    </KitScene>
  )
}
