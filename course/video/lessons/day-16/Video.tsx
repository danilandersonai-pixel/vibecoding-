import { LessonVideo } from '../../term/LessonVideo'
import { day16 } from './lesson'

// Ролик day-16 «Питание»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day16} {...p} />
}
