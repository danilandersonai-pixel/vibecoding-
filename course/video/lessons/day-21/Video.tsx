import { LessonVideo } from '../../term/LessonVideo'
import { day21 } from './lesson'

// Ролик day-21 «Запуск»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day21} {...p} />
}
