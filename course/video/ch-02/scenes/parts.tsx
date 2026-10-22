import type { ReactNode } from 'react'
import { Actor, type ActorProps } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { theme } from '../../theme'

// Детали сцен ролика «Как говорить с ИИ, чтобы он понял»: кондитер, торт, лист документа,
// реплика с хвостиком. Плашка и галочка — Pill и Mark из kit/props.tsx.

/** Кондитер в колпаке; центр — середина фигуры, как у остальных героев. */
export function Chef({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.ink} pose={pose} mood={mood} />
      {/* фартук */}
      <path d="M-22 4 H22 V60 Q0 68 -22 60 Z" fill={theme.paper} opacity={0.9} />
      {/* колпак: околыш и три пышки */}
      <g fill={theme.white} stroke={theme.line} strokeWidth={3}>
        <circle cx={-15} cy={-96} r={14} />
        <circle cx={15} cy={-96} r={14} />
        <circle cx={0} cy={-104} r={16} />
        <rect x={-23} y={-90} width={46} height={16} rx={4} />
      </g>
    </Actor>
  )
}

/**
 * Торт на подставке: (x, y) — середина низа подставки.
 * big — огромный шоколадный в три яруса с орехами; иначе — небольшой ягодный со свечами.
 */
export function Cake({ x, y, big, text }: { x: number; y: number; big: boolean; text: string }) {
  if (big) {
    const tiers = [
      { w: 250, h: 58 },
      { w: 190, h: 52 },
      { w: 130, h: 46 },
    ]
    let top = y - 10
    return (
      <g>
        <rect x={x - 150} y={y - 10} width={300} height={10} rx={4} fill={theme.line} />
        {tiers.map((t, i) => {
          top -= t.h
          return (
            <g key={i}>
              <rect x={x - t.w / 2} y={top} width={t.w} height={t.h} rx={8} fill={theme.alt} stroke={theme.ink} strokeWidth={2.5} />
              {/* шоколадные подтёки */}
              <path d={`M${x - t.w / 2 + 6} ${top + 4} H${x + t.w / 2 - 6} V${top + 12} Q${x + t.w / 4} ${top + 24} ${x} ${top + 12} Q${x - t.w / 4} ${top + 24} ${x - t.w / 2 + 6} ${top + 12} Z`} fill={theme.ink} opacity={0.35} />
            </g>
          )
        })}
        {/* орехи сверху */}
        {[-44, -18, 8, 34].map((dx, i) => (
          <ellipse key={dx} cx={x + dx} cy={top - 4 + (i % 2) * 2} rx={9} ry={6} fill={theme.paper} stroke={theme.ink} strokeWidth={2.5} />
        ))}
        <text x={x} y={y - 10 - 58 - 52 / 2 + 7} textAnchor="middle" fill={theme.white} style={{ font: `700 20px ${theme.font}` }}>
          {text}
        </text>
      </g>
    )
  }
  const w = 210
  const h = 84
  const top = y - 10 - h
  return (
    <g>
      <rect x={x - w / 2 - 20} y={y - 10} width={w + 40} height={10} rx={4} fill={theme.line} />
      <rect x={x - w / 2} y={top} width={w} height={h} rx={10} fill={theme.white} stroke={theme.ink} strokeWidth={2.5} />
      <rect x={x - w / 2 + 2} y={top + h - 18} width={w - 4} height={14} fill={theme.riskTint} />
      {/* свечи и ягоды */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const cx = x - 72 + i * 24
        return (
          <g key={i}>
            <rect x={cx - 3} y={top - 26} width={6} height={24} rx={2} fill={theme.accent} />
            <path d={`M${cx} ${top - 38} q6 7 0 11 q-6 -4 0 -11 Z`} fill={theme.alt} />
          </g>
        )
      })}
      {[-84, -36, 12, 60, 84].map((dx) => (
        <circle key={dx} cx={x + dx} cy={top + 2} r={7} fill={theme.risk} />
      ))}
      <text x={x} y={top + 46} textAnchor="middle" fill={theme.ink} style={{ font: `700 22px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Лист документа с загнутым уголком: (x, y) — левый верхний угол; title — заголовок, дети — в координатах холста. */
export function Doc({ x, y, w, h, title, color = theme.line, children }: { x: number; y: number; w: number; h: number; title?: string; color?: string; children?: ReactNode }) {
  const fold = 26
  return (
    <g>
      <path d={`M${x} ${y} H${x + w - fold} L${x + w} ${y + fold} V${y + h} H${x} Z`} fill={theme.white} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${x + w - fold} ${y} V${y + fold} H${x + w}`} fill={theme.codeBg} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      {title && (
        <text x={x + 20} y={y + 38} fill={theme.ink} style={{ font: `700 22px ${theme.font}` }}>
          {title}
        </text>
      )}
      {children}
    </g>
  )
}

/** Реплика: плашка с текстом по центру (x, y) и хвостиком к говорящему (вниз, влево или вправо). */
export function Say({ x, y, text, tail = 'down', color = theme.ink, fill = theme.white, size = 22 }: { x: number; y: number; text: string; tail?: 'down' | 'left' | 'right'; color?: string; fill?: string; size?: number }) {
  const w = Math.round(text.length * size * 0.56 + 36)
  const h = size + 24
  const l = x - w / 2
  const t = y - h / 2
  const tip =
    tail === 'down'
      ? `M${x - 30} ${t + h - 2} L${x - 40} ${t + h + 18} L${x - 10} ${t + h - 2}`
      : tail === 'left'
        ? `M${l + 2} ${y - 8} L${l - 18} ${y + 10} L${l + 2} ${y + 8}`
        : `M${l + w - 2} ${y - 8} L${l + w + 18} ${y + 10} L${l + w - 2} ${y + 8}`
  return (
    <g>
      <path d={tip} fill={fill} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={l} y={t} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={2.5} />
      {/* закрываем шов между хвостиком и плашкой */}
      {tail === 'down' && <rect x={x - 38} y={t + h - 5} width={27} height={5} fill={fill} />}
      {tail === 'left' && <rect x={l} y={y - 7} width={5} height={14} fill={fill} />}
      {tail === 'right' && <rect x={l + w - 5} y={y - 7} width={5} height={14} fill={fill} />}
      <text x={x} y={y + size * 0.36} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${size}px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}
