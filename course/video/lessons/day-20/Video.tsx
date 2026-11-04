import { LessonVideo } from '../../term/LessonVideo'
import { day20 } from './lesson'

// Ролик day-20 «Бета-тест: исправления»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day20} {...p} />
}
