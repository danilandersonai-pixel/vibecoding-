import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Checklist } from '../../kit/screens/Checklist'
import { theme } from '../../theme'
import { BOARD2, PHONE_FONT, PHONE_SCALE, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Stars, Wall, You } from './parts'

const ID = 's3-collect'
const F = PHONE_FONT
const X2 = BOARD2
const W = S3.wall

const STEPS = [
  { title: 'Собрать', sub: ['как пользователь:', 'скриншоты, видео'] },
  { title: 'Разобрать', sub: ['экраны, данные,', 'сценарии, правила'] },
  { title: 'Описать', sub: ['своими словами,', 'решить отличие'] },
  { title: 'Собрать заново', sub: ['новая сессия,', 'только описание'] },
  { title: 'Сверить', sub: ['паритет и', 'сценарии рядом'] },
]
const THUMBS = ['все экраны', 'пустые экраны', 'ошибки', 'запись экрана', 'справка и цены', 'отзывы']
const BANNED = ['вскрывать код', 'обходить вход', 'выкачивать данные']
const LAYERS = [
  { title: 'Карта экранов', ex: 'что куда ведёт' },
  { title: 'Сущности и данные', ex: 'тренер, подход' },
  { title: 'Сценарии', ex: 'записать подход' },
  { title: 'Правила и крайние случаи', ex: 'вес пустой?' },
  { title: 'Оформление', ex: 'карточки, вкладки' },
  { title: 'Невидимое', ex: 'уведомления, сеть' },
]
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Опиши устройство эталона. Тексты и вид не копируй.' },
  { from: 'agent', text: 'Готово: экраны, данные, сценарии. Не уверен: что будет, если вес пустой?' },
]
const QUESTIONS = ['вес пустой — что будет?', 'нет сети — сохранится?']

type Screen = 'login' | 'list' | 'empty' | 'error' | 'rec' | 'price' | 'reviews'

