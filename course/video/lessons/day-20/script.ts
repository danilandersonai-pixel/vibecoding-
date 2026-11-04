import type { VideoScript } from '../../types'
import data from './script.gen.json'

// Сценарий ролика day-20 для сайта — снимок buildLesson(day20).script: lesson.test.ts сверяет его со сборкой, поэтому
// JSON (у него fps: number, а не 30) приводится к VideoScript. Записи сессий и код кадров в основной файл сайта не попадают:
// они в ленивом куске ролика (Video.tsx).
export const day20Script = data as VideoScript
