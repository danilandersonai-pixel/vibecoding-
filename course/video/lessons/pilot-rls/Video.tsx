import { LessonVideo } from '../../term/LessonVideo'
import { pilotRls } from './lesson'

// Ролик pilot-rls «Почему тренер не увидит чужих подопечных»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={pilotRls} {...p} />
}
