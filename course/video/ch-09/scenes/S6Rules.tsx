import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Badge, Lock } from './parts'

const ID = 's6-rules'
const C = S6.cols
const R = S6.recap

// три группы правил (рис. 9.6) и правила в них; tie — пример из приложения тренера
const GROUPS = [
  { title: 'Ваша ответственность', color: theme.accent },
  { title: 'Люди и их данные', color: theme.ok },
  { title: 'Право и честность', color: theme.alt },
]
const RULES = [
  { n: 1, col: 0, row: 0, title: ['Ответственность', 'не делегируется'], tie: 'отвечает принявший' },
  { n: 2, col: 0, row: 1, title: ['Понимай то,', 'что выпускаешь'], tie: 'у нас — данные о здоровье' },
  { n: 3, col: 1, row: 0, title: ['Защищай чужие данные'], tie: 'телефон Анны — по нужде' },
  { n: 4, col: 2, row: 0, title: ['Уважай лицензии'], tie: 'сканер лицензий в CI' },
  { n: 5, col: 2, row: 1, title: ['Будь честен о роли ИИ'], tie: 'Co-Authored-By' },
  { n: 6, col: 1, row: 1, title: ['Проверяй на разных людях'], tie: 'имя на любом языке' },
  { n: 7, col: 1, row: 2, title: ['Не автоматизируй вред'], tie: 'не «просто скрипт»' },
  { n: 8, col: 0, row: 2, title: ['Учись, а не только', 'получай'], tie: 'навык проверять ИИ' },
]
const RECAP = ['лицензии — проверяем', 'роль ИИ — называем', 'на разных людях — пробуем', 'отвечаем — сами']
const pillW = (t: string) => Math.round(t.length * 18 * 0.56 + 28)

// Сцена 6: восемь золотых правил в трёх группах — каждое появляется со своим примером из приложения;
// итог главы: лицензии, роль ИИ, разные люди, ответственность на человеке.
export function S6Rules() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // когда появляется правило i (по репликам: 1, 2, 3, 4 и 5, 6, 7, 8) и его пример
  const ruleAt = [b(0) + 50, b(1) + 10, b(2) + 16, b(3) + 10, b(3) + 80, b(4) + 10, b(5) + 10, b(6) + 10]
  const tieAt = [b(0) + 110, b(1) + 70, b(2) + 90, b(3) + 40, b(3) + 110, b(4) + 60, b(5) + 80, b(6) + 40]
  const colAt = [4, 12, b(2) + 20]

  const recap = useAppear(b(7) + 10)
  const recapAt = RECAP.map((_, i) => b(7) + 30 + i * 26)
  const tool = useAppear(b(7) + 100)
  const owner = useAppear(b(7) + 124)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(7) + 124, ['point', 'happy']],
  ])

  return (
    <KitScene chip="6 / 6 · Золотые правила" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* три колонки */}
      {GROUPS.map((g, i) => (
        <g key={g.title} opacity={appear(frame, colAt[i])}>
          <Card x={C.x[i]} y={C.y} w={C.w} h={C.h} stroke={g.color} fill={theme.white}>
            <Label x={C.x[i] + 22} y={C.y + 40} anchor="start" size={22} color={g.color} weight={800}>
              {g.title}
            </Label>
            <line x1={C.x[i] + 20} y1={C.y + C.head - 4} x2={C.x[i] + C.w - 20} y2={C.y + C.head - 4} stroke={theme.grid} strokeWidth={2} />
          </Card>
        </g>
      ))}

      {/* правила по одному, у каждого — пример */}
      {RULES.map((r, i) => (
        <Rule key={r.n} rule={r} at={ruleAt[i]} tieAt={tieAt[i]} color={GROUPS[r.col].color} />
      ))}
      {/* правило 3: данные под замком; правило 7: вреду — нет */}
      <g opacity={appear(frame, b(2) + 150)}>
        <Lock x={C.x[1] + 350} y={C.y + C.head + 70} color={theme.ok} scale={0.9} />
      </g>
      <g opacity={appear(frame, b(5) + 140)}>
        <Mark x={C.x[1] + 300} y={C.y + C.head + 2 * C.row + 70} ok={false} r={14} />
      </g>

      {/* доска 2: итог */}
      <g opacity={recap}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 36} y={R.y + 52} anchor="start" size={28} weight={800}>
            Итог главы
          </Label>
        </Card>
      </g>
      {RECAP.map((t, i) => (
        <g key={t} opacity={appear(frame, recapAt[i])}>
          <Mark x={R.x + 60 + (i % 2) * 540} y={R.y + 120 + Math.floor(i / 2) * 76} ok r={16} />
          <Label x={R.x + 92 + (i % 2) * 540} y={R.y + 128 + Math.floor(i / 2) * 76} anchor="start" size={24} weight={700}>
            {t}
          </Label>
        </g>
      ))}
      <Actor x={S6.you.x} y={S6.you.y} scale={0.8} label="Вы" enterAt={b(7) + 40}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Agent x={S6.agent.x} y={S6.agent.y} scale={0.8} enterAt={b(7) + 50} pose="idle" />
      <g opacity={tool}>
        <Callout x={S6.agent.x - 220} y={S6.agent.y - 40} tx={S6.agent.x - 44} ty={S6.agent.y - 40} text="ИИ — инструмент" color={theme.accent} />
      </g>
      <g opacity={owner}>
        <Callout x={S6.you.x + 210} y={S6.you.y - 40} tx={S6.you.x + 40} ty={S6.you.y - 40} text="отвечаю я" color={theme.ink} />
      </g>
    </KitScene>
  )
}

// Строка правила в колонке: номер, название (одна-две строки) и плашка-пример.
function Rule({ rule, at, tieAt, color }: { rule: (typeof RULES)[number]; at: number; tieAt: number; color: string }) {
  const frame = useCurrentFrame()
  const pop = usePop(at)
  const x = C.x[rule.col]
  const top = C.y + C.head + rule.row * C.row
  const tieY = top + (rule.title.length > 1 ? 88 : 70)
  const w = pillW(rule.tie)
  if (frame < at) return null
  return (
    <g>
      <g transform={`translate(${x + 36} ${top + 30}) scale(${pop}) translate(${-x - 36} ${-top - 30})`}>
        <Badge x={x + 36} y={top + 30} n={rule.n} color={color} />
      </g>
      <g opacity={appear(frame, at + 4, 10)}>
        {rule.title.map((t, k) => (
          <Label key={t} x={x + 66} y={top + 36 + k * 24} anchor="start" size={21} weight={800}>
            {t}
          </Label>
        ))}
      </g>
      <g opacity={appear(frame, tieAt, 10)}>
        <Pill x={x + 66 + w / 2} y={tieY} w={w} text={rule.tie} color={color} fill={theme.white} size={18} compact />
      </g>
    </g>
  )
}
