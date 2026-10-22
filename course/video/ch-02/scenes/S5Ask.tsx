import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Phone } from '../../actors/Phone'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, PhoneScreen } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { chatLayout } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { PHONE_SCALE, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-ask'
const C = S5.chat
const P = S5.plan
const MN = S5.menu
const RP = S5.reply
const TR = S5.tricks

// вопросы перед стартом (рис. 2.6) на примере напоминаний о тренировке
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Нужны напоминания о тренировке. Сначала задай до 5 вопросов.' },
  { from: 'agent', text: '1) За сколько напоминать? 2) Куда: почта или телефон? 3) Что с отменами?' },
  { from: 'me', text: 'За 2 часа, в телефон, при отмене — не надо.' },
  { from: 'agent', text: 'Понял. Вот план — подтверждаете?' },
]
// режимы приложения Claude (рис. 2.7)
const MODES = ['Manual', 'Accept edits', 'Plan', 'Auto']
const PLAN = ['1. Таблица напоминаний', '2. Уведомление за 2 часа', '3. Отменённые — пропускать', '4. Копия письмом на почту']
// ещё приёмы из таблицы техник (s18)
const TRICKS = [
  { title: 'Образцы результата', lines: ['покажите 1–3 примера', 'нужного вида'] },
  { title: 'Тесты сначала', lines: ['сперва проверки,', 'потом код'] },
  { title: 'Самопроверка', lines: ['«перечисли необычные', 'случаи и проверь их»'] },
  { title: 'Взгляд специалиста', lines: ['«посмотри как', 'специалист', 'по безопасности»'] },
]

