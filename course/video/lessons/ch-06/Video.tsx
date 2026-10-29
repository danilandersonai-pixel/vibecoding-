import { LessonVideo } from '../../term/LessonVideo'
import { ch06 } from './lesson'

// Ролик ch-06 «Прототип за вечер»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch06} {...p} />
}
