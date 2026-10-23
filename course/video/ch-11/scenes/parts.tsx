import { theme } from '../../theme'
import { Label } from '../../kit/parts'
import { GROUND, STEPS } from '../layout'

// Детали сцен ролика «Что дальше»: лестница уровней, карточка кода, процессор, луна, набросок, экран приложения,
// клавиша, чертёж дома, значок программы, маленький робот, солнце, указатель мыши.
// Общие детали (плашка, галочка, облако, окно браузера, реплика) — в kit/props.tsx.

/**
 * Лестница уровней: три ступени из layout. shown — насколько видна каждая ступень (0 — только пунктир),
 * subs — видимость подписи под названием, glow — зелёная обводка нижних ступеней.
 */
export function Stairs({ shown, subs, glow = 0 }: { shown: number[]; subs: number[]; glow?: number }) {
  return (
    <g>
      {STEPS.map((s, i) => {
        const a = shown[i] ?? 0
        const h = GROUND - s.top
        // подпись на передней стенке: у нижней ступени стенка низкая — строки плотнее
        const labelY = s.top + (h < 100 ? 32 : 44)
        const subY = labelY + (h < 100 ? 28 : 34)
        return (
          <g key={s.label}>
            <rect x={s.x} y={s.top} width={s.w} height={h} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="10 8" opacity={1 - a} />
            <g opacity={a}>
              <rect x={s.x} y={s.top} width={s.w} height={h} fill={i === 2 ? theme.accentTint : theme.zone} stroke={theme.ink} strokeWidth={3} />
              <rect x={s.x} y={s.top - 6} width={s.w} height={10} rx={3} fill={i === 2 ? theme.accent : theme.ink} />
              <Label x={s.x + s.w / 2} y={labelY} size={24} weight={700} color={i === 2 ? theme.accent : theme.ink}>
                {s.label}
              </Label>
              <Label x={s.x + s.w / 2} y={subY} size={20} weight={600} color={theme.soft} opacity={subs[i] ?? 0}>
                {s.sub}
              </Label>
            </g>
            {i < 2 && glow > 0 && <rect x={s.x + 4} y={s.top + 4} width={s.w - 8} height={h - 8} fill="none" stroke={theme.ok} strokeWidth={5} opacity={glow} />}
          </g>
        )
      })}
    </g>
  )
}

/** Карточка с моноширинными строками; lines — уже набранные части строк. */
export function CodeCard({ x, y, w, h, lines, color = theme.ink, fill = theme.codeBg }: { x: number; y: number; w: number; h: number; lines: string[]; color?: string; fill?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={theme.line} strokeWidth={2.5} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 34 + i * 30} fill={color} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
    </g>
  )
}

/** Процессор: квадрат с ножками и подпись под ним; (x, y) — центр. */
export function Chip({ x, y }: { x: number; y: number }) {
  const pins = [-18, 0, 18]
  return (
    <g>
      {pins.map((d) => (
        <g key={d} stroke={theme.ink} strokeWidth={4} strokeLinecap="round">
          <line x1={x + d} y1={y - 40} x2={x + d} y2={y - 30} />
          <line x1={x + d} y1={y + 30} x2={x + d} y2={y + 40} />
          <line x1={x - 40} y1={y + d} x2={x - 30} y2={y + d} />
          <line x1={x + 30} y1={y + d} x2={x + 40} y2={y + d} />
        </g>
      ))}
      <rect x={x - 30} y={y - 30} width={60} height={60} rx={8} fill={theme.ink} />
      <rect x={x - 16} y={y - 16} width={32} height={32} rx={4} fill="none" stroke={theme.line} strokeWidth={3} />
      <Label x={x - 54} y={y + 8} anchor="end" size={20} weight={600} color={theme.soft}>
        процессор
      </Label>
    </g>
  )
}

export type ChoreGlyph = 'update' | 'move' | 'logs'

/** Значок рутины сопровождения: обновление, перенос данных, журнал; (x, y) — центр. */
export function ChoreIcon({ x, y, glyph, color = theme.accent }: { x: number; y: number; glyph: ChoreGlyph; color?: string }) {
  return (
    <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {glyph === 'update' && (
        <>
          <path d={`M${x + 18} ${y - 8} A20 20 0 1 0 ${x + 20} ${y + 6}`} />
          <path d={`M${x + 22} ${y - 22} L${x + 19} ${y - 7} L${x + 4} ${y - 10}`} />
        </>
      )}
      {glyph === 'move' && (
        <>
          <ellipse cx={x - 30} cy={y - 12} rx={14} ry={6} />
          <path d={`M${x - 44} ${y - 12} V${y + 12} A14 6 0 0 0 ${x - 16} ${y + 12} V${y - 12}`} />
          <ellipse cx={x + 30} cy={y - 12} rx={14} ry={6} />
          <path d={`M${x + 16} ${y - 12} V${y + 12} A14 6 0 0 0 ${x + 44} ${y + 12} V${y - 12}`} />
          <path d={`M${x - 8} ${y} H${x + 8} M${x + 2} ${y - 6} L${x + 8} ${y} L${x + 2} ${y + 6}`} />
        </>
      )}
      {glyph === 'logs' && (
        <>
          <rect x={x - 22} y={y - 24} width={44} height={48} rx={6} />
          <path d={`M${x - 12} ${y - 10} H${x + 12} M${x - 12} ${y} H${x + 12} M${x - 12} ${y + 10} H${x + 4}`} />
        </>
      )}
    </g>
  )
}

