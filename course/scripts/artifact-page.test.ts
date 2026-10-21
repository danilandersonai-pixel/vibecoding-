import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { buildArtifactPage } from './artifact-page.mjs'

const INDEX = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600&display=swap" rel="stylesheet" />
    <title>Вайб-курс</title>
    <script type="module" crossorigin src="./assets/index-abc.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-def.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

describe('artifact-page', () => {
  const dist = mkdtempSync(join(tmpdir(), 'dist-'))
  const out = mkdtempSync(join(tmpdir(), 'out-'))
  mkdirSync(join(dist, 'assets'))
  writeFileSync(join(dist, 'index.html'), INDEX)
  writeFileSync(join(dist, 'assets', 'index-abc.js'), 'console.log(1)')
  writeFileSync(join(dist, 'assets', 'index-def.css'), 'body{}')
  writeFileSync(join(dist, 'book.html'), '<!doctype html><title>Книга</title>')
  buildArtifactPage(dist, out)
  const page = readFileSync(join(out, 'page.html'), 'utf8')

  it('оставляет заголовок, шрифты, стили, скрипт и #root с путями assets/…', () => {
    expect(page).toContain('<title>Вайб-курс</title>')
    expect(page).toContain('href="https://fonts.googleapis.com/css2?family=Onest')
    expect(page).toContain('<script type="module" crossorigin src="assets/index-abc.js"></script>')
    expect(page).toContain('href="assets/index-def.css"')
    expect(page).toContain('<div id="root"></div>')
    expect(page).not.toContain('./assets/')
  })

  it('без собственного каркаса документа', () => {
    expect(page).not.toMatch(/<html|<head|<body|<!doctype/i)
  })

  it('кладёт рядом сборку и книгу', () => {
    expect(existsSync(join(out, 'assets', 'index-abc.js'))).toBe(true)
    expect(existsSync(join(out, 'assets', 'index-def.css'))).toBe(true)
    expect(existsSync(join(out, 'book.html'))).toBe(true)
  })
})
