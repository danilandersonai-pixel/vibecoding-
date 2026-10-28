import { LessonVideo } from '../../term/LessonVideo'
import { chAbc } from './lesson'

// Ролик ch-abc «Как устроено приложение»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={chAbc} {...p} />
}
