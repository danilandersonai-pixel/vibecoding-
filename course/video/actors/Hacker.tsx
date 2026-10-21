import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person } from './Person'

export function Hacker(props: ActorProps) {
  return (
    <Actor {...props}>
      <Person color={theme.risk} accessory="hood" />
    </Actor>
  )
}
