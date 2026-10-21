import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person, type Mood, type Pose } from './Person'

export function Hacker({ pose, mood, ...props }: ActorProps & { pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={theme.risk} accessory="hood" pose={pose} mood={mood} />
    </Actor>
  )
}
