import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Phone } from '../../actors/Phone'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, PhoneScreen } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { terminalStarts, type TermLine } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { PHONE_SCALE, S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Say } from './parts'

const ID = 's4-loop'
const M = S4.msg

// команды чистого контекста — парами «команда → ответ»
const TERM: TermLine[] = [
  { text: '/clear', kind: 'cmd' },
  { text: 'контекст пуст — новый разговор', kind: 'ok' },
  { text: '/compact', kind: 'cmd' },
  { text: 'история сжата в краткую выжимку', kind: 'out' },
  { text: '/context', kind: 'cmd' },
  { text: 'видно, чем занят стол модели', kind: 'out' },
]
const RULES = ['# Правила проекта', '- Запуск: npm run dev', '- Проверка: npm test']
const TRAP = '- Вес подхода — число, не строка'
// хороший отзыв: что сделали, чего ждали, что вышло
const REPORT = [
  { tag: 'Сделал:', text: 'нажал «Сохранить»' },
  { tag: 'Ждал:', text: 'подход в списке' },
  { tag: 'Вышло:', text: 'белый экран' },
]
const ERROR = ['TypeError: sets is', 'undefined, save.ts:14']
const OPTIONS = ['разбить задачу', 'дать пример', 'сменить модель']

type Pt = { x: number; y: number }
const mid = (r: { x: number; y: number; w: number; h: number }): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

