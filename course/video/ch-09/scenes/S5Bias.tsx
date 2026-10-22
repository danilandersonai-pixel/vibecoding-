import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person } from '../../actors/Person'
import { Turnstile } from '../../actors/Turnstile'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Checklist } from '../../kit/screens/Checklist'
import { Diff } from '../../kit/screens/Diff'
import { Editor } from '../../kit/screens/Editor'
import { theme } from '../../theme'
import { DIFF_LINES, FAIR_CHAT, RISK_ITEMS, RULE_LINES, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Badge, Key, Slot } from './parts'

const ID = 's5-bias'
const F = S5.form
const L = S5.login
const W = S5.walk

// очередь к программе: кто проходит, а кого отсекает
const QUEUE = [
  { color: theme.ok, pass: true, end: 740 },
  { color: theme.alt, pass: false, end: 230 },
  { color: theme.accent, pass: true, end: 830 },
  { color: theme.soft, pass: false, end: 310 },
]
// имена, которые проверка «только латиница» отсекает (рис. 9.4); первое — в поле формы
const NAMES = ['Ёлкина', "O'Connor", 'Мария-Луиза', 'Müller']
const TYPED = ['Anna', 'Ёлкина', "O'Connor", 'Мария-Луиза']
const TESTS = ['имя с апострофом', 'адрес другой страны', 'только клавиатура']

