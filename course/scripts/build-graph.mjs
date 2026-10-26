// Сборка графа знаний курса и книги: узлы, связи строения (часть → глава → раздел → схема, неделя → день → видеоурок),
// упоминания терминов (в словаре и в тексте книги) и раскладка; пишет `content/graph.json`.
// Запуск: node scripts/build-graph.mjs <book.html> <contentDir>
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { plain, readBook } from './extract-book.mjs'

// Главы, которых в графе нет: «Об авторе», «Оформление книги», «Алфавитный указатель» и всё, что в них.
const SKIPPED_CHAPTERS = new Set(['about', 'design', 'index'])
// Приложения после последней части — без части.
const APPENDICES = new Set(['glossary', 'sources'])
// Длина короткого текста раздела в карточке.
const SECTION_TEXT_MAX = 240

// Заголовок главы целиком: текст `h2` («Введение: что такое вайб-кодинг?»), без «Глава» и номера из шапки.
function chapterTitle(block) {
  const h2 = block.h.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)
  return plain(h2 ? h2[1] : block.h)
}

// Обрезка по границе слова до `max` знаков вместе с «…».
function clip(text, max) {
  if (text.length <= max) return text
  const head = text.slice(0, max - 1)
  const cut = /\s/.test(text[max - 1]) ? head.length : head.lastIndexOf(' ')
  return (cut > 0 ? head.slice(0, cut) : head) + '…'
}

// Строение книги по порядку блоков: части, главы графа (с частью), разделы и схемы (с главой и разделом).
// Глава принадлежит части, которая стоит перед ней; «Предисловие» и «Азбука» стоят до первой части,
// «Словарь терминов» и «Источники» — приложения: части не имеют.
function scanBook(blocks) {
  const parts = []
  const chapters = []
  const sections = []
  const figures = []
  let part = null
  let chapter = null
  let section = null
  for (const b of blocks) {
    if (b.t === 'part') {
      parts.push(b)
      part = b
      chapter = section = null
    } else if (b.t === 'ch') {
      section = null
      chapter = SKIPPED_CHAPTERS.has(b.id) ? null : b
      if (chapter) chapters.push({ block: b, part: APPENDICES.has(b.id) ? null : part })
    } else if (!chapter) continue
    else if (b.t === 'h3') {
      section = b
      sections.push({ block: b, chapter })
    } else if (b.t === 'fig') figures.push({ block: b, chapter, section })
  }
  return { parts, chapters, sections, figures }
}

/**
 * Узлы графа без раскладки (`x`, `y`, `size` добавляет `layout`).
 * `bookIndex` — записи индекса книги `{ a, c, s, t }`: из них берётся короткий текст раздела.
 */
export function buildNodes({ book, glossary, bookIndex, weeks, days }) {
  const { parts, chapters, sections, figures } = scanBook(book.blocks)
  // Первый фрагмент текста раздела: заголовок раздела в индексе (`t === s`) не считается.
  const firstText = new Map()
  for (const e of bookIndex) if (e.t !== e.s && !firstText.has(e.a)) firstText.set(e.a, e.t)

  const nodes = []
  for (const b of parts) nodes.push({ id: `part:${b.num}`, type: 'part', label: `Часть ${b.num} · ${b.title}`, text: '' })
  for (const { block: b } of chapters) {
    nodes.push({ id: `ch:${b.id}`, type: 'chapter', label: plain(b.head), text: chapterTitle(b), book: b.id })
  }
  for (const { block: b } of sections) {
    nodes.push({ id: `sec:${b.id}`, type: 'section', label: plain(b.h), text: clip(firstText.get(b.id) ?? '', SECTION_TEXT_MAX), book: b.id })
  }
  for (const { block: b, chapter, section } of figures) {
    nodes.push({ id: `fig:${b.n}`, type: 'figure', label: plain(b.cap), text: '', book: (section ?? chapter).id, figure: b.n })
  }
  glossary.forEach((g, i) => {
    const node = { id: `term:${i + 1}`, type: 'term', label: g.term, text: g.definition }
    if (g.refs.length) node.book = g.refs[0]
    nodes.push(node)
  })
  for (const w of weeks) nodes.push({ id: `week:${w.number}`, type: 'week', label: `Неделя ${w.number} · ${w.title}`, text: w.result })
  for (const d of days) nodes.push({ id: `day:${d.number}`, type: 'day', label: `День ${d.number} · ${d.title}`, text: d.goal, day: d.number })
  // Видеоурок один на весь курс; если ролик назван в двух днях, узел остаётся у первого.
  const videos = new Map()
  for (const d of days) {
    for (const b of d.blocks ?? []) {
      if (b.type !== 'video' || videos.has(b.videoId)) continue
      videos.set(b.videoId, { id: `video:${b.videoId}`, type: 'video', label: b.title, text: `День ${d.number} · ${d.title}`, day: d.number, video: b.videoId })
    }
  }
  return [...nodes, ...videos.values()]
}

