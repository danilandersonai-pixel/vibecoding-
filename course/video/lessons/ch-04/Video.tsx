import { LessonVideo } from '../../term/LessonVideo'
import { ch04 } from './lesson'

// Ролик ch-04 «Что остаётся человеку»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch04} {...p} />
}
