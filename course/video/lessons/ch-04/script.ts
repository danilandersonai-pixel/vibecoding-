import type { VideoScript } from '../../types'
import data from './script.gen.json'

// Сценарий ролика ch-04 для сайта — снимок buildLesson(ch04).script: lesson.test.ts сверяет его со сборкой, поэтому
// JSON (у него fps: number, а не 30) приводится к VideoScript. Записи сессий и код кадров в основной файл сайта не попадают:
// они в ленивом куске ролика (Video.tsx).
export const ch04Script = data as VideoScript
