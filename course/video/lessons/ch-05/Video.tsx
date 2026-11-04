import { LessonVideo } from '../../term/LessonVideo'
import { ch05 } from './lesson'

// Ролик ch-05 «Читать код, который написал ИИ»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch05} {...p} />
}
