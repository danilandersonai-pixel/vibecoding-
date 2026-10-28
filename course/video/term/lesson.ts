import type { FrameSpec } from './frames'

// Урок как данные (спецификация §6): главы по каркасу (§6.2), в главах — сцены из готовых кадров набора «Репозиторий».
// Время считается из реплик (PACE в kit/script.ts); всё, что меняется в кадре, привязано к номеру реплики (at — с нуля),
// поэтому правка текста не рассинхронизирует картинку. Собирает урок buildLesson (build.ts), проверяет lessonProblems (problems.ts).

/** Роль сцены в каркасе: что узнаете, объяснение, пример на записи, типичная ошибка, итог. */
export type Role = 'intro' | 'explain' | 'example' | 'mistake' | 'summary'

export type LessonScene = {
  /** id сцены — уникальный во всём уроке. */
  id: string
  role: Role
  /** Кадр и его данные (frames/index.ts). */
  frame: FrameSpec
  /** Реплики: из них считается время сцены, субтитры и озвучка. */
  lines: string[]
  /** Камера: с реплики at наезд на часть кадра (focusShot) или весь кадр ('whole'); без ключей — весь кадр. */
  camera?: { at: number; target: string | 'whole' }[]
  /**
   * Пояснения по нажатию на часть кадра target: с реплики at до реплики until; без until — до конца сцены минус 12 кадров,
   * until = числу реплик — до самого конца (проверка этого не пропустит: последние 12 кадров — смена сцены).
   */
  spots?: { at: number; until?: number; target: string; title: string; text: string }[]
  /** Только у сцены mistake: с реплики at в шапке «Неверно» (wrong) или «Верно» (right); сначала wrong. */
  verdict?: { at: number; kind: 'wrong' | 'right' }[]
}

export type LessonChapter = {
  id: string
  /** Название — в шапке кадра, на полосе перемотки и в списке глав плеера. */
  title: string
  /** Разделы книги главы; без них — разделы урока. */
  book?: string[]
  scenes: LessonScene[]
}

export type Lesson = {
  /** id ролика: 'ch-abc' — он же id сценария и композиции. */
  id: string
  kind: 'chapter' | 'day'
  title: string
  /** Разделы книги урока: ['sa1', …]. */
  book: string[]
  /** Первая глава — «Что узнаете» (у ролика дня — «Что строим сегодня»), последняя — «Итог» («Проверьте у себя»). */
  chapters: LessonChapter[]
}
