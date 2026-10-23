// Герои роликов — плоские SVG-фигуры. Рисунок один в один с макетом, цвета — переменные темы (tokens.css)
type HeroProps = { size?: number; className?: string }

// size — высота в px; ширину считаем из пропорции viewBox, чтобы фигура не сплющивалась
function width(size: number, viewW: number, viewH: number) {
  return Math.round((size * viewW) / viewH)
}

// Тренер: круглая голова, колокол-тело, свисток на шнурке
export function Coach({ size = 112, className }: HeroProps) {
  return (
    <svg width={width(size, 96, 120)} height={size} viewBox="0 0 96 120" className={className} aria-hidden="true">
      <circle cx="48" cy="30" r="20" fill="var(--cover-ink)" />
      <circle cx="41" cy="28" r="2.6" fill="var(--cover-bg)" />
      <circle cx="55" cy="28" r="2.6" fill="var(--cover-bg)" />
      <path d="M41 37q7 5 14 0" stroke="var(--cover-bg)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 120v-30q0-26 34-26t34 26v30z" fill="var(--cover-accent)" />
      <path d="M48 64v22" stroke="var(--cover-ink)" strokeWidth="2" />
      <circle cx="48" cy="90" r="4" fill="var(--cover-ink)" />
    </svg>
  )
}

// Ученик: круглая голова и зелёное тело
export function Student({ size = 112, className }: HeroProps) {
  return (
    <svg width={width(size, 84, 104)} height={size} viewBox="0 0 84 104" className={className} aria-hidden="true">
      <circle cx="42" cy="26" r="18" fill="var(--cover-ink)" />
      <circle cx="36" cy="24" r="2.4" fill="var(--cover-bg)" />
      <circle cx="48" cy="24" r="2.4" fill="var(--cover-bg)" />
      <path d="M36 32q6 4 12 0" stroke="var(--cover-bg)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M12 104v-26q0-22 30-22t30 22v26z" fill="var(--cover-add)" />
    </svg>
  )
}

// Агент: квадратная голова с антенной
export function Agent({ size = 112, className }: HeroProps) {
  return (
    <svg width={width(size, 88, 112)} height={size} viewBox="0 0 88 112" className={className} aria-hidden="true">
      <path d="M44 8v10" stroke="var(--cover-ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="7" r="4" fill="var(--cover-del)" />
      <rect x="18" y="18" width="52" height="40" rx="12" fill="var(--cover-ink)" />
      <circle cx="34" cy="38" r="4" fill="var(--cover-bg)" />
      <circle cx="54" cy="38" r="4" fill="var(--cover-bg)" />
      <path d="M36 48h16" stroke="var(--cover-bg)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="16" y="64" width="56" height="48" rx="14" fill="var(--cover-soft)" />
      <circle cx="44" cy="86" r="6" fill="var(--cover-bg)" />
    </svg>
  )
}