// Сцена 5: предвзятость — программа раз за разом подводит одних людей; допущения из данных обучения
// становятся «разумным» значением по умолчанию. Форма записи пускает только латиницу; справедливое правило;
// попросить ИИ словами. Проверка глазами другого человека и клавиатурой; как снижать риск.
export function S5Bias() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: очередь к турникету «программа»
  const walkers = QUEUE.map((q, i) => {
    const t0 = b(0) + 10 + i * 38
    const keys: [number, number, number][] = q.pass
      ? [
          [t0, W.from, W.y],
          [t0 + 28, 400, W.y],
          [t0 + 56, q.end, W.y],
        ]
      : [
          [t0, W.from, W.y],
          [t0 + 28, 372, W.y],
          [t0 + 46, q.end, W.y],
        ]
    return { ...q, t0, pos: trackAt(frame, keys), done: frame >= t0 + (q.pass ? 56 : 46) }
  })
  const open = walkers.some((w) => w.pass && frame >= w.t0 + 20 && w.pos.x < 600) ? 1 : 0
  const verdict = useAppear(b(0) + 110)
  const data = useAppear(b(1) + 10)
  const dataSlot = useAppear(b(0) + 30) * (1 - data)
  const normSlot = useAppear(b(0) + 30)
  const toAgent = appear(frame, b(1) + 40, 14)
  const norm = useAppear(b(1) + 96)
  const toGate = appear(frame, b(1) + 140, 16)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 50, 'working'],
    [b(1) + 96, 'done'],
    [b(1) + 150, 'idle'],
  ])

  // доска 2: форма записи, имена, исправление, запрос словами
  const formAt = b(2) + 8
  const typedAt = [b(2) + 24, b(2) + 64, b(2) + 104, b(2) + 144]
  const cur = stepAt(frame, typedAt.map((at, i): [number, number] => [at, i]))
  const name = typed(TYPED[cur], frame, typedAt[cur], 30)
  const fixed = frame >= b(3) + 100
  const doneTyping = name === TYPED[cur]
  const nameOk = cur === 0 || fixed
  const nameAt = [b(2) + 80, b(2) + 120, b(2) + 160, b(2) + 186]
  const flipAt = NAMES.map((_, i) => b(3) + 90 + i * 15)
  const ruleAt = b(2) + 40
  const diffAt = b(3) + 10
  const chatAt = b(4) + 6

  // доска 3: проверка клавиатурой, тесты и как снижать риск
  const loginAt = b(5) + 10
  const focus = stepAt(frame, [
    [0, -1],
    [b(5) + 40, 0],
    [b(5) + 70, 1],
    [b(5) + 100, 2],
  ])
  const press = (at: number) => frame >= at && frame < at + 8
  const tab = press(b(5) + 40) || press(b(5) + 70) || press(b(5) + 100)
  const enter = frame >= b(5) + 130
  const keys = useAppear(b(5) + 30)
  const testAt = TESTS.map((_, i) => b(5) + 16 + i * 30)
  const testHead = useAppear(b(5) + 10)
  const riskAt = b(6) + 6

  // поля формы входа: (y, высота) в координатах окна
  const FIELDS = [
    { label: 'Почта', y: 136, h: 48, w: 432 },
    { label: 'Пароль', y: 226, h: 48, w: 432 },
    { label: '', y: 296, h: 44, w: 160 },
  ]

  return (
    <KitScene chip="5 / 6 · Предвзятость" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* очередь к программе */}
      <Turnstile x={S5.gate.x} y={S5.gate.y} label="программа" open={open} enterAt={2} />
      {walkers.map((w, i) =>
        frame >= w.t0 ? (
          <g key={i} opacity={appear(frame, w.t0, 8)}>
            <Actor x={w.pos.x} y={w.pos.y} scale={0.55}>
              <Person color={w.color} pose={w.done && !w.pass ? 'surprised' : 'stand'} mood={w.done ? (w.pass ? 'happy' : 'worried') : 'neutral'} />
            </Actor>
            {w.done && <Mark x={w.pos.x} y={W.y - 74} ok={w.pass} r={14} />}
          </g>
        ) : null,
      )}
      <g opacity={verdict}>
        <Pill x={S5.gate.x} y={196} text="одних пускает, других — нет" color={theme.risk} fill={theme.white} size={20} compact />
      </g>

      {/* места будущего блока данных и плашки «по умолчанию» */}
      <g opacity={dataSlot}>
        {[0, 1, 2].map((i) => (
          <Slot key={i} x={S5.data.x + S5.data.w / 2} y={S5.data.y + 16 + i * 38} w={S5.data.w} h={32} r={8} />
        ))}
      </g>
      <g opacity={normSlot * (1 - appear(frame, b(1) + 96))}>
        <Slot x={S5.agent.x} y={272} w={286} h={34} r={17} text="?" />
      </g>

      {/* допущения из данных обучения → «разумное» по умолчанию */}
      <g opacity={data}>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={S5.data.x} y={S5.data.y + i * 38} width={S5.data.w} height={32} rx={8} fill={theme.white} stroke={theme.line} strokeWidth={2.5} />
        ))}
        <Label x={S5.data.x + S5.data.w / 2} y={S5.data.y + 23} size={20} color={theme.soft} weight={700}>
          данные обучения
        </Label>
        <rect x={S5.data.x + 30} y={S5.data.y + 50} width={150} height={8} rx={4} fill={theme.grid} />
        <rect x={S5.data.x + 30} y={S5.data.y + 88} width={110} height={8} rx={4} fill={theme.grid} />
      </g>
      <Arrow x1={S5.agent.x} y1={S5.data.y + 112} x2={S5.agent.x} y2={248} color={theme.alt} draw={toAgent} />
      <g opacity={norm}>
        <Pill x={S5.agent.x} y={272} text="«разумное» по умолчанию" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Arrow x1={S5.agent.x - 150} y1={272} x2={S5.gate.x + 82} y2={262} color={theme.alt} dashed draw={toGate} />
      <Agent x={S5.agent.x} y={S5.agent.y} scale={0.8} enterAt={b(1) + 30} pose={agent} />

      {/* доска 2: форма записи к тренеру */}
      {frame >= formAt && (
        <Browser x={F.x} y={F.y} w={F.w} h={F.h} at={formAt} url="запись к тренеру">
          <Label x={24} y={84} anchor="start" size={24} weight={800}>
            Запись к тренеру
          </Label>
          <Label x={24} y={122} anchor="start" size={20} color={theme.soft} weight={600}>
            Имя
          </Label>
          <rect x={24} y={134} width={432} height={48} rx={8} fill={theme.white} stroke={doneTyping && !nameOk ? theme.risk : theme.accent} strokeWidth={3} />
          <Label x={40} y={166} anchor="start" size={22} weight={600}>
            {name}
          </Label>
          {doneTyping && frame >= typedAt[0] + 10 && <Mark x={426} y={158} ok={nameOk} r={14} />}
          {doneTyping && !nameOk && (
            <Label x={24} y={208} anchor="start" size={20} color={theme.risk} weight={700}>
              только латиница A–Z
            </Label>
          )}
          <rect x={24} y={222} width={180} height={36} rx={8} fill={doneTyping && !nameOk ? theme.line : theme.accent} />
          <Label x={114} y={247} size={20} color={theme.white} weight={700}>
            Записаться
          </Label>
        </Browser>
      )}
      {NAMES.map((n, i) => {
        const ok = frame >= flipAt[i]
        const x = S5.names.x[i % 2]
        const y = S5.names.y[Math.floor(i / 2)]
        return (
          <g key={n} opacity={appear(frame, nameAt[i])}>
            <Mark x={x - 112} y={y} ok={ok} r={14} />
            <Pill x={x} y={y} w={190} text={n} color={ok ? theme.ok : theme.risk} fill={ok ? theme.okTint : theme.riskTint} size={20} compact />
          </g>
        )
      })}
      {frame >= ruleAt && frame < diffAt && <Editor x={S5.diff.x} y={S5.diff.y} w={S5.diff.w} at={ruleAt} file="проверка имени" lines={RULE_LINES} highlight={[2]} />}
      {frame >= diffAt && <Diff x={S5.diff.x} y={S5.diff.y} w={S5.diff.w} at={diffAt} lines={DIFF_LINES} />}
      {frame >= chatAt && <AgentChat x={S5.chat.x} y={S5.chat.y} w={S5.chat.w} at={chatAt} messages={FAIR_CHAT} />}

      {/* доска 3: форма входа только клавиатурой */}
      {frame >= loginAt && (
        <Browser x={L.x} y={L.y} w={L.w} h={L.h} at={loginAt} url="вход">
          <Label x={24} y={84} anchor="start" size={24} weight={800}>
            Вход для тренера
          </Label>
          {FIELDS.map((f, i) => (
            <g key={i}>
              {f.label && (
                <Label x={24} y={f.y - 12} anchor="start" size={20} color={theme.soft} weight={600}>
                  {f.label}
                </Label>
              )}
              {i < 2 ? (
                <rect x={24} y={f.y} width={f.w} height={f.h} rx={8} fill={theme.white} stroke={theme.line} strokeWidth={2.5} />
              ) : (
                <g>
                  <rect x={24} y={f.y} width={f.w} height={f.h} rx={8} fill={enter ? theme.ok : theme.accent} />
                  <Label x={24 + f.w / 2} y={f.y + 29} size={20} color={theme.white} weight={700}>
                    Войти
                  </Label>
                </g>
              )}
              {focus === i && <rect x={18} y={f.y - 6} width={f.w + 12} height={f.h + 12} rx={11} fill="none" stroke={theme.alt} strokeWidth={4} />}
              {focus >= i && <Badge x={i < 2 ? f.w - 4 : f.w + 60} y={f.y + f.h / 2} n={i + 1} color={theme.alt} r={16} />}
            </g>
          ))}
          {enter && <Mark x={290} y={318} ok r={16} />}
        </Browser>
      )}
      <g opacity={keys}>
        <Key x={L.x + 150} y={500} text="Tab" pressed={tab} />
        <Key x={L.x + 320} y={500} text="Enter" pressed={enter && frame < b(5) + 140} />
      </g>
      <g opacity={testHead}>
        <Label x={S5.tests.x} y={90} size={20} color={theme.soft} weight={700}>
          глазами непохожего человека:
        </Label>
      </g>
      {TESTS.map((t, i) => (
        <g key={t} opacity={appear(frame, testAt[i])}>
          <Pill x={S5.tests.x} y={S5.tests.y[i]} text={t} color={theme.accent} fill={theme.white} size={20} compact />
        </g>
      ))}
      {frame >= riskAt && <Checklist x={S5.risk.x} y={S5.risk.y} w={S5.risk.w} at={riskAt} items={RISK_ITEMS} done={RISK_ITEMS.length} />}
    </KitScene>
  )
}