// Глава ролика по его id: `ch-04` → `ch:ch4` (без ведущего нуля), `ch-abc` → `ch:abc`; ролики дней и пилота — без главы.
function videoChapter(videoId) {
  const m = videoId.match(/^ch-(.+)$/)
  if (!m) return null
  return /^\d+$/.test(m[1]) ? `ch:ch${Number(m[1])}` : `ch:${m[1]}`
}

/**
 * Связи строения книги и курса (§3 спецификации, кроме `term-term` и `term-text`).
 * Петель и повторов пары и вида нет; связь с отсутствующим узлом не создаётся.
 */
export function structureEdges({ book, glossary, weeks, days }) {
  const { chapters, sections, figures } = scanBook(book.blocks)
  const ids = new Set(buildNodes({ book, glossary, bookIndex: [], weeks, days }).map((n) => n.id))
  const found = new Map()
  const link = (s, t, kind) => {
    if (s !== t && ids.has(s) && ids.has(t)) found.set(`${kind}\t${s}\t${t}`, { s, t, kind })
  }

  for (const { block, part } of chapters) if (part) link(`part:${part.num}`, `ch:${block.id}`, 'part-ch')
  for (const { block, chapter } of sections) link(`ch:${chapter.id}`, `sec:${block.id}`, 'ch-sec')
  for (const { block, chapter, section } of figures) {
    if (section) link(`sec:${section.id}`, `fig:${block.n}`, 'sec-fig')
    else link(`ch:${chapter.id}`, `fig:${block.n}`, 'ch-fig')
  }
  glossary.forEach((g, i) => {
    for (const ref of g.refs) link(`term:${i + 1}`, `ch:${ref}`, 'term-ch')
  })

  const termByName = new Map()
  glossary.forEach((g, i) => {
    if (!termByName.has(g.term)) termByName.set(g.term, `term:${i + 1}`)
  })
  for (const d of days) {
    const day = `day:${d.number}`
    link(`week:${d.week}`, day, 'week-day')
    for (const b of d.blocks ?? []) {
      if (b.type === 'video') {
        link(day, `video:${b.videoId}`, 'day-video')
        const ch = videoChapter(b.videoId)
        if (ch) link(`video:${b.videoId}`, ch, 'video-ch')
      }
    }
    for (const name of d.cards ?? []) if (termByName.has(name)) link(day, termByName.get(name), 'day-term')
    for (const b of d.blocks ?? []) {
      if (b.bookRef?.section) link(day, `sec:${b.bookRef.section}`, 'day-sec')
      if ((b.type === 'diagram' || b.type === 'idea') && b.figure) link(day, `fig:${b.figure}`, 'day-fig')
    }
  }
  return [...found.values()]
}

// Нормализация — как в поиске курса (`src/search/normalize.ts`): нижний регистр, «ё» → «е»,
// всё кроме букв, цифр и знаков ударения — пробел, пробелы схлопнуты.
const SEPARATOR = /[^\p{L}\p{N}\p{M}]/gu

export function normalize(text) {
  let lower = text.toLowerCase()
  // У редких букв (İ) строчная форма длиннее — их поиск оставляет как есть, и здесь так же.
  if (lower.length !== text.length) {
    lower = Array.from(text, (ch) => {
      const l = ch.toLowerCase()
      return l.length === ch.length ? l : ch
    }).join('')
  }
  return lower.replaceAll('ё', 'е').replace(SEPARATOR, ' ').replace(/ +/g, ' ').trim()
}

const words = (normalized) => (normalized ? normalized.split(' ') : [])

// Варианты термина: название без скобок и текст в скобках, если он не короче 2 знаков.
export function termVariants(term) {
  const name = normalize(term.replace(/\([^)]*\)/g, ' '))
  const inner = [...term.matchAll(/\(([^)]*)\)/g)].map((m) => normalize(m[1])).filter((v) => v.length >= 2)
  return [...new Set([name, ...inner])].filter(Boolean)
}

// Слово варианта до 4 знаков совпадает только целым словом, длиннее — по началу длиной max(4, длина − 2).
function wordMatches(variantWord, word) {
  if (variantWord.length <= 4) return word === variantWord
  return word.startsWith(variantWord.slice(0, Math.max(4, variantWord.length - 2)))
}

// Слова варианта идут в тексте подряд.
function hasRun(variantWords, textWords) {
  for (let i = 0; i + variantWords.length <= textWords.length; i++) {
    if (variantWords.every((v, j) => wordMatches(v, textWords[i + j]))) return true
  }
  return false
}

/** Упомянут ли термин (любой из нормализованных вариантов) в нормализованном тексте. */
export function mentions(variants, normalizedText) {
  const textWords = words(normalizedText)
  return variants.some((v) => hasRun(words(v), textWords))
}

