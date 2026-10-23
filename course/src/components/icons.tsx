import type { ReactNode } from 'react'

// Линейные значки 24×24: цвет берут от текста (currentColor), от экранных дикторов скрыты — рядом всегда есть подпись
type IconProps = { size?: number }

function Icon({ size = 18, strokeWidth = 2, fill = 'none', children }: IconProps & { strokeWidth?: number; fill?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Стрелка вправо — жирнее остальных, как на кнопках макета
export const IconArrow = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.4}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

// Треугольник «играть» — закрашенный
export const IconPlay = ({ size }: IconProps) => (
  <Icon size={size} fill="currentColor">
    <path d="M8 5.5v13l11-6.5z" />
  </Icon>
)

export const IconPause = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M9 5v14M15 5v14" />
  </Icon>
)

export const IconBook = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11a1 1 0 0 1 1 1v15a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 16.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13a1 1 0 0 0-1 1v15a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z" />
  </Icon>
)

export const IconCheck = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)

// Развернуть на весь экран — четыре уголка
export const IconExpand = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4" />
  </Icon>
)

// Ролик — экран с треугольником, как в строке дня макета
export const IconVideo = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10 9l5 3-5 3z" />
  </Icon>
)

// Шаги дня — три строки с точками
export const IconSteps = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M10 6h10M10 12h10M10 18h10" />
    <circle cx="5" cy="6" r="1" />
    <circle cx="5" cy="12" r="1" />
    <circle cx="5" cy="18" r="1" />
  </Icon>
)
