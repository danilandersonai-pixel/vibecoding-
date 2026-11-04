import { LessonVideo } from '../../term/LessonVideo'
import { day17 } from './lesson'

// Ролик day-17 «Замеры и фото прогресса»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={day17} {...p} />
}
