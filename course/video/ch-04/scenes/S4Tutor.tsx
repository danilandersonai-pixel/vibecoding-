import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Timer } from './parts'

const ID = 's4-tutor'
const K = S4.cards
const P = S4.pile

// шесть правил для начинающих (s26): заголовок и пояснение
const RULES = [
  { title: 'Сначала сами', sub: 'минут 15 своей попытки' },
  { title: 'Объяснять, а не решать', sub: 'наставник задаёт вопросы' },
  { title: 'Ошибки — самому', sub: 'перескажите сообщение' },
  { title: 'Пересказ кода', sub: 'своими словами, по шагам' },
  { title: 'Учиться проверять', sub: 'тесты — контроль над ИИ' },
  { title: 'Портфолио', sub: 'с объяснением «почему так»' },
]

// Сцена 4: для новичка ИИ — лучший репетитор и главный риск: код работает, а понимания нет, и первая же
// ошибка ИИ — тупик. Шесть правил: сначала сами, объяснение вместо решения, ошибки, пересказ, тесты, портфолио.
export function S4Tutor() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: репетитор и риск, стопка «работает», ошибка и тупик
  const tutor = useAppear(b(0) + 24)
  const risk = useAppear(b(0) + 66)
  const pileAt = [b(1) + 16, b(1) + 36, b(1) + 56]
  const bugFly = trackAt(frame, [
    [b(1) + 92, P.x + P.w / 2, 230],
    [b(1) + 112, P.x + P.w / 2, P.y - 3 * P.h - P.h / 2],
  ])
  const bugOn = frame >= b(1) + 92
  const bugIn = appear(frame, b(1) + 92, 8)
  const stuck = useAppear(b(1) + 128)
  const marks = useAppear(b(1) + 118)

  // доска 2: карточки правил
  const ghost = useAppear(b(2) + 16)
  const cardAt = [b(2) + 58, b(3) + 6, b(3) + 98, b(4) + 6, b(5) + 6, b(5) + 66]
  const timer = grow(frame, b(2) + 90, 80)
  const askBubble = useAppear(b(3) + 40)
  const answerBubble = useAppear(b(3) + 66)
  const errLine = useAppear(b(3) + 118)
  const retell = grow(frame, b(3) + 140, 14)
  const stepsAt = [b(4) + 40, b(4) + 70, b(4) + 100]
  const testsAt = [b(5) + 24, b(5) + 36, b(5) + 48]
  const why = useAppear(b(5) + 96)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 24, ['point', 'happy']],
    [b(0) + 66, ['think', 'worried']],
    [b(1) + 10, ['cheer', 'happy']],
    [b(1) + 112, ['surprised', 'worried']],
    [b(1) + 150, ['think', 'worried']],
  ])

  return (
    <KitScene chip="4 / 6 · ИИ — репетитор и риск" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* репетитор и риск */}
      <g opacity={tutor}>
        <Pill x={S4.tutor.x} y={S4.tutor.y} text="лучший репетитор" color={theme.ok} fill={theme.okTint} size={22} />
        {/* открытая книга */}
        <g transform={`translate(${S4.tutor.x} ${S4.tutor.y + 66})`}>
          <path d="M0 -20 Q-26 -30 -50 -20 L-50 20 Q-26 10 0 20 Z" fill={theme.white} stroke={theme.ok} strokeWidth={3} strokeLinejoin="round" />
          <path d="M0 -20 Q26 -30 50 -20 L50 20 Q26 10 0 20 Z" fill={theme.white} stroke={theme.ok} strokeWidth={3} strokeLinejoin="round" />
        </g>
      </g>
      <g opacity={risk}>
        <Pill x={S4.risk.x} y={S4.risk.y} text="главный риск" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>
      <g opacity={1 - appear(frame, b(1) + 84, 10)}>
        <Arrow x1={S4.tutor.x + 120} y1={S4.tutor.y + 30} x2={S4.marina.x - 60} y2={S4.marina.y - 110} color={theme.ok} draw={grow(frame, b(0) + 40, 14)} />
      </g>

      {/* стопка «работает», сверху — ошибка ИИ */}
      {pileAt.map((at, i) => {
        if (frame < at) return null
        const y = trackAt(frame, [
          [at, P.y - (i + 1) * P.h - 60],
          [at + 14, P.y - (i + 1) * P.h],
        ].map(([f, yy]) => [f, P.x, yy] as [number, number, number])).y
        return (
          <g key={at} opacity={appear(frame, at, 6)}>
            <rect x={P.x} y={y} width={P.w} height={P.h - 6} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />
            <Label x={P.x + 18} y={y + 26} anchor="start" size={18} color={theme.ok} weight={700}>
              код работает ✓
            </Label>
          </g>
        )
      })}
      {bugOn && (
        <g opacity={bugIn}>
          <rect x={P.x} y={bugFly.y - P.h / 2} width={P.w} height={P.h - 6} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2.5} />
          <Label x={P.x + 18} y={bugFly.y - P.h / 2 + 26} anchor="start" size={18} color={theme.risk} weight={700}>
            ошибка ИИ ✗
          </Label>
        </g>
      )}
      <g opacity={marks}>
        {[-34, 0, 34].map((dx, i) => (
          <Label key={dx} x={S4.marina.x + dx} y={S4.marina.y - 96 - (i % 2) * 14} size={26} color={theme.risk} weight={800}>
            ?
          </Label>
        ))}
      </g>
      <g opacity={stuck}>
        {/* тупик: стена из кирпичей */}
        <g transform={`translate(${S4.stuck.x - 60} ${S4.stuck.y + 20})`}>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={c * 40 + (r % 2) * 20 - 10} y={r * 22} width={38} height={20} rx={3} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} />),
          )}
        </g>
        <Pill x={S4.stuck.x} y={S4.stuck.y} text="и вы в тупике" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <Coach x={S4.marina.x} y={S4.marina.y} scale={0.9} label="Марина" enterAt={6} pose={marina[0]} mood={marina[1]} />

      {/* доска 2: шесть правил — сперва пустые места, потом карточки по репликам */}
      {RULES.map((r, i) => {
        const x = K.x + (i % 3) * (K.w + K.gap)
        const y = K.y + Math.floor(i / 3) * (K.h + K.gap)
        return (
          <g key={r.title} opacity={ghost * (1 - appear(frame, cardAt[i], 12))}>
            <rect x={x} y={y} width={K.w} height={K.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
            <Label x={x + K.w / 2} y={y + K.h / 2 + 12} size={34} color={theme.grid} weight={800}>
              {i + 1}
            </Label>
          </g>
        )
      })}
      {RULES.map((r, i) => {
        const x = K.x + (i % 3) * (K.w + K.gap)
        const y = K.y + Math.floor(i / 3) * (K.h + K.gap)
        const a = appear(frame, cardAt[i], 12)
        return (
          <g key={r.title} opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
            <Card x={x} y={y} w={K.w} h={K.h} stroke={theme.accent} fill={theme.white}>
              <circle cx={x + 38} cy={y + 40} r={22} fill={theme.accent} />
              <Label x={x + 38} y={y + 48} size={22} color={theme.white} weight={800}>
                {i + 1}
              </Label>
              <Label x={x + 72} y={y + 48} anchor="start" size={22} weight={700}>
                {r.title}
              </Label>
              <Label x={x + 24} y={y + 92} anchor="start" size={20} color={theme.soft} weight={600}>
                {r.sub}
              </Label>
            </Card>
            {i === 0 && (
              <g>
                <Timer x={x + 120} y={y + 150} r={32} p={timer} />
                <Label x={x + 176} y={y + 158} anchor="start" size={22} weight={700} color={theme.accent}>
                  {`${Math.round(timer * 15)} мин`}
                </Label>
              </g>
            )}
            {i === 1 && (
              <g>
                <g opacity={askBubble}>
                  <Pill x={x + 130} y={y + 134} text="ИИ: а если пусто?" color={theme.accent} fill={theme.accentTint} size={18} compact />
                </g>
                <g opacity={answerBubble}>
                  <Pill x={x + 240} y={y + 174} text="вы: тогда ноль" color={theme.ink} fill={theme.white} size={18} compact />
                </g>
              </g>
            )}
            {i === 2 && (
              <g>
                <g opacity={errLine}>
                  <rect x={x + 20} y={y + 112} width={K.w - 40} height={34} rx={8} fill={theme.termBg} />
                  <text x={x + 34} y={y + 135} fill={theme.termErr} style={{ font: `500 18px ${theme.mono}`, whiteSpace: 'pre' }}>
                    Ошибка: нет поля «вес»
                  </text>
                </g>
                <g opacity={retell}>
                  <Pill x={x + K.w / 2} y={y + 176} text="«не заполнили вес»" color={theme.ok} fill={theme.okTint} size={18} compact />
                </g>
              </g>
            )}
            {i === 3 &&
              stepsAt.map((at, k) => (
                <g key={at} opacity={appear(frame, at, 10)}>
                  <circle cx={x + 40} cy={y + 124 + k * 26} r={11} fill={theme.ok} />
                  <Label x={x + 40} y={y + 130 + k * 26} size={18} color={theme.white} weight={800}>
                    {k + 1}
                  </Label>
                  <rect x={x + 62} y={y + 118 + k * 26} width={[200, 250, 170][k]} height={12} rx={6} fill={theme.line} />
                </g>
              ))}
            {i === 4 &&
              testsAt.map((at, k) => (
                <g key={at} opacity={appear(frame, at, 8)}>
                  <Mark x={x + 90 + k * 95} y={y + 140} ok r={17} />
                  <Label x={x + 90 + k * 95} y={y + 186} size={18} color={theme.soft} weight={600}>
                    тест
                  </Label>
                </g>
              ))}
            {i === 5 && (
              <g>
                <rect x={x + 40} y={y + 112} width={90} height={80} rx={8} fill={theme.white} stroke={theme.line} strokeWidth={3} />
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={x + 54} y={y + 128 + k * 18} width={[60, 46, 54][k]} height={8} rx={4} fill={theme.grid} />
                ))}
                <g opacity={why}>
                  <Pill x={x + 250} y={y + 152} text="почему так?" color={theme.alt} fill={theme.altTint} size={20} compact />
                </g>
              </g>
            )}
          </g>
        )
      })}
    </KitScene>
  )
}
