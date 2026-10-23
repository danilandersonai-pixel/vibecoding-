import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Checklist } from '../../kit/screens/Checklist'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's6-ai'
const PROMPT = 'Добавь Анне график жима'
// кусочки, на которые модель режет запрос (для наглядности)
const TOKENS = ['Доб', 'авь', ' Ан', 'не', ' граф', 'ик', ' жи', 'ма']
const TOKEN_W = TOKENS.map((t) => t.trim().length * 13 + 22)
// левый край каждого кусочка в ряду (от левого края ряда)
const TOKEN_X = TOKEN_W.map((_, i) => TOKEN_W.slice(0, i).reduce((s, w) => s + w + 4, 0))
const CHAT: ChatMessage[] = [
  { from: 'me', text: PROMPT },
  { from: 'agent', text: 'Читаю workout.ts и chart.ts…' },
]
const ACTS: { line: TermLine; at: number }[] = [
  { line: { text: 'читаю workout.ts', kind: 'out' }, at: 20 },
  { line: { text: 'читаю chart.ts', kind: 'out' }, at: 45 },
  { line: { text: 'npm test', kind: 'cmd' }, at: 70 },
  { line: { text: '✓ правлю chart.ts', kind: 'ok' }, at: 110 },
]
const FILES = [
  { name: 'workout.ts', w: 136, mono: true },
  { name: 'CLAUDE.md', w: 126, mono: true },
  { name: 'история чата', w: 150, mono: false },
]
const PLUGS = ['календарь', 'база данных', 'браузер']

// Плашка файла в контексте; (x, y) — левый верхний угол.
function FileChip({ x, y, w, name, mono, dim }: { x: number; y: number; w: number; name: string; mono: boolean; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.45 : 1}>
      <rect x={x} y={y} width={w} height={40} rx={8} fill={theme.paper} stroke={dim ? theme.line : theme.accent} strokeWidth={2} strokeDasharray={dim ? '6 5' : undefined} />
      <text x={x + w / 2} y={y + 27} textAnchor="middle" fill={theme.ink} style={{ font: `500 18px ${mono ? theme.mono : theme.font}` }}>
        {name}
      </text>
    </g>
  )
}

