import { LessonVideo } from '../../term/LessonVideo'
import { ch12 } from './lesson'

// Ролик ch-12 «Своё приложение по образцу»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch12} {...p} />
}