// Сцена 5: техники запросов. Вопросы перед стартом — ИИ уточняет, вы отвечаете; режим Plan — план до кода,
// поправка словами и смена режима; ещё четыре приёма из таблицы.
export function S5Ask() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: чат растёт по репликам; at подобран так, чтобы новое сообщение приходило на своём кадре
  const title = useAppear(b(0) + 6)
  const all = chatLayout(CHAT, C.w, 0)
  const stages: [number, number, number][] = [
    // [кадр, сколько сообщений показать, какое из них приходит на этом кадре]
    [b(1) + 6, 1, 0],
    [b(2) + 6, 2, 1],
    [b(3) + 6, 4, 2],
  ]
  const [stageAt, count, arriving] = stepAt(frame, [[0, stages[0]], ...stages.map((st) => [st[0], st] as [number, [number, number, number]])])
  const chatAt = stageAt - all.items[arriving].start
  const asks = [b(0) + 40, b(0) + 56, b(0) + 72].map((at) => appear(frame, at) * interpolate(frame, [b(3) + 90, b(3) + 100], [1, 0], CLAMP))
  const sure = useAppear(b(3) + 100)
  const notify = useAppear(b(3) + 110)
  // вопросы агента «загораются», когда он прочитал просьбу
  const asksOn = frame >= b(1) + 100
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 50, 'working'],
    [b(1) + 100, 'idle'],
    [b(2) + 6, 'working'],
    [b(2) + 60, 'done'],
    [b(2) + 110, 'idle'],
    [b(3) + 40, 'working'],
    [b(3) + 80, 'done'],
  ])

  // доска 2: режим Plan — выбрать, прочитать план, поправить и переключить
  const step = [b(4) + 30, b(4) + 60, b(5) + 6].map((at) => appear(frame, at))
  const menu = useAppear(b(4) + 36)
  const open = frame >= b(4) + 48
  const chosen = frame >= b(5) + 70 ? 'Accept edits' : frame >= b(4) + 58 ? 'Plan' : 'Manual'
  const planAt = PLAN.map((_, i) => b(4) + 84 + i * 22)
  const reply = useAppear(b(5) + 12)
  const strike = interpolate(frame, [b(5) + 40, b(5) + 52], [0, 1], CLAMP)
  const edits = frame >= b(5) + 110
  const now = useAppear(b(5) + 96)

  // доска 3: ещё приёмы
  const trickAt = TRICKS.map((_, i) => b(6) + 32 + i * 24)

  return (
    <KitScene chip="5 / 6 · Сначала вопросы, потом план" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* вопросы перед стартом */}
      <g opacity={title}>
        <Pill x={S5.title.x} y={S5.title.y} text="Приём: вопросы перед стартом" color={theme.accent} size={22} />
      </g>
      {frame >= stages[0][0] - 12 && <AgentChat x={C.x} y={C.y} w={C.w} at={chatAt} messages={CHAT.slice(0, count)} />}
      {['?', '?', '?'].map((q, i) => (
        <g key={i} opacity={asks[i]}>
          <circle cx={S5.agent.x - 40 + i * 40} cy={262 - (i % 2) * 22} r={18} fill={asksOn ? theme.accent : theme.paper} stroke={theme.accent} strokeWidth={3} />
          <Label x={S5.agent.x - 40 + i * 40} y={270 - (i % 2) * 22} size={22} color={asksOn ? theme.white : theme.accent} weight={800}>
            {q}
          </Label>
        </g>
      ))}
      <g opacity={sure}>
        <Mark x={S5.agent.x} y={256} ok r={18} />
      </g>
      <Agent x={S5.agent.x} y={S5.agent.y} scale={0.9} enterAt={b(0) + 10} pose={agent} />
      <Phone x={S5.phone.x} y={S5.phone.y} scale={PHONE_SCALE} enterAt={b(0) + 24}>
        <PhoneScreen tapAt={-100} listAt={b(0) + 30} list={['пт · ноги', 'вс · спина']} label="Мои тренировки">
          <g opacity={notify} transform={`translate(0 ${(1 - notify) * -12})`}>
            <rect x={-52} y={10} width={104} height={58} rx={8} fill={theme.accent} />
            <text x={0} y={34} textAnchor="middle" fill={theme.white} style={{ font: `700 12px ${theme.font}` }}>
              Тренировка
            </text>
            <text x={0} y={54} textAnchor="middle" fill={theme.white} style={{ font: `500 12px ${theme.font}` }}>
              через 2 часа
            </text>
          </g>
        </PhoneScreen>
      </Phone>
      <g opacity={appear(frame, b(0) + 30)}>
        <Label x={S5.phone.x} y={S5.phone.y + 200} size={20} color={theme.soft} weight={600}>
          телефон Анны
        </Label>
      </g>

      {/* доска 2: режим Plan */}
      {['Выберите Plan', 'Claude пишет план', 'Поправьте и дайте добро'].map((t, i) => {
        const x = [MN.x, P.x, RP.x][i]
        return (
          <g key={t} opacity={step[i]}>
            <circle cx={x + 18} cy={118} r={18} fill={theme.accent} />
            <Label x={x + 18} y={125} size={20} color={theme.white} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={x + 46} y={125} anchor="start" size={22} weight={700}>
              {t}
            </Label>
          </g>
        )
      })}
      <g opacity={menu}>
        <rect x={MN.x} y={MN.y} width={MN.w} height={48} rx={10} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
        <Label x={MN.x + 18} y={MN.y + 32} anchor="start" size={22} color={theme.accent} weight={700}>
          {`${chosen} ▾`}
        </Label>
        {open &&
          MODES.map((m, i) => {
            const on = m === chosen
            const y = MN.y + 60 + i * 46
            return (
              <g key={m} opacity={appear(frame, b(4) + 48 + i * 4, 6)}>
                <rect x={MN.x} y={y} width={MN.w} height={42} rx={8} fill={on ? theme.accentTint : theme.paper} stroke={on ? theme.accent : theme.grid} strokeWidth={2} />
                <Label x={MN.x + 18} y={y + 28} anchor="start" size={20} color={on ? theme.accent : theme.ink} weight={on ? 700 : 500}>
                  {m}
                </Label>
                {on && <Mark x={MN.x + MN.w - 26} y={y + 21} ok r={12} />}
              </g>
            )
          })}
      </g>
      <g opacity={step[1]}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.accent}>
          <Label x={P.x + 22} y={P.y + 40} anchor="start" size={22} weight={700}>
            Задача: напоминания
          </Label>
          {PLAN.map((t, i) => {
            const y = P.y + 88 + i * 50
            return (
              <g key={t}>
                <Label x={P.x + 22} y={y} anchor="start" size={20} color={i === 3 && strike > 0 ? theme.soft : theme.ink} weight={500}>
                  {frame >= planAt[i] ? typed(t, frame, planAt[i], 40) : ''}
                </Label>
                {i === 3 && <line x1={P.x + 18} y1={y - 7} x2={P.x + 18 + 300 * strike} y2={y - 7} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />}
              </g>
            )
          })}
          <line x1={P.x + 18} y1={P.y + P.h - 58} x2={P.x + P.w - 18} y2={P.y + P.h - 58} stroke={theme.grid} strokeWidth={2} />
          <Label x={P.x + 22} y={P.y + P.h - 22} anchor="start" size={20} color={edits ? theme.alt : theme.ok} weight={700}>
            {edits ? 'Файлов изменено: 3' : 'Файлов изменено: 0'}
          </Label>
        </Card>
      </g>
      <g opacity={reply}>
        <Card x={RP.x} y={RP.y} w={RP.w} h={92} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={RP.x + 20} y={RP.y + 38} anchor="start" size={20} weight={600}>
            Пункт 4 не нужен,
          </Label>
          <Label x={RP.x + 20} y={RP.y + 68} anchor="start" size={20} weight={600}>
            остальное делай
          </Label>
        </Card>
      </g>
      <g opacity={appear(frame, b(5) + 64)}>
        <Label x={RP.x} y={RP.y + 140} anchor="start" size={20} color={theme.soft} weight={600}>
          Смените режим:
        </Label>
        <Pill x={RP.x + 52} y={RP.y + 180} w={104} text="Plan ▾" color={theme.soft} size={20} compact />
        <Arrow x1={RP.x + 112} y1={RP.y + 180} x2={RP.x + 150} y2={RP.y + 180} color={theme.accent} />
        <Pill x={RP.x + 248} y={RP.y + 180} w={180} text="Accept edits ▾" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={now}>
        <Label x={RP.x} y={RP.y + 246} anchor="start" size={20} weight={600}>
          Теперь Claude правит файлы
        </Label>
        <Label x={RP.x} y={RP.y + 276} anchor="start" size={20} weight={600}>
          по согласованному плану
        </Label>
      </g>

      {/* доска 3: ещё приёмы */}
      {TRICKS.map((t, i) => {
        const x = TR.x + i * (TR.w + TR.gap)
        const a = appear(frame, trickAt[i])
        return (
          <g key={t.title} opacity={a} transform={`translate(0 ${(1 - a) * 18})`}>
            <Card x={x} y={TR.y} w={TR.w} h={TR.h} stroke={theme.accent} />
            <circle cx={x + 34} cy={TR.y + 38} r={18} fill={theme.accent} />
            <Label x={x + 34} y={TR.y + 45} size={20} color={theme.white} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={x + 18} y={TR.y + 96} anchor="start" size={22} weight={700}>
              {t.title}
            </Label>
            {t.lines.map((l, j) => (
              <Label key={l} x={x + 18} y={TR.y + 134 + j * 28} anchor="start" size={20} color={theme.soft} weight={500}>
                {l}
              </Label>
            ))}
          </g>
        )
      })}
      {frame >= b(6) + 120 && <Agent x={TR.x + 1178 / 2} y={470} scale={0.6} label="Агент" enterAt={b(6) + 120} pose="done" />}
    </KitScene>
  )
}
