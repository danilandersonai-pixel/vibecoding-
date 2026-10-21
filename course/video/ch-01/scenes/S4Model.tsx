import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Mood, Pose } from '../../actors/Person'
import { Pill } from '../../ch-abc/scenes/parts'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { CARD_H, CARD_ROW, CARD_TOP, S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { appear, clamp } from './motion'
import { You } from './parts'

const ID = 's4-model'
const T = S4.tools
const M = S4.model
const L = S4.label
const K = S4.card
const TB = S4.table
const LD = S4.ladder

// классы инструментов (снимок на октябрь 2026, как в книге)
const TOOLS = [
  { name: ['Подсказки', 'в редакторе'], ex: 'GitHub Copilot' },
  { name: ['ИИ-редактор'], ex: 'Cursor, Zed' },
  { name: ['Терминальный', 'агент'], ex: 'Claude Code' },
  { name: ['Облачный', 'агент'], ex: 'Codex в облаке' },
  { name: ['Конструктор', 'приложений'], ex: 'Lovable, v0' },
]
const BRANDS = [
  { name: 'Opus', x: M.x - 200, y: M.y },
  { name: 'Sol', x: M.x, y: M.y + 112 },
  { name: 'Argon', x: M.x + 200, y: M.y },
]
// этикетка: что на ней → что в карточке модели (номер строки карточки)
const LABEL_ROWS = [
  { name: 'Состав', means: 'чему и как учили', row: -1 },
  { name: 'Срок годности', means: 'срез знаний', row: 2 },
  { name: 'Цена за кг', means: 'за 1 млн токенов', row: 3 },
  { name: 'Мелкий шрифт', means: 'ограничения', row: 6 },
]
// строки карточки «Модель X» (значения — как у Sonnet 5.5 в таблице книги)
const CARD_ROWS = [
  { name: 'Контекстное окно', value: '1 млн токенов' },
  { name: 'Максимальный ответ', value: '128 тыс. токенов' },
  { name: 'Срез знаний', value: 'июнь 2026' },
  { name: 'Цена: вход / выход', value: '$2 / $10 за 1 млн' },
  { name: 'Скорость', value: '≈90–135 ток./с' },
  { name: 'Уровни усилия', value: 'low … max' },
  { name: 'Ограничения', value: 'раздел в system card' },
]
// линейка Claude на октябрь 2026
const MODELS = ['Haiku 5.5', 'Sonnet 5.5', 'Opus 5.5']
const TABLE = [
  { name: 'Роль', values: ['быстрая и дешёвая', 'на каждый день', 'сложные задачи'], same: false },
  { name: 'Контекстное окно', values: ['1 млн токенов', '1 млн токенов', '1 млн токенов'], same: true },
  { name: 'Срез знаний', values: ['июнь 2026', 'июнь 2026', 'июнь 2026'], same: true },
  { name: 'Цена: вход / выход', values: ['$0,10 / $0,50*', '$2 / $10', '$4 / $20'], same: false },
]
const HEAD_H = 56
const ROW_H = 54
const FIRST_COL = 300
const COL = (TB.w - FIRST_COL) / 3
// ступени: лёгкая → средняя → флагман
const STEPS = [
  { name: 'Лёгкая модель', task: 'подсказки, переименования', h: 74 },
  { name: 'Средняя модель', task: 'повседневная работа', h: 92 },
  { name: 'Флагман, высокое усилие', task: 'план, сложная ошибка', h: 110 },
]

// Сцена 4: что за модель перед вами. Внутри любого инструмента — модель; название — бренд;
// карточка модели как этикетка; линейка Claude: окно и срез одинаковые, цена — в 40 раз; выбор по задаче.
export function S4Model() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // доска 1: инструменты → модель → бренды
  const toolIn = TOOLS.map((_, i) => appear(frame, b(0) + 5 + i * 10))
  const wires = interpolate(frame, [b(0) + 60, b(0) + 90], [0, 1], clamp)
  const model = spring({ frame: frame - b(0) - 88, fps, config: { damping: 12 } })
  const inside = useAppear(b(0) + 120)
  const brandIn = BRANDS.map((_, i) => appear(frame, b(1) + 8 + i * 14))
  const brandWord = useAppear(b(1) + 60)
  const doc = useAppear(b(1) + 95)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 5, ['think', 'neutral']],
    [b(1) + 95, ['point', 'happy']],
  ])

  // доска 2: карточка и этикетка; строки карточки загораются по репликам
  const card = useAppear(b(2) + 4)
  const labelIn = useAppear(b(2) + 18)
  const labelRows = LABEL_ROWS.map((_, i) => appear(frame, b(2) + 38 + i * 22))
  const litAt = [b(3) + 5, b(3) + 75, b(4) + 5, b(5) + 5, b(5) + 35, b(5) + 62, b(5) + 92]
  const links = [0, 0, b(4) + 40, b(5) + 15, 0, 0, b(5) + 100]
  // текущие строки — с подсветкой; уже названные — полностью видны; остальные — бледные
  const lit = litAt.map((at) => appear(frame, at, 10))
  const until = [b(4), b(4), b(5), b(5) + 35, b(5) + 62, b(5) + 92, b(6)]
  const current = (i: number) => frame >= litAt[i] && frame < until[i]

  // доска 3: линейка Claude и ступени
  const table = useAppear(b(6) + 2)
  const rowIn = TABLE.map((_, i) => appear(frame, b(6) + 14 + i * 10))
  const same = [appear(frame, b(6) + 58), appear(frame, b(6) + 74)]
  const times = useAppear(b(6) + 110)
  const stepIn = [appear(frame, b(7) + 80), appear(frame, b(7) + 125), appear(frame, b(7) + 12)]

  const toolX = (i: number) => T.x + i * (T.w + T.gap)
  const cardRowY = (i: number) => K.y + CARD_TOP + i * CARD_ROW
  const colX = (j: number) => TB.x + FIRST_COL + j * COL
  const rowY = (i: number) => TB.y + HEAD_H + i * ROW_H
  const tableBottom = rowY(TABLE.length)

  return (
    <KitScene chip="4 / 6 · Что за модель перед вами" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* классы инструментов, внутри каждого — модель */}
      {TOOLS.map((t, i) => {
        const x = toolX(i)
        return (
          <g key={t.ex} opacity={toolIn[i]} transform={`translate(0 ${(1 - toolIn[i]) * 12})`}>
            <Card x={x} y={T.y} w={T.w} h={T.h} />
            {t.name.map((n, j) => (
              <Label key={n} x={x + T.w / 2} y={T.y + (t.name.length === 1 ? 46 : 34) + j * 26} size={22} weight={700}>
                {n}
              </Label>
            ))}
            <Label x={x + T.w / 2} y={T.y + T.h - 16} size={18} color={theme.soft} weight={600}>
              {t.ex}
            </Label>
          </g>
        )
      })}
      {TOOLS.map((t, i) => {
        const x0 = toolX(i) + T.w / 2
        return <path key={t.ex} d={`M${x0} ${T.y + T.h} C ${x0} ${T.y + T.h + 60}, ${M.x} ${M.y - 120}, ${M.x} ${M.y - 58}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - wires} fill="none" stroke={theme.accent} strokeWidth={3} opacity={wires > 0 ? 0.7 : 0} />
      })}
      <g transform={`translate(${M.x} ${M.y}) scale(${Math.max(0, model)})`}>
        <circle r={56} fill={theme.accent} />
        <Label x={0} y={8} size={24} color={theme.paper} weight={700}>
          модель
        </Label>
      </g>
      <g opacity={inside * interpolate(frame, [b(1), b(1) + 10], [1, 0], clamp)}>
        <Label x={M.x} y={M.y + 92} size={20} color={theme.soft} weight={600}>
          внутри у каждого
        </Label>
      </g>
      {BRANDS.map((br, i) => (
        <g key={br.name} opacity={brandIn[i]}>
          <Pill x={br.x} y={br.y} w={130} text={br.name} color={theme.alt} fill={theme.paper} size={24} />
        </g>
      ))}
      <g opacity={brandWord}>
        <Label x={M.x} y={M.y + 180} size={22} color={theme.alt} weight={700}>
          название — бренд, а не описание
        </Label>
      </g>
      <g opacity={doc}>
        <rect x={1010} y={300} width={70} height={90} rx={8} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={1022} y={318 + i * 16} width={i === 3 ? 26 : 46} height={6} rx={3} fill={theme.accent} />
        ))}
        <Label x={1045} y={420} size={20} color={theme.accent} weight={700}>
          карточка модели
        </Label>
      </g>
      <You x={170} y={420} scale={0.8} label="Вы" enterAt={b(0) + 30} pose={you[0]} mood={you[1]} />

      {/* доска 2: этикетка продукта */}
      <g opacity={labelIn}>
        <rect x={L.x} y={L.y} width={L.w} height={L.h} rx={14} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
        <rect x={L.x + 10} y={L.y + 10} width={L.w - 20} height={L.h - 20} rx={8} fill="none" stroke={theme.line} strokeWidth={2} strokeDasharray="6 5" />
        <Label x={L.x + L.w / 2} y={L.y + 48} size={26} weight={800}>
          Этикетка
        </Label>
        {LABEL_ROWS.map((r, i) => {
          const y = L.y + 100 + i * 82
          return (
            <g key={r.name} opacity={labelRows[i]}>
              <Label x={L.x + 30} y={y} anchor="start" size={22} weight={700}>
                {r.name}
              </Label>
              <Label x={L.x + 30} y={y + 30} anchor="start" size={20} color={theme.accent} weight={600}>
                {`→ ${r.means}`}
              </Label>
            </g>
          )
        })}
      </g>
      {LABEL_ROWS.map((r, i) =>
        r.row >= 0 ? (
          <path
            key={r.name}
            d={`M${L.x + L.w + 4} ${L.y + 108 + i * 82} C ${L.x + L.w + 30} ${L.y + 108 + i * 82}, ${K.x - 30} ${cardRowY(r.row) + CARD_ROW / 2}, ${K.x + 4} ${cardRowY(r.row) + CARD_ROW / 2}`}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - interpolate(frame, [links[r.row], links[r.row] + 15], [0, 1], clamp)}
            fill="none"
            stroke={theme.accent}
            strokeWidth={3}
            opacity={frame >= links[r.row] ? 1 : 0}
          />
        ) : null,
      )}

      {/* доска 2: карточка модели */}
      <g opacity={card}>
        <Window
          x={K.x}
          y={K.y}
          w={K.w}
          h={CARD_H}
          at={b(2) + 4}
          bar={
            <>
              <text x={18} y={BAR / 2 + 7} fill={theme.ink} style={{ font: `700 20px ${theme.font}` }}>
                Модель X
              </text>
              <text x={130} y={BAR / 2 + 7} fill={theme.soft} style={{ font: `500 18px ${theme.font}` }}>
                страница модели · карточка
              </text>
            </>
          }
        >
          {CARD_ROWS.map((r, i) => {
            const y = CARD_TOP + i * CARD_ROW
            const on = current(i)
            return (
              <g key={r.name} opacity={0.3 + 0.7 * lit[i]}>
                {on && <rect x={3} y={y} width={K.w - 6} height={CARD_ROW} fill={theme.accentTint} />}
                {on && <rect x={3} y={y} width={5} height={CARD_ROW} fill={theme.accent} />}
                <circle cx={36} cy={y + CARD_ROW / 2} r={15} fill={lit[i] > 0 ? theme.accent : theme.line} />
                <text x={36} y={y + CARD_ROW / 2 + 6} textAnchor="middle" fill={theme.paper} style={{ font: `700 17px ${theme.font}` }}>
                  {String(i + 1)}
                </text>
                <text x={64} y={y + CARD_ROW / 2 + 7} fill={theme.ink} style={{ font: `700 20px ${theme.font}` }}>
                  {r.name}
                </text>
                <text x={K.w - 24} y={y + CARD_ROW / 2 + 7} textAnchor="end" fill={on ? theme.accent : theme.ink} style={{ font: `500 20px ${theme.mono}` }}>
                  {r.value}
                </text>
                {i < CARD_ROWS.length - 1 && <line x1={20} y1={y + CARD_ROW} x2={K.w - 20} y2={y + CARD_ROW} stroke={theme.grid} strokeWidth={1.5} />}
              </g>
            )
          })}
        </Window>
      </g>

      {/* доска 3: линейка Claude, октябрь 2026 */}
      <g opacity={table}>
        <Card x={TB.x} y={TB.y} w={TB.w} h={tableBottom - TB.y} />
        <Label x={TB.x + 24} y={TB.y + 36} anchor="start" size={20} color={theme.soft} weight={600}>
          Claude, октябрь 2026
        </Label>
        {MODELS.map((m, j) => (
          <Label key={m} x={colX(j) + COL / 2} y={TB.y + 37} size={24} weight={800}>
            {m}
          </Label>
        ))}
        <line x1={TB.x} y1={TB.y + HEAD_H} x2={TB.x + TB.w} y2={TB.y + HEAD_H} stroke={theme.line} strokeWidth={2} />
        {TABLE.map((r, i) => {
          const y = rowY(i)
          const price = i === TABLE.length - 1
          return (
            <g key={r.name} opacity={rowIn[i]}>
              {i > 0 && <line x1={TB.x + 16} y1={y} x2={TB.x + TB.w - 16} y2={y} stroke={theme.grid} strokeWidth={1.5} />}
              <Label x={TB.x + 24} y={y + 34} anchor="start" size={20} weight={700}>
                {r.name}
              </Label>
              {r.values.map((v, j) => (
                <text key={j} x={colX(j) + COL / 2} y={y + 34} textAnchor="middle" fill={r.same ? (same[i - 1] > 0 ? theme.ok : theme.ink) : price && times > 0 ? theme.risk : theme.ink} style={{ font: `${price || r.same ? 600 : 500} 20px ${price || r.same ? theme.mono : theme.font}` }}>
                  {v}
                </text>
              ))}
              {r.same &&
                [1, 2].map((j) => (
                  <text key={j} x={colX(j)} y={y + 36} textAnchor="middle" fill={theme.ok} opacity={same[i - 1]} style={{ font: `800 26px ${theme.font}` }}>
                    =
                  </text>
                ))}
            </g>
          )
        })}
      </g>
      <g opacity={times}>
        <path d={`M${colX(0) + COL / 2} ${tableBottom + 4} C ${colX(0) + COL / 2} ${tableBottom + 44}, ${colX(2) + COL / 2} ${tableBottom + 44}, ${colX(2) + COL / 2} ${tableBottom + 4}`} fill="none" stroke={theme.risk} strokeWidth={3} />
        <rect x={colX(1) + COL / 2 - 62} y={tableBottom + 18} width={124} height={34} rx={17} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2.5} />
        <Label x={colX(1) + COL / 2} y={tableBottom + 42} size={22} color={theme.risk} weight={800}>
          × 40
        </Label>
        <Label x={TB.x + 24} y={tableBottom + 40} anchor="start" size={18} color={theme.soft} weight={500}>
          * для запросов до 100 тыс. токенов
        </Label>
      </g>
      {STEPS.map((s, i) => {
        const x = LD.x + i * LD.step
        return (
          <g key={s.name} opacity={stepIn[i]} transform={`translate(0 ${(1 - stepIn[i]) * 14})`}>
            <rect x={x} y={LD.bottom - s.h} width={LD.w} height={s.h} rx={12} fill={i === 2 ? theme.accent : theme.accentTint} stroke={theme.accent} strokeWidth={3} />
            <Label x={x + LD.w / 2} y={LD.bottom - s.h + 30} size={22} color={i === 2 ? theme.paper : theme.ink} weight={700}>
              {s.name}
            </Label>
            <Label x={x + LD.w / 2} y={LD.bottom - s.h + 56} size={18} color={i === 2 ? theme.paper : theme.soft} weight={600}>
              {s.task}
            </Label>
          </g>
        )
      })}
    </KitScene>
  )
}
