import { LessonVideo } from '../../term/LessonVideo'
import { ch02 } from './lesson'

// Ролик ch-02 «Как говорить с ИИ, чтобы он понял»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch02} {...p} />
}
