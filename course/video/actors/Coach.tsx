import { theme } from '../theme'
import { Actor, type ActorProps } from './Actor'
import { Person, type Mood, type Pose } from './Person'

export function Coach({ color = theme.accent, pose, mood, ...props }: ActorProps & { color?: string; pose?: Pose; mood?: Mood }) {
  return (
    <Actor {...props}>
      <Person color={color} accessory="whistle" pose={pose} mood={mood} />
    </Actor>
  )
}
