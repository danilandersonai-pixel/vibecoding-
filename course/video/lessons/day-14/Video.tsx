import { LessonVideo } from '../../term/LessonVideo'
import { day14 } from './lesson'

// Ролик day-14 «Надёжность»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day14} {...p} />
}
