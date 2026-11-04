import { LessonVideo } from '../../term/LessonVideo'
import { ch01 } from './lesson'

// Ролик ch-01 «Вайб-кодинг: шкала, а не выключатель»: общий ролик урока по описанию lesson.ts. debugSpots — рамки пояснений для снимков.
export default function Video(p: { debugSpots?: boolean }) {
  return <LessonVideo lesson={ch01} {...p} />
}