// Сцена 4: цикл уточнения (рис. 2.4): запрос → результат → проверка → готово? Нет — уточнить
// новыми сведениями, да — принять. Хороший отзыв, правило двух попыток, чистый контекст, запись в правила.
export function S4Loop() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const REQ = mid(S4.req)
  const RES = mid(S4.res)
  const CHK = mid(S4.chk)
  const DEC = { x: S4.dec.x, y: S4.dec.y }
  const ACC = { x: S4.accept.x, y: S4.accept.y }

  // узлы круга и стрелки
  const nodeIn = [b(0) + 4, b(0) + 18, b(0) + 32, b(0) + 46].map((at) => appear(frame, at))
  const arrows = [b(0) + 14, b(0) + 28, b(0) + 42, b(0) + 58].map((at) => interpolate(frame, [at, at + 12], [0, 1], CLAMP))
  const yes = interpolate(frame, [b(1) + 30, b(1) + 42], [0, 1], CLAMP)

  // фишка бежит по кругу: два раза «нет», третий — «да»
  type K = [number, number, number]
  const loop = (t0: number, step: number): K[] => [
    [t0, REQ.x, REQ.y],
    [t0 + step, RES.x, RES.y],
    [t0 + 2 * step, CHK.x, CHK.y],
    [t0 + 3 * step, DEC.x, DEC.y],
  ]
  const token = useTrack([...loop(b(0) + 80, 25), [b(0) + 180, REQ.x, REQ.y], ...loop(b(1) + 10, 24), [b(1) + 110, REQ.x, REQ.y], ...loop(b(2) + 100, 18), [b(2) + 176, ACC.x, ACC.y - 2]])
  const tokenIn = useAppear(b(0) + 76)
  const noFlash = (frame >= b(0) + 160 && frame < b(0) + 190) || (frame >= b(1) + 86 && frame < b(1) + 120)
  const accepted = frame >= b(2) + 176

  // новые сведения вместо «громче»
  const louder = useAppear(b(2) + 8) * interpolate(frame, [b(3) - 10, b(3)], [1, 0], CLAMP)
  const louderX = useAppear(b(2) + 40)
  const chipAt = [b(2) + 64, b(2) + 92]

  // отзыв с телефона
  const tapAt = b(3) + 24
  const blank = useAppear(b(3) + 34, 6)
  const bad = useAppear(b(3) + 10)
  const badX = useAppear(b(3) + 40)
  const good = useAppear(b(3) + 46)
  const reportAt = REPORT.map((_, i) => b(3) + 56 + i * 24)
  const errorAt = b(3) + 132

  // две попытки без сдвига → сменить подход
  const tries = [b(4) + 10, b(4) + 34]
  const toChange = interpolate(frame, [b(4) + 52, b(4) + 66], [0, 1], CLAMP)
  const change = useAppear(b(4) + 62)
  const optAt = OPTIONS.map((_, i) => b(4) + 84 + i * 22)

  // доска 2: команды по одной паре; at подобран так, чтобы новая команда начиналась на своём кадре
  const stages = [b(5) + 26, b(5) + 54, b(5) + 82]
  const stage = stepAt(frame, [[0, 0], ...stages.map((at, i) => [at, i + 1] as [number, number])])
  const lines = TERM.slice(0, stage * 2)
  const termAt = stage === 0 ? stages[0] : stages[stage - 1] - terminalStarts(TERM, 0)[(stage - 1) * 2]
  const brief = useAppear(b(5) + 130)
  const trapAt = b(6) + 24
  const trapRule = useAppear(b(6) + 70)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(6) + 96, 'working'],
    [b(6) + 140, 'done'],
  ])
  const reads = interpolate(frame, [b(6) + 84, b(6) + 98], [0, 1], CLAMP)

  const node = (r: { x: number; y: number; w: number; h: number }, text: string, i: number, hot: boolean) => (
    <g opacity={nodeIn[i]}>
      {/* подложка непрозрачная: фишка под узлом не просвечивает сквозь подсветку */}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={14} fill={theme.paper} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={14} fill={hot ? theme.accentTint : theme.paper} stroke={theme.accent} strokeWidth={3} />
      <Label x={r.x + r.w / 2} y={r.y + r.h / 2 + 8} size={22} weight={700}>
        {text}
      </Label>
    </g>
  )
  const near = (p: Pt) => Math.hypot(token.x - p.x, token.y - p.y) < 30 && tokenIn > 0
  const D = S4.dec
  const diamond = `M${D.x} ${D.y - D.h / 2} L${D.x + D.w / 2} ${D.y} L${D.x} ${D.y + D.h / 2} L${D.x - D.w / 2} ${D.y} Z`

  return (
    <KitScene chip="4 / 6 · Круг уточнений" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* фишка едет по стрелкам и прячется под узлом, в который вошла */}
      <circle cx={token.x} cy={token.y} r={11} fill={theme.alt} stroke={theme.paper} strokeWidth={3} opacity={tokenIn * (accepted ? 0 : 1)} />

      {/* круг: запрос → результат → проверка → готово? */}
      {node(S4.req, 'Запрос', 0, near(REQ))}
      {node(S4.res, 'Результат ИИ', 1, near(RES))}
      {node(S4.chk, 'Проверка', 2, near(CHK))}
      <g opacity={nodeIn[3]}>
        <path d={diamond} fill={theme.paper} />
        <path d={diamond} fill={near(DEC) ? theme.altTint : theme.paper} stroke={theme.alt} strokeWidth={3} strokeLinejoin="round" />
        <Label x={D.x} y={D.y + 8} size={22} weight={700}>
          Готово?
        </Label>
      </g>
      <Arrow x1={S4.req.x + S4.req.w + 4} y1={REQ.y} x2={S4.res.x - 6} y2={RES.y} color={theme.accent} draw={arrows[0]} />
      <Arrow x1={RES.x} y1={S4.res.y + S4.res.h + 4} x2={CHK.x} y2={S4.chk.y - 6} color={theme.accent} draw={arrows[1]} />
      <Arrow x1={S4.chk.x - 4} y1={CHK.y} x2={D.x + D.w / 2 + 6} y2={D.y} color={theme.accent} draw={arrows[2]} />
      <Arrow x1={D.x} y1={D.y - D.h / 2 - 4} x2={REQ.x} y2={S4.req.y + S4.req.h + 6} color={theme.risk} draw={arrows[3]} />
      <g opacity={arrows[3]}>
        <Label x={D.x + 14} y={236} anchor="start" size={20} color={theme.risk} weight={noFlash ? 800 : 600}>
          нет
        </Label>
      </g>
      <Arrow x1={D.x} y1={D.y + D.h / 2 + 4} x2={ACC.x} y2={ACC.y - 26} color={theme.ok} draw={yes} />
      <g opacity={yes}>
        <Label x={D.x + 14} y={D.y + D.h / 2 + 26} anchor="start" size={20} color={theme.ok} weight={accepted ? 800 : 600}>
          да
        </Label>
        <Pill x={ACC.x} y={ACC.y} text="Принять: коммит и правила" color={theme.ok} fill={accepted ? theme.okTint : theme.paper} size={20} compact />
      </g>

      {/* каждый круг — новые сведения, а не просьба громче */}
      <g opacity={louder}>
        <Say x={S4.louder.x} y={S4.louder.y} text="Сделай нормально!" tail="left" color={theme.risk} />
        <g opacity={louderX}>
          <line x1={S4.louder.x - 118} y1={S4.louder.y} x2={S4.louder.x + 118} y2={S4.louder.y} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
          <Pill x={S4.louder.x} y={S4.louder.y - 52} text="громче — не поможет" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>
      {['+ лог ошибки', '+ пример'].map((t, i) => (
        <g key={t} opacity={appear(frame, chipAt[i])} transform={`translate(0 ${(1 - appear(frame, chipAt[i])) * 10})`}>
          <Pill x={S4.chipX} y={S4.chipY[i]} text={t} color={theme.accent} fill={theme.accentTint} size={20} compact />
        </g>
      ))}

      {/* отзыв: телефон с белым экраном и два письма */}
      <Phone x={S4.phone.x} y={S4.phone.y} scale={PHONE_SCALE} enterAt={b(3) - 4}>
        <PhoneScreen tapAt={tapAt} listAt={b(3)} list={['жим 50 × 10']} label="Сохранить">
          <rect x={-54} y={-92} width={108} height={184} rx={6} fill={theme.white} opacity={blank} />
        </PhoneScreen>
      </Phone>
      <g opacity={blank}>
        <Pill x={S4.phone.x} y={512} text="белый экран" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={bad * (1 - badX * 0.5)}>
        <Card x={M.x} y={M.y} w={M.w} h={58} stroke={theme.risk}>
          <Label x={M.x + 20} y={M.y + 37} anchor="start" size={22} weight={700}>
            «Не работает»
          </Label>
        </Card>
      </g>
      <g opacity={badX}>
        <Mark x={M.x + M.w - 30} y={M.y + 29} ok={false} />
      </g>
      <g opacity={good}>
        <Card x={M.x} y={M.y + 78} w={M.w} h={330} stroke={theme.ok}>
          {REPORT.map((r, i) => (
            <g key={r.tag} opacity={appear(frame, reportAt[i])}>
              <Label x={M.x + 20} y={M.y + 112 + i * 62} anchor="start" size={18} color={theme.soft} weight={600}>
                {r.tag}
              </Label>
              <Label x={M.x + 20} y={M.y + 138 + i * 62} anchor="start" size={20} weight={600}>
                {r.text}
              </Label>
            </g>
          ))}
          <g opacity={appear(frame, errorAt)}>
            <Label x={M.x + 20} y={M.y + 298} anchor="start" size={18} color={theme.soft} weight={600}>
              Ошибка целиком:
            </Label>
            <rect x={M.x + 12} y={M.y + 308} width={M.w - 24} height={60} rx={8} fill={theme.riskTint} />
            {ERROR.map((e, i) => (
              <text key={e} x={M.x + 22} y={M.y + 332 + i * 26} fill={theme.risk} style={{ font: `500 18px ${theme.mono}` }}>
                {e}
              </text>
            ))}
          </g>
        </Card>
      </g>
      <g opacity={appear(frame, errorAt + 14)}>
        <Mark x={M.x + M.w - 30} y={M.y + 108} ok />
      </g>

      {/* две попытки без сдвига → сменить подход */}
      {tries.map((at, i) => (
        <g key={at} opacity={appear(frame, at)}>
          <Mark x={D.x - 34} y={226 + i * 36} ok={false} />
          <Label x={D.x - 56} y={233 + i * 36} anchor="end" size={18} color={theme.risk} weight={600}>
            {`${i + 1}-я`}
          </Label>
        </g>
      ))}
      <Arrow x1={D.x + 70} y1={D.y + 40} x2={S4.change.x - 6} y2={S4.change.y + 40} color={theme.alt} dashed draw={toChange} />
      <g opacity={change}>
        <Card x={S4.change.x} y={S4.change.y} w={S4.change.w} h={S4.change.h} stroke={theme.alt}>
          <Label x={S4.change.x + 18} y={S4.change.y + 32} anchor="start" size={22} color={theme.alt} weight={700}>
            Сменить подход
          </Label>
          {OPTIONS.map((o, i) => (
            <g key={o} opacity={appear(frame, optAt[i])}>
              <Label x={S4.change.x + 18} y={S4.change.y + 68 + i * 30} anchor="start" size={20} weight={500}>
                {`• ${o}`}
              </Label>
            </g>
          ))}
        </Card>
      </g>

      {/* доска 2: чистый контекст и файл правил */}
      {stage > 0 && <Terminal x={S4.term.x} y={S4.term.y} w={S4.term.w} at={termAt} lines={lines} />}
      <g opacity={brief}>
        <Pill x={S4.term.x + S4.term.w / 2} y={420} text="кратко: что известно и что пробовали" color={theme.accent} size={20} compact />
      </g>
      {frame >= b(5) + 40 && <Editor x={S4.rules.x} y={S4.rules.y} w={S4.rules.w} at={b(5) + 40} file="CLAUDE.md" lines={[...RULES, frame >= trapAt ? typed(TRAP, frame, trapAt, 30) : '']} highlight={frame >= trapAt ? [4] : []} />}
      <g opacity={trapRule}>
        <Pill x={S4.rules.x + S4.rules.w / 2} y={330} text="ловушка найдена → правило" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <Arrow x1={S4.agent.x} y1={352} x2={S4.agent.x} y2={378} color={theme.accent} draw={reads} />
      {frame >= b(6) + 70 && <Agent x={S4.agent.x} y={S4.agent.y} scale={0.7} label="Новая сессия" enterAt={b(6) + 70} pose={agent} />}
    </KitScene>
  )
}
