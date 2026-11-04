import { LessonVideo } from '../../term/LessonVideo'
import { day18 } from './lesson'

// Ролик day-18 «Тренировка без интернета»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day18} {...p} />
}
