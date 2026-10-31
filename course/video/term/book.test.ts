import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { bookRef, bookSection } from './book'

type Entry = { a: string; c: string; s: string; t: string }

// Разделы книги: по одной записи на якорь s<N> / sa<N> с непустым названием раздела.
// book-index.json в код роликов не импортируется — из него только пишется снимок book-sections.json.
function sectionsFromIndex() {
  const index: Entry[] = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../content/book-index.json'), 'utf8'))
  const sections: Record<string, { chapter: string; title: string }> = {}
  for (const e of index) {
    if (/^sa?\d+$/.test(e.a) && e.s && !(e.a in sections)) sections[e.a] = { chapter: e.c, title: e.s }
  }
  return sections
}

describe('book-sections.json', () => {
  it('снимок разделов книги совпадает с book-index.json', async () => {
    const sections = sectionsFromIndex()
    expect(Object.keys(sections).length).toBeGreaterThan(90)
    await expect(JSON.stringify(sections, null, 1) + '\n').toMatchFileSnapshot('./book-sections.json')
  })
})

describe('bookSection', () => {
  it('раздел Азбуки: глава и название', () => {
    expect(bookSection('sa3')).toMatchObject({ chapter: 'Азбука', title: 'Где живёт код: терминал, редактор и репозиторий' })
    expect(bookSection('sa3')?.id).toBe('sa3')
  })

  it('раздел главы', () => {
    expect(bookSection('s5')).toMatchObject({ chapter: 'Глава 1 · Введение' })
  })

  it('неизвестный якорь — null, в том числе служебные имена объекта', () => {
    expect(bookSection('s9999')).toBeNull()
    expect(bookSection('')).toBeNull()
    expect(bookSection('constructor')).toBeNull()
    expect(bookSection('toString')).toBeNull()
  })

  it('все разделы из снимка находятся', () => {
    for (const id of Object.keys(sectionsFromIndex())) expect(bookSection(id)?.id).toBe(id)
  })
})

describe('bookRef', () => {
  it('раздел главы: «книга · гл. N · название», не длиннее maxChars', () => {
    const ref = bookRef(['s5'], 56)
    expect(ref.startsWith('книга · гл. 1 · ')).toBe(true)
    expect(ref.length).toBeLessThanOrEqual(56)
    expect(ref.endsWith('…')).toBe(true)
  })

  it('раздел Азбуки: название главы как есть', () => {
    expect(bookRef(['sa3'], 80)).toBe('книга · Азбука · Где живёт код: терминал, редактор и репозиторий')
  })

  it('несколько разделов: первый и счёт остальных', () => {
    expect(bookRef(['sa3', 'sa4', 'sa5'], 80)).toBe('книга · Азбука · Где живёт код: терминал, редактор и репозиторий и ещё 2')
  })

  it('несколько разделов и тесно: обрезается название первого, «и ещё N» остаётся', () => {
    const ref = bookRef(['sa3', 'sa4', 'sa5'], 48)
    expect(ref.length).toBeLessThanOrEqual(48)
    expect(ref).toMatch(/^книга · Азбука · Где живёт код.*… и ещё 2$/)
    // места нет даже под «…» с хвостом — тогда обрезается вся строка
    expect(bookRef(['sa3', 'sa4'], 20)).toHaveLength(20)
  })

  it('неизвестные якоря пропускаются, без разделов — просто «книга»', () => {
    expect(bookRef(['nope', 'sa3'], 80)).toBe('книга · Азбука · Где живёт код: терминал, редактор и репозиторий')
    expect(bookRef(['nope'], 80)).toBe('книга')
    expect(bookRef([], 80)).toBe('книга')
  })

  it('короткий предел обрезает с «…»', () => {
    const ref = bookRef(['sa3'], 20)
    expect(ref).toHaveLength(20)
    expect(ref.endsWith('…')).toBe(true)
  })
})
