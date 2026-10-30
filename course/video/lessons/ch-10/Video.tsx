import { LessonVideo } from '../../term/LessonVideo'
import { ch10 } from './lesson'

// Ролик ch-10 «Фоновые агенты»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch10} {...p} />
}
