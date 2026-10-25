import type { CourseEntry, TermEntry } from './courseIndex'
import { fold, normalize, queryWords, squash } from './normalize'

// Запись индекса книги (course/content/book-index.json): якорь, глава, раздел, текст. Текст — обычный, без HTML,
// в коде бывают сырые «<» и «&», поэтому выводить его только как текст.
export type BookEntry = { a: string; c: string; s: string; t: string }

// Диапазон [начало, конец) в исходной строке — метка совпадения
export type Mark = [number, number]

export type Hit<T> = { entry: T; titleMarks: Mark[]; snippet: string; snippetMarks: Mark[] }

// Слово из одного знака участвует в совпадении (И), но не подсвечивается: метки на каждой «а» и «в» только мешают
function markable(word: string): boolean {
  return [...word].length > 1
}

// Все вхождения слов в свёрнутой строке; пересекающиеся и соприкасающиеся диапазоны сливаются.
// Слова должны быть свёрнуты (normalize); однознаковые и пустые пропускаются.
function markRanges(folded: string, words: string[]): Mark[] {
  const all: Mark[] = []
  for (const w of words) {
    if (!markable(w)) continue
    for (let i = folded.indexOf(w); i !== -1; i = folded.indexOf(w, i + 1)) all.push([i, i + w.length])
  }
  all.sort((x, y) => x[0] - y[0] || x[1] - y[1])
  const merged: Mark[] = []
  for (const [a, b] of all) {
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  return merged
}

// Фрагмент по уже свёрнутому тексту (fold сохраняет длину, так что позиции общие)
function snippetOf(text: string, folded: string, words: string[], max: number): { snippet: string; marks: Mark[] } {
  if (text === '') return { snippet: '', marks: [] }
  if (text.length <= max) return { snippet: text, marks: markRanges(folded, words) }

  const room = max - 2 // «…» может стоять с обеих сторон
  // Якорь окна — первое вхождение самого длинного слова, которое есть в тексте (при равной длине — более раннее):
  // короткие частые слова («на», «ко») стоят в начале любого абзаца и увели бы окно от искомого
  let first = -1
  let firstLen = 0
  for (const w of words) {
    if (!markable(w)) continue
    const i = folded.indexOf(w)
    if (i !== -1 && (w.length > firstLen || (w.length === firstLen && i < first))) {
      first = i
      firstLen = w.length
    }
  }
  // Окно вокруг якоря: треть места — до него, остальное — после; у конца текста окно сдвигается назад
  let start = first === -1 ? 0 : Math.max(0, first - Math.floor(room / 3))
  let end = Math.min(text.length, start + room)
  start = Math.max(0, end - room)

  // Края окна не режут слова: сдвигаем к ближайшему пробелу, но совпадение остаётся целиком
  const space = (i: number) => /\s/.test(text[i])
  if (start > 0 && !space(start - 1) && !space(start)) {
    const limit = first === -1 ? end : first
    for (let i = start; i < limit; i++) {
      if (space(i)) {
        start = i + 1
        break
      }
    }
  }
  if (end < text.length && !space(end - 1) && !space(end)) {
    const floor = first === -1 ? start : first + firstLen
    for (let i = end - 1; i >= floor; i--) {
      if (space(i)) {
        end = i
        break
      }
    }
  }
  // Окно не режет суррогатную пару; якорь — буквы слова, так что он остаётся внутри
  if (start > 0 && isLow(text, start)) start++
  if (end < text.length && isLow(text, end)) end--
  while (start < end && space(start)) start++
  while (end > start && space(end - 1)) end--

  // «…» — только если обрезано что-то кроме пробелов
  const lead = /\S/.test(text.slice(0, start)) ? '…' : ''
  const tail = /\S/.test(text.slice(end)) ? '…' : ''
  const marks = markRanges(folded.slice(start, end), words).map(([a, b]): Mark => [a + lead.length, b + lead.length])
  return { snippet: lead + text.slice(start, end) + tail, marks }
}

// Вторая половина суррогатной пары стоит на позиции i, а первая — перед ней
function isLow(text: string, i: number): boolean {
  const c = text.charCodeAt(i)
  const p = text.charCodeAt(i - 1)
  return c >= 0xdc00 && c <= 0xdfff && p >= 0xd800 && p <= 0xdbff
}

// Фрагмент до max знаков (вместе с «…») вокруг самого длинного искомого слова, с «…» по краям, если текст обрезан.
// Слова сворачиваются здесь же (подойдут «Агент» и «ЕЛКА»); слова из одного знака в метках не участвуют.
// Совпадения нет (слова нашлись в названии) — начало текста; пустой текст — пустой фрагмент.
export function makeSnippet(text: string, words: string[], max = 160): { snippet: string; marks: Mark[] } {
  const folded = [...new Set(words.flatMap((w) => normalize(w).split(' ')))].filter(markable)
  return snippetOf(text, fold(text), folded, max)
}

// Свёрнутые название и текст записи: книга большая, запрос меняется на каждую букву — сворачиваем один раз
type Folded = { title: string; text: string; foldedTitle: string; foldedText: string }
const cache = new WeakMap<object, Folded>()

function foldedOf(entry: object, title: string, text: string): Folded {
  const known = cache.get(entry)
  if (known && known.title === title && known.text === text) return known
  const fresh = { title, text, foldedTitle: fold(title), foldedText: fold(text) }
  cache.set(entry, fresh)
  return fresh
}

// Порядок внутри группы: название совпадает с запросом целиком → начинается с запроса → все слова в названии → остальное
function rankOf(foldedTitle: string, phrase: string, words: string[]): number {
  const title = squash(foldedTitle)
  if (title === phrase) return 0
  if (title.startsWith(phrase)) return 1
  return words.every((w) => foldedTitle.includes(w)) ? 2 : 3
}

function search<T extends object>(query: string, entries: T[], fields: (e: T) => { title: string; text: string }): Hit<T>[] {
  const words = queryWords(query)
  if (words.length === 0) return []
  const phrase = normalize(query)

  const found: { hit: Hit<T>; rank: number; order: number }[] = []
  entries.forEach((entry, order) => {
    const { title, text } = fields(entry)
    const f = foldedOf(entry, title, text)
    // слово ищется отдельно в названии и в тексте: через границу между ними слова не склеиваются
    if (!words.every((w) => f.foldedTitle.includes(w) || f.foldedText.includes(w))) return
    const { snippet, marks } = snippetOf(text, f.foldedText, words, 160)
    found.push({
      hit: { entry, titleMarks: markRanges(f.foldedTitle, words), snippet, snippetMarks: marks },
      rank: rankOf(f.foldedTitle, phrase, words),
      order,
    })
  })
  // при равном ранге — порядок источника
  return found.sort((x, y) => x.rank - y.rank || x.order - y.order).map((x) => x.hit)
}

export function searchCourse(query: string, entries: CourseEntry[]): Hit<CourseEntry>[] {
  return search(query, entries, (e) => ({ title: e.title, text: e.text }))
}

export function searchTerms(query: string, entries: TermEntry[]): Hit<TermEntry>[] {
  return search(query, entries, (e) => ({ title: e.term, text: e.definition }))
}

// Для книги название — заголовок раздела (а если раздела нет — главы), текст — абзац
export function searchBook(query: string, entries: BookEntry[]): Hit<BookEntry>[] {
  return search(query, entries, (e) => ({ title: e.s || e.c, text: e.t }))
}
