import { LessonVideo } from '../../term/LessonVideo'
import { ch03 } from './lesson'

// Ролик ch-03 «Проблема 70%»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch03} {...p} />
}
