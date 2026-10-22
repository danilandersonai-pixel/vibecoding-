import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt, typed } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { theme } from '../../theme'
import { COMMIT_LINES, S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Lens } from './parts'

const ID = 's4-honest'
const PR = S4.pr
const BX = S4.boxes
const HUB = S4.hub
const BN = S4.banner

// описание пул-реквеста (рис. 9.2): что сделал ИИ, что проверили вы, куда смотреть
const PR_ROWS = [
  { label: 'ИИ сделал:', value: 'экспорт в CSV', color: theme.ink },
  { label: 'Я проверил:', value: 'дифф прочитан, тесты прошли', color: theme.ok },
  { label: 'Проверьте особо:', value: 'права доступа', color: theme.risk },
]
// где важна прозрачность (рис. 9.3): четыре ситуации вокруг центра
const PLACES = [
  { title: 'В команде', lines: ['метка в коммите', 'и в пул-реквесте'], color: theme.accent, tint: theme.accentTint },
  { title: 'В открытом коде', lines: ['Gentoo и NetBSD — запрет (2024)', 'другие — требуют пометки'], color: theme.alt, tint: theme.altTint },
  { title: 'В учёбе и на собеседованиях', lines: ['ответ ИИ за свой — обман', 'обычно быстро вскрывается'], color: theme.risk, tint: theme.riskTint },
  { title: 'Перед заказчиком', lines: ['обсудите ИИ заранее', 'если договор — о способе работы'], color: theme.ok, tint: theme.okTint },
]
const boxAt = (i: number) => ({ x: BX.x[i % 2], y: BX.y[Math.floor(i / 2)] })

