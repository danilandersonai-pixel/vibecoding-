import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { KeyGlyph } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { L, PHONE_FONT, PHONE_SCALE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-check'
const STEPS = ['Заведите второго пользователя', 'Войдите под ним', 'Откройте чужой адрес: client/17', 'Должно быть пусто']
const X2 = L.board2 // левый край второй доски на холсте

// Сцена 5: «Проверьте у себя» — проверка, что делать, если чужое видно, и куда идти дальше.
// Первая доска — проверка; вторая (справа, камера переезжает) — исправление с агентом и секретный ключ.
export function S5CheckYourself() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const stepOn = [b(1), b(1) + 50, b(2), b(3)] // кадр, с которого шаг проверки горит
  const signedIn = useAppear(b(1) + 50)
  const url = typed('…/client/17', frame, b(2) + 20, 20)
  const result = useAppear(b(3))
  const leakCard = useAppear(b(3) + 80) * (frame < b(7) ? 1 : 0)
  const rlsOff = useAppear(b(4) + 90)
  const rlsOn = useAppear(b(5) + 100)
  const secret = useAppear(b(6))
  const onServer = useAppear(b(6) + 60)
  const notInPage = useAppear(b(6) + 110)
  const book = useAppear(b(7) + 20)
  const bookPrompt = typed(' · запрос «Проверь безопасность базы»', frame, b(7) + 60, 30)
  const mentor = useAppear(b(8))
  const command = typed('/mentor 4', frame, b(8) + 12, 15)

  // Марина ждёт результата → рада пустому списку → «видно чужое» — удивлена → рада наставнику
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2), ['think', 'neutral']],
    [b(3) + 10, ['cheer', 'happy']],
    [b(3) + 80, ['surprised', 'worried']],
    [b(7), ['stand', 'happy']],
    [b(8) + 50, ['cheer', 'happy']],
  ])
  // агент создаёт таблицу, затем по просьбе включает RLS
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(4) + 20, 'working'],
    [b(4) + 80, 'idle'],
    [b(5) + 30, 'working'],
    [b(5) + 100, 'done'],
  ])

  return (
    <KitScene chip="5 / 5 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: проверка за две минуты */}
      <g opacity={useAppear(b(0))}>
        <Label x={90} y={120} anchor="start" size={40} weight={700}>
          Проверка за 2 минуты
        </Label>
      </g>
      {STEPS.map((s, i) => {
        const on = frame >= stepOn[i]
        return (
          <g key={s} opacity={on ? 1 : 0.15}>
            <circle cx={112} cy={190 + i * 66} r={22} fill={on ? (i === 3 ? theme.ok : theme.accent) : theme.grid} />
            <Label x={112} y={198 + i * 66} size={22} color="#fff" weight={700}>
              {i === 3 && result > 0.5 ? '✓' : String(i + 1)}
            </Label>
            <Label x={150} y={198 + i * 66} anchor="start" size={26} weight={500}>
              {s}
            </Label>
          </g>
        )
      })}
      <Phone x={900} y={290} scale={PHONE_SCALE} enterAt={b(0) + 6}>
        <rect x={-50} y={-86} width={100} height={22} rx={5} fill={theme.codeBg} />
        <text x={-45} y={-70} style={{ font: `500 ${PHONE_FONT}px ${theme.mono}` }} fill={theme.ink}>
          {url}
        </text>
        <g opacity={signedIn}>
          <text x={-45} y={-46} style={{ font: `500 ${PHONE_FONT}px ${theme.font}` }} fill={theme.soft}>
            вы: второй
          </text>
        </g>
        <g opacity={result}>
          <text y={4} textAnchor="middle" style={{ font: `700 26px ${theme.mono}` }} fill={theme.ok}>
            [ ]
          </text>
          <text y={30} textAnchor="middle" style={{ font: `500 ${PHONE_FONT}px ${theme.font}` }} fill={theme.soft}>
            нет записей
          </text>
        </g>
      </Phone>
      <Coach x={1140} y={320} scale={0.9} color={theme.accent} label="Марина" enterAt={b(0) + 12} pose={marina[0]} mood={marina[1]} />
      <g opacity={leakCard}>
        <Card x={90} y={450} w={700} h={64} stroke={theme.risk} fill={theme.riskTint}>
          <Label x={112} y={490} anchor="start" size={22} color={theme.risk}>
            видно чужое → RLS выключен или правило неверное
          </Label>
        </Card>
      </g>
      <g opacity={book}>
        <Card x={90} y={470} w={640} h={64} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={112} y={511} anchor="start" size={21} color={theme.accent}>
            Книга, гл. 7{bookPrompt}
          </Label>
        </Card>
      </g>
      <g opacity={mentor}>
        <Card x={760} y={470} w={240} h={64} fill={theme.codeBg} stroke={theme.line}>
          <text x={782} y={511} style={{ font: `600 24px ${theme.mono}` }} fill={theme.ink}>
            {command}
          </text>
        </Card>
      </g>

      {/* доска 2: таблица из SQL без RLS → просьба агенту → секретный ключ */}
      <Terminal x={X2 + 60} y={80} w={600} at={b(4) + 20} lines={[{ text: 'create table workouts (…);', kind: 'cmd' }, { text: 'CREATE TABLE', kind: 'out' }]} />
      <Agent x={X2 + 780} y={190} pose={agent} enterAt={b(4) + 10} />
      <g opacity={rlsOff}>
        <Card x={X2 + 880} y={150} w={280} h={60} stroke={rlsOn > 0.5 ? theme.ok : theme.risk} fill={rlsOn > 0.5 ? theme.okTint : theme.riskTint}>
          <Label x={X2 + 1020} y={189} size={24} color={rlsOn > 0.5 ? theme.ok : theme.risk} weight={700}>
            {rlsOn > 0.5 ? 'RLS: включён ✓' : 'RLS: выключен'}
          </Label>
        </Card>
      </g>
      <AgentChat
        x={X2 + 60}
        y={234}
        w={600}
        at={b(5)}
        messages={[
          { from: 'me', text: 'Включи RLS для таблицы workouts и добавь политику: строку видит только владелец' },
          { from: 'agent', text: 'Готово: RLS включён, политика добавлена. Проверь вторым пользователем.' },
        ]}
      />
      <g opacity={secret}>
        <Card x={X2 + 700} y={360} w={400} h={160} stroke={theme.risk}>
          <KeyGlyph x={X2 + 750} y={400} color={theme.risk} scale={1.3} />
          <Label x={X2 + 800} y={409} anchor="start" size={26} color={theme.risk} weight={700}>
            секретный ключ
          </Label>
          <Label x={X2 + 740} y={444} anchor="start" size={20} color={theme.soft} weight={500}>
            обходит все правила RLS
          </Label>
          <g opacity={onServer}>
            <Label x={X2 + 740} y={476} anchor="start" size={22} color={theme.ok} weight={600}>
              место — только на сервере
            </Label>
          </g>
          <g opacity={notInPage}>
            <Label x={X2 + 740} y={506} anchor="start" size={22} color={theme.risk} weight={600}>
              в коде страницы — никогда
            </Label>
          </g>
        </Card>
      </g>
      <g opacity={onServer}>
        <Server x={X2 + 1180} y={420} scale={0.6} />
      </g>
    </KitScene>
  )
}
