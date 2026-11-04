import { LessonVideo } from '../../term/LessonVideo'
import { day15 } from './lesson'

// Ролик day-15 «Первое знакомство и полировка»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day15} {...p} />
}
