import { LessonVideo } from '../../term/LessonVideo'
import { ch09 } from './lesson'

// Ролик ch-09 «Этика вайб-кодинга»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch09} {...p} />
}
