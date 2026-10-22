import { interpolate, useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's6-growth'
const CY = S6.cycle
const CH = S6.chart
const J = S6.journal

// цикл осознанной практики (s27): узлы по кругу
const CYCLE = [
  { text: 'попытка', angle: -90 },
  { text: 'разбор', angle: 30 },
  { text: 'вывод', angle: 150 },
]
const node = (angle: number) => ({ x: CY.x + CY.r * Math.cos((angle * Math.PI) / 180), y: CY.y + CY.r * Math.sin((angle * Math.PI) / 180) })

// журнал Марины (рис. 4.7): дата, запрос, что вышло, вывод; good — запрос сработал
const ROWS = [
  { cells: ['12.10', '«Улучши список подопечных»', 'переделал всё подряд', 'называть, что именно'], good: false },
  { cells: ['14.10', '«Почини вход» + текст ошибки', 'причина с первого раза', 'прикладывать ошибку'], good: true },
  { cells: ['16.10', '«Добавь напоминания»', 'пришли всем подряд', 'писать, кому и когда'], good: false },
]
const HEAD = ['Дата', 'Запрос', 'Что вышло', 'Вывод']
const REVIEW = ['где сберёг время?', 'где отнял?', 'что сделать самой?']
// таблица s27: что устаревает и что остаётся
const OLD = ['горячие клавиши редактора', '«волшебные» фразы под модель', 'тонкости тарифов и лимитов', 'обходы слабостей старой модели', 'знать, что сейчас в моде']
const STAY = ['разбивать задачу на части', 'ясно писать, ставить задачи', 'читать и проверять чужой код', 'тестировать, искать причины', 'понимать приложения и данные']
const KEEP = ['решения', 'вкус', 'глубина', 'проверка']

// Сцена 6: навык растёт от цикла «попытка — разбор — вывод», а не от числа запросов; две кривые роста.
// Журнал запросов Марины, разбор раз в неделю: удачное — в шаблоны, промахи — в правила проекта.
// Что устаревает и что остаётся; итог ролика.
export function S6Growth() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: запросы копятся, а навык стоит; цикл двигает навык
  const bubbleAt = [0, 1, 2, 3, 4].map((i) => b(0) + 8 + i * 9)
  const flat = useAppear(b(0) + 30)
  const nodeAt = CYCLE.map((_, i) => b(0) + 96 + i * 16)
  const arcs = grow(frame, b(0) + 140, 20)
  const run = frame >= b(0) + 160 ? ((frame - b(0) - 160) % 75) / 75 : -1
  const skill = interpolate(frame, [b(0) + 30, b(0) + 150, b(1) + 40], [0.12, 0.14, 0.7], CLAMP)
  const axes = useAppear(b(0) + 110)
  const fast = grow(frame, b(1) + 16, 60)
  const fastTag = useAppear(b(1) + 60)
  const slow = grow(frame, b(1) + 96, 60)
  const slowTag = useAppear(b(1) + 130)

  // доска 2: журнал, разбор, шаблоны и правила
  const journal = useAppear(b(2) + 24)
  const cellAt = [
    [b(2) + 50, b(2) + 62, b(2) + 92, b(2) + 122],
    [b(2) + 150, b(2) + 156, b(2) + 166, b(2) + 176],
    [b(3) - 6, b(3), b(3) + 10, b(3) + 20],
  ]
  const review = useAppear(b(3) + 36)
  const askAt = [b(3) + 70, b(3) + 98, b(3) + 128]
  const toTemplates = grow(frame, b(4) + 16, 14)
  const templates = useAppear(b(4) + 28)
  const toRules = grow(frame, b(4) + 84, 14)
  const rules = useAppear(b(4) + 96)
  const rowGlow = (i: number) => (i === 1 ? appear(frame, b(4) + 10, 8) : appear(frame, b(4) + 78, 8))

  // доска 3: что устаревает, что остаётся, итог
  const oldCard = useAppear(b(5) + 16)
  const stayCard = useAppear(b(5) + 26)
  const oldAt = OLD.map((_, i) => b(5) + 32 + i * 10)
  const strikeAt = OLD.map((_, i) => b(5) + 70 + i * 12)
  const stayAt = STAY.map((_, i) => b(5) + 110 + i * 12)
  const recap = useAppear(b(6) + 6)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 40, ['point', 'neutral']],
    [b(3) + 30, ['think', 'neutral']],
    [b(4) + 10, ['point', 'happy']],
    [b(4) + 120, ['cheer', 'happy']],
  ])
  const keepAt = KEEP.map((_, i) => b(6) + 40 + i * 18)

  // кривые роста: быстрая и медленная — от начала осей
  const fastPath = `M${CH.x0} ${CH.y0} Q${CH.x0 + 260} ${CH.y0 - 60} ${CH.x1 - 30} ${CH.y1 + 30}`
  const slowPath = `M${CH.x0} ${CH.y0} Q${CH.x0 + 300} ${CH.y0 - 30} ${CH.x1 - 30} ${CH.y0 - 80}`

  const dotAt = (() => {
    if (run < 0) return null
    const seg = Math.floor(run * 3)
    const t = run * 3 - seg
    const a = CYCLE[seg].angle
    const ang = ((a + 120 * t) * Math.PI) / 180
    return { x: CY.x + CY.r * Math.cos(ang), y: CY.y + CY.r * Math.sin(ang) }
  })()

  return (
    <KitScene chip="6 / 6 · Осознанный рост и журнал запросов" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* запросы копятся, а навык не растёт */}
      {bubbleAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 6) * (1 - appear(frame, b(0) + 90, 10))}>
          <Pill x={S6.asks.x + (i < 3 ? (i - 1) * 110 : (i - 3.5) * 110)} y={S6.asks.y[i < 3 ? 0 : 1]} w={96} text="запрос" color={theme.soft} fill={theme.white} size={18} compact />
        </g>
      ))}
      {/* цикл: попытка → разбор → вывод */}
      <circle cx={CY.x} cy={CY.y} r={CY.r} fill="none" stroke={theme.accent} strokeWidth={4} strokeDasharray={`${2 * Math.PI * CY.r * arcs} 2000`} transform={`rotate(-90 ${CY.x} ${CY.y})`} />
      {dotAt && <circle cx={dotAt.x} cy={dotAt.y} r={9} fill={theme.alt} />}
      {CYCLE.map((n, i) => {
        const p = node(n.angle)
        return (
          <g key={n.text} opacity={appear(frame, nodeAt[i])}>
            <Pill x={p.x} y={p.y} text={n.text} color={theme.accent} fill={theme.white} size={22} />
          </g>
        )
      })}
      {/* шкала навыка */}
      <g opacity={flat}>
        <Label x={60} y={548} anchor="start" size={20} color={theme.soft} weight={700}>
          навык
        </Label>
        <rect x={130} y={530} width={270} height={22} rx={11} fill={theme.grid} />
        <rect x={130} y={530} width={270 * skill} height={22} rx={11} fill={theme.accent} />
      </g>

      {/* две кривые роста */}
      <g opacity={axes}>
        <Arrow x1={CH.x0} y1={CH.y0} x2={CH.x0} y2={CH.y1 - 10} color={theme.ink} />
        <Arrow x1={CH.x0} y1={CH.y0} x2={CH.x1 + 10} y2={CH.y0} color={theme.ink} />
        <g transform={`translate(${CH.x0 - 16} ${(CH.y0 + CH.y1) / 2}) rotate(-90)`}>
          <Label x={0} y={0} size={20} weight={700}>
            умение работать с ИИ
          </Label>
        </g>
        <Label x={(CH.x0 + CH.x1) / 2} y={CH.y0 + 36} size={20} weight={700}>
          время
        </Label>
      </g>
      <path d={fastPath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fast} fill="none" stroke={theme.accent} strokeWidth={6} strokeLinecap="round" opacity={fast > 0 ? 1 : 0} />
      <path d={slowPath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - slow} fill="none" stroke={theme.line} strokeWidth={6} strokeLinecap="round" opacity={slow > 0 ? 1 : 0} />
      <g opacity={fastTag}>
        <Label x={CH.x1 + 10} y={CH.y1 + 32} anchor="start" size={20} color={theme.accent} weight={700}>
          с разбором неудач
        </Label>
        <Label x={CH.x1 + 10} y={CH.y1 + 58} anchor="start" size={20} color={theme.accent} weight={700}>
          — быстро
        </Label>
      </g>
      <g opacity={slowTag}>
        <Label x={CH.x1 + 10} y={CH.y0 - 82} anchor="start" size={20} color={theme.soft} weight={700}>
          просто пользоваться
        </Label>
        <Label x={CH.x1 + 10} y={CH.y0 - 56} anchor="start" size={20} color={theme.soft} weight={700}>
          — медленно
        </Label>
      </g>

      {/* доска 2: журнал запросов Марины */}
      <g opacity={journal}>
        <Card x={J.x} y={J.y} w={J.w} h={J.head + ROWS.length * J.row + 14} stroke={theme.accent} fill={theme.white}>
          {HEAD.map((h, i) => (
            <Label key={h} x={J.x + S6.cols[i]} y={J.y + 38} anchor="start" size={20} color={theme.soft} weight={700}>
              {h}
            </Label>
          ))}
          <Label x={J.x + J.w - 20} y={J.y + 38} anchor="end" size={20} color={theme.accent} weight={700}>
            Журнал запросов
          </Label>
        </Card>
      </g>
      {ROWS.map((r, i) => {
        const top = J.y + J.head + i * J.row
        return (
          <g key={r.cells[0]} opacity={appear(frame, cellAt[i][0] - 4, 8)}>
            <rect x={J.x + 8} y={top + 4} width={J.w - 16} height={J.row - 8} rx={8} fill={r.good ? theme.okTint : theme.riskTint} opacity={rowGlow(i)} />
            <line x1={J.x + 16} y1={top} x2={J.x + J.w - 16} y2={top} stroke={theme.grid} strokeWidth={2} />
            {r.cells.map((c, k) => (
              <Label key={k} x={J.x + S6.cols[k]} y={top + J.row / 2 + 7} anchor="start" size={20} color={k === 2 ? (r.good ? theme.ok : theme.risk) : theme.ink} weight={k === 3 ? 700 : 500}>
                {typed(c, frame, cellAt[i][k], 60)}
              </Label>
            ))}
          </g>
        )
      })}
      {/* раз в неделю — разбор */}
      <g opacity={review}>
        <Pill x={S6.review.x[0]} y={S6.review.y} text="Раз в неделю — разбор" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      {REVIEW.map((t, i) => (
        <g key={t} opacity={appear(frame, askAt[i])}>
          <Pill x={S6.review.x[i + 1]} y={S6.review.y} text={t} color={theme.ink} fill={theme.white} size={18} compact />
        </g>
      ))}
      <Arrow x1={S6.outputs.x[0]} y1={S6.review.y + 24} x2={S6.outputs.x[0]} y2={S6.outputs.y - 24} color={theme.ok} draw={toTemplates} />
      <g opacity={templates}>
        <Pill x={S6.outputs.x[0]} y={S6.outputs.y} text="удачное → шаблоны запросов" color={theme.ok} fill={theme.okTint} size={20} />
      </g>
      <Arrow x1={S6.outputs.x[1]} y1={S6.review.y + 24} x2={S6.outputs.x[1]} y2={S6.outputs.y - 24} color={theme.accent} draw={toRules} />
      <g opacity={rules}>
        <Pill x={S6.outputs.x[1]} y={S6.outputs.y} text="промахи → правила проекта" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      <Coach x={S6.marina.x} y={S6.marina.y} scale={0.75} label="Марина" enterAt={b(2) + 10} pose={marina[0]} mood={marina[1]} />

      {/* доска 3: устаревают быстро — остаются надолго */}
      {[
        { box: S6.old, title: 'Устаревают быстро', color: theme.risk, rows: OLD, at: oldAt, a: oldCard },
        { box: S6.stay, title: 'Остаются надолго', color: theme.ok, rows: STAY, at: stayAt, a: stayCard },
      ].map((c, ci) => (
        <g key={c.title} opacity={c.a}>
          <Card x={c.box.x} y={c.box.y} w={c.box.w} h={c.box.h} stroke={c.color} fill={theme.white}>
            <Label x={c.box.x + 28} y={c.box.y + 44} anchor="start" size={24} color={c.color} weight={700}>
              {c.title}
            </Label>
          </Card>
          {c.rows.map((t, i) => {
            const y = c.box.y + 92 + i * 46
            // устаревшее зачёркивается по одному: крестик и линия по тексту
            const struck = ci === 0 && frame >= strikeAt[i]
            return (
              <g key={t} opacity={appear(frame, c.at[i], 10)}>
                {ci === 1 && <Mark x={c.box.x + 40} y={y - 7} ok r={12} />}
                {struck && <Mark x={c.box.x + 40} y={y - 7} ok={false} r={12} />}
                <text x={c.box.x + 64} y={y} fill={ci === 0 ? theme.soft : theme.ink} style={{ font: `600 20px ${theme.font}`, textDecoration: struck ? 'line-through' : 'none' }}>
                  {t}
                </text>
              </g>
            )
          })}
        </g>
      ))}
      <g opacity={recap}>
        <Card x={S6.recap.x} y={S6.recap.y} w={S6.recap.w} h={S6.recap.h} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={S6.recap.x + 30} y={S6.recap.y + 62} anchor="start" size={24} color={theme.soft} weight={600}>
            Код пишет ИИ.
          </Label>
          <Label x={S6.recap.x + 230} y={S6.recap.y + 62} anchor="start" size={24} weight={800}>
            За вами:
          </Label>
        </Card>
      </g>
      {KEEP.map((t, i) => (
        <g key={t} opacity={appear(frame, keepAt[i])}>
          <Pill x={S6.recap.x + 470 + i * 170} y={S6.recap.y + S6.recap.h / 2} w={150} text={t} color={theme.white} fill={theme.accent} size={22} />
        </g>
      ))}
    </KitScene>
  )
}
