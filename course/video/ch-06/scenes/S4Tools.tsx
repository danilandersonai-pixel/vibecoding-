import type { ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { theme } from '../../theme'
import { BOARD2, S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's4-tools'
const Y = S4.cardY
const W = S4.cardW
const IH = 150 // высота картинки в карточке
const PILL = 20

type Tool = { title: string; examples: string[][]; when: string; limit: string }

// классы инструментов прототипирования (таблица s37, снимок на октябрь 2026)
const TOOLS: Tool[] = [
  { title: 'Конструкторы приложений', examples: [['Lovable', 'Bolt', 'v0', 'Replit']], when: 'идея на людях за день, хостинг сразу', limit: 'привязка к платформе' },
  { title: 'Дизайн-холсты с ИИ', examples: [['Claude Design', 'Figma Make']], when: 'интерфейс и сценарий — до кода', limit: 'не скажет, можно ли это сделать' },
  { title: 'Терминальные агенты', examples: [['Claude Code', 'Codex'], ['Antigravity CLI']], when: 'прототип, который станет продуктом', limit: 'нужны навыки: проект и терминал' },
  { title: 'Ноутбуки и скрипты', examples: [['Jupyter', 'Python-скрипты']], when: 'данные, алгоритм, скорость', limit: 'нет интерфейса для людей' },
]

const pillW = (t: string) => Math.round(t.length * PILL * 0.56 + 28)

// Карточка класса: номер и название, картинка (дети, координаты холста), примеры, когда брать и ограничение.
function ToolCard({ n, x, at, pillsAt, whenAt, limitAt, focus = 0, children }: { n: number; x: number; at: number; pillsAt: number; whenAt: number; limitAt: number; focus?: number; children: ReactNode }) {
  const frame = useCurrentFrame()
  const t = TOOLS[n]
  return (
    <g opacity={appear(frame, at)}>
      <Card x={x} y={Y} w={W} h={S4.cardH} stroke={focus > 0.5 ? theme.ok : theme.line} fill={focus > 0.5 ? theme.okTint : theme.paper} />
      <circle cx={x + 38} cy={Y + 42} r={18} fill={theme.accent} />
      <Label x={x + 38} y={Y + 49} size={20} weight={700} color={theme.white}>
        {n + 1}
      </Label>
      <Label x={x + 66} y={Y + 51} anchor="start" size={26} weight={700}>
        {t.title}
      </Label>
      <rect x={x + 24} y={Y + 74} width={W - 48} height={IH} rx={10} fill={theme.codeBg} />
      {children}
      {t.examples.map((row, r) => {
        let left = x + 24
        return row.map((e, i) => {
          const w = pillW(e)
          const cx = left + w / 2
          left += w + 12
          return (
            <g key={e} opacity={appear(frame, pillsAt + (r * 2 + i) * 8, 8)}>
              <Pill x={cx} y={Y + 250 + r * 42} w={w} text={e} color={theme.ink} fill={theme.paper} size={PILL} compact />
            </g>
          )
        })
      })}
      <g opacity={appear(frame, whenAt)}>
        <Label x={x + 24} y={Y + 336} anchor="start" size={21} weight={600}>
          <tspan fill={theme.ok}>✓ </tspan>
          {t.when}
        </Label>
      </g>
      <g opacity={appear(frame, limitAt)}>
        <Label x={x + 24} y={Y + 368} anchor="start" size={21} weight={600} color={theme.risk}>
          {`✗ ${t.limit}`}
        </Label>
      </g>
    </g>
  )
}

// Сцена 4: четыре класса инструментов (снимок на октябрь 2026): конструкторы, дизайн-холсты,
// терминальные агенты, ноутбуки; правило выбора — по тому, станет ли прототип продуктом.
export function S4Tools() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const [x1, x2, x3, x4] = S4.cards
  const ix = (x: number) => x + 24
  const iy = Y + 74

  // заголовок крупно, потом карточки
  const title = appear(frame, b(0) + 6) * interpolate(frame, [b(1) - 14, b(1)], [1, 0], CLAMP)
  const dots = [0, 1, 2, 3].map((i) => appear(frame, b(0) + 40 + i * 12))
  const stamp = appear(frame, b(1) + 20)

  // 1: конструктор — чат слева, приложение справа, «Опубликовать» → ссылка
  const chat = [b(1) + 26, b(1) + 40].map((at) => appear(frame, at))
  const app = appear(frame, b(1) + 54)
  const click = b(1) + 84
  const ripple = frame >= click && frame < click + 16 ? (frame - click) / 16 : 0
  const link = appear(frame, click + 10)

  // 2: холст — экраны и сценарий, карандаш рисует
  const frames = [0, 1, 2].map((i) => appear(frame, b(2) + 20 + i * 14))
  const pen = trackAt(frame, [
    [b(2) + 20, ix(x2) + 110, iy + 40],
    [b(2) + 48, ix(x2) + 250, iy + 110],
    [b(2) + 76, ix(x2) + 390, iy + 40],
    [b(2) + 100, ix(x2) + 440, iy + 120],
  ])

  // 3: терминал в настоящем проекте
  const term = [0, 1, 2, 3].map((i) => appear(frame, b(3) - 4 + i * 12, 8))
  // 4: ноутбук — график и замер скорости
  const bars = [0, 1, 2, 3, 4].map((i) => appear(frame, b(4) + 20 + i * 6, 10))
  const speed = appear(frame, b(4) + 56)

  // правило: станет продуктом → свой стек; разовая проверка → самый быстрый
  const focus = appear(frame, b(5) + 24)
  const fast = appear(frame, b(5) + 120)

  return (
    <KitScene chip="4 / 7 · Чем собирать" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* заголовок */}
      <g opacity={title}>
        <Label x={S4.title.x} y={S4.title.y - 30} size={40} weight={700}>
          Чем собирать прототип?
        </Label>
        <Label x={S4.title.x} y={S4.title.y + 20} size={24} weight={600} color={theme.soft}>
          четыре класса · снимок на октябрь 2026
        </Label>
        {dots.map((d, i) => (
          <g key={i} opacity={d}>
            <circle cx={S4.title.x - 120 + i * 80} cy={S4.title.y + 96} r={24} fill={theme.accent} />
            <Label x={S4.title.x - 120 + i * 80} y={S4.title.y + 104} size={22} weight={700} color={theme.white}>
              {i + 1}
            </Label>
          </g>
        ))}
      </g>
      <g opacity={stamp}>
        <Pill x={1110} y={84} text="снимок на октябрь 2026" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>

      {/* 1: конструкторы приложений */}
      <ToolCard n={0} x={x1} at={b(1) + 10} pillsAt={b(1) + 40} whenAt={b(1) + 96} limitAt={b(1) + 136}>
        <g opacity={chat[0]}>
          <rect x={ix(x1) + 16} y={iy + 16} width={200} height={118} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
          <rect x={ix(x1) + 60} y={iy + 30} width={142} height={24} rx={10} fill={theme.accentTint} />
        </g>
        <g opacity={chat[1]}>
          <rect x={ix(x1) + 28} y={iy + 66} width={124} height={24} rx={10} fill={theme.codeBg} stroke={theme.grid} strokeWidth={2} />
        </g>
        <g opacity={app}>
          <rect x={ix(x1) + 232} y={iy + 16} width={264} height={118} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
          {[0, 1].map((i) => (
            <rect key={i} x={ix(x1) + 246} y={iy + 30 + i * 26} width={150 - i * 30} height={16} rx={5} fill={theme.grid} />
          ))}
          <rect x={ix(x1) + 352} y={iy + 92} width={132} height={32} rx={8} fill={theme.accent} />
          <text x={ix(x1) + 418} y={iy + 114} textAnchor="middle" fill={theme.white} style={{ font: `600 18px ${theme.font}` }}>
            Опубликовать
          </text>
          {ripple > 0 && <circle cx={ix(x1) + 418} cy={iy + 108} r={10 + ripple * 34} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        </g>
        <g opacity={link}>
          <Pill x={ix(x1) + 292} y={iy + 108} text="ссылка" color={theme.ok} fill={theme.okTint} size={18} compact />
        </g>
      </ToolCard>

      {/* 2: дизайн-холсты */}
      <ToolCard n={1} x={x2} at={b(2) + 6} pillsAt={b(2) + 34} whenAt={b(2) + 96} limitAt={b(2) + 130}>
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 21 }, (_, c) => <circle key={`${r}-${c}`} cx={ix(x2) + 16 + c * 24} cy={iy + 14 + r * 24} r={1.6} fill={theme.line} opacity={0.6} />),
        )}
        {frames.map((f, i) => (
          <g key={i} opacity={f}>
            <rect x={ix(x2) + 70 + i * 140} y={iy + 22} width={70} height={106} rx={10} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
            <rect x={ix(x2) + 78 + i * 140} y={iy + 32} width={54} height={14} rx={4} fill={theme.accentTint} />
            <rect x={ix(x2) + 78 + i * 140} y={iy + 56} width={40} height={8} rx={4} fill={theme.grid} />
            <rect x={ix(x2) + 78 + i * 140} y={iy + 72} width={48} height={8} rx={4} fill={theme.grid} />
            {i < 2 && <path d={`M${ix(x2) + 146 + i * 140} ${iy + 75} H${ix(x2) + 204 + i * 140}`} stroke={theme.accent} strokeWidth={3} strokeDasharray="6 5" opacity={appear(frame, b(2) + 34 + i * 14)} />}
          </g>
        ))}
        {frame >= b(2) + 20 && (
          <g transform={`translate(${pen.x} ${pen.y}) rotate(35)`}>
            <rect x={-5} y={-34} width={10} height={30} rx={2} fill={theme.alt} />
            <path d="M-5 -4 L0 6 L5 -4 Z" fill={theme.ink} />
          </g>
        )}
      </ToolCard>

      {/* 3: терминальные агенты */}
      <ToolCard n={2} x={x3} at={b(3) - 24} pillsAt={b(3) + 6} whenAt={b(3) + 110} limitAt={b(3) + 150} focus={focus}>
        <rect x={ix(x3) + 12} y={iy + 12} width={488} height={126} rx={8} fill={theme.termBg} />
        {['src/', 'tests/'].map((f, i) => (
          <text key={f} x={ix(x3) + 30} y={iy + 48 + i * 32} fill={theme.termDim} style={{ font: `500 18px ${theme.mono}` }}>
            {f}
          </text>
        ))}
        <line x1={ix(x3) + 120} y1={iy + 24} x2={ix(x3) + 120} y2={iy + 126} stroke={theme.termBar} strokeWidth={3} />
        <text x={ix(x3) + 140} y={iy + 48} fill={theme.termDim} style={{ font: `500 18px ${theme.mono}` }}>
          $
        </text>
        {term.map((t, i) => (
          <rect key={i} x={ix(x3) + (i === 0 ? 164 : 140)} y={iy + 36 + i * 22} width={[150, 260, 200, 120][i] * t} height={12} rx={4} fill={i === 3 ? theme.termOk : theme.termText} opacity={i === 0 ? 1 : 0.55} />
        ))}
      </ToolCard>
      <g opacity={focus}>
        <Pill x={x3 + W / 2} y={Y + S4.cardH + 24} text="станет продуктом → сюда" color={theme.ok} fill={theme.paper} size={20} compact />
      </g>

      {/* 4: ноутбуки и скрипты */}
      <ToolCard n={3} x={x4} at={b(4) + 8} pillsAt={b(4) + 24} whenAt={b(4) + 70} limitAt={b(4) + 120}>
        <text x={ix(x4) + 16} y={iy + 34} fill={theme.soft} style={{ font: `500 18px ${theme.mono}` }}>
          [1]
        </text>
        <rect x={ix(x4) + 60} y={iy + 20} width={170} height={18} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
        {bars.map((v, i) => {
          const h = [40, 70, 54, 86, 62][i] * v
          return <rect key={i} x={ix(x4) + 64 + i * 32} y={iy + 136 - h} width={22} height={h} rx={3} fill={theme.accent} opacity={0.75} />
        })}
        <text x={ix(x4) + 268} y={iy + 34} fill={theme.soft} style={{ font: `500 18px ${theme.mono}` }}>
          [2]
        </text>
        <rect x={ix(x4) + 312} y={iy + 20} width={170} height={18} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
        <g opacity={speed}>
          <text x={ix(x4) + 390} y={iy + 104} textAnchor="middle" fill={theme.ok} style={{ font: `700 36px ${theme.mono}` }}>
            0,8 с
          </text>
        </g>
      </ToolCard>
      <g opacity={fast}>
        <Pill x={BOARD2 + 640} y={84} text="разовая проверка → самый быстрый: 1 или 2" color={theme.alt} fill={theme.paper} size={20} compact />
      </g>
    </KitScene>
  )
}
