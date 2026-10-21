import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person } from './Person'

export function Client({ color = theme.ok, ...props }: ActorProps & { color?: string }) {
  return (
    <Actor {...props}>
      <Person color={color} accessory="dumbbell" />
    </Actor>
  )
}
