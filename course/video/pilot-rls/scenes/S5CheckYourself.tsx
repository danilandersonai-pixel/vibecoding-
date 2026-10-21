import { useCurrentFrame } from 'remotion'
import { Phone } from '../../actors/Phone'
import { theme } from '../../theme'
import { beat, sceneDuration } from '../script'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { useAppear } from '../../kit/hooks'

const ID = 's5-check'
const STEPS = ['Заведите второго пользователя', 'Войдите под ним', 'Откройте чужой адрес: client/17', 'Должно быть пусто']

// Сцена 5: «Проверьте у себя за 2 минуты» — чек-лист, результат и куда идти дальше.
export function S5CheckYourself() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const stepAt = [b(1), b(1) + 40, b(2), b(3)]
  const result = useAppear(b(3))
  const book = useAppear(b(4))
  const mentor = useAppear(b(5))

  return (
    <KitScene chip="5 / 5 · Проверьте у себя" duration={sceneDuration(ID)}>
      <Label x={90} y={120} anchor="start" size={40} weight={700}>
        Проверка за 2 минуты
      </Label>
      {STEPS.map((s, i) => {
        const on = frame >= stepAt[i]
        return (
          <g key={s} opacity={on ? 1 : 0.15}>
            <circle cx={112} cy={190 + i * 70} r={22} fill={on ? (i === 3 ? theme.ok : theme.accent) : theme.grid} />
            <Label x={112} y={198 + i * 70} size={22} color="#fff" weight={700}>
              {i === 3 && result > 0.5 ? '✓' : String(i + 1)}
            </Label>
            <Label x={150} y={198 + i * 70} anchor="start" size={26} weight={500}>
              {s}
            </Label>
          </g>
        )
      })}
      <Phone x={940} y={290} scale={1.25}>
        <rect x={-46} y={-72} width={92} height={18} rx={4} fill={theme.codeBg} />
        <text x={-40} y={-59} style={{ font: `500 9px ${theme.mono}` }} fill={theme.ink}>
          …/client/17
        </text>
        <g opacity={result}>
          <text y={0} textAnchor="middle" style={{ font: `700 26px ${theme.mono}` }} fill={theme.ok}>
            [ ]
          </text>
          <text y={26} textAnchor="middle" style={{ font: `500 11px ${theme.font}` }} fill={theme.soft}>
            нет записей
          </text>
        </g>
      </Phone>
      <g opacity={book}>
        <Card x={90} y={470} w={640} h={64} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={112} y={511} anchor="start" size={21} color={theme.accent}>
            Книга, гл. 7 · запрос «Проверь безопасность базы»
          </Label>
        </Card>
      </g>
      <g opacity={mentor}>
        <Card x={760} y={470} w={240} h={64} fill={theme.codeBg} stroke={theme.line}>
          <text x={782} y={511} style={{ font: `600 24px ${theme.mono}` }} fill={theme.ink}>
            /mentor 4
          </text>
        </Card>
      </g>
    </KitScene>
  )
}
