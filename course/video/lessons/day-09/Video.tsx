import { LessonVideo } from '../../term/LessonVideo'
import { day09 } from './lesson'

// Ролик day-09 «Программы тренировок»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day09} {...p} />
}
