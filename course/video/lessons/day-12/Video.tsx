import { LessonVideo } from '../../term/LessonVideo'
import { day12 } from './lesson'

// Ролик day-12 «Приглашение по ссылке»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day12} {...p} />
}
