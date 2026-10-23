import type { ReactNode } from 'react'
import { theme } from '../../theme'
import { CLIENTS, daysWord, MISSING_DAYS } from '../layout'

// Детали сцен ролика «Прототип за вечер»: картонный макет дома, часы таймбокса, корзина, замок, щит,
// месяц и календарь, ромб решения, реплика с хвостиком, список подопечных прототипа.
// Общие детали (плашка, галочка, облако, окно браузера, ключ) — в kit/props.tsx.

/**
 * Картонный макет дома в разрезе (передней стены нет): (x, y) — левый край пола, w×h — стены.
 * wall — x внутренней стенки, built — сколько деталей уже на месте (0…6: пол, задняя стена,
 * левая, правая, стенка, крыша), lift — крыша приподнята (0…1), sag — макет проседает (0…1).
 */
export function House({ x, y, w, h, wall, built = 6, lift = 0, sag = 0, rooms = true }: { x: number; y: number; w: number; h: number; wall: number; built?: number; lift?: number; sag?: number; rooms?: boolean }) {
  const top = y - h
  // деталь i въезжает сверху, пока built растёт от i до i + 1
  const part = (i: number) => Math.min(1, Math.max(0, built - i))
  const drop = (i: number) => (1 - part(i)) * -60
  const roofY = top - lift * 90
  const skew = sag * 6
  return (
    <g transform={`translate(${x + w / 2} ${y}) rotate(${-skew * 0.6}) scale(1 ${1 - sag * 0.18}) translate(${-x - w / 2} ${-y})`}>
      {/* пол */}
      <g opacity={part(0)} transform={`translate(0 ${drop(0)})`}>
        <rect x={x - 10} y={y - 10} width={w + 20} height={12} rx={3} fill={theme.alt} />
      </g>
      {/* задняя стена с окнами */}
      <g opacity={part(1)} transform={`translate(0 ${drop(1)})`}>
        <rect x={x} y={top} width={w} height={h - 10} fill={theme.altTint} stroke={theme.alt} strokeWidth={3} />
        <rect x={x + w - 90} y={top + 40} width={44} height={44} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
        <rect x={x + 22} y={top + 40} width={34} height={44} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
      </g>
      {/* боковые стены */}
      <g opacity={part(2)} transform={`translate(0 ${drop(2)})`}>
        <rect x={x - 8} y={top} width={12} height={h - 8} fill={theme.alt} />
      </g>
      <g opacity={part(3)} transform={`translate(0 ${drop(3)})`}>
        <rect x={x + w - 4} y={top} width={12} height={h - 8} fill={theme.alt} />
      </g>
      {/* внутренняя стенка с дверным проёмом */}
      <g opacity={part(4)} transform={`translate(0 ${drop(4)})`}>
        <rect x={wall - 5} y={top} width={10} height={h - 70} fill={theme.alt} />
      </g>
      {rooms && part(4) >= 1 && (
        <g>
          <text x={(x + wall) / 2} y={y - 24} textAnchor="middle" fill={theme.ink} style={{ font: `600 20px ${theme.font}` }}>
            кухня
          </text>
          <text x={(wall + x + w) / 2} y={y - 24} textAnchor="middle" fill={theme.ink} style={{ font: `600 20px ${theme.font}` }}>
            гостиная
          </text>
        </g>
      )}
      {/* крыша */}
      <g opacity={part(5)} transform={`translate(0 ${drop(5)})`}>
        <path d={`M${x - 26} ${roofY} L${x + w / 2} ${roofY - 96} L${x + w + 26} ${roofY} Z`} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} strokeLinejoin="round" />
        {/* гофра картона */}
        {[0.3, 0.5, 0.7].map((t) => (
          <line key={t} x1={x - 26 + (w + 52) * t} y1={roofY - 8} x2={x + w / 2 + (t - 0.5) * 60} y2={roofY - 70} stroke={theme.alt} strokeWidth={2} opacity={0.5} />
        ))}
      </g>
    </g>
  )
}

