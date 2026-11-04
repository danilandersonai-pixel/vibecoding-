import { LessonVideo } from '../../term/LessonVideo'
import { day08 } from './lesson'

// Ролик day-08 «Отзывы и фоновые агенты»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day08} {...p} />
}
