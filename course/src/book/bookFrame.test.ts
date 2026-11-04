import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BOOK_HASH_READ, bookSrcdoc } from './bookFrame'

// Настоящая книга автора. public/book.html — её копия (scripts/copy-book.mjs перед dev и сборкой), в git её нет,
// поэтому читаем исходник: так проверка идёт и до первой сборки
const BOOK = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../vibe-coding-na-praktike-2026-10.html'), 'utf8')

const count = (text: string, part: string) => text.split(part).length - 1

describe('bookSrcdoc', () => {
  it('читалка настоящей книги читает якорь ровно этим фрагментом, один раз (книгу пересобрали — тест упадёт)', () => {
    expect(count(BOOK, BOOK_HASH_READ)).toBe(1)
  })

  it('с разделом: читалка стартует с раздела, якорь адреса больше не читается', () => {
    const doc = bookSrcdoc(BOOK, 's77')
    expect(doc).toContain('"s77"')
    expect(doc).not.toContain(BOOK_HASH_READ)
    expect(doc.length - BOOK.length).toBeLessThan(40)
  })

  it('раздел — строкой JS без «<»: из рамки не выйти закрывающим </script>', () => {
    const doc = bookSrcdoc(`<script>${BOOK_HASH_READ}</script>`, '</script><b>$&"')
    expect(doc).toBe('<script>const h = "\\u003c/script>\\u003cb>$&\\"" || (location.hash || "").slice(1);</script>')
  })

  it('без раздела текст не меняется — книга откроется, где читатель остановился', () => {
    expect(bookSrcdoc(BOOK)).toBe(BOOK)
    expect(bookSrcdoc(BOOK, '')).toBe(BOOK)
  })

  it('текст без фрагмента не меняется', () => {
    const other = '<script>const h = location.hash.slice(1);</script>'
    expect(bookSrcdoc(other, 's77')).toBe(other)
  })

  it('тема курса передаётся книге: тёмная по умолчанию, светлая — по выбору ученика', () => {
    expect(BOOK.startsWith('<!doctype html><html><head>')).toBe(true)
    expect(bookSrcdoc(BOOK, undefined, 'dark')).toContain('<!doctype html><html data-theme="dark"><head>')
    expect(bookSrcdoc(BOOK, 's77', 'light')).toContain('<html data-theme="light"><head>')
    expect(count(bookSrcdoc(BOOK, 's77', 'light'), 'data-theme="light"><head>')).toBe(1)
  })
})
