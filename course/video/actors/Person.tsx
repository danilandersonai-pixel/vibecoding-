import { theme } from '../theme'

export type Pose = 'stand' | 'point' | 'think' | 'cheer' | 'surprised'
export type Mood = 'neutral' | 'happy' | 'worried'
export type Accessory = 'whistle' | 'dumbbell' | 'hood'

type Arm = { d: string; hand: [number, number] }

// Руки по позам: плечо, локоть, кисть. Левая и правая — с точки зрения зрителя.
const ARMS: Record<Pose, { left: Arm; right: Arm }> = {
  stand: {
    left: { d: 'M-38 -4 L-54 22 L-52 42', hand: [-52, 42] },
    right: { d: 'M38 -4 L54 22 L52 42', hand: [52, 42] },
  },
  point: {
    left: { d: 'M-38 -4 L-54 22 L-52 42', hand: [-52, 42] },
    right: { d: 'M38 -4 L66 -10 L96 -18', hand: [96, -18] },
  },
  think: {
    left: { d: 'M-38 -4 L-54 22 L-52 42', hand: [-52, 42] },
    right: { d: 'M38 -4 L54 26 L22 -22', hand: [22, -22] },
  },
  cheer: {
    left: { d: 'M-38 -4 L-62 -30 L-60 -66', hand: [-60, -66] },
    right: { d: 'M38 -4 L62 -30 L60 -66', hand: [60, -66] },
  },
  surprised: {
    left: { d: 'M-38 -4 L-70 0 L-72 -34', hand: [-72, -34] },
    right: { d: 'M38 -4 L70 0 L72 -34', hand: [72, -34] },
  },
}

// Рот — дуга по настроению.
const MOUTHS: Record<Mood, string> = {
  neutral: 'M-7 -40 L7 -40',
  happy: 'M-9 -42 Q0 -32 9 -42',
  worried: 'M-8 -36 Q0 -45 8 -36',
}

// Простая фигура человека в стиле схем книги; центр — середина фигуры.
export function Person({ color, accessory, pose = 'stand', mood = 'neutral' }: { color: string; accessory?: Accessory; pose?: Pose; mood?: Mood }) {
  const arms = ARMS[pose]
  // Гантель держит правая рука; в позе «думает» правая у подбородка — тогда левая.
  const holder = pose === 'think' ? arms.left : arms.right
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
      {[arms.left, arms.right].map((arm, i) => (
        <path key={i} data-part="arm" d={arm.d} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {accessory === 'dumbbell' && (
        <g transform={`translate(${holder.hand[0]} ${holder.hand[1]})`}>
          <rect x={-18} y={-3} width={36} height={6} fill={theme.ink} />
          <rect x={-24} y={-12} width={8} height={24} rx={2} fill={theme.ink} />
          <rect x={16} y={-12} width={8} height={24} rx={2} fill={theme.ink} />
        </g>
      )}
      {[arms.left, arms.right].map((arm, i) => (
        <circle key={i} cx={arm.hand[0]} cy={arm.hand[1]} r={7} fill={theme.paper} stroke={color} strokeWidth={4} />
      ))}
      {accessory === 'hood' ? (
        <g>
          <rect x={-14} y={-58} width={28} height={8} rx={4} fill={theme.ink} />
          <rect x={-10} y={-56} width={7} height={4} rx={2} fill={theme.paper} />
          <rect x={3} y={-56} width={7} height={4} rx={2} fill={theme.paper} />
        </g>
      ) : (
        <g fill={theme.ink}>
          <circle cx={-8} cy={-56} r={3.5} />
          <circle cx={8} cy={-56} r={3.5} />
        </g>
      )}
      <path data-part="mouth" d={MOUTHS[mood]} fill="none" stroke={theme.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}
