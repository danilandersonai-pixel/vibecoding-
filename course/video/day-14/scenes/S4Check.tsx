import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S4, TODAY_LIST } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Caution, CopyDoc, TickRow, Watch } from './parts'

const ID = 's4-check'
const L = S4.list
const K = S4.card

// карточки справа: заголовок, цвет рамки и пункты с галочками
const CARDS = [
  { title: 'Тесты', name: 'тесты', color: theme.termBar },
  { title: 'Медленный экран', name: 'скорость', color: theme.alt, rows: ['1. замер', '2. правка по цифрам'] },
  { title: 'Тестовая ошибка', name: 'ошибки', color: theme.risk, rows: ['экран', 'шаги', 'стектрейс'] },
  { title: 'Вчерашняя копия', name: 'копии', color: theme.ok, rows: ['в тестовой базе', 'тренировка Анны', 'время записано'] },
]
const cardX = (i: number) => K.x[i % 2]
const cardY = (i: number) => K.y[Math.floor(i / 2)]

// Сцена 4 (проверьте у себя): тесты и нарочная поломка, медленный экран — сначала замер, тестовая ошибка
// в отслеживании, вчерашняя копия в тестовой базе. Слева — что сделать, справа — как это выглядит.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // список: строки сразу, галочки — в конце своей реплики, подсветка — у текущей
  const title = appear(frame, b(0) + 4, 10)
  const rowIn = TODAY_LIST.map((_, i) => b(0) + 12 + i * 8)
  const tickAt = [b(0) + 176, b(1) + 150, b(2) + 160, b(3) + 166]
  const now = stepAt<number>(frame, [
    [0, -1],
    [b(0) + 12, 0],
    [b(1), 1],
    [b(2), 2],
    [b(3), 3],
    [b(4), -1],
  ])

  // карточки: места пунктиром, наполнение — по реплике
  const slots = appear(frame, b(0) + 10, 10)
  const cardAt = [b(0) + 20, b(1) + 8, b(2) + 8, b(3) + 8]
  // терминал: прогон, нарочная поломка, второй прогон
  const term = [
    { at: b(0) + 34, text: '$ npm test', color: theme.termText, typed: true },
    { at: b(0) + 60, text: '✓ 24 passed', color: theme.termOk },
    { at: b(0) + 118, text: '$ npm test', color: theme.termText, typed: true },
    { at: b(0) + 150, text: '✗ 1 failed', color: theme.termErr },
  ]
  const broke = appear(frame, b(0) + 110, 10)
  const rowTick = [[], [b(1) + 96, b(1) + 146], [b(2) + 118, b(2) + 134, b(2) + 152], [b(3) + 56, b(3) + 108, b(3) + 156]]
  const allOk = appear(frame, b(4) + 40, 12)
  const lucky = appear(frame, b(4) + 64, 10)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 30, ['think', 'neutral']],
    [b(0) + 176, ['stand', 'happy']],
    [b(1) + 20, ['think', 'neutral']],
    [b(2) + 20, ['point', 'neutral']],
    [b(3) + 20, ['think', 'neutral']],
    [b(3) + 166, ['stand', 'happy']],
    [b(4) + 50, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* что сделать сегодня у себя */}
      <g opacity={title}>
        <Label x={L.x} y={118} anchor="start" size={24} weight={800}>
          Сегодня у себя
        </Label>
      </g>
      {TODAY_LIST.map((t, i) => (
        <g key={t} opacity={appear(frame, rowIn[i], 10)}>
          {now === i && <rect x={L.x - 10} y={L.y + i * L.row - 8} width={460} height={46} rx={10} fill={theme.accentTint} />}
          <TickRow x={L.x} y={L.y + i * L.row} text={t} at={tickAt[i]} />
        </g>
      ))}

      {/* вы: проверяете по очереди */}
      <Actor x={S4.you.x} y={S4.you.y} scale={0.6} label="Вы" enterAt={b(0) + 6}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={lucky}>
        <Callout x={S4.you.x + 236} y={S4.you.y + 14} tx={S4.you.x + 18} ty={S4.you.y - 26} text="узнали на учениях" color={theme.ok} />
      </g>

      {/* четыре карточки: как выглядит каждая проверка */}
      {CARDS.map((c, i) => {
        const x = cardX(i)
        const y = cardY(i)
        const on = appear(frame, cardAt[i], 10)
        const dark = i === 0
        return (
          <g key={c.name}>
            <g opacity={slots * (1 - on)}>
              <Slot x={x} y={y} w={K.w} h={K.h} text={c.name} />
            </g>
            <g opacity={on}>
              <Card x={x} y={y} w={K.w} h={K.h} stroke={allOk > 0 && !dark ? theme.ok : c.color} fill={dark ? theme.termBg : theme.white}>
                <Label x={x + 18} y={y + 34} anchor="start" size={20} weight={800} color={dark ? theme.termText : theme.ink}>
                  {c.title}
                </Label>
                {i === 1 && <Watch x={x + K.w - 34} y={y + 30} r={14} t={0.25} />}
                {i === 2 && <Caution x={x + K.w - 34} y={y + 28} />}
                {i === 3 && <CopyDoc x={x + K.w - 34} y={y + 30} s={0.7} />}
              </Card>
              {c.rows?.map((r, k) => (
                <TickRow key={r} x={x + 18} y={y + 56 + k * 44} text={r} at={rowTick[i][k]} size={20} />
              ))}
            </g>
          </g>
        )
      })}
      {term.map((l, k) =>
        frame >= l.at ? (
          <Mono key={k} x={cardX(0) + 18} y={cardY(0) + 74 + k * 32} fill={l.color}>
            {l.typed ? typed(l.text, frame, l.at, 24) : l.text}
          </Mono>
        ) : null,
      )}
      <g opacity={broke}>
        <Label x={cardX(0) + K.w - 16} y={cardY(0) + 74 + 2 * 32} anchor="end" size={18} weight={600} color={theme.termDim}>
          после поломки
        </Label>
      </g>
    </KitScene>
  )
}
