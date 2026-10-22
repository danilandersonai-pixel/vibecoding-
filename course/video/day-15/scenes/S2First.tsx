import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { chatHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { ALL_H, ALL_ROWS, S2, screenOf, WELCOME_Y } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Handset, InviteBody, RegisterBody, Ring, WelcomeBody } from './parts'

const ID = 's2-first'
const A = S2.all
const C = S2.chat

// запрос со скриншотом и ответ агента
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Скриншот с пометками: исправь отмеченное, остальное не трогай' },
  { from: 'agent', text: 'Готово: кнопка ярче, текст крупнее.' },
]
const CHAT_H = chatHeight(CHAT, C.w)

type Screen = 'register' | 'wait' | 'welcome' | 'invite'

// Сцена 2 (что строим сегодня): Ира регистрируется; первый экран — приветствие и один шаг, а не все
// разделы разом (без подопечных они пусты); шаг ведёт в приглашение по ссылке. Полировка: скриншот
// с пометками «кнопка бледная», «текст мелкий» → запрос «исправь отмеченное, остальное не трогай».
export function S2First() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const s = screenOf(S2.phone)
  const sh = screenOf(S2.shot)

  // регистрация → ожидание первого экрана → первый экран → приглашение
  const filled = stepAt(frame, [
    [0, 0],
    [b(0) + 20, 1],
    [b(0) + 34, 2],
    [b(0) + 48, 3],
  ])
  const signUp = b(0) + 70
  const tap = b(3) + 30
  const screen = stepAt<Screen>(frame, [
    [0, 'register'],
    [signUp + 18, 'wait'],
    [b(1) + 70, 'welcome'],
    [tap + 14, 'invite'],
  ])
  const welcomeIn = appear(frame, b(1) + 70, 10)
  const glow = appear(frame, b(2) + 86, 12) * (1 - appear(frame, tap, 6))

  // «всё сразу» рядом: появляется, когда камера отъехала; «пусто» — по реплике
  const all = appear(frame, b(1) + 26, 12) * (1 - 0.65 * appear(frame, tap, 14))
  const rowAt = ALL_ROWS.map((_, i) => b(1) + 34 + i * 6)
  const cross = appear(frame, b(1) + 60, 10)
  const noneAt = b(2) + 8
  const emptyAt = ALL_ROWS.map((_, i) => b(2) + 32 + i * 8)
  const one = appear(frame, b(1) + 110, 10) * (1 - appear(frame, tap, 14))
  const known = appear(frame, tap + 60, 12)

  // доска 2: скриншот, пометки, запрос и правка
  const shot = appear(frame, b(4) - 10, 12)
  const flash = frame >= b(4) + 40 ? 1 - appear(frame, b(4) + 40, 16) : 0
  const shotTag = appear(frame, b(4) + 50, 10)
  const chatSlot = appear(frame, b(4) + 20, 12) * (1 - appear(frame, b(6) + 8, 6))
  const ring1 = appear(frame, b(5) + 30, 16)
  const ring2 = appear(frame, b(5) + 90, 16)
  const marksOut = 1 - appear(frame, b(6) + 80, 12)
  const polish = appear(frame, b(6) + 90, 4)
  const after = appear(frame, b(6) + 96, 10)
  const checked = appear(frame, b(6) + 130, 12)

  const ira = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [signUp - 10, ['point', 'neutral']],
    [signUp + 22, ['think', 'neutral']],
    [b(1) + 80, ['stand', 'happy']],
    [b(2) + 10, ['think', 'neutral']],
    [b(2) + 120, ['stand', 'happy']],
    [tap - 10, ['point', 'happy']],
    [tap + 50, ['cheer', 'happy']],
  ])

  // кнопка на скриншоте и слова «Первый шаг:» — где обводить
  const btnY = sh.y + WELCOME_Y.button + WELCOME_Y.buttonH / 2
  const callY = sh.y + WELCOME_Y.call - 6

  return (
    <KitScene chip="2 / 4 · Первое знакомство" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* Ира и её телефон */}
      <Coach x={S2.ira.x} y={S2.ira.y} scale={0.8} label="Ира" color={theme.ink} enterAt={2} pose={ira[0]} mood={ira[1]} />
      <g opacity={appear(frame, 4, 12)}>
        <Handset x={S2.phone.x} y={S2.phone.y}>
          {screen === 'register' && <RegisterBody s={s} filled={filled} tapAt={signUp} />}
          {screen === 'wait' && <Slot x={s.x + 20} y={s.y + 80} w={s.w - 40} h={220} text="первый экран?" />}
          {screen === 'welcome' && (
            <g opacity={welcomeIn}>
              <WelcomeBody s={s} glow={glow} tapAt={tap} />
            </g>
          )}
          {screen === 'invite' && <InviteBody s={s} at={tap + 22} />}
        </Handset>
      </g>

      {/* один шаг против всего сразу */}
      <g opacity={one}>
        <Pill x={S2.step.x} y={S2.step.y} text="один шаг" color={theme.ok} fill={theme.okTint} size={20} compact />
        <Mark x={S2.step.x} y={S2.step.y + 44} ok r={14} />
      </g>
      <g opacity={known}>
        <Pill x={S2.step.x} y={S2.step.y} text="из дня 12" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={all}>
        <Card x={A.x} y={A.y} w={A.w} h={ALL_H} stroke={theme.line} fill={theme.white}>
          <Label x={A.x + 22} y={A.y + 36} anchor="start" size={22} weight={800}>
            Всё сразу
          </Label>
        </Card>
        <g opacity={cross}>
          <Mark x={A.x + A.w - 30} y={A.y + 28} ok={false} r={15} />
        </g>
        {ALL_ROWS.map((t, i) => {
          const y = A.y + A.top + i * A.row
          const none = i === 0
          return (
            <g key={t} opacity={appear(frame, rowAt[i], 8)}>
              <rect x={A.x + 16} y={y} width={A.w - 32} height={A.rowH} rx={8} fill={none ? theme.accentTint : theme.paper} stroke={none ? theme.accent : theme.grid} strokeWidth={2} opacity={none ? 0.4 + 0.6 * appear(frame, noneAt, 10) : 1} />
              <Label x={A.x + 32} y={y + 28} anchor="start" size={20} weight={600}>
                {t}
              </Label>
              <g opacity={appear(frame, none ? noneAt : emptyAt[i], 10)}>
                <Pill x={A.x + A.w - 80} y={y + A.rowH / 2} w={96} text={none ? 'нет' : 'пусто'} color={none ? theme.accent : theme.soft} fill={theme.white} size={18} compact />
              </g>
            </g>
          )
        })}
      </g>

      {/* доска 2: скриншот с пометками */}
      <g opacity={shot}>
        <Handset x={S2.shot.x} y={S2.shot.y}>
          <WelcomeBody s={sh} polish={polish} />
          {flash > 0 && <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} rx={10} fill={theme.white} opacity={flash} />}
        </Handset>
      </g>
      <g opacity={shotTag * (1 - after)}>
        <Pill x={S2.marks.x} y={sh.y + 20} text="скриншот" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={after}>
        <Pill x={S2.marks.x} y={sh.y + 20} text="после правки" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={marksOut}>
        <Ring cx={sh.x + 72} cy={callY} rx={72} ry={22} draw={ring2} />
        <Ring cx={sh.x + sh.w / 2} cy={btnY} rx={sh.w / 2 + 4} ry={36} draw={ring1} />
        <g opacity={appear(frame, b(5) + 106, 10)}>
          <Arrow x1={S2.marks.x - 88} y1={callY} x2={sh.x + 150} y2={callY} color={theme.risk} />
          <Pill x={S2.marks.x} y={callY} text="текст мелкий" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
        <g opacity={appear(frame, b(5) + 46, 10)}>
          <Arrow x1={S2.marks.x - 100} y1={btnY + 14} x2={sh.x + sh.w + 8} y2={btnY + 14} color={theme.risk} />
          <Pill x={S2.marks.x} y={btnY + 14} w={196} text="кнопка бледная" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>

      {/* запрос со скриншотом: исправь отмеченное, остальное не трогай */}
      <g opacity={chatSlot}>
        <Slot x={C.x} y={C.y} w={C.w} h={CHAT_H} text="запрос ИИ со скриншотом" />
      </g>
      {frame >= b(6) + 8 && <AgentChat x={C.x} y={C.y} w={C.w} at={b(6) + 8} messages={CHAT} />}
      <g opacity={checked}>
        <Mark x={C.x + 150} y={C.y + CHAT_H + 64} ok r={18} />
        <Label x={C.x + 180} y={C.y + CHAT_H + 72} anchor="start" size={22} weight={700} color={theme.ok}>
          проверено глазами
        </Label>
      </g>
    </KitScene>
  )
}
