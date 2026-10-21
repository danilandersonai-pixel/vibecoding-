import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { writeOutputs } from './extract-book.mjs'

const BOOK = join(__dirname, '..', '..', 'vibe-coding-na-praktike-2026-10.html')

describe('extract-book', () => {
  const out = mkdtempSync(join(tmpdir(), 'book-'))
  const css = join(out, 'figures.css')
  writeOutputs(readFileSync(BOOK, 'utf8'), out, css)

  it('пишет SVG схемы с классами оформления книги', () => {
    const svg = readFileSync(join(out, 'figures', 'abc_restaurant.svg'), 'utf8')
    expect(svg).toContain('class="fg-')
  })

  it('пишет словарь книги с термином «Бенчмарк»', () => {
    const glossary = JSON.parse(readFileSync(join(out, 'glossary.json'), 'utf8')) as { term: string; definition: string; refs: string[] }[]
    expect(glossary.length).toBeGreaterThanOrEqual(270)
    const b = glossary.find((g) => g.term === 'Бенчмарк')
    expect(b?.definition).toContain('набор задач')
    expect(b?.refs).toContain('ch1')
  })

  it('пишет стили схем и маркеры стрелок', () => {
    expect(readFileSync(css, 'utf8')).toContain('.fg-hi')
    expect(existsSync(join(out, 'figures', '_defs.svg'))).toBe(true)
    expect(readFileSync(join(out, 'figures', '_defs.svg'), 'utf8')).toContain('id="bk-arrow-acc"')
  })
})
