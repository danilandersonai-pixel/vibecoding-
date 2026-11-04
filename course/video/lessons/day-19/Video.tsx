import { LessonVideo } from '../../term/LessonVideo'
import { day19 } from './lesson'

// Ролик day-19 «Бета-тест: запуск»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day19} {...p} />
}
