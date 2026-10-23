import { interpolate, spring, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill, PhoneScreen } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { theme } from '../../theme'
import { PHONE_SCALE, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's2-ckokf'
const T = S2.table
const F = S2.forks

const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Сделай экран тренировок' },
  { from: 'agent', text: 'Готово! Показал все тренировки на одном экране.' },
]
// что модель показала: чужие тренировки вперемешку со своими
const LIST = ['Анна · ноги', 'Олег · спина', 'Анна · грудь', 'Олег · руки']
const FORKS = ['Чьи тренировки?', 'Что показать?', 'Как проверить?']

// пять элементов хорошего запроса (s14, рис. 2.2) и как они выглядят в запросе на экран тренировок
const CKOKF = [
  { letter: 'Ц', name: 'Цель', ask: 'Что и зачем нужно?', example: 'экран, где Анна видит свои тренировки на неделю' },
  { letter: 'К', name: 'Контекст', ask: 'Где это живёт и что уже есть?', example: 'тренировки уже в базе, их заводит тренер Марина' },
  { letter: 'О', name: 'Ограничения', ask: 'Чего нельзя или что обязательно?', example: 'только свои тренировки; без новых библиотек' },
  { letter: 'К', name: 'Критерий готовности', ask: 'Как понять, что всё сделано?', example: 'Анна видит свои 3 тренировки, а Олега — нет' },
  { letter: 'Ф', name: 'Формат ответа', ask: 'В каком виде вернуть результат?', example: 'список изменений и пояснение простыми словами' },
]

