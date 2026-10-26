// Достаёт из HTML-книги схемы, маркеры стрелок, стили схем, словарь и индекс текста для поиска.
// Запуск: node scripts/extract-book.mjs <book.html> <outDir> [cssOut]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENTITIES = { nbsp: '\u00a0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", shy: '' }

// Теги — только `<тег …>` и `</тег>`: голое «<» из текста («символы вроде <code><</code>») остаётся.
function decode(html) {
  return html
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g, (e, dec, hex, name) => {
      if (name) return name in ENTITIES ? ENTITIES[name] : e
      const code = dec ? Number(dec) : parseInt(hex, 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : e
    })
    .replace(/\u00ad/g, '')
    .trim()
}

export function readBook(html) {
  const marker = 'const BOOK = '
  const start = html.indexOf(marker)
  if (start < 0) throw new Error('В файле нет данных книги (const BOOK = …)')
  // Объект BOOK — валидный JSON, ищем его конец по балансу скобок вне строк.
  let depth = 0
  let inString = false
  for (let i = start + marker.length; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return JSON.parse(html.slice(start + marker.length, i + 1))
  }
  throw new Error('Данные книги обрываются')
}

function parseGlossary(book) {
  const list = book.blocks.find((b) => b.t === 'list' && b.c === 'gl')
  if (!list) throw new Error('В книге нет словаря (список с классом gl)')
  return list.items.map((item) => {
    const term = item.match(/<strong class="tt">(.*?)<\/strong>/)
    const refsAt = item.indexOf('<span class="refs">')
    const body = item.slice(term ? item.indexOf('</strong>') + 9 : 0, refsAt < 0 ? undefined : refsAt)
    return {
      term: decode(term ? term[1] : ''),
      definition: decode(body).replace(/^—\s*/, ''),
      refs: [...item.matchAll(/data-go="([^"]+)"/g)].map((m) => m[1]),
    }
  })
}

function figureCss(html) {
  const rules = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)]
    .flatMap((m) => m[1].match(/[^{}]*\.fg-[^{}]*\{[^{}]*\}/g) ?? [])
    .map((r) => r.replace(/\/\*[\s\S]*?\*\//g, '').trim())
  return [
    '/* Сгенерировано scripts/extract-book.mjs из книги — не править руками. */',
    '.figure svg{display:block;width:100%;height:auto;margin:0 auto;font-family:var(--font-ui)}',
    '.figure-missing{padding:24px;border:1px dashed var(--fig-grid);border-radius:6px;color:var(--ink-soft);font:400 .85em/1.4 var(--font-ui);text-align:center}',
    ...rules,
    '',
  ].join('\n')
}

// Индекс текста книги для окна поиска: плоский список записей по порядку книги.
// `a` — id ближайшего предшествующего блока `ch`/`h3` (якорь в книге), `c` — название главы,
// `s` — заголовок текущего раздела (пусто до первого `h3` главы), `t` — чистый текст.
/** @typedef {{ a: string, c: string, s: string, t: string }} BookEntry */

const squash = (text) => text.replace(/\s+/g, ' ').trim()
// Границы блоков (абзац, пункт, ячейка, разделитель `<i>`) — пробел, чтобы соседние слова не склеились;
// строчные теги (`strong`, `code`, `a`…) пропадают бесследно: «<code>RLS</code>-политика» остаётся «RLS-политика».
const BREAKS = /<\/?(?:br|i|p|div|li|ul|ol|tr|td|th|h[1-6]|header)\b[^>]*>/g
export const plain = (html) => squash(decode(html.replace(BREAKS, ' ')))
// Ячейки таблицы — каждая отдельным пунктом, иначе соседние слова склеятся.
const cells = (row) => [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => plain(m[1]))
// Подпись врезки («Совет», «Внимание», «Простыми словами») отделена от текста: «Внимание: Таблицы…», а не «Внимание Таблицы…».
const noteText = (html) => plain(html.replace(/<span class="nl">([\s\S]*?)<\/span>\s*/, '$1: '))

/** @returns {BookEntry[]} */
export function bookSearchIndex(book) {
  const entries = []
  let a = ''
  let c = ''
  let s = ''
  // До первого `ch`/`h3` якоря нет — такие записи пропускаем, как и пустые.
  const add = (t) => {
    if (a && t) entries.push({ a, c, s, t })
  }
  const join = (parts) => parts.filter(Boolean).join(' · ')
  for (const b of book.blocks) {
    if (b.t === 'ch') {
      a = b.id
      c = plain(b.head)
      s = ''
    } else if (b.t === 'h3') {
      a = b.id
      s = plain(b.h)
      add(s)
    } else if (b.t === 'p') add(plain(b.h))
    else if (b.t === 'note') add(noteText(b.h))
    // Словарь (`gl`) ищется отдельной группой «Термины»; алфавитный указатель (`idx`) — слова со ссылками, шум в выдаче.
    else if (b.t === 'list') {
      if (b.c !== 'gl' && b.c !== 'idx') add(join(b.items.map(plain)))
    }
    // Код — обычный текст, а не HTML (книга сама экранирует его при показе): угловые скобки и «&» сохраняем.
    else if (b.t === 'code') add(squash([b.label, ...b.lines].join(' ')))
    else if (b.t === 'table') add(join([b.head, ...b.rows].flatMap(cells)))
    else if (b.t === 'fig') add(plain(b.cap))
  }
  return entries
}

export function extractBook(html) {
  const book = readBook(html)
  const defs = html.match(/<svg width="0" height="0"[^>]*>[\s\S]*?<\/svg>/)
  if (!defs) throw new Error('В книге нет скрытого SVG с маркерами стрелок')
  return { figs: book.figs, defs: defs[0], glossary: parseGlossary(book), css: figureCss(html), bookIndex: bookSearchIndex(book) }
}

export function writeOutputs(html, outDir, cssOut) {
  const { figs, defs, glossary, css, bookIndex } = extractBook(html)
  const figDir = join(outDir, 'figures')
  mkdirSync(figDir, { recursive: true })
  for (const [id, svg] of Object.entries(figs)) writeFileSync(join(figDir, `${id}.svg`), svg)
  writeFileSync(join(figDir, '_defs.svg'), defs)
  writeFileSync(join(outDir, 'glossary.json'), JSON.stringify(glossary, null, 2) + '\n')
  writeFileSync(join(outDir, 'book-index.json'), JSON.stringify(bookIndex) + '\n')
  writeFileSync(cssOut, css)
  return { figures: Object.keys(figs).length, terms: glossary.length, bookEntries: bookIndex.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [book, outDir, cssOut = 'src/styles/figures.css'] = process.argv.slice(2)
  if (!book || !outDir) {
    console.error('Использование: node scripts/extract-book.mjs <book.html> <outDir> [cssOut]')
    process.exit(1)
  }
  const { readFileSync } = await import('node:fs')
  const { figures, terms, bookEntries } = writeOutputs(readFileSync(book, 'utf8'), outDir, cssOut)
  console.log(`Схем: ${figures}, терминов: ${terms}, записей индекса книги: ${bookEntries}`)
}
