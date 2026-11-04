import { LessonVideo } from '../../term/LessonVideo'
import { ch11 } from './lesson'

// Ролик ch-11 «Что дальше»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch11} {...p} />
}
