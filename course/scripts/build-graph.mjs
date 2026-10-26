// Сборка графа знаний курса и книги: узлы и связи строения (часть → глава → раздел → схема, неделя → день → видеоурок).
// Чистые функции без чтения файлов — данные приходят аргументами.

// Главы, которых в графе нет: «Об авторе», «Оформление книги», «Алфавитный указатель» и всё, что в них.
const SKIPPED_CHAPTERS = new Set(['about', 'design', 'index'])
// Длина короткого текста раздела в карточке.
const SECTION_TEXT_MAX = 240

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", shy: '' }
// Границы блоков — пробел, чтобы соседние слова не склеились; строчные теги (`code`, `strong`…) пропадают бесследно.
const BREAKS = /<\/?(?:br|i|p|div|li|ul|ol|tr|td|th|h[1-6]|header)\b[^>]*>/g

// Текст из HTML-фрагмента книги: без тегов, с разобранными сущностями, пробелы схлопнуты.
function plain(html) {
  return html
    .replace(BREAKS, ' ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g, (e, dec, hex, name) => {
      if (name) return name in ENTITIES ? ENTITIES[name] : e
      const code = dec ? Number(dec) : parseInt(hex, 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : e
    })
    .replace(/­/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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
// Глава с номером (`ch1`…) принадлежит части, которая стоит перед ней; «Предисловие», «Азбука»,
// «Словарь терминов» и «Источники» части не имеют.
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
      if (chapter) chapters.push({ block: b, part: /^ch\d+$/.test(b.id) ? part : null })
    } else if (!chapter) continue
    else if (b.t === 'h3') {
      section = b
      sections.push({ block: b, chapter })
    } else if (b.t === 'fig') figures.push({ block: b, chapter, section })
  }
  return { parts, chapters, sections, figures }
}

/**
 * Узлы графа без раскладки (`x`, `y`, `size` добавляет сборка файла).
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
    nodes.push({ id: `ch:${b.id}`, type: 'chapter', label: b.head, text: chapterTitle(b), book: b.id })
  }
  for (const { block: b } of sections) {
    nodes.push({ id: `sec:${b.id}`, type: 'section', label: plain(b.h), text: clip(firstText.get(b.id) ?? '', SECTION_TEXT_MAX), book: b.id })
  }
  for (const { block: b, chapter, section } of figures) {
    nodes.push({ id: `fig:${b.n}`, type: 'figure', label: b.cap, text: '', book: (section ?? chapter).id, figure: b.n })
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
