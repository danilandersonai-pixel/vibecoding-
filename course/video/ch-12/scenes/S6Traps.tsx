import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { revealCount } from '../../kit/reveal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniPhone } from './parts'

const ID = 's6-traps'

const TRAPS = [
  { title: 'По скриншоту', fix: 'сначала описание' },
  { title: 'Память модели', fix: 'сканер лицензий' },
  { title: 'Чужое имя', fix: 'своё имя и значок' },
  { title: 'Копия ошибок', fix: 'спросите: зачем?' },
  { title: 'Вечный паритет', fix: 'главное и отличие' },
  { title: 'Чужие данные', fix: 'свои или открытые' },
  { title: 'Догадки ИИ', fix: 'проверить руками' },
]
const CODE = ['sum(sets)', 'avg(sets)']

// Картинка ловушки в центре карточки (cx, cy); t — кадры с начала анимации.
function TrapIcon({ i, cx, cy, t }: { i: number; cx: number; cy: number; t: number }) {
  const p = (from: number, len = 12) => interpolate(t, [from, from + len], [0, 1], CLAMP)
  if (i === 0) {
    return (
      <g>
        <MiniPhone x={cx - 70} y={cy} w={44} h={72} color={theme.alt} />
        <Arrow x1={cx - 38} y1={cy} x2={cx + 38} y2={cy} color={theme.ink} draw={p(4, 14)} />
        <g opacity={p(18)}>
          <MiniPhone x={cx + 70} y={cy} w={44} h={72} color={theme.alt} />
          <Label x={cx + 70} y={cy + 56} size={18} weight={700} color={theme.risk}>
            двойник
          </Label>
        </g>
      </g>
    )
  }
  if (i === 1) {
    const shown = revealCount(t, 16, 10, CODE.length)
    return (
      <g>
        <rect x={cx - 120} y={cy - 26} width={72} height={52} rx={10} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />
        <Label x={cx - 84} y={cy + 7} size={18} weight={700} color={theme.accent}>
          ИИ
        </Label>
        <Arrow x1={cx - 42} y1={cy} x2={cx - 16} y2={cy} color={theme.ink} draw={p(4, 10)} />
        <rect x={cx - 8} y={cy - 36} width={130} height={70} rx={8} fill={theme.codeBg} stroke={theme.ink} strokeWidth={2} />
        {CODE.slice(0, shown).map((l, k) => (
          <text key={l} x={cx + 6} y={cy - 8 + k * 26} fill={theme.ink} style={{ font: `500 18px ${theme.mono}`, whiteSpace: 'pre' }}>
            {l}
          </text>
        ))}
        <g opacity={p(40)}>
          <Label x={cx + 30} y={cy + 56} size={18} weight={700} color={theme.risk}>
            чужой, по памяти
          </Label>
        </g>
      </g>
    )
  }
  if (i === 2) {
    return (
      <g>
        <circle cx={cx - 56} cy={cy} r={34} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} />
        <Label x={cx - 56} y={cy + 12} size={34} weight={700} color={theme.alt}>
          Э
        </Label>
        <Label x={cx} y={cy + 10} size={30} weight={700} color={theme.soft}>
          ≈
        </Label>
        <g opacity={p(10)} transform={`translate(${(1 - p(10)) * 20} 0)`}>
          <circle cx={cx + 56} cy={cy} r={34} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} />
          <Label x={cx + 56} y={cy + 12} size={34} weight={700} color={theme.alt}>
            Э
          </Label>
        </g>
        <g opacity={p(30)}>
          <Mark x={cx + 88} y={cy - 28} ok={false} />
        </g>
      </g>
    )
  }
  if (i === 3) {
    const wobble = Math.sin(t / 3) * 3 * p(10)
    return (
      <g>
        <MiniPhone x={cx - 60} y={cy} w={56} h={90} color={theme.alt} />
        <g transform={`rotate(${wobble} ${cx - 60} ${cy + 26})`}>
          <rect x={cx - 82} y={cy + 14} width={44} height={22} rx={6} fill={theme.risk} />
        </g>
        <g opacity={p(24)}>
          <path d={`M${cx - 20} ${cy + 20} L${cx + 6} ${cy - 2}`} stroke={theme.ink} strokeWidth={3} />
          <rect x={cx + 6} y={cy - 26} width={110} height={40} rx={20} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />
          <Label x={cx + 61} y={cy + 1} size={20} weight={700} color={theme.accent}>
            зачем?
          </Label>
        </g>
      </g>
    )
  }
  if (i === 4) {
    // цель уезжает вперёд — догнать нельзя
    const run = interpolate(t, [6, 90], [0, 1], CLAMP)
    const goal = cx - 40 + 150 * run
    const fill = cx - 110 + 140 * run
    return (
      <g>
        <rect x={cx - 110} y={cy - 8} width={220} height={16} rx={8} fill={theme.grid} />
        <rect x={cx - 110} y={cy - 8} width={Math.max(0, fill - (cx - 110))} height={16} rx={8} fill={theme.alt} />
        <line x1={goal} y1={cy - 44} x2={goal} y2={cy + 8} stroke={theme.ink} strokeWidth={3} />
        <path d={`M${goal} ${cy - 44} l24 8 l-24 8 Z`} fill={theme.risk} />
        <g opacity={p(30)}>
          <Label x={cx} y={cy + 46} size={18} weight={700} color={theme.risk}>
            вечно догоняем
          </Label>
        </g>
      </g>
    )
  }
  if (i === 5) {
    return (
      <g>
        <path d={`M${cx - 64} ${cy - 30} V${cy + 26} A64 14 0 0 0 ${cx + 64} ${cy + 26} V${cy - 30}`} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <ellipse cx={cx} cy={cy - 30} rx={64} ry={14} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <Label x={cx} y={cy + 4} size={18} weight={600} color={theme.alt}>
          каталог
        </Label>
        <Label x={cx} y={cy + 26} size={18} weight={600} color={theme.alt}>
          эталона
        </Label>
        <g opacity={p(16)}>
          <Mark x={cx + 76} y={cy - 26} ok={false} />
        </g>
      </g>
    )
  }
  return (
    <g>
      <rect x={cx - 120} y={cy - 40} width={240} height={46} rx={23} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
      <path d={`M${cx - 70} ${cy + 6} l-6 16 l20 -16`} fill={theme.paper} stroke={theme.line} strokeWidth={3} strokeLinejoin="round" />
      <Label x={cx} y={cy - 10} size={20} weight={600} color={theme.soft}>
        «скорее всего, так»
      </Label>
      <g opacity={p(26)}>
        <circle cx={cx + 70} cy={cy + 34} r={18} fill={theme.accentTint} stroke={theme.ink} strokeWidth={4} />
        <line x1={cx + 83} y1={cy + 47} x2={cx + 96} y2={cy + 60} stroke={theme.ink} strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  )
}