/** Луна и пара звёзд: ночь. */
export function Moon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x + 8} ${y - 30} A32 32 0 1 0 ${x + 30} ${y + 14} A26 26 0 1 1 ${x + 8} ${y - 30} Z`} fill={theme.alt} />
      {[
        [-60, -10],
        [56, -34],
        [70, 26],
      ].map(([dx, dy], i) => (
        <path key={i} d={`M${x + dx} ${y + dy - 7} L${x + dx + 2} ${y + dy - 2} L${x + dx + 7} ${y + dy} L${x + dx + 2} ${y + dy + 2} L${x + dx} ${y + dy + 7} L${x + dx - 2} ${y + dy + 2} L${x + dx - 7} ${y + dy} L${x + dx - 2} ${y + dy - 2} Z`} fill={theme.alt} />
      ))}
    </g>
  )
}

/** Набросок экрана карандашом на листе; draw (0…1) — сколько штрихов уже нарисовано. */
export function Sketch({ x, y, w, h, draw }: { x: number; y: number; w: number; h: number; draw: number }) {
  // штрихи: шапка, три строки списка, крупная кнопка
  const strokes = [
    `M${x + 24} ${y + 30} H${x + w - 24} V${y + 66} H${x + 24} Z`,
    `M${x + 24} ${y + 96} H${x + w - 70}`,
    `M${x + 24} ${y + 128} H${x + w - 40}`,
    `M${x + 24} ${y + 160} H${x + w - 90}`,
    `M${x + 34} ${y + 196} H${x + w - 34} V${y + 236} H${x + 34} Z`,
  ]
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={theme.white} stroke={theme.line} strokeWidth={2.5} transform={`rotate(-2 ${x + w / 2} ${y + h / 2})`} />
      <g transform={`rotate(-2 ${x + w / 2} ${y + h / 2})`}>
        {strokes.map((d, i) => {
          const p = Math.min(1, Math.max(0, draw * strokes.length - i))
          return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} fill="none" stroke={theme.soft} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        })}
      </g>
    </g>
  )
}

export type ScreenKind = 'log' | 'records' | 'profile' | 'wide' | 'tall' | 'grid' | 'list'

/**
 * Экран приложения в стиле дизайн-системы (цвета темы): шапка, блоки и кнопка; (x, y) — левый верхний угол.
 * title — подпись под экраном (18 px), kind — какой набор блоков.
 */
export function MiniScreen({ x, y, w, h, kind, title }: { x: number; y: number; w: number; h: number; kind: ScreenKind; title?: string }) {
  const pad = 12
  // кнопка: обычная, во всю ширину или высокая; строки списка — только те, что помещаются над ней
  const btn = { x: kind === 'wide' ? x + 6 : x + pad + 10, y: kind === 'tall' ? y + h - 76 : y + h - 52, w: kind === 'wide' ? w - 12 : w - 2 * pad - 20, h: kind === 'tall' ? 62 : 36 }
  const first = kind === 'records' || kind === 'profile' ? y + 134 : y + 52
  const rows = Array.from({ length: kind === 'list' ? 5 : kind === 'grid' ? 0 : 3 }, (_, i) => first + i * 30).filter((top) => top + 18 <= btn.y - 6)
  // плитки: два ряда по две, по высоте экрана
  const tileH = Math.min(66, (h - 62) / 2 - 6)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={34} rx={11} fill={theme.accent} />
      <rect x={x + pad} y={y + 14} width={w * 0.45} height={10} rx={5} fill={theme.white} />
      {kind === 'records' && <rect x={x + pad} y={y + 50} width={w - 2 * pad} height={70} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />}
      {kind === 'profile' && <circle cx={x + w / 2} cy={y + 82} r={30} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />}
      {kind === 'grid' &&
        [0, 1, 2, 3].map((i) => <rect key={i} x={x + pad + (i % 2) * ((w - 2 * pad) / 2 + 2)} y={y + 48 + Math.floor(i / 2) * (tileH + 8)} width={(w - 2 * pad) / 2 - 6} height={tileH} rx={8} fill={theme.altTint} stroke={theme.alt} strokeWidth={2} />)}
      {rows.map((top, i) => (
        <rect key={top} x={x + pad} y={top} width={w - 2 * pad - (i % 2) * 24} height={18} rx={6} fill={theme.grid} />
      ))}
      {kind !== 'grid' && <rect x={btn.x} y={btn.y} width={btn.w} height={btn.h} rx={10} fill={theme.alt} />}
      {title !== undefined && (
        <Label x={x + w / 2} y={y + h + 30} size={20} weight={600} color={theme.soft}>
          {title}
        </Label>
      )}
    </g>
  )
}

/** Клавиша клавиатуры с подписью; (x, y) — центр. */
export function Keycap({ x, y, text, w = 64 }: { x: number; y: number; text: string; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 26} width={w} height={52} rx={10} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
      <rect x={x - w / 2 + 5} y={y + 16} width={w - 10} height={5} rx={2.5} fill={theme.grid} />
      <Label x={x} y={y + 8} size={22} weight={700}>
        {text}
      </Label>
    </g>
  )
}

/** Чертёж дома на синей сетке; draw (0…1) — сколько линий уже проведено. */
export function Blueprint({ x, y, w, h, draw }: { x: number; y: number; w: number; h: number; draw: number }) {
  const cx = x + w / 2
  const base = y + h - 46
  const lines = [
    `M${cx - 150} ${base} H${cx + 150}`,
    `M${cx - 130} ${base} V${base - 120} M${cx + 130} ${base} V${base - 120}`,
    `M${cx - 160} ${base - 116} L${cx} ${base - 196} L${cx + 160} ${base - 116}`,
    `M${cx - 30} ${base} V${base - 70} H${cx + 30} V${base}`,
    `M${cx - 104} ${base - 96} h50 v40 h-50 Z M${cx + 54} ${base - 96} h50 v40 h-50 Z`,
  ]
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />
      {Array.from({ length: Math.floor(w / 40) - 1 }, (_, i) => (
        <line key={`v${i}`} x1={x + 40 * (i + 1)} y1={y + 4} x2={x + 40 * (i + 1)} y2={y + h - 4} stroke={theme.accent} strokeOpacity={0.15} strokeWidth={1.5} />
      ))}
      {Array.from({ length: Math.floor(h / 40) - 1 }, (_, i) => (
        <line key={`h${i}`} x1={x + 4} y1={y + 40 * (i + 1)} x2={x + w - 4} y2={y + 40 * (i + 1)} stroke={theme.accent} strokeOpacity={0.15} strokeWidth={1.5} />
      ))}
      {lines.map((d, i) => {
        const p = Math.min(1, Math.max(0, draw * lines.length - i))
        return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} fill="none" stroke={theme.accent} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      })}
    </g>
  )
}

export type AppGlyph = 'list' | 'chart' | 'check' | 'clock' | 'dumbbell'

/** Значок программы: скруглённый квадрат с простым рисунком; (x, y) — левый верхний угол. */
export function AppIcon({ x, y, size, color, glyph }: { x: number; y: number; size: number; color: string; glyph: AppGlyph }) {
  const c = { x: x + size / 2, y: y + size / 2 }
  const s = size / 74
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={18 * s} fill={color} />
      <g transform={`translate(${c.x} ${c.y}) scale(${s})`} stroke={theme.white} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {glyph === 'list' && <path d="M-18 -14 H18 M-18 0 H18 M-18 14 H8" />}
        {glyph === 'chart' && <path d="M-20 18 V4 M-6 18 V-6 M8 18 V-14 M22 18 V-2" />}
        {glyph === 'check' && <path d="M-16 0 L-4 12 L18 -12" />}
        {glyph === 'clock' && (
          <>
            <circle r={18} />
            <path d="M0 -10 V0 L8 6" />
          </>
        )}
        {glyph === 'dumbbell' && <path d="M-20 0 H20 M-14 -10 V10 M14 -10 V10" />}
      </g>
    </g>
  )
}

/** Маленький робот (значок агента без подписи); (x, y) — центр, s — масштаб. */
export function MiniBot({ x, y, s = 1, light = theme.alt }: { x: number; y: number; s?: number; light?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -26 V-36" stroke={theme.accent} strokeWidth={4} strokeLinecap="round" />
      <circle cy={-38} r={5} fill={theme.accent} />
      <rect x={-22} y={-26} width={44} height={32} rx={9} fill={theme.paper} stroke={theme.accent} strokeWidth={4} />
      <circle cx={-8} cy={-10} r={3.5} fill={theme.ink} />
      <circle cx={8} cy={-10} r={3.5} fill={theme.ink} />
      <rect x={-18} y={8} width={36} height={22} rx={6} fill={theme.accent} />
      <circle cy={19} r={4} fill={light} />
    </g>
  )
}

/** Солнце: высоко — день, у горизонта — утро; (x, y) — центр. */
export function Sun({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        return <line key={i} x1={x + Math.cos(a) * (r + 6)} y1={y + Math.sin(a) * (r + 6)} x2={x + Math.cos(a) * (r + 16)} y2={y + Math.sin(a) * (r + 16)} stroke={theme.alt} strokeWidth={4} strokeLinecap="round" />
      })}
      <circle cx={x} cy={y} r={r} fill={theme.alt} />
    </g>
  )
}

/** Указатель мыши; (x, y) — кончик стрелки. */
export function Cursor({ x, y, color = theme.ink }: { x: number; y: number; color?: string }) {
  return <path d={`M${x} ${y} l0 34 l9 -9 l7 15 l7 -3 l-7 -15 l12 0 Z`} fill={theme.white} stroke={color} strokeWidth={3} strokeLinejoin="round" />
}
