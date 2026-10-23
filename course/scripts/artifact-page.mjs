// Готовит сборку Vite к публикации приватной страницей Claude:
// out/page.html — содержимое страницы без каркаса документа (его добавляет публикация),
// рядом assets/ и книга book.html.
// Запуск: node scripts/artifact-page.mjs <dist> <out>
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function buildArtifactPage(dist, out) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ''
  // Из head берём всё, кроме meta: кодировку и viewport ставит публикация.
  const keep = head
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('<meta'))
  const page = [...keep, body.trim(), '']
    .join('\n')
    .replaceAll('"./assets/', '"assets/')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'page.html'), page)
  rmSync(join(out, 'assets'), { recursive: true, force: true })
  cpSync(join(dist, 'assets'), join(out, 'assets'), { recursive: true })
  cpSync(join(dist, 'book.html'), join(out, 'book.html'))
  return page
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dist = 'dist', out = 'out/artifact'] = process.argv.slice(2)
  buildArtifactPage(dist, out)
  console.log(`Страница для публикации: ${join(out, 'page.html')}`)
}
