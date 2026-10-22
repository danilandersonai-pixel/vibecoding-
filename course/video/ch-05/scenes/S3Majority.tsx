import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { KeyGlyph, Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Editor } from '../../kit/screens/Editor'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's3-majority'
const CH = S3.chart
const CD = S3.cards

// варианты одной задачи и как часто они встречались при обучении (высота столбика)
const BARS = [
  { label: ['целая', 'библиотека'], h: 196, color: theme.alt },
  { label: ['старый', 'способ'], h: 140, color: theme.line },
  { label: ['сам', 'язык'], h: 56, color: theme.ok },
]
// три проявления «решения большинства»
const CARDS = [
  { title: 'Устаревший способ', text: 'старых примеров больше' },
  { title: 'Тяжёлая библиотека', text: 'для даты хватит языка' },
  { title: 'Учебный вход', text: 'попытка №' },
]
const RULES = ['# Правила проекта', '- Даты: только средства языка', '- Сеть: встроенный способ', '- Версия: Next.js 16, App Router']

// Сцена 3: «решение большинства» (s30). ИИ берёт то, что чаще встречал при обучении, — это
// предсказуемо, но не всегда подходит. Примеры и как с этим работать: правила, версии, три подхода.
export function S3Majority() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // столбики растут по очереди, агент выбирает самый высокий
  const barGrow = BARS.map((_, i) => grow(frame, b(0) + 20 + i * 10, 24))
  const pick = interpolate(frame, [b(0) + 80, b(0) + 96], [0, 1], CLAMP)
  const picked = appear(frame, b(0) + 96)
  const fit = appear(frame, b(1) + 40)
  const notEq = appear(frame, b(1) + 80)
  const cardAt = [b(2) + 30, b(2) + 96, b(3) + 10]
  const attempts = Math.min(999, Math.max(1, Math.floor((frame - (b(3) + 30)) / 2)))
  const keyOld = appear(frame, b(3) + 90)

  // доска 2: правила проекта, три подхода на выбор
  const verHi = appear(frame, b(4) + 70)
  const choose = appear(frame, b(4) + 140)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(0) + 80, 'done'],
    [b(1) + 30, 'idle'],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 60, ['think', 'neutral']],
    [b(4) + 136, ['point', 'happy']],
  ])

  return (
    <KitScene chip="3 / 7 · Решение большинства" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* агент и столбики: что чаще встречалось при обучении */}
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.85} enterAt={0} pose={agent} />
      <Card x={CH.x} y={CH.y} w={CH.w} h={CH.h} stroke={theme.line}>
        <Label x={CH.x + CH.w / 2} y={CH.y + 40} size={22} weight={700}>
          Что чаще встречалось
        </Label>
        <line x1={CH.x + 30} y1={S3.baseY} x2={CH.x + CH.w - 30} y2={S3.baseY} stroke={theme.ink} strokeWidth={3} />
        {BARS.map((bar, i) => {
          const x = S3.barXs[i]
          const h = bar.h * barGrow[i]
          return (
            <g key={bar.label[1]}>
              <rect x={x - S3.barW / 2} y={S3.baseY - h} width={S3.barW} height={h} rx={8} fill={bar.color} opacity={i === 0 ? 0.85 : 0.7} />
              {bar.label.map((l, j) => (
                <Label key={l} x={x} y={S3.baseY + 26 + j * 22} size={18} weight={600} color={theme.soft}>
                  {l}
                </Label>
              ))}
            </g>
          )
        })}
      </Card>
      <Arrow x1={S3.agent.x + 60} y1={S3.agent.y - 70} x2={S3.barXs[0] - S3.barW / 2 - 8} y2={S3.baseY - BARS[0].h + 30} color={theme.alt} draw={pick} />
      <g opacity={picked}>
        <Pill x={S3.barXs[0]} y={S3.baseY - BARS[0].h - 26} text="берёт это" color={theme.alt} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={fit}>
        <circle cx={S3.barXs[2]} cy={S3.baseY - BARS[2].h - 46} r={30} fill={theme.paper} stroke={theme.ok} strokeWidth={4} />
        <circle cx={S3.barXs[2]} cy={S3.baseY - BARS[2].h - 46} r={18} fill="none" stroke={theme.ok} strokeWidth={4} />
        <circle cx={S3.barXs[2]} cy={S3.baseY - BARS[2].h - 46} r={6} fill={theme.ok} />
        <Pill x={S3.barXs[2]} y={S3.baseY - BARS[2].h - 102} text="ваш случай" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={notEq}>
        <Pill x={CH.x + CH.w / 2} y={CH.y - 30} text="частое ≠ подходящее" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>

      {/* три проявления */}
      {CARDS.map((c, i) => {
        const g = appear(frame, cardAt[i])
        const y = CD.y + i * (CD.h + CD.gap)
        return (
          <g key={c.title} opacity={g} transform={`translate(${(1 - g) * 20} 0)`}>
            <Card x={CD.x} y={y} w={CD.w} h={CD.h} stroke={theme.risk}>
              <Label x={CD.x + 24} y={y + 42} anchor="start" size={22} weight={700}>
                {c.title}
              </Label>
              <Label x={CD.x + 24} y={y + 82} anchor="start" size={20} weight={500} color={theme.soft}>
                {i === 2 ? `${c.text} ${attempts}` : c.text}
              </Label>
            </Card>
            <Mark x={CD.x + CD.w - 36} y={y + 36} ok={false} r={16} />
            {i === 2 && (
              <g opacity={keyOld}>
                <KeyGlyph x={CD.x + 216} y={y + 76} color={theme.alt} />
                <Label x={CD.x + 254} y={y + 82} anchor="start" size={20} weight={600} color={theme.alt}>
                  ключ навсегда
                </Label>
              </g>
            )}
          </g>
        )
      })}

      {/* доска 2: правила проекта и три подхода */}
      {frame >= b(4) && <Editor x={S3.rules.x} y={S3.rules.y} w={S3.rules.w} at={b(4)} file="CLAUDE.md" lines={RULES} highlight={frame >= b(4) + 60 ? [4] : []} />}
      <g opacity={verHi}>
        <Pill x={S3.rules.x + S3.rules.w / 2} y={S3.rules.y + 250} text="версия отсекает старые примеры" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {frame >= b(4) + 16 && (
        <AgentChat
          x={S3.chat.x}
          y={S3.chat.y}
          w={S3.chat.w}
          at={b(4) + 16}
          messages={[
            { from: 'me', text: 'Дай три подхода с плюсами и минусами' },
            { from: 'agent', text: 'А — библиотека: быстро, но тяжело. Б — средства языка: легко. В — сервер: сложнее.' },
          ]}
        />
      )}
      <Actor x={S3.you.x} y={S3.you.y} scale={0.8} label="Вы" enterAt={b(4) + 20}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={choose}>
        <Pill x={S3.you.x - 200} y={S3.you.y - 20} text="выбираю Б" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
    </KitScene>
  )
}
