// Достаёт из HTML-книги схемы, маркеры стрелок, стили схем и словарь.
// Запуск: node scripts/extract-book.mjs <book.html> <outDir> [cssOut]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

function decode(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (e) => ENTITIES[e]).trim()
}

function readBook(html) {
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

export function extractBook(html) {
  const book = readBook(html)
  const defs = html.match(/<svg width="0" height="0"[^>]*>[\s\S]*?<\/svg>/)
  if (!defs) throw new Error('В книге нет скрытого SVG с маркерами стрелок')
  return { figs: book.figs, defs: defs[0], glossary: parseGlossary(book), css: figureCss(html) }
}

export function writeOutputs(html, outDir, cssOut) {
  const { figs, defs, glossary, css } = extractBook(html)
  const figDir = join(outDir, 'figures')
  mkdirSync(figDir, { recursive: true })
  for (const [id, svg] of Object.entries(figs)) writeFileSync(join(figDir, `${id}.svg`), svg)
  writeFileSync(join(figDir, '_defs.svg'), defs)
  writeFileSync(join(outDir, 'glossary.json'), JSON.stringify(glossary, null, 2) + '\n')
  writeFileSync(cssOut, css)
  return { figures: Object.keys(figs).length, terms: glossary.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [book, outDir, cssOut = 'src/styles/figures.css'] = process.argv.slice(2)
  if (!book || !outDir) {
    console.error('Использование: node scripts/extract-book.mjs <book.html> <outDir> [cssOut]')
    process.exit(1)
  }
  const { readFileSync } = await import('node:fs')
  const { figures, terms } = writeOutputs(readFileSync(book, 'utf8'), outDir, cssOut)
  console.log(`Схем: ${figures}, терминов: ${terms}`)
}
