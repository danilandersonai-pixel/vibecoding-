import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person } from './Person'

export function Coach({ color = theme.accent, ...props }: ActorProps & { color?: string }) {
  return (
    <Actor {...props}>
      <Person color={color} accessory="whistle" />
    </Actor>
  )
}