/** Маленький картонный домик-значок: (x, y) — середина пола. */
export function MiniHouse({ x, y, sag = 0 }: { x: number; y: number; sag?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${-sag * 5}) scale(1 ${1 - sag * 0.2})`}>
      <rect x={-80} y={-110} width={160} height={110} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} />
      <path d="M-96 -110 L0 -176 L96 -110 Z" fill={theme.altTint} stroke={theme.alt} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-56} y={-84} width={36} height={36} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
      <rect x={14} y={-70} width={34} height={70} fill={theme.paper} stroke={theme.alt} strokeWidth={3} />
    </g>
  )
}

/** Часы таймбокса: (x, y) — центр; дуга от часа from до часа to закрашивается на долю progress. */
export function Clock({ x, y, r, from, to, progress }: { x: number; y: number; r: number; from: number; to: number; progress: number }) {
  const angle = (hour: number) => ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2
  const a0 = angle(from)
  const span = (((to - from + 12) % 12) / 12) * Math.PI * 2
  const a1 = a0 + span * progress
  const rr = r - 14
  const p0 = [x + rr * Math.cos(a0), y + rr * Math.sin(a0)]
  const p1 = [x + rr * Math.cos(a1), y + rr * Math.sin(a1)]
  const large = span * progress > Math.PI ? 1 : 0
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.paper} stroke={theme.ink} strokeWidth={4} />
      {progress > 0.01 && <path d={`M${x} ${y} L${p0[0]} ${p0[1]} A${rr} ${rr} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <line key={i} x1={x + (r - 10) * Math.cos(a)} y1={y + (r - 10) * Math.sin(a)} x2={x + (r - 2) * Math.cos(a)} y2={y + (r - 2) * Math.sin(a)} stroke={theme.ink} strokeWidth={i % 3 === 0 ? 4 : 2} />
      })}
      <line x1={x} y1={y} x2={x + (r - 26) * Math.cos(a1)} y2={y + (r - 26) * Math.sin(a1)} stroke={theme.ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={theme.ink} />
    </g>
  )
}

/** Корзина: (x, y) — середина дна; lid — крышка открыта (0…1). */
export function Bin({ x, y, lid = 0 }: { x: number; y: number; lid?: number }) {
  return (
    <g>
      <path d={`M${x - 46} ${y - 110} L${x - 38} ${y} H${x + 38} L${x + 46} ${y - 110} Z`} fill={theme.paper} stroke={theme.soft} strokeWidth={4} strokeLinejoin="round" />
      {[-20, 0, 20].map((dx) => (
        <line key={dx} x1={x + dx} y1={y - 94} x2={x + dx * 0.85} y2={y - 14} stroke={theme.line} strokeWidth={3} />
      ))}
      <g transform={`rotate(${-lid * 40} ${x - 52} ${y - 116})`}>
        <rect x={x - 56} y={y - 124} width={112} height={12} rx={4} fill={theme.soft} />
        <rect x={x - 14} y={y - 134} width={28} height={10} rx={3} fill={theme.soft} />
      </g>
    </g>
  )
}

