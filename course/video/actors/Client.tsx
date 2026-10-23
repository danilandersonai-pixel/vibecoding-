import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person, type Mood, type Pose } from './Person'

export function Client({ color = theme.ok, pose, mood, ...props }: ActorProps & { color?: string; pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={color} accessory="dumbbell" pose={pose} mood={mood} />
    </Actor>
  )
}
