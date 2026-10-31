import { LessonVideo } from '../../term/LessonVideo'
import { day13 } from './lesson'

// Ролик day-13 «Своё отличие»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day13} {...p} />
}
