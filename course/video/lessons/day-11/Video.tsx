import { LessonVideo } from '../../term/LessonVideo'
import { day11 } from './lesson'

// Ролик day-11 «Комментарии и уведомления»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day11} {...p} />
}