/**
 * Связи упоминаний: `term-term` — термин упомянут в статье словаря другого термина (название и определение:
 * «Агент фонового программирования» упоминает «Агент» уже в названии), сам себя термин не упоминает;
 * `term-text` — термин во фрагментах индекса книги, `w` — число фрагментов. Фрагмент с якорем раздела ведёт
 * к разделу, с якорем главы (введение до первого раздела) — к главе; заголовок раздела (`t === s`) — не текст.
 * `chapterOf` — якорь главы или раздела графа → id главы; фрагменты с другими якорями пропускаются.
 */
export function mentionEdges({ glossary, bookIndex, chapterOf }) {
  const variants = glossary.map((g) => termVariants(g.term).map(words))
  const mentioned = (i, textWords) => variants[i].some((v) => hasRun(v, textWords))
  const edges = []

  glossary.forEach((g, i) => {
    const entry = words(normalize(`${g.term} ${g.definition}`))
    glossary.forEach((_, j) => {
      if (i !== j && mentioned(j, entry)) edges.push({ s: `term:${i + 1}`, t: `term:${j + 1}`, kind: 'term-term' })
    })
  })

  const fragments = []
  for (const e of bookIndex) {
    const chapter = chapterOf.get(e.a)
    if (chapter && e.t !== e.s) fragments.push({ target: e.a === chapter ? `ch:${e.a}` : `sec:${e.a}`, words: words(normalize(e.t)) })
  }
  glossary.forEach((_, i) => {
    const weight = new Map()
    for (const f of fragments) if (mentioned(i, f.words)) weight.set(f.target, (weight.get(f.target) ?? 0) + 1)
    for (const [t, w] of weight) edges.push({ s: `term:${i + 1}`, t, kind: 'term-text', w })
  })
  return edges
}

// Размер узла: 3–14 по логарифму числа связей; шагов раскладки — как у d3-force до остановки.
const SIZE_MIN = 3
const SIZE_MAX = 14
const LAYOUT_TICKS = 300

// Генератор случайных чисел от зерна (mulberry32): раскладка не зависит от `Math.random` и времени.
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// До 0,1; `|| 0` убирает «-0».
const round = (v) => Math.round(v * 10) / 10 || 0

/** Силовая раскладка: те же узлы с `x`, `y` (до 0,1) и `size`; при том же `seed` — те же числа. */
export function layout(nodes, edges, seed = 1) {
  const degree = new Map(nodes.map((n) => [n.id, 0]))
  for (const e of edges) {
    degree.set(e.s, degree.get(e.s) + 1)
    degree.set(e.t, degree.get(e.t) + 1)
  }
  const top = Math.log1p(Math.max(0, ...degree.values()))
  const sizes = nodes.map((n) => (top ? SIZE_MIN + ((SIZE_MAX - SIZE_MIN) * Math.log1p(degree.get(n.id))) / top : SIZE_MIN))
  const points = nodes.map((n, i) => ({ id: n.id, r: sizes[i] }))
  // Таймер симуляции останавливается сразу: шаги считаются синхронно.
  forceSimulation(points)
    .stop()
    .randomSource(seededRandom(seed))
    .force('link', forceLink(edges.map((e) => ({ source: e.s, target: e.t }))).id((p) => p.id))
    .force('charge', forceManyBody())
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide((p) => p.r))
    .tick(LAYOUT_TICKS)
  return nodes.map((n, i) => ({ ...n, x: round(points[i].x), y: round(points[i].y), size: round(sizes[i]) }))
}

/** Весь граф: узлы с раскладкой, связи строения и упоминаний. */
export function buildGraph({ book, glossary, bookIndex, weeks, days }) {
  const { chapters, sections } = scanBook(book.blocks)
  const chapterOf = new Map()
  for (const { block } of chapters) chapterOf.set(block.id, block.id)
  for (const { block, chapter } of sections) chapterOf.set(block.id, chapter.id)
  const edges = [...structureEdges({ book, glossary, weeks, days }), ...mentionEdges({ glossary, bookIndex, chapterOf })]
  return { nodes: layout(buildNodes({ book, glossary, bookIndex, weeks, days }), edges), edges }
}

/** Источники графа: книга, словарь, индекс книги, недели и дни (по номеру) из `contentDir`. */
export function readSources(bookFile, contentDir) {
  const json = (...path) => JSON.parse(readFileSync(join(contentDir, ...path), 'utf8'))
  const days = readdirSync(join(contentDir, 'days'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => json('days', f))
    .sort((a, b) => a.number - b.number)
  return {
    book: readBook(readFileSync(bookFile, 'utf8')),
    glossary: json('glossary.json'),
    bookIndex: json('book-index.json'),
    weeks: json('weeks.json'),
    days,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [bookFile, contentDir] = process.argv.slice(2)
  if (!bookFile || !contentDir) {
    console.error('Использование: node scripts/build-graph.mjs <book.html> <contentDir>')
    process.exit(1)
  }
  const graph = buildGraph(readSources(bookFile, contentDir))
  writeFileSync(join(contentDir, 'graph.json'), JSON.stringify(graph) + '\n')
  console.log(`Узлов: ${graph.nodes.length}, связей: ${graph.edges.length}`)
}
