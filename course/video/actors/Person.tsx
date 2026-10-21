import { theme } from '../theme'

// Простая фигура человека в стиле схем книги; центр — середина фигуры.
export function Person({ color, accessory }: { color: string; accessory?: 'whistle' | 'dumbbell' | 'hood' }) {
  return (
    <g>
      {accessory === 'hood' ? (
        <path d="M-34 -40 Q-36 -82 0 -84 Q36 -82 34 -40 Z" fill={color} />
      ) : null}
      <circle cx={0} cy={-52} r={24} fill={theme.paper} stroke={color} strokeWidth={5} />
      <path d="M-44 70 L-44 10 Q-44 -20 0 -20 Q44 -20 44 10 L44 70 Z" fill={color} />
      {accessory === 'whistle' && (
        <g>
          <path d="M0 -20 L-14 18" stroke={theme.paper} strokeWidth={3} fill="none" />
          <rect x={-24} y={16} width={18} height={12} rx={4} fill={theme.paper} />
        </g>
      )}
      {accessory === 'dumbbell' && (
        <g transform="translate(56 30)">
          <rect x={-18} y={-3} width={36} height={6} fill={theme.ink} />
          <rect x={-24} y={-12} width={8} height={24} rx={2} fill={theme.ink} />
          <rect x={16} y={-12} width={8} height={24} rx={2} fill={theme.ink} />
        </g>
      )}
      {accessory === 'hood' && <rect x={-14} y={-58} width={28} height={8} rx={4} fill={theme.ink} />}
    </g>
  )
}
