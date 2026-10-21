import type { ReactNode } from 'react'
import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'

// Телефон; children рисуются на экране в координатах от -50,-80 до 50,80.
export function Phone({ children, ...props }: ActorProps & { children?: ReactNode }) {
  return (
    <Actor {...props} width={124} height={220}>
      <rect x={-62} y={-110} width={124} height={220} rx={18} fill={theme.ink} />
      <rect x={-54} y={-92} width={108} height={184} rx={6} fill={theme.paper} />
      <rect x={-14} y={-104} width={28} height={5} rx={2.5} fill={theme.soft} />
      {children}
    </Actor>
  )
}