// Сцена 2: «Сделай экран тренировок» оставляет решения модели; ЦКОКФ — пять вопросов к запросу,
// заполненные для экрана Анны; сколько пунктов нужно — зависит от размера задачи и цены ошибки.
export function S2Ckokf() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: чат, телефон с чужими тренировками, развилки
  const listAt = b(0) + 96
  const strangers = useAppear(b(1) + 10)
  const forkAt = FORKS.map((_, i) => b(1) + 14 + i * 30)
  const redo = useAppear(b(1) + 112)
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [listAt, ['think', 'neutral']],
    [b(1) + 10, ['surprised', 'worried']],
  ])

  // доска 2: буквы → названия и вопросы → примеры по репликам
  const head = useAppear(b(2) + 30)
  const letterAt = CKOKF.map((_, i) => b(2) + 36 + i * 10)
  const nameAt = CKOKF.map((_, i) => b(2) + 86 + i * 8)
  const exampleAt = [b(3) + 14, b(3) + 80, b(4) + 34, b(5) + 30, b(6) + 18]
  // какая строка сейчас заполняется
  const current = stepAt(frame, [[0, -1], ...exampleAt.map((at, i) => [at, i] as [number, number]), [b(6) + 90, -1]])
  // шкала: мелкий вопрос → крупная задача; нужных пунктов от одного до пяти
  const scaleIn = useAppear(b(7) + 10)
  const knob = interpolate(frame, [b(7) + 70, b(7) + 160], [0, 1], CLAMP)
  const needed = frame < b(7) + 30 ? 5 : 1 + Math.round(knob * 4)

  return (
    <KitScene chip="2 / 6 · ЦКОКФ: пять вопросов к запросу" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* «Сделай экран тренировок» — и что из этого вышло */}
      <AgentChat x={S2.chat.x} y={S2.chat.y} w={S2.chat.w} at={b(0) + 6} messages={CHAT} />
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} enterAt={b(0) + 60}>
        <PhoneScreen tapAt={b(0) + 84} listAt={listAt} list={LIST} label="Тренировки" listColor={theme.line}>
          {[1, 3].map((i) => (
            <rect key={i} x={-50} y={-48 + i * 32} width={100} height={26} rx={6} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} opacity={strangers} />
          ))}
        </PhoneScreen>
      </Phone>
      <Client x={S2.anna.x} y={S2.anna.y} scale={0.6} color={theme.accent} label="Анна" enterAt={b(0) + 70} pose={anna[0]} mood={anna[1]} />

      {/* развилки: решает модель */}
      {FORKS.map((q, i) => {
        const y = F.y + i * F.row
        const a = appear(frame, forkAt[i])
        return (
          <g key={q} opacity={a} transform={`translate(${(1 - a) * 30} 0)`}>
            <Card x={F.x} y={y} w={F.w} h={84} stroke={theme.risk}>
              <circle cx={F.x + 42} cy={y + 42} r={22} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
              <Label x={F.x + 42} y={y + 51} size={26} color={theme.risk} weight={800}>
                ?
              </Label>
              <Label x={F.x + 80} y={y + 36} anchor="start" size={22} weight={700}>
                {q}
              </Label>
              <Label x={F.x + 80} y={y + 66} anchor="start" size={20} color={theme.soft} weight={500}>
                решит модель — наугад
              </Label>
            </Card>
          </g>
        )
      })}
      <g opacity={redo}>
        <Pill x={F.x + F.w / 2} y={F.y + 3 * F.row + 22} text="придётся переделывать" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>

      {/* доска 2: ЦКОКФ */}
      <g opacity={head}>
        <Label x={S2.exampleX} y={T.y - 14} anchor="start" size={20} color={theme.soft} weight={600}>
          в запросе на экран тренировок:
        </Label>
      </g>
      {CKOKF.map((r, i) => {
        const y = T.y + i * T.row
        const cy = y + T.row / 2
        const on = current === i
        const pop = spring({ frame: frame - letterAt[i], fps: 30, config: { damping: 14 } })
        return (
          <g key={r.name} opacity={i < needed ? 1 : 0.3}>
            {on && <rect x={T.x} y={y + 4} width={T.w} height={T.row - 8} rx={12} fill={theme.accentTint} />}
            {i > 0 && <line x1={T.x + 10} y1={y} x2={T.x + T.w - 10} y2={y} stroke={theme.grid} strokeWidth={2} />}
            <g transform={`translate(${T.x + 40} ${cy}) scale(${pop})`}>
              <circle r={26} fill={theme.accent} />
              <text y={10} textAnchor="middle" fill={theme.white} style={{ font: `800 28px ${theme.font}` }}>
                {r.letter}
              </text>
            </g>
            <g opacity={appear(frame, nameAt[i])}>
              <Label x={T.x + 84} y={cy - 6} anchor="start" size={22} weight={700}>
                {r.name}
              </Label>
              <Label x={T.x + 84} y={cy + 22} anchor="start" size={18} color={theme.soft} weight={500}>
                {r.ask}
              </Label>
            </g>
            <g opacity={appear(frame, exampleAt[i] - 6, 6)}>
              <rect x={S2.exampleX - 14} y={y + 12} width={T.x + T.w - S2.exampleX + 4} height={T.row - 24} rx={10} fill={theme.paper} stroke={on ? theme.accent : theme.grid} strokeWidth={2} />
              <Label x={S2.exampleX} y={cy + 7} anchor="start" size={20} weight={500}>
                {typed(r.example, frame, exampleAt[i], 22)}
              </Label>
            </g>
          </g>
        )
      })}

      {/* шкала: сколько пунктов проговаривать */}
      <g opacity={scaleIn}>
        <Label x={S2.scale.x0 - 20} y={S2.scale.y + 7} anchor="end" size={20} color={theme.soft} weight={600}>
          мелкий вопрос
        </Label>
        <Label x={S2.scale.x1 + 20} y={S2.scale.y + 7} anchor="start" size={20} color={theme.soft} weight={600}>
          крупно и дорого
        </Label>
        <line x1={S2.scale.x0} y1={S2.scale.y} x2={S2.scale.x1} y2={S2.scale.y} stroke={theme.line} strokeWidth={6} strokeLinecap="round" />
        <line x1={S2.scale.x0} y1={S2.scale.y} x2={S2.scale.x0 + (S2.scale.x1 - S2.scale.x0) * knob} y2={S2.scale.y} stroke={theme.accent} strokeWidth={6} strokeLinecap="round" />
        <circle cx={S2.scale.x0 + (S2.scale.x1 - S2.scale.x0) * knob} cy={S2.scale.y} r={14} fill={theme.accent} stroke={theme.paper} strokeWidth={4} />
      </g>
    </KitScene>
  )
}