/** Замок: (x, y) — середина корпуса; open — дужка откинута. */
export function Lock({ x, y, open, color = theme.risk }: { x: number; y: number; open: boolean; color?: string }) {
  return (
    <g>
      <path d={open ? `M${x - 14} ${y - 14} V${y - 30} A16 16 0 0 1 ${x + 18} ${y - 34}` : `M${x - 14} ${y - 14} V${y - 26} A14 14 0 0 1 ${x + 14} ${y - 26} V${y - 14}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <rect x={x - 24} y={y - 16} width={48} height={38} rx={8} fill={color} />
      <circle cx={x} cy={y + 2} r={5} fill={theme.paper} />
    </g>
  )
}

/** Щит с галочкой: (x, y) — центр, size — высота. */
export function Shield({ x, y, size = 100 }: { x: number; y: number; size?: number }) {
  const s = size / 100
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -50 L40 -36 V0 Q40 34 0 50 Q-40 34 -40 0 V-36 Z" fill={theme.okTint} stroke={theme.ok} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-16 0 L-4 13 L18 -14" fill="none" stroke={theme.ok} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** Месяц — «вечер»: (x, y) — центр, r — радиус; серп — круг без второго круга, сдвинутого вправо. */
export function Moon({ x, y, r }: { x: number; y: number; r: number }) {
  // точки пересечения круга r и круга 0,8r с центром на 0,5r правее
  const px = x + 0.61 * r
  const py = 0.7924 * r
  return (
    <g>
      <circle cx={x} cy={y} r={r + 18} fill={theme.accentTint} />
      <path d={`M${px} ${y - py} A${r} ${r} 0 1 0 ${px} ${y + py} A${r * 0.8} ${r * 0.8} 0 1 1 ${px} ${y - py} Z`} fill={theme.alt} />
    </g>
  )
}

/** Календарь — «недели»: (x, y) — левый верхний угол; flip — сколько листов уже сорвано (0…3, последний остаётся). */
export function Calendar({ x, y, w, h, flip }: { x: number; y: number; w: number; h: number; flip: number }) {
  return (
    <g>
      {[3, 2, 1, 0].map((i) => {
        const gone = i === 3 ? 0 : Math.min(1, Math.max(0, flip - i))
        if (gone >= 1) return null
        return (
          <g key={i} opacity={1 - gone} transform={`translate(${gone * 60} ${gone * 80}) rotate(${gone * 20} ${x + w} ${y})`}>
            <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
            <rect x={x} y={y} width={w} height={36} rx={10} fill={theme.risk} />
            <text x={x + w / 2} y={y + 24} textAnchor="middle" fill={theme.white} style={{ font: `700 18px ${theme.font}` }}>
              неделя
            </text>
            <text x={x + w / 2} y={y + h / 2 + 38} textAnchor="middle" fill={theme.ink} style={{ font: `700 48px ${theme.font}` }}>
              {i + 1}
            </text>
          </g>
        )
      })}
      {[0.12, 0.88].map((t) => (
        <rect key={t} x={x + w * t - 4} y={y - 10} width={8} height={22} rx={4} fill={theme.soft} />
      ))}
    </g>
  )
}

/** Ромб решения с центром (x, y); дети — текст в координатах холста. */
export function Diamond({ x, y, w, h, color = theme.ink, fill = theme.paper, children }: { x: number; y: number; w: number; h: number; color?: string; fill?: string; children?: ReactNode }) {
  return (
    <g>
      <path d={`M${x} ${y - h / 2} L${x + w / 2} ${y} L${x} ${y + h / 2} L${x - w / 2} ${y} Z`} fill={fill} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      {children}
    </g>
  )
}

/** Реплика: плашка по центру (x, y) и хвостик к точке (tx, ty) под ней. */
export function Speech({ x, y, text, tx, ty, color = theme.ink, fill = theme.white, size = 22 }: { x: number; y: number; text: string; tx: number; ty: number; color?: string; fill?: string; size?: number }) {
  const h = size + 20
  const w = Math.round(text.length * size * 0.56 + 36)
  return (
    <g>
      <path d={`M${tx - 12} ${y + h / 2 - 3} L${tx} ${ty} L${tx + 12} ${y + h / 2 - 3} Z`} fill={fill} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={3} />
      <rect x={tx - 10} y={y + h / 2 - 5} width={20} height={4} fill={fill} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${size}px ${theme.font}` }}>
        {text}
      </text>
    </g>
  )
}

/** Искорка «полировки»: (x, y) — центр, s — размер (0 — не видна). */
export function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  if (s <= 0) return null
  return <path d={`M${x} ${y - 14 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 14 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 14 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 14 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 14 * s} Z`} fill={theme.alt} />
}

/**
 * Список подопечных на странице прототипа (координаты окна браузера): заголовок и строки
 * «имя — дней назад». mark (0…1) — второй виток: пропавшие (неделя и дольше) подсвечены красным.
 * shown — сколько строк уже видно.
 */
export function ClientList({ w, top = 52, row = 52, mark = 0, shown = CLIENTS.length, size = 22 }: { w: number; top?: number; row?: number; mark?: number; shown?: number; size?: number }) {
  return (
    <g>
      <text x={24} y={top + 30} fill={theme.ink} style={{ font: `700 ${size + 4}px ${theme.font}` }}>
        Подопечные
      </text>
      {CLIENTS.slice(0, shown).map((c, i) => {
        const y = top + 50 + i * row
        const missing = c.days >= MISSING_DAYS
        const m = missing ? mark : 0
        return (
          <g key={c.name}>
            <rect x={16} y={y} width={w - 32} height={row - 8} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
            {m > 0 && <rect x={16} y={y} width={w - 32} height={row - 8} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} opacity={m} />}
            <text x={32} y={y + (row - 8) / 2 + size * 0.36} fill={theme.ink} style={{ font: `600 ${size}px ${theme.font}` }}>
              {c.name}
            </text>
            {m > 0 && (
              <text x={w / 2 - 10} y={y + (row - 8) / 2 + 7} textAnchor="middle" fill={theme.risk} opacity={m} style={{ font: `700 20px ${theme.font}` }}>
                пропал
              </text>
            )}
            <text x={w - 32} y={y + (row - 8) / 2 + 7} textAnchor="end" fill={m > 0.5 ? theme.risk : theme.soft} style={{ font: `500 20px ${theme.font}` }}>
              {`${daysWord(c.days)} назад`}
            </text>
          </g>
        )
      })}
    </g>
  )
}
