import { LessonVideo } from '../../term/LessonVideo'
import { ch08 } from './lesson'

// Ролик ch-08 «Безопасность и надёжность»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch08} {...p} />
}
