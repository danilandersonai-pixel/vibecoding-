import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { colX, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Note, Slot } from './parts'

const ID = 's2-sort'
const N = S2.notes
const C = S2.cols

// три отзыва дословно и их короткая запись в стопке
const NOTES = [
  { author: 'Марина', color: theme.accent, text: 'Анна вписала 52,5 — сохранилось 52', short: '52,5 → 52' },
  { author: 'Дима', color: theme.alt, text: 'Не вижу, кто пропустил тренировку', short: 'кто пропустил?' },
  { author: 'Олег', color: theme.ok, text: 'Хочу тёмную тему', short: 'тёмная тема' },
]
// три стопки и решение под каждой
const STACKS = [
  { head: 'портит данные', color: theme.risk, fill: theme.riskTint, tag: 'агенту в фон', tagColor: theme.ok, tagFill: theme.okTint },
  { head: 'мешает', color: theme.alt, fill: theme.altTint, tag: 'уточнить у Димы', tagColor: theme.alt, tagFill: theme.altTint },
  { head: 'подождёт', color: theme.soft, fill: theme.zone, tag: 'в список', tagColor: theme.soft, tagFill: theme.paper },
]
// подсказки к первому листку: из чего состоит хороший отзыв
const HINTS = ['кто', 'что делал', 'что вышло']
const MINI = { w: 170, h: 64 }

// Сцена 2 (что строим сегодня): отзывы дословно — Марина, Дима, Олег; три стопки по приоритету;
// агенту в фон — задачу с заранее понятным «готово» и тестом; размытую — сначала уточнить.
export function S2Sort() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // отзывы: места, подсказки, листки
  const header = useAppear(b(0) + 12)
  const hintAt = [b(0) + 70, b(0) + 92, b(0) + 114]
  const hints = 1 - appear(frame, b(1) - 4, 8)
  const noteAt = [b(1) + 4, b(2) + 6, b(2) + 96]
  const lost = useAppear(b(1) + 70)

  // стопки: заголовки, перелёт карточек, решения
  const headAt = [b(3) + 30, b(3) + 40, b(3) + 50]
  const flyAt = [b(3) + 36, b(3) + 56, b(3) + 76]
  // разобранный листок бледнеет; на последней реплике листки уходят — камера едет к стопкам
  const notesOut = 1 - appear(frame, b(6), 12)
  const dim = (i: number) => (1 - 0.45 * appear(frame, flyAt[i] + 26, 10)) * notesOut
  const slots = appear(frame, b(3) - 10, 12)
  const tagAt = [b(4) + 20, b(5) + 18, b(3) + 160]
  const crit = useAppear(b(4) + 70)
  const test = useAppear(b(4) + 110)
  const fuzzy = useAppear(b(5) + 6)
  const pick = appear(frame, b(6) + 12, 12)
  const ready = useAppear(b(6) + 60)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(6) + 40, 'done'],
  ])

  return (
    <KitScene chip="2 / 4 · Отзывы и приоритеты" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* отзывы — в одно место и дословно */}
      <g opacity={header * notesOut}>
        <Label x={N.x + N.w} y={N.y[0] - 14} anchor="end" size={20} color={theme.soft} weight={700}>
          отзывы — дословно
        </Label>
      </g>
      {N.y.map((y, i) => (
        <g key={y} opacity={appear(frame, b(0) + 24 + i * 10, 10) * notesOut}>
          <Slot x={N.x} y={y} w={N.w} h={N.h} />
        </g>
      ))}
      <g opacity={hints}>
        {HINTS.map((h, i) => (
          <g key={h} opacity={appear(frame, hintAt[i], 10)}>
            <Pill x={N.x + 90 + i * 150} y={N.y[0] + N.h / 2} text={h} color={theme.soft} size={20} compact />
          </g>
        ))}
      </g>
      {NOTES.map((n, i) => (
        <g key={n.author} opacity={appear(frame, noteAt[i], 10) * dim(i)}>
          <Note x={N.x} y={N.y[i]} w={N.w} h={N.h} author={n.author} color={n.color} text={typed(n.text, frame, noteAt[i] + 10, 32)} />
        </g>
      ))}
      <g opacity={lost * dim(0)}>
        <Pill x={N.x + N.w - 64} y={N.y[0] + 32} text="−0,5 кг" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* три стопки: места с самого начала, заголовки и карточки — по реплике */}
      {STACKS.map((s, i) => {
        const x = colX(i)
        return (
          <g key={s.head}>
            <g opacity={slots}>
              <Slot x={x} y={C.top} w={C.w} h={C.h} color={appear(frame, headAt[i], 10) > 0 ? s.color : theme.grid} />
            </g>
            <g opacity={appear(frame, headAt[i], 10)}>
              <Pill x={x + C.w / 2} y={C.head} w={C.w} text={s.head} color={s.color} fill={s.fill} size={20} compact />
            </g>
            <g opacity={appear(frame, tagAt[i], 10)}>
              <Pill x={x + C.w / 2} y={S2.tagY} w={C.w} text={s.tag} color={s.tagColor} fill={s.tagFill} size={20} compact />
            </g>
          </g>
        )
      })}
      {NOTES.map((n, i) => {
        if (frame < flyAt[i]) return null
        const from = { x: N.x + N.w - MINI.w - 20, y: N.y[i] + (N.h - MINI.h) / 2 }
        const to = { x: colX(i) + (C.w - MINI.w) / 2, y: C.top + 16 }
        // вторая и третья карточки идут под уже разложенными и поднимаются в свою стопку
        const p = trackAt(
          frame,
          i === 0
            ? [
                [flyAt[i], from.x, from.y],
                [flyAt[i] + 28, to.x, to.y],
              ]
            : [
                [flyAt[i], from.x, from.y],
                [flyAt[i] + 18, to.x, C.top + C.h + 14],
                [flyAt[i] + 32, to.x, to.y],
              ],
        )
        const on = i === 0 ? pick : 0
        return (
          <g key={n.short}>
            <Card x={p.x} y={p.y} w={MINI.w} h={MINI.h} stroke={on > 0 ? theme.ok : n.color} fill={theme.white}>
              <rect x={p.x + 3} y={p.y + 3} width={MINI.w - 6} height={MINI.h - 6} rx={10} fill={theme.okTint} opacity={on} />
              <Label x={p.x + MINI.w / 2} y={p.y + 40} size={20} weight={700}>
                {n.short}
              </Label>
            </Card>
          </g>
        )
      })}

      {/* что отдать агенту: «готово» ясно заранее и есть тест; размытое — сначала уточнить */}
      <g opacity={crit}>
        <Pill x={colX(0) + C.w / 2} y={C.top + 108} text="«готово» ясно ✓" color={theme.ok} fill={theme.white} size={18} compact />
      </g>
      <g opacity={test}>
        <Pill x={colX(0) + C.w / 2} y={C.top + 146} text="тест напишем ✓" color={theme.ok} fill={theme.white} size={18} compact />
      </g>
      <g opacity={fuzzy}>
        <Pill x={colX(1) + C.w / 2} y={C.top + 108} text="пропуск — это?" color={theme.alt} fill={theme.white} size={18} compact />
      </g>
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.6} enterAt={b(4) + 30} pose={agent} />
      <g opacity={ready}>
        <Callout x={S2.agent.x + 190} y={S2.agent.y - 30} tx={S2.agent.x + 40} ty={S2.agent.y - 30} text="готов взяться" color={theme.accent} />
      </g>
    </KitScene>
  )
}
