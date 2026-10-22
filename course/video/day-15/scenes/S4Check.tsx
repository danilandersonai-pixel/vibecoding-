import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { chatHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { EMPTY_STATES, FOCUS, HAND, LIST_H, RECORDS_EMPTY, S4, screenOf, TODAY } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { EmptyBody, Handset, Key, PlusButton, RegisterBody, ScreenButton, Speaker, WelcomeBody } from './parts'

const ID = 's4-check'
const L = S4.list
const CT = S4.contrast
const R = S4.reader
const C = S4.chat

// запрос ИИ проверить доступность и его ответ
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Проверь контраст, подписи и клавиатуру. Исправь главное.' },
  { from: 'agent', text: 'Нашёл: бледная кнопка, у «+» нет подписи. Исправил.' },
]
const CHAT_H = chatHeight(CHAT, C.w)
// что записали за новым человеком
const NOTES = ['искал, где программы', 'что такое «цикл»?']

type Screen = 'register' | 'welcome' | 'empty0' | 'empty1' | 'records'

// Сцена 4 (проверьте у себя): путь нового тренера без подсказок, каждый список пустым — с кнопкой;
// доступность — одна клавиатура (Tab, Enter, видимый фокус сверху вниз), контраст, подписи для
// скринридера; запрос ИИ и своя проверка; показ тому, кто приложение не видел: молчать и записывать.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const sp = screenOf(S4.phone)
  const sf = screenOf(S4.form)

  // список дел: строки сразу, галочки — по репликам (третья и четвёртая — пока камера на доске 2)
  const title = appear(frame, b(0) + 4, 10)
  const rowIn = TODAY.map((_, i) => b(0) + 14 + i * 8)
  const tickAt = [b(0) + 150, b(1) + 170, b(3) + 100, b(5) + 60, b(6) + 150]

  // телефон: регистрация → первый экран → пустые списки по очереди → первый экран у нового человека
  const filled = stepAt(frame, [
    [0, 0],
    [b(0) + 30, 1],
    [b(0) + 44, 2],
    [b(0) + 58, 3],
  ])
  const signUp = b(0) + 72
  const emptyAt = [b(1) + 20, b(1) + 70, b(1) + 120]
  const screen = stepAt<Screen>(frame, [
    [0, 'register'],
    [signUp + 16, 'welcome'],
    [emptyAt[0], 'empty0'],
    [emptyAt[1], 'empty1'],
    [emptyAt[2], 'records'],
    [b(6) - 10, 'welcome'],
  ])
  const shownAt = stepAt(frame, [
    [0, -100],
    [emptyAt[0], emptyAt[0]],
    [emptyAt[1], emptyAt[1]],
    [emptyAt[2], emptyAt[2]],
    [b(6) - 10, -100],
  ])
  const hasButton = shownAt > 0 ? appear(frame, shownAt + 18, 8) : 0

  // доска 2: клавиатура и фокус
  const bench = appear(frame, b(2) - 10, 12)
  const keys = appear(frame, b(2) + 30, 10)
  const tabs = [b(2) + 44, b(2) + 84, b(2) + 120, b(3) + 14]
  const enter = b(3) + 90
  const focus = stepAt(frame, [[0, -1], [tabs[0], 0], [tabs[1], 1], [tabs[2], 2], [tabs[3], 3]])
  const pressed = (at: number) => (frame >= at && frame < at + 8 ? 1 : 0)
  const tabDown = Math.max(...tabs.map(pressed))
  const orderAt = FOCUS.map((_, i) => b(3) + 30 + i * 8)
  const order = appear(frame, b(3) + 30, 24)
  const focusOk = appear(frame, b(3) + 120, 10)
  // контраст и подписи
  const contrast = appear(frame, b(4) + 6, 10)
  const reader = appear(frame, b(4) + 80, 10)
  // запрос ИИ
  const chatSlot = appear(frame, b(2) + 30, 12) * (1 - appear(frame, b(5) + 10, 6))
  const yours = appear(frame, b(5) + 120, 12)

  // показ новому человеку
  const quiet = appear(frame, b(6) + 56, 10)
  const notes = appear(frame, b(6) + 76, 10)
  const noteAt = [b(6) + 96, b(6) + 128]

  const guest = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 60, ['point', 'neutral']],
    [b(6) + 96, ['think', 'worried']],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 90, ['think', 'neutral']],
  ])

  const centerY = (i: number) => sf.y + FOCUS[i].y + FOCUS[i].h / 2

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать сегодня у себя */}
      <g opacity={title}>
        <Card x={L.x} y={L.y} w={L.w} h={LIST_H} stroke={theme.ok} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 42} anchor="start" size={24} weight={800}>
            Сегодня у себя
          </Label>
          <line x1={L.x + 20} y1={L.y + L.head - 8} x2={L.x + L.w - 20} y2={L.y + L.head - 8} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {TODAY.map((t, i) => {
        const y = L.y + L.head + i * L.row
        const done = appear(frame, tickAt[i], 8)
        return (
          <g key={t} opacity={appear(frame, rowIn[i], 10)}>
            <circle cx={L.x + 38} cy={y + 22} r={15} fill="none" stroke={theme.line} strokeWidth={2.5} strokeDasharray="6 5" opacity={1 - done} />
            <g opacity={done}>
              <Mark x={L.x + 38} y={y + 22} ok r={15} />
            </g>
            <Label x={L.x + 66} y={y + 29} anchor="start" size={21} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}

      {/* телефон: путь нового тренера и пустые списки */}
      <g opacity={appear(frame, 6, 12)}>
        <Handset x={S4.phone.x} y={S4.phone.y}>
          {screen === 'register' && <RegisterBody s={sp} filled={filled} tapAt={signUp} />}
          {screen === 'welcome' && <WelcomeBody s={sp} polish={1} name={frame >= b(6) - 10 ? '' : 'Ира'} />}
          {screen === 'empty0' && <EmptyBody s={sp} state={EMPTY_STATES[0]} />}
          {screen === 'empty1' && <EmptyBody s={sp} state={EMPTY_STATES[1]} />}
          {screen === 'records' && <EmptyBody s={sp} state={RECORDS_EMPTY} />}
        </Handset>
      </g>
      <g opacity={hasButton}>
        <Mark x={S4.phone.x + HAND.w - 6} y={S4.phone.y + 6} ok r={18} />
      </g>

      {/* показ тому, кто приложение не видел: молчим и записываем */}
      <g transform={`translate(${2 * S4.guest.x} 0) scale(-1 1)`}>
        <Actor x={S4.guest.x} y={S4.guest.y} scale={0.75} enterAt={b(6) + 20}>
          <Person color={theme.line} pose={guest[0]} mood={guest[1]} />
        </Actor>
      </g>
      <g opacity={appear(frame, b(6) + 24, 10)}>
        <Label x={S4.guest.x} y={S4.guest.y + 84} size={18} weight={600}>
          новый человек
        </Label>
      </g>
      <Actor x={S4.you.x} y={S4.you.y} scale={0.75} label="Вы" enterAt={b(6) + 30}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={quiet}>
        <Pill x={S4.you.x} y={236} text="молчу" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
      <g opacity={notes}>
        <Card x={S4.notes.x} y={S4.notes.y} w={S4.notes.w} h={S4.notes.h} stroke={theme.alt} fill={theme.white}>
          <Label x={S4.notes.x + 18} y={S4.notes.y + 30} anchor="start" size={20} weight={800} color={theme.alt}>
            где растерялся:
          </Label>
          {NOTES.map((n, i) => (
            <Label key={n} x={S4.notes.x + 18} y={S4.notes.y + 60 + i * 28} anchor="start" size={20} weight={600}>
              {typed(n, frame, noteAt[i], 30)}
            </Label>
          ))}
        </Card>
      </g>

      {/* доска 2: одна клавиатура — фокус видно, он идёт сверху вниз, кнопка жмётся клавишей */}
      <g opacity={bench}>
        <Handset x={S4.form.x} y={S4.form.y}>
          <RegisterBody s={sf} focus={focus} tapAt={enter} />
        </Handset>
      </g>
      <g opacity={focusOk}>
        <Mark x={S4.form.x - 26} y={centerY(3) + 50} ok r={15} />
      </g>
      <Arrow x1={S4.form.x - 26} y1={centerY(0)} x2={S4.form.x - 26} y2={centerY(3) + 4} color={theme.accent} draw={order} />
      {FOCUS.map((_, i) => (
        <g key={i} opacity={appear(frame, orderAt[i], 8)}>
          <circle cx={S4.form.x - 26} cy={centerY(i)} r={15} fill={theme.accent} />
          <Label x={S4.form.x - 26} y={centerY(i) + 7} size={18} weight={800} color={theme.white}>
            {String(i + 1)}
          </Label>
        </g>
      ))}
      <g opacity={keys}>
        <Key x={CT.x + 55} y={S4.keys.y + S4.keys.h / 2} w={100} text="Tab" down={tabDown} />
        <Key x={CT.x + 190} y={S4.keys.y + S4.keys.h / 2} w={120} text="Enter" down={pressed(enter)} />
        <Pill x={CT.x + 330} y={S4.keys.y + S4.keys.h / 2} text="без мыши" color={theme.soft} fill={theme.white} size={20} compact />
      </g>

      {/* места карточек контраста и подписей — пока идёт проверка клавиатурой */}
      <g opacity={keys * (1 - contrast)}>
        <Slot x={CT.x} y={CT.y} w={CT.w} h={CT.h} text="контраст" />
      </g>
      <g opacity={keys * (1 - reader)}>
        <Slot x={R.x} y={R.y} w={R.w} h={R.h} text="подписи для скринридера" />
      </g>

      {/* контраст: текст должен читаться на своём фоне */}
      <g opacity={contrast}>
        <Card x={CT.x} y={CT.y} w={CT.w} h={CT.h} stroke={theme.line} fill={theme.white}>
          <Label x={CT.x + 20} y={CT.y + 32} anchor="start" size={20} weight={800}>
            контраст
          </Label>
        </Card>
        <g opacity={appear(frame, b(4) + 30, 10)}>
          <ScreenButton cx={CT.x + 85} y={CT.y + 52} w={130} h={46} text="Создать" fill={theme.accentTint} color={theme.line} />
          <Mark x={CT.x + 172} y={CT.y + 75} ok={false} r={14} />
        </g>
        <g opacity={appear(frame, b(4) + 54, 10)}>
          <ScreenButton cx={CT.x + 271} y={CT.y + 52} w={130} h={46} text="Создать" />
          <Mark x={CT.x + 362} y={CT.y + 75} ok r={14} />
        </g>
      </g>

      {/* подписи: что зачитает скринридер у кнопки-значка */}
      <g opacity={reader}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.line} fill={theme.white}>
          <Speaker x={R.x + 34} y={R.y + 26} />
          <Label x={R.x + 62} y={R.y + 34} anchor="start" size={20} weight={800}>
            скринридер читает
          </Label>
        </Card>
        {[
          { text: '«Кнопка»', ok: false, at: b(4) + 100 },
          { text: '«Пригласить, кнопка»', ok: true, at: b(4) + 130 },
        ].map((r, i) => {
          const y = R.y + 56 + i * 58
          return (
            <g key={r.text} opacity={appear(frame, r.at, 10)}>
              <PlusButton x={R.x + 20} y={y} />
              <Label x={R.x + 76} y={y + 27} anchor="start" size={20} weight={600} color={r.ok ? theme.ink : theme.risk}>
                {r.text}
              </Label>
              <g opacity={appear(frame, r.at + 12, 8)}>
                <Mark x={R.x + R.w - 30} y={y + 20} ok={r.ok} r={14} />
              </g>
            </g>
          )
        })}
      </g>

      {/* запрос ИИ: проверить и исправить, а проверить исправления — самим */}
      <g opacity={chatSlot}>
        <Slot x={C.x} y={C.y} w={C.w} h={CHAT_H} text="запрос ИИ" />
      </g>
      {frame >= b(5) + 10 && <AgentChat x={C.x} y={C.y} w={C.w} at={b(5) + 10} messages={CHAT} />}
      <g opacity={yours}>
        <Pill x={C.x + C.w / 2} y={C.y + CHAT_H + 40} w={196} text="проверьте сами" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}
