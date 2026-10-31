import { LessonVideo } from '../../term/LessonVideo'
import { day10 } from './lesson'

// Ролик day-10 «Рекорды и отчёты»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day10} {...p} />
}