// Сцена 6: семь ловушек обратной инженерии с ИИ — у каждой своё противоядие.
export function S6Traps() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const starts = [b(0) + 10, b(1) + 5, b(2) + 5, b(3) + 5, b(4) + 5, b(5) + 5, b(5) + 60]
  const fixDelay = [80, 80, 80, 80, 70, 40, 50]
  const pos = [...S6.row1.xs.map((x) => ({ x, y: S6.row1.y })), ...S6.row2.xs.map((x) => ({ x, y: S6.row2.y }))]

  return (
    <KitScene chip="6 / 7 · Ловушки с ИИ" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {TRAPS.map((tr, i) => {
        const { x, y } = pos[i]
        const on = appear(frame, starts[i])
        const fix = appear(frame, starts[i] + fixDelay[i])
        const active = frame >= starts[i] && (i === 6 || frame < (starts[i + 1] ?? Infinity))
        return (
          <g key={tr.title} opacity={on} transform={`translate(0 ${(1 - on) * 16})`}>
            <Card x={x} y={y} w={S6.w} h={S6.h} stroke={active ? theme.risk : theme.line} fill={active ? theme.riskTint : theme.paper} />
            <circle cx={x + 30} cy={y + 32} r={17} fill={theme.risk} />
            <Label x={x + 30} y={y + 39} size={20} weight={700} color={theme.paper}>
              {String(i + 1)}
            </Label>
            <Label x={x + 56} y={y + 40} anchor="start" size={22} weight={700}>
              {tr.title}
            </Label>
            <TrapIcon i={i} cx={x + S6.w / 2} cy={y + 102} t={frame - starts[i] - 10} />
            <g opacity={fix}>
              <Pill x={x + S6.w / 2} y={y + 190} text={tr.fix} color={theme.ok} fill={theme.okTint} size={18} compact />
            </g>
          </g>
        )
      })}
    </KitScene>
  )
}