// Экран эталона (координаты экрана телефона): что видит обычный пользователь.
function RefScreen({ screen, flash }: { screen: Screen; flash: number }) {
  const header = screen === 'price' ? 'Тарифы' : screen === 'reviews' ? 'Отзывы' : screen === 'login' ? 'Вход' : 'Тренировки'
  const rows = screen === 'price' ? ['Бесплатно', 'Про'] : ['Жим лёжа', 'Присед', 'Тяга']
  return (
    <g>
      <rect x={-50} y={-84} width={100} height={24} rx={6} fill={theme.alt} />
      <text y={-67} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        {header}
      </text>
      {screen === 'login' && (
        <g>
          <rect x={-46} y={-44} width={92} height={24} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
          <text x={-40} y={-27} fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
            мой аккаунт
          </text>
          <rect x={-46} y={-10} width={92} height={24} rx={6} fill={theme.alt} />
          <text y={7} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
            Войти
          </text>
        </g>
      )}
      {(screen === 'list' || screen === 'rec' || screen === 'price') &&
        rows.map((r, i) => (
          <g key={r}>
            <rect x={-50} y={-48 + i * 32} width={100} height={26} rx={6} fill={theme.paper} stroke={theme.alt} strokeWidth={2} />
            <text x={-44} y={-30.5 + i * 32} fill={theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
              {r}
            </text>
          </g>
        ))}
      {screen === 'rec' && (
        <g>
          <circle cx={-38} cy={62} r={6} fill={theme.risk} />
          <text x={-26} y={66} fill={theme.risk} style={{ font: `600 ${F}px ${theme.font}` }}>
            запись
          </text>
        </g>
      )}
      {screen === 'empty' && (
        <g>
          <text y={-6} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${F}px ${theme.font}` }}>
            Пока пусто
          </text>
          <text y={14} textAnchor="middle" fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
            добавьте первую
          </text>
        </g>
      )}
      {screen === 'error' && (
        <g>
          <rect x={-46} y={-36} width={92} height={40} rx={6} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} />
          <text y={-11} textAnchor="middle" fill={theme.risk} style={{ font: `600 ${F}px ${theme.font}` }}>
            Нет сети
          </text>
          <text y={30} textAnchor="middle" fill={theme.alt} style={{ font: `600 ${F}px ${theme.font}` }}>
            Повторить
          </text>
        </g>
      )}
      {screen === 'reviews' && (
        <g>
          <Stars x={-38} y={-40} n={2} size={7} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-46} y={-20 + i * 22} width={92 - (i % 2) * 24} height={8} rx={4} fill={theme.grid} />
          ))}
        </g>
      )}
      {flash > 0 && <rect x={-54} y={-92} width={108} height={184} rx={6} fill={theme.white} opacity={flash} />}
    </g>
  )
}

// Сцена 3: чистая комната — пять шагов и стена; шаг 1 — материал, как его видит пользователь
// (и чего делать нельзя); шаг 2 — разбор на слои и вопросы, которые ИИ не может знать.
export function S3Collect() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: пять шагов и стена
  const sides = appear(frame, b(0) + 5)
  const stepIn = STEPS.map((_, i) => appear(frame, b(0) + 12 + i * 14))
  const wall = interpolate(frame, [b(0) + 90, b(0) + 120], [0, 1], CLAMP)
  const people = appear(frame, b(0) + 125)
  // через стену: описание проходит, скриншот и тексты — нет
  const doc = trackAt(frame, [
    [b(1) + 8, S3.you.x + 120, S3.slotY],
    [b(1) + 40, W.x + W.w / 2, S3.slotY],
    [b(1) + 62, S3.agent.x - 130, S3.slotY],
  ])
  const docIn = appear(frame, b(1) + 4)
  const shot = trackAt(frame, [
    [b(1) + 70, S3.you.x + 150, S3.slotY + 70],
    [b(1) + 92, W.x - 70, S3.slotY + 70],
    [b(1) + 104, W.x - 150, S3.slotY + 70],
  ])
  const shotIn = appear(frame, b(1) + 66)
  const shotNo = appear(frame, b(1) + 92)
  const texts = trackAt(frame, [
    [b(1) + 100, S3.you.x + 150, S3.slotY - 70],
    [b(1) + 122, W.x - 76, S3.slotY - 70],
    [b(1) + 134, W.x - 156, S3.slotY - 70],
  ])
  const textsIn = appear(frame, b(1) + 96)
  const textsNo = appear(frame, b(1) + 122)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1), ['point', 'neutral']],
    [b(1) + 70, ['stand', 'neutral']],
    [b(1) + 130, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 62, 'working'],
    [b(1) + 140, 'done'],
  ])

  // доска 2: материал
  const phoneIn = appear(frame, b(2) + 20)
  const stuff = appear(frame, b(2) + 30)
  const thumbAt = [b(2) + 70, b(3) + 10, b(3) + 40, b(3) + 70, b(3) + 100, b(3) + 130]
  const screen = stepAt<Screen>(frame, [
    [0, 'login'],
    [b(2) + 58, 'list'],
    [b(3) + 2, 'empty'],
    [b(3) + 32, 'error'],
    [b(3) + 62, 'rec'],
    [b(3) + 92, 'price'],
    [b(3) + 122, 'reviews'],
  ])
  const flash = Math.max(0, ...thumbAt.map((at) => interpolate(frame, [at - 4, at, at + 6], [0, 0.8, 0], CLAMP)))
  const bannedIn = [10, 40, 70].map((d) => appear(frame, b(4) + d))

  // доска 3: слои и вопросы
  const layerIn = LAYERS.map((_, i) => appear(frame, b(5) + 18 + i * 16))
  const qTitle = appear(frame, b(6) + 95)

  const T = S3.thumbs
  const Ly = S3.layers

  return (
    <KitScene chip="3 / 7 · Собрать и разобрать" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: пять шагов, между третьим и четвёртым — стена */}
      <g opacity={sides}>
        <Label x={S3.steps[0]} y={116} anchor="start" size={22} weight={700} color={theme.alt}>
          Разбор эталона
        </Label>
        <Label x={S3.steps[3]} y={116} anchor="start" size={22} weight={700} color={theme.accent}>
          Ваша разработка
        </Label>
      </g>
      {STEPS.map((s, i) => {
        const x = S3.steps[i]
        const color = i < 3 ? theme.alt : theme.accent
        return (
          <g key={s.title} opacity={stepIn[i]} transform={`translate(0 ${(1 - stepIn[i]) * 14})`}>
            <Card x={x} y={S3.stepY} w={S3.stepW} h={S3.stepH} stroke={color} />
            <circle cx={x + 32} cy={S3.stepY + 34} r={18} fill={color} />
            <Label x={x + 32} y={S3.stepY + 41} size={20} weight={700} color={theme.paper}>
              {String(i + 1)}
            </Label>
            <Label x={x + 18} y={S3.stepY + 86} anchor="start" size={22} weight={700}>
              {s.title}
            </Label>
            {s.sub.map((l, j) => (
              <Label key={l} x={x + 18} y={S3.stepY + 114 + j * 22} anchor="start" size={18} weight={500} color={theme.soft}>
                {l}
              </Label>
            ))}
          </g>
        )
      })}
      <defs>
        <clipPath id="ch12-s3-wall">
          <rect x={W.x - 4} y={W.y + W.h * (1 - wall)} width={W.w + 8} height={W.h * wall + 2} />
        </clipPath>
      </defs>
      <g clipPath="url(#ch12-s3-wall)">
        <Wall x={W.x} y={W.y} w={W.w} h={W.h} slotY={S3.slotY} />
      </g>
      <g opacity={wall >= 1 ? 1 : 0}>
        <Label x={W.x + W.w / 2} y={W.y - 8} size={20} weight={700} color={theme.alt}>
          стена
        </Label>
      </g>
      <g opacity={people}>
        <You x={S3.you.x} y={S3.you.y} scale={0.6} label="Вы" pose={you[0]} mood={you[1]} />
        <Agent x={S3.agent.x} y={S3.agent.y} scale={0.6} pose={agent} />
      </g>
      {frame >= b(1) + 4 && (
        <g opacity={docIn}>
          <Pill x={doc.x} y={doc.y} text="описание" color={theme.ok} fill={theme.okTint} size={20} compact />
        </g>
      )}
      {frame >= b(1) + 62 && <Mark x={S3.agent.x - 130 + 62} y={S3.slotY - 22} ok />}
      {frame >= b(1) + 66 && (
        <g opacity={shotIn}>
          <Pill x={shot.x} y={shot.y} text="скриншоты" color={theme.risk} fill={theme.paper} size={20} compact />
          <g opacity={shotNo}>
            <Mark x={shot.x + 66} y={shot.y - 18} ok={false} />
          </g>
        </g>
      )}
      {frame >= b(1) + 96 && (
        <g opacity={textsIn}>
          <Pill x={texts.x} y={texts.y} text="тексты" color={theme.risk} fill={theme.paper} size={20} compact />
          <g opacity={textsNo}>
            <Mark x={texts.x + 50} y={texts.y - 18} ok={false} />
          </g>
        </g>
      )}

      {/* доска 2: шаг 1 — материал, как его видит пользователь */}
      <g opacity={phoneIn}>
        <Phone x={S3.phone.x} y={S3.phone.y} scale={PHONE_SCALE}>
          <RefScreen screen={screen} flash={flash} />
        </Phone>
        <Pill x={S3.phone.x} y={520} text="Эталон А" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <g opacity={stuff}>
        <Card x={S3.stuff.x} y={S3.stuff.y} w={S3.stuff.w} h={S3.stuff.h} />
        <Label x={S3.stuff.x + 30} y={S3.stuff.y + 40} anchor="start" size={24} weight={700}>
          Шаг 1 · Материал из своего аккаунта
        </Label>
      </g>
      {THUMBS.map((t, i) => {
        const x = T.x + (i % 3) * T.dx
        const y = T.y + Math.floor(i / 3) * T.dy
        const on = appear(frame, thumbAt[i], 10)
        return (
          <g key={t} opacity={on} transform={`translate(${(1 - on) * -40} 0)`}>
            <rect x={x} y={y} width={T.w} height={T.h} rx={12} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
            <rect x={x + 16} y={y + 18} width={42} height={74} rx={6} fill={theme.ink} />
            <rect x={x + 20} y={y + 26} width={34} height={58} rx={3} fill={i === 2 ? theme.riskTint : theme.paper} />
            <rect x={x + 24} y={y + 31} width={26} height={7} rx={2} fill={theme.alt} />
            <Label x={x + 74} y={y + 62} anchor="start" size={20} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}
      {BANNED.map((t, i) => {
        const cx = X2 + 530 + i * 275
        return (
          <g key={t} opacity={bannedIn[i]} transform={`translate(0 ${(1 - bannedIn[i]) * 12})`}>
            <Pill x={cx} y={S3.banY} w={250} text={t} color={theme.risk} fill={theme.riskTint} size={20} compact />
            <Mark x={cx - 125} y={S3.banY - 20} ok={false} />
          </g>
        )
      })}

      {/* доска 3: шаг 2 — разбор на слои */}
      {LAYERS.map((l, i) => {
        const y = Ly.y + i * Ly.step
        return (
          <g key={l.title} opacity={layerIn[i]} transform={`translate(${(1 - layerIn[i]) * -24} 0)`}>
            <rect x={Ly.x} y={y} width={Ly.w} height={Ly.h} rx={12} fill={i % 2 === 0 ? theme.altTint : theme.paper} stroke={theme.alt} strokeWidth={3} />
            <Label x={Ly.x + 20} y={y + 38} anchor="start" size={22} weight={700}>
              {l.title}
            </Label>
            <Label x={Ly.x + Ly.w - 20} y={y + 38} anchor="end" size={18} weight={500} color={theme.soft}>
              {l.ex}
            </Label>
          </g>
        )
      })}
      {frame >= b(6) && <AgentChat x={S3.chat.x} y={S3.chat.y} w={S3.chat.w} at={b(6) + 4} messages={CHAT} />}
      <g opacity={qTitle}>
        <Label x={S3.check.x} y={S3.check.y - 14} anchor="start" size={20} weight={700} color={theme.accent}>
          Вопросы — проверю руками в эталоне
        </Label>
      </g>
      {frame >= b(6) + 95 && <Checklist x={S3.check.x} y={S3.check.y} w={S3.check.w} at={b(6) + 100} items={QUESTIONS} done={2} />}
    </KitScene>
  )
}