// Сцена 4: прозрачность — какую часть сделал ИИ; метка Co-Authored-By в коммите и описание пул-реквеста;
// четыре ситуации (команда, открытый код, учёба, заказчик); ИИ — инструмент, отвечает человек; тест честности.
export function S4Honest() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: доля работы → сообщение коммита → пул-реквест
  const share = useAppear(b(0) + 20) * interpolate(frame, [b(1), b(1) + 10], [1, 0], CLAMP)
  const aiPart = grow(frame, b(0) + 30, 24)
  const youPart = grow(frame, b(0) + 66, 24)
  const editorAt = b(1) + 8
  const mark = useAppear(b(1) + 74)
  const pr = useAppear(b(2) + 16)
  const rowAt = [b(2) + 30, b(2) + 60, b(2) + 90]
  const lens = useAppear(b(2) + 116)

  // доска 2: четыре ситуации и вывод
  const hub = useAppear(b(3) + 10)
  // все четыре рамки с заголовками появляются сразу, а о какой ситуации речь — та подсвечена
  const placeAt = [b(3) + 16, b(3) + 28, b(3) + 40, b(3) + 52]
  const focusAt = [b(3) + 16, b(3) + 16, b(4) + 10, b(5) + 10, b(6)]
  const lineAt = [
    [b(3) + 24, b(3) + 30],
    [b(3) + 70, b(3) + 120],
    [b(4) + 50, b(4) + 120],
    [b(5) + 60, b(5) + 110],
  ]
  const banner = useAppear(b(6) + 6)
  const test = useAppear(b(6) + 90)
  const ok = useAppear(b(6) + 130)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 66, ['point', 'neutral']],
    [b(1) + 30, ['think', 'neutral']],
    [b(1) + 80, ['point', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 30, 'working'],
    [b(0) + 70, 'done'],
    [b(1) + 30, 'idle'],
  ])
  const colleague = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(2) + 116, ['point', 'happy']],
  ])
  const you2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(4), ['think', 'neutral']],
    [b(5), ['point', 'neutral']],
    [b(6) + 120, ['cheer', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(5) + 60, ['point', 'happy']],
    [b(6) + 120, ['cheer', 'happy']],
  ])

  const share0 = 440 * 0.58 * aiPart
  return (
    <KitScene chip="4 / 6 · Честно о роли ИИ" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* какую часть работы сделал ИИ */}
      <g opacity={share}>
        <Label x={80} y={150} anchor="start" size={22} color={theme.soft} weight={700}>
          какую часть работы сделал ИИ?
        </Label>
        <rect x={80} y={172} width={440} height={48} rx={12} fill={theme.white} stroke={theme.line} strokeWidth={3} />
        <rect x={84} y={176} width={share0} height={40} rx={9} fill={theme.accent} />
        <rect x={84 + 440 * 0.58} y={176} width={(440 * 0.42 - 8) * youPart} height={40} rx={9} fill={theme.soft} />
        <g opacity={aiPart}>
          <Label x={84 + share0 / 2} y={203} size={22} color={theme.white} weight={700}>
            ИИ
          </Label>
        </g>
        <g opacity={youPart}>
          <Label x={84 + 440 * 0.79} y={203} size={22} color={theme.white} weight={700}>
            вы
          </Label>
        </g>
      </g>

      {/* сообщение коммита с меткой */}
      {frame >= editorAt && <Editor x={S4.commit.x} y={S4.commit.y} w={S4.commit.w} at={editorAt} file="сообщение коммита" lines={COMMIT_LINES} highlight={[3]} />}
      <g opacity={mark}>
        <Pill x={S4.commit.x + S4.commit.w / 2} y={306} text="метка: в работе участвовал ИИ" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <Actor x={S4.you.x} y={S4.you.y} scale={0.8} label="Вы" enterAt={4}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Agent x={S4.agent.x} y={S4.agent.y} scale={0.8} enterAt={10} pose={agent} />

      {/* описание пул-реквеста и коллега */}
      <g opacity={pr}>
        <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} stroke={theme.accent} fill={theme.white}>
          <Label x={PR.x + 24} y={PR.y + 44} anchor="start" size={24} weight={800}>
            Пул-реквест: экспорт в CSV
          </Label>
          <line x1={PR.x + 20} y1={PR.y + 66} x2={PR.x + PR.w - 20} y2={PR.y + 66} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {PR_ROWS.map((r, i) => {
        const y = PR.y + 116 + i * 62
        return (
          <g key={r.label} opacity={appear(frame, rowAt[i] - 4, 8)}>
            <Label x={PR.x + 24} y={y} anchor="start" size={20} color={theme.soft} weight={600}>
              {r.label}
            </Label>
            <Label x={PR.x + 230} y={y} anchor="start" size={22} color={r.color} weight={700}>
              {typed(r.value, frame, rowAt[i], 40)}
            </Label>
          </g>
        )
      })}
      <g opacity={lens}>
        <Lens x={PR.x + PR.w - 60} y={PR.y + 232} r={20} />
      </g>
      <Actor x={S4.colleague.x} y={S4.colleague.y} scale={0.7} label="Коллега" enterAt={b(2) + 40}>
        <Person color={theme.ink} pose={colleague[0]} mood={colleague[1]} />
      </Actor>

      {/* доска 2: где важна прозрачность */}
      <g opacity={hub}>
        {PLACES.map((_, i) => {
          const p = boxAt(i)
          const left = i % 2 === 0
          const top = i < 2
          return (
            <line
              key={i}
              x1={left ? HUB.x : HUB.x + HUB.w}
              y1={top ? HUB.y + 20 : HUB.y + HUB.h - 20}
              x2={left ? p.x + BX.w : p.x}
              y2={p.y + BX.h / 2}
              stroke={theme.line}
              strokeWidth={3}
              strokeDasharray="7 6"
              opacity={appear(frame, placeAt[i])}
            />
          )
        })}
        <Card x={HUB.x} y={HUB.y} w={HUB.w} h={HUB.h} stroke={theme.ink} fill={theme.white}>
          <Label x={HUB.x + HUB.w / 2} y={HUB.y + 42} size={22} weight={800}>
            Роль ИИ в работе
          </Label>
          <Label x={HUB.x + HUB.w / 2} y={HUB.y + 74} size={20} color={theme.soft} weight={600}>
            скажите честно
          </Label>
        </Card>
      </g>
      {PLACES.map((p, i) => {
        const at = boxAt(i)
        return (
          <g key={p.title} opacity={appear(frame, placeAt[i])}>
            <Card x={at.x} y={at.y} w={BX.w} h={BX.h} stroke={p.color} fill={theme.white}>
              <rect x={at.x + 2} y={at.y + 2} width={BX.w - 4} height={BX.h - 4} rx={10} fill={p.tint} opacity={appear(frame, focusAt[i], 10) * (1 - appear(frame, focusAt[i + 1], 10))} />
              <Label x={at.x + 24} y={at.y + 40} anchor="start" size={22} color={p.color} weight={800}>
                {p.title}
              </Label>
            </Card>
            {p.lines.map((l, k) => (
              <g key={l} opacity={appear(frame, lineAt[i][k], 10)}>
                <Label x={at.x + 24} y={at.y + 80 + k * 32} anchor="start" size={20} weight={600}>
                  {l}
                </Label>
              </g>
            ))}
          </g>
        )
      })}
      <Actor x={S4.you2.x} y={S4.you2.y} scale={0.6} label="Вы" enterAt={b(3) + 24}>
        <Person color={theme.soft} pose={you2[0]} mood={you2[1]} />
      </Actor>
      <Coach x={S4.marina.x} y={S4.marina.y} scale={0.6} label="Марина" enterAt={b(5) + 20} pose={marina[0]} mood={marina[1]} />

      {/* ИИ — инструмент, отвечает человек; тест честности */}
      <g opacity={banner}>
        <Card x={BN.x} y={BN.y} w={BN.w} h={BN.h} stroke={theme.accent} fill={theme.accentTint}>
          <text x={BN.x + 30} y={BN.y + 42} style={{ font: `800 24px ${theme.font}` }}>
            <tspan fill={theme.accent}>ИИ — инструмент,</tspan>
            <tspan fill={theme.ink}> а отвечает человек</tspan>
          </text>
        </Card>
      </g>
      <g opacity={test}>
        <Label x={BN.x + 30} y={BN.y + 82} anchor="start" size={20} weight={600}>
          Спросят «как сделано?» — расскажете без смущения?
        </Label>
      </g>
      <g opacity={ok}>
        <Mark x={BN.x + BN.w - 40} y={BN.y + 76} ok r={16} />
      </g>
    </KitScene>
  )
}
