import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Cake, Chef, Doc, Say } from './parts'

const ID = 's1-cake'
const O = S1.order
const SP = S1.spec
const CH = S1.chats

// строки подробного заказа — по одной на каждую догадку кондитера
const ORDER = [
  { tag: 'Для кого', value: 'сыну, 7 лет' },
  { tag: 'Гостей', value: '10' },
  { tag: 'Начинка', value: 'ягодная, без орехов' },
  { tag: 'Надпись', value: '«Ура, 7 лет!»' },
  { tag: 'Забрать', value: 'суббота, 12:00' },
]
// что стажёр знает назубок: языки (первый ряд) и библиотеки (второй)
const BOOKS = [
  ['JavaScript', 'Python', 'SQL'],
  ['React', 'Next.js', 'Express'],
]
const BOOK_SIZE = 20
const bookW = (t: string) => Math.round(t.length * BOOK_SIZE * 0.56 + 28)

// Сцена 1 (метафора): «Сделай вкусно» — кондитер угадывает и промахивается; подробный заказ закрывает
// все догадки. С ИИ так же: запрос — техзадание, исполнитель — стажёр без памяти, знает только то, что дали.
export function S1Cake() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // «Сделай вкусно!» и догадки кондитера
  const say = useAppear(b(0) + 14) * interpolate(frame, [b(1) + 30, b(1) + 42], [1, 0], CLAMP)
  const guessAt = S1.guesses.map((_, i) => b(0) + 55 + i * 15)
  // строка заказа i закрывает догадку i
  const rowAt = [b(2) + 40, b(2) + 80, b(2) + 120, b(3) + 10, b(3) + 50]
  const guessesOut = interpolate(frame, [b(3) + 110, b(3) + 125], [1, 0], CLAMP)

  // торт «наугад» → уходит; торт по заказу
  const bigIn = usePop(b(1) + 10)
  const bigOut = interpolate(frame, [b(2), b(2) + 14], [1, 0], CLAMP)
  const miss = useAppear(b(1) + 140)
  const order = useAppear(b(2) + 18)
  const goodIn = usePop(b(3) + 90)
  const hit = useAppear(b(3) + 110)

  // доска 2: волшебное слово → техзадание; стажёр и книги; разговоры с нуля
  const wish = useAppear(b(4) + 24)
  const strike = interpolate(frame, [b(4) + 62, b(4) + 76], [0, 1], CLAMP)
  const toSpec = interpolate(frame, [b(4) + 78, b(4) + 92], [0, 1], CLAMP)
  const spec = useAppear(b(4) + 88)
  const barsAt = [0, 1, 2, 3, 4].map((i) => b(4) + 100 + i * 8)
  const tag = useAppear(b(5) + 10)
  const known = frame >= b(6) + 150
  const chat1 = b(6) + 6
  const chat2 = b(6) + 46
  const wipe = interpolate(frame, [b(6) + 30, b(6) + 44], [0, 1], CLAMP)
  const fly = useTrack([
    [b(6) + 96, BOARD2 + 300, 330],
    [b(6) + 140, BOARD2 + 560, 318],
  ])
  const flyOn = frame >= b(6) + 92 && frame < b(6) + 146

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 12, ['point', 'neutral']],
    [b(0) + 70, ['stand', 'neutral']],
    [b(1) + 50, ['surprised', 'worried']],
    [b(2) + 10, ['think', 'neutral']],
    [b(2) + 38, ['point', 'neutral']],
    [b(3) + 100, ['cheer', 'happy']],
  ])
  const chef = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 45, ['think', 'worried']],
    [b(1) + 5, ['point', 'happy']],
    [b(1) + 120, ['stand', 'worried']],
    [b(2) + 30, ['think', 'neutral']],
    [b(3) + 88, ['point', 'happy']],
    [b(3) + 130, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 50, 'working'],
    [b(5) + 130, 'done'],
    [b(6) + 20, 'idle'],
    [b(6) + 140, 'done'],
  ])

  return (
    <KitScene chip="1 / 6 · Торт: «сделай вкусно» или заказ" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* прилавок */}
      <rect x={S1.counter.x - 60} y={S1.counter.y} width={S1.counter.w + 120} height={22} rx={6} fill={theme.desk} />

      {/* торт наугад: огромный, шоколадный, с орехами */}
      {frame >= b(1) + 10 && frame < b(2) + 14 && (
        <g opacity={bigOut} transform={`translate(${S1.cake.x} ${S1.cake.y}) scale(${bigIn}) translate(${-S1.cake.x} ${-S1.cake.y})`}>
          <Cake x={S1.cake.x} y={S1.cake.y} big text="С юбилеем!" />
        </g>
      )}
      <g opacity={miss * bigOut}>
        <Mark x={262} y={300} ok={false} r={18} />
        <Pill x={262} y={252} text="мимо" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* торт по заказу */}
      {frame >= b(3) + 90 && (
        <g transform={`translate(${S1.cake.x} ${S1.cake.y}) scale(${goodIn}) translate(${-S1.cake.x} ${-S1.cake.y})`}>
          <Cake x={S1.cake.x} y={S1.cake.y} big={false} text="Ура, 7 лет!" />
        </g>
      )}
      <g opacity={hit}>
        <Mark x={530} y={318} ok r={18} />
      </g>

      {/* вы и кондитер */}
      <Actor x={S1.you.x} y={S1.you.y} scale={0.8} label="Вы" enterAt={0}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Chef x={S1.chef.x} y={S1.chef.y} scale={0.8} label="Кондитер" enterAt={6} pose={chef[0]} mood={chef[1]} />
      <g opacity={say}>
        <Say x={S1.say.x} y={S1.say.y} text="Сделай вкусно!" />
      </g>

      {/* догадки кондитера: «?» → ✓, когда заказ отвечает на вопрос */}
      <g opacity={guessesOut}>
        {S1.guesses.map((g, i) => {
          const done = frame >= rowAt[i] + 12
          return (
            <g key={g.text} opacity={appear(frame, guessAt[i], 10)}>
              <Pill x={g.x} y={g.y} text={done ? `✓ ${g.text.replace('?', '')}` : g.text} color={done ? theme.ok : theme.risk} fill={done ? theme.okTint : theme.paper} size={18} compact />
            </g>
          )
        })}
      </g>

      {/* подробный заказ */}
      <g opacity={order}>
        <Card x={O.x} y={O.y} w={O.w} h={64 + ORDER.length * O.row + 10} stroke={theme.accent}>
          <Label x={O.x + 24} y={O.y + 42} anchor="start" size={24} color={theme.accent} weight={700}>
            Подробный заказ
          </Label>
          {ORDER.map((r, i) => {
            const cy = O.y + 64 + i * O.row + O.row / 2
            return (
              <g key={r.tag} opacity={appear(frame, rowAt[i] - 8, 8)}>
                <line x1={O.x + 20} y1={cy - O.row / 2} x2={O.x + O.w - 20} y2={cy - O.row / 2} stroke={theme.grid} strokeWidth={2} />
                <Label x={O.x + 24} y={cy + 7} anchor="start" size={20} color={theme.soft} weight={600}>
                  {r.tag}
                </Label>
                <Label x={O.x + 140} y={cy + 8} anchor="start" size={22} weight={700}>
                  {typed(r.value, frame, rowAt[i], 30)}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>

      {/* доска 2: не волшебное слово, а техзадание */}
      <g opacity={wish}>
        <path d={`M${S1.wish.x - 128} ${S1.wish.y - 16} l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 Z`} fill={theme.alt} />
        <Pill x={S1.wish.x + 10} y={S1.wish.y} text="сделай вкусно" color={theme.alt} size={22} />
        <line x1={S1.wish.x - 100} y1={S1.wish.y} x2={S1.wish.x - 100 + 220 * strike} y2={S1.wish.y} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>
      <Arrow x1={S1.wish.x} y1={S1.wish.y + 24} x2={S1.wish.x} y2={SP.y - 6} color={theme.accent} draw={toSpec} />
      <g opacity={spec}>
        <Doc x={SP.x} y={SP.y} w={SP.w} h={SP.h} title="Техзадание" color={theme.accent}>
          {barsAt.map((at, i) => (
            <rect key={at} x={SP.x + 22} y={SP.y + 66 + i * 44} width={(SP.w - 60 - (i % 2) * 50) * appear(frame, at, 10)} height={16} rx={8} fill={theme.grid} />
          ))}
        </Doc>
      </g>

      {/* стажёр без памяти: языки и библиотеки знает назубок */}
      {BOOKS.map((row, r) => {
        let left = S1.agent.x - (row.reduce((s, t) => s + bookW(t), 0) + (row.length - 1) * 12) / 2
        return row.map((t, i) => {
          const w = bookW(t)
          const cx = left + w / 2
          left += w + 12
          return (
            <g key={t} opacity={appear(frame, b(5) + 50 + (r * 3 + i) * 10, 10)}>
              <Pill x={cx} y={S1.books.y + r * S1.books.dy} w={w} text={t} color={theme.accent} size={BOOK_SIZE} compact />
            </g>
          )
        })
      })}
      <g opacity={tag}>
        <Pill x={S1.agent.x} y={262} text={known ? 'знает то, что вы дали' : 'стажёр без памяти'} color={known ? theme.ok : theme.risk} fill={known ? theme.okTint : theme.riskTint} size={20} compact />
      </g>
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.9} label="ИИ-исполнитель" enterAt={b(4) + 30} pose={agent} />

      {/* разговоры: каждый новый — с чистого листа */}
      {frame >= chat1 && (
        <Window x={CH.x} y={CH.y} w={CH.w} h={CH.h} at={chat1} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={600}>Разговор 1</Label>}>
          <g opacity={1 - wipe}>
            <rect x={CH.w - 190} y={BAR + 16} width={170} height={30} rx={12} fill={theme.accentTint} />
            <rect x={20} y={BAR + 58} width={220} height={30} rx={12} fill={theme.codeBg} />
          </g>
          <g opacity={wipe}>
            <Label x={CH.w / 2} y={BAR + 64} size={20} color={theme.soft} weight={600}>
              забыто
            </Label>
          </g>
        </Window>
      )}
      {frame >= chat2 && (
        <Window x={CH.x} y={CH.y + CH.h + CH.gap} w={CH.w} h={CH.h} at={chat2} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={600}>Разговор 2</Label>}>
          <Label x={CH.w / 2} y={BAR + 64} size={22} color={theme.risk} weight={700}>
            с нуля
          </Label>
        </Window>
      )}

      {/* что вы дали — летит к исполнителю */}
      {flyOn && (
        <g transform={`translate(${fly.x} ${fly.y})`}>
          <Doc x={-22} y={-28} w={44} h={56} color={theme.accent} />
        </g>
      )}
    </KitScene>
  )
}
