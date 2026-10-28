import sections from './book-sections.json'
import { fitText } from './text'

// Разделы книги для шапки кадра. book-sections.json — выжимка из content/book-index.json (id раздела → глава и название);
// её пишет и проверяет book.test.ts, а в код роликов book-index.json не попадает: он весит сотни килобайт.

type Section = { chapter: string; title: string }
const SECTIONS: Record<string, Section> = sections

/** Раздел книги по якорю (s5, sa3…); неизвестный → null. */
export function bookSection(id: string): { id: string; chapter: string; title: string } | null {
  if (!Object.hasOwn(SECTIONS, id)) return null
  return { id, ...SECTIONS[id] }
}

// «Глава 1 · Введение» → «гл. 1»; «Азбука» остаётся как есть.
function shortChapter(chapter: string): string {
  const m = /^Глава (\d+)/.exec(chapter)
  return m ? `гл. ${m[1]}` : chapter
}

/**
 * Ссылка на книгу для шапки: «книга · Азбука · Код, языки и чужие детали», для глав — «книга · гл. 1 · …».
 * Для нескольких разделов — первый и «и ещё N»; неизвестные якоря пропускаются. Длиннее maxChars не бывает: обрезается с «…»
 * название первого раздела, а «и ещё N» остаётся (если под название не остаётся и пяти знаков — обрезается вся строка).
 */
export function bookRef(ids: string[], maxChars: number): string {
  const found = ids.map(bookSection).filter((s) => s !== null)
  if (found.length === 0) return fitText('книга', maxChars)
  const [first, ...rest] = found
  const more = rest.length > 0 ? ` и ещё ${rest.length}` : ''
  const head = `книга · ${shortChapter(first.chapter)} · `
  const room = maxChars - [...head].length - [...more].length
  if (more && [...first.title].length > room && room >= 5) return head + fitText(first.title, room) + more
  return fitText(`${head}${first.title}${more}`, maxChars)
}