// Сцена 6: слова про ИИ — модель, промпт, контекст, токены, агент, галлюцинация, MCP — и итог Азбуки.
export function S6Ai() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const X = S6.context

  const models = [b(0) + 50, b(0) + 62, b(0) + 74]
  const modelCard = useAppear(b(0)) * interpolate(frame, [b(4) - 10, b(4)], [1, 0], CLAMP)
  const promptTag = useAppear(b(0) + 140)
  const context = useAppear(b(1))
  const chips = [b(1) + 20, b(1) + 30, b(1) + 40]
  const notSeen = useAppear(b(1) + 80) * interpolate(frame, [b(3) + 30, b(3) + 40], [1, 0], CLAMP)
  // агент прочитал chart.ts — файл переезжает в контекст
  const chart = useTrack([
    [b(3) + 40, S6.outside.x, S6.outside.y],
    [b(3) + 65, X.x + 20, S6.chipsY[1]],
  ])
  const tokens = useAppear(b(2)) * interpolate(frame, [b(4) - 10, b(4)], [1, 0], CLAMP)
  const split = interpolate(frame, [b(2) + 35, b(2) + 55], [0, 1], CLAMP)
  const price = useAppear(b(2) + 70)
  const acts = ACTS.filter((a) => frame >= b(3) + a.at).map((a) => a.line)
  const fake = useAppear(b(4) + 10)
  const stamp = useAppear(b(4) + 75)
  const mcp = useAppear(b(5) + 5)
  const cables = [b(5) + 20, b(5) + 35, b(5) + 50].map((at) => interpolate(frame, [at, at + 20], [0, 1], CLAMP))
  // итог: остальное приглушается, поверх — чек-лист Азбуки
  const rest = interpolate(frame, [b(6), b(6) + 15], [1, 0.1], CLAMP)
  const next = useAppear(b(6) + 90)

  // ждёт → отвечает → работает → уверенно «выдумывает» → подключён к инструментам → готово
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3), 'working'],
    [b(3) + 125, 'done'],
    [b(4) + 75, 'idle'],
    [b(5) + 70, 'done'],
    [b(6), 'done'],
  ])

  // ответ агента приходит на b(3) + 14; первое сообщение к этому кадру уже на месте
  const chatAt = frame < b(3) ? b(0) + 110 : b(3) - 20
  const chat = frame < b(3) ? CHAT.slice(0, 1) : CHAT

  return (
    <KitScene chip="6 / 6 · Слова про ИИ" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <g opacity={rest}>
        {/* модель */}
        <g opacity={modelCard}>
          <Card x={S6.model.x} y={S6.model.y} w={S6.model.w} h={S6.model.h}>
            <Label x={S6.model.x + 20} y={S6.model.y + 34} anchor="start" size={22} color={theme.soft} weight={600}>
              модель
            </Label>
            {['Claude', 'GPT', 'Gemini'].map((m, i) => (
              <g key={m} opacity={interpolate(frame, [models[i], models[i] + 10], [0, 1], CLAMP)}>
                <Pill x={S6.model.x + S6.model.w / 2} y={S6.model.y + 74 + i * 46} w={180} text={m} />
              </g>
            ))}
          </Card>
        </g>

        {/* галлюцинация: уверенная выдумка */}
        <g opacity={fake}>
          <Card x={S6.model.x} y={S6.model.y} w={S6.model.w} h={150} stroke={theme.risk}>
            <Label x={S6.model.x + 20} y={S6.model.y + 40} anchor="start" size={22} weight={500}>
              Вызову готовую
            </Label>
            <text x={S6.model.x + 20} y={S6.model.y + 78} style={{ font: `600 22px ${theme.mono}` }} fill={theme.ink}>
              saveAllSets()
            </text>
          </Card>
          <path d={`M${S6.agent.x - 20} ${S6.model.y + 150} L${S6.agent.x - 4} ${S6.model.y + 184} L${S6.agent.x + 16} ${S6.model.y + 150}`} fill={theme.paper} stroke={theme.risk} strokeWidth={3} />
          <g opacity={stamp} transform={`rotate(-6 ${S6.model.x + 130} ${S6.model.y + 118})`}>
            <rect x={S6.model.x + 14} y={S6.model.y + 96} width={232} height={40} rx={6} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
            <Label x={S6.model.x + 130} y={S6.model.y + 123} size={20} color={theme.risk} weight={700}>
              такой функции нет
            </Label>
          </g>
        </g>

        {/* контекст: что агент видит сейчас */}
        <g opacity={context}>
          <rect x={X.x} y={X.y} width={X.w} height={X.h} rx={18} fill="none" stroke={theme.accent} strokeWidth={3} strokeDasharray="12 8" />
          <Label x={X.x + 20} y={X.y + X.h - 12} anchor="start" size={22} color={theme.accent} weight={700}>
            контекст
          </Label>
        </g>
        {FILES.map((f, i) => {
          const x = X.x + 20 + FILES.slice(0, i).reduce((s, p) => s + p.w + 14, 0)
          return (
            <g key={f.name} opacity={interpolate(frame, [chips[i], chips[i] + 10], [0, 1], CLAMP)}>
              <FileChip x={x} y={S6.chipsY[0]} w={f.w} name={f.name} mono={f.mono} />
            </g>
          )
        })}
        <g opacity={useAppear(b(1) + 60)}>
          <FileChip x={chart.x} y={chart.y} w={120} name="chart.ts" mono dim={frame < b(3) + 65} />
        </g>
        <g opacity={notSeen}>
          <Label x={S6.outside.x + 60} y={S6.outside.y + 66} size={20} color={theme.soft} weight={600}>
            не видит
          </Label>
        </g>
        {frame >= b(0) + 100 && <AgentChat x={S6.chat.x} y={S6.chat.y} w={S6.chat.w} at={chatAt} messages={chat} />}
        <g opacity={promptTag}>
          <Pill x={X.x + 100} y={S6.chat.y + 82} w={150} text="промпт" size={20} color={theme.accent} fill={theme.accentTint} />
        </g>

        {/* токены */}
        <g opacity={tokens}>
          {TOKENS.map((t, i) => {
            const w = TOKEN_W[i]
            const x = X.x + 20 + TOKEN_X[i]
            const shift = i * 8 * split
            return (
              <g key={t} transform={`translate(${shift} 0)`}>
                <rect x={x} y={S6.tokensY} width={w} height={40} rx={split > 0 ? 8 : 0} fill={theme.altTint} stroke={split > 0 ? theme.alt : 'none'} strokeWidth={2} />
                <text x={x + w / 2} y={S6.tokensY + 27} textAnchor="middle" fill={theme.ink} style={{ font: `500 22px ${theme.font}` }}>
                  {t.trim()}
                </text>
              </g>
            )
          })}
          {/* кусочки — для наглядности, настоящий токенизатор режет иначе */}
          <g opacity={split}>
            <Label x={X.x + X.w - 20} y={S6.tokensY + 74} anchor="end" size={18} color={theme.soft} weight={600}>
              условно
            </Label>
          </g>
          <g opacity={price}>
            <Label x={X.x + 20} y={S6.tokensY + 74} anchor="start" size={20} color={theme.alt} weight={600}>
              токены: в них считают цену и лимиты
            </Label>
          </g>
        </g>

        {/* агент действует сам */}
        {frame >= b(3) && <Terminal x={S6.term.x} y={S6.term.y} w={S6.term.w} at={b(3) + 8} lines={acts} />}

        {/* MCP: разъём для внешних инструментов */}
        <g opacity={mcp}>
          <Card x={S6.mcp.x} y={S6.mcp.y} w={S6.mcp.w} h={S6.mcp.h} stroke={theme.accent}>
            <Label x={S6.mcp.x + 20} y={S6.mcp.y + 36} anchor="start" size={22} weight={700}>
              MCP — разъём
            </Label>
            {PLUGS.map((p, i) => {
              const y = S6.mcp.y + 56 + i * 50
              return (
                <g key={p} opacity={cables[i] > 0 ? 1 : 0.35}>
                  <rect x={S6.mcp.x + 20} y={y + 6} width={30} height={26} rx={5} fill={theme.accent} />
                  <path d={`M${S6.mcp.x + 50} ${y + 13} h10 M${S6.mcp.x + 50} ${y + 25} h10`} stroke={theme.accent} strokeWidth={4} />
                  <Label x={S6.mcp.x + 76} y={y + 27} anchor="start" size={22} weight={500}>
                    {p}
                  </Label>
                </g>
              )
            })}
          </Card>
        </g>
        {PLUGS.map((p, i) => {
          const y = S6.mcp.y + 75 + i * 50
          return (
            <path
              key={p}
              d={`M${S6.agent.x + 50} ${S6.agent.y + 10} C ${S6.agent.x + 300} ${S6.agent.y + 120}, ${S6.mcp.x - 200} ${y + 40}, ${S6.mcp.x + 20} ${y}`}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - cables[i]}
              fill="none"
              stroke={theme.accent}
              strokeWidth={3}
            />
          )
        })}
      </g>

      <Agent x={S6.agent.x} y={S6.agent.y} scale={0.95} enterAt={b(0) + 10} pose={agent} />

      {/* итог Азбуки */}
      {frame >= b(6) && <Checklist x={340} y={110} w={600} at={b(6) + 10} items={['четыре части приложения', 'Git: репозиторий и коммит', 'локально → продакшен', 'Console и текст ошибки']} done={4} />}
      <g opacity={next}>
        <Pill x={640} y={392} w={460} text="дальше — как работать с ИИ" size={26} color={theme.accent} fill={theme.paper} />
      </g>
    </KitScene>
  )
}
