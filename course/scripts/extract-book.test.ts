import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { bookSearchIndex, readBook, writeOutputs } from './extract-book.mjs'

const BOOK = join(__dirname, '..', '..', 'vibe-coding-na-praktike-2026-10.html')

type BookEntry = { a: string; c: string; s: string; t: string }
const index = (blocks: object[]): BookEntry[] => bookSearchIndex({ blocks })

// Маленькая книга-образец: две главы, у первой есть раздел.
const SAMPLE = [
  { t: 'p', h: 'Текст до первой главы — якоря нет, запись пропускается.' },
  { t: 'ch', id: 'ch1', head: 'Введение', h: '<header class="ch-open"><h2>Введение: что такое вайб-кодинг?</h2></header>' },
  { t: 'p', h: 'Абзац сразу под заголовком главы.' },
  { t: 'h3', id: 's1', h: '<h3>Что такое RLS</h3>' },
  { t: 'p', h: 'Политики строк защищают данные.' },
  { t: 'ch', id: 'ch2', head: 'Азбука', h: '<header class="ch-open"><h2>Азбука: слова на каждый день</h2></header>' },
  { t: 'p', h: 'Первый абзац второй главы.' },
]

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

  it('пишет book-index.json компактным JSON и без служебных частей', () => {
    const raw = readFileSync(join(out, 'book-index.json'), 'utf8')
    expect(raw.trimEnd()).not.toContain('\n')
    const entries = JSON.parse(raw) as BookEntry[]
    expect(entries.length).toBeGreaterThan(500)
    expect(entries.every((e) => e.a && e.c && e.t && typeof e.s === 'string')).toBe(true)
  })

  it('в индексе настоящей книги есть раздел про RLS', () => {
    const book = readBook(readFileSync(BOOK, 'utf8')) as { blocks: { t: string; id?: string }[] }
    const anchors = new Set(book.blocks.filter((b) => b.t === 'ch' || b.t === 'h3').map((b) => b.id))
    const rls = bookSearchIndex(book).filter((e: BookEntry) => /Row Level Security/.test(e.t))
    expect(rls.length).toBeGreaterThan(0)
    expect(rls.every((e: BookEntry) => anchors.has(e.a))).toBe(true)
    expect(rls[0]).toMatchObject({ a: 's43', c: expect.stringContaining('Глава 7'), s: 'Проектирование и интеграция баз данных' })
  })

  it('в индексе настоящей книги нет тегов и сущностей, а код сохранён как есть', () => {
    const book = readBook(readFileSync(BOOK, 'utf8')) as { blocks: { t: string }[] }
    const leftovers = /<\/?[a-zA-Z]|&(#\d+|#x[0-9a-f]+|[a-z]+);/i
    const text = bookSearchIndex({ blocks: book.blocks.filter((b) => b.t !== 'code') })
    expect(text.filter((e: BookEntry) => leftovers.test(e.t))).toEqual([])
    expect(text.filter((e: BookEntry) => /\s{2}/.test(e.t))).toEqual([])
    expect(bookSearchIndex(book).some((e: BookEntry) => e.t.includes('z.infer<typeof CheckinInput>'))).toBe(true)
  })

  it('алфавитный указатель книги не попадает в индекс', () => {
    const book = readBook(readFileSync(BOOK, 'utf8'))
    const entries: BookEntry[] = bookSearchIndex(book)
    expect(entries.filter((e) => /Автодополнение|гл\. \d/.test(e.t) && e.a === 'index')).toEqual([])
    // Вступительный абзац главы «Алфавитный указатель» остаётся.
    expect(entries.filter((e) => e.a === 'index')).toHaveLength(1)
  })
})

describe('bookSearchIndex', () => {
  it('запись знает главу, раздел и якорь', () => {
    expect(index(SAMPLE)).toEqual([
      { a: 'ch1', c: 'Введение', s: '', t: 'Абзац сразу под заголовком главы.' },
      { a: 's1', c: 'Введение', s: 'Что такое RLS', t: 'Что такое RLS' },
      { a: 's1', c: 'Введение', s: 'Что такое RLS', t: 'Политики строк защищают данные.' },
      { a: 'ch2', c: 'Азбука', s: '', t: 'Первый абзац второй главы.' },
    ])
  })

  it('словарь и алфавитный указатель книги не попадают в индекс', () => {
    const entries = index([
      ...SAMPLE.slice(1, 3),
      { t: 'list', tag: 'ul', c: 'ul', items: ['<li>Первый пункт</li>', '<li><strong>Второй</strong> пункт</li>'] },
      { t: 'list', tag: 'ul', c: 'gl', items: ['<li><strong class="tt">Бенчмарк</strong> — набор задач</li>'] },
      { t: 'list', tag: 'ul', c: 'idx', items: ['<li><span class="tt">Агент</span><i></i><span class="refs">гл.&nbsp;<button class="go" data-go="ch1">1</button></span></li>'] },
    ])
    expect(entries.map((e) => e.t)).toEqual(['Абзац сразу под заголовком главы.', 'Первый пункт · Второй пункт'])
  })

  it('запросы, таблицы и подписи схем ищутся', () => {
    const entries = index([
      SAMPLE[1],
      { t: 'code', c: 'prompt', label: 'Запрос', lines: ['Сделай форму входа.', '  Не добавляй библиотек.'] },
      {
        t: 'table',
        cols: 2,
        head: '<tr><th>Часть</th><th>Как в ресторане</th></tr>',
        rows: ['<tr><td>Бэкенд</td><td>Кухня</td></tr>', '<tr><td>Сервер</td><td>Здание кухни</td></tr>'],
      },
      { t: 'fig', n: 'abc_restaurant', cap: 'Рис. А.1 · приложение как ресторан' },
    ])
    expect(entries.map((e) => e.t)).toEqual([
      'Запрос Сделай форму входа. Не добавляй библиотек.',
      'Часть · Как в ресторане · Бэкенд · Кухня · Сервер · Здание кухни',
      'Рис. А.1 · приложение как ресторан',
    ])
  })

  it('теги и сущности убраны, пробелы схлопнуты', () => {
    const entries = index([
      SAMPLE[1],
      { t: 'p', h: 'Ключ&nbsp;<strong>API</strong>   и&nbsp;&amp;&nbsp;пароль\n  &lt;секрет&gt; &quot;в&quot; &#39;коде&#39;' },
      { t: 'p', h: 'Не&#8209;сломать, мяг&shy;кий знак &#1105;, &#x41;' },
      { t: 'note', h: '<div class="note tip"><span class="nl">Совет</span> Проверьте <code><</code> и <code>&</code> в поле.</div>' },
      { t: 'p', h: '<em> </em>&nbsp;' },
    ])
    expect(entries.map((e) => e.t)).toEqual([
      'Ключ API и & пароль <секрет> "в" \'коде\'',
      'Не\u2011сломать, мягкий знак ё, A',
      'Совет Проверьте < и & в поле.',
    ])
  })

  it('границы блоков не склеивают слова, а внутри слова теги пропадают бесследно', () => {
    const entries = index([
      SAMPLE[1],
      { t: 'list', tag: 'ul', c: 'ul', items: ['<li><span class="tt">Агент</span><i></i><span class="refs">гл.&nbsp;<button class="go" data-go="ch1">1</button></span></li>'] },
      { t: 'p', h: '<p>Первый</p><p>второй, <code>RLS</code>-политика и <strong>Н</strong>ачало<br>конец</p>' },
    ])
    expect(entries.map((e) => e.t)).toEqual(['Агент гл. 1', 'Первый второй, RLS-политика и Начало конец'])
  })

  it('код берётся как есть: угловые скобки и & не теряются', () => {
    const entries = index([
      SAMPLE[1],
      { t: 'code', label: 'TypeScript', lines: ['type T = z.infer<typeof Input>;', 'if (a && b) return;'] },
    ])
    expect(entries[0].t).toBe('TypeScript type T = z.infer<typeof Input>; if (a && b) return;')
  })

  it('служебные блоки и пустые записи не выводятся', () => {
    const entries = index([
      { t: 'part', id: 'p1', num: 'I', title: 'Основы', h: '<div class="part-in">Основы</div>' },
      SAMPLE[1],
      { t: 'lbl', h: '<div class="lbl">Упражнения</div>' },
      { t: 'p', h: '<span></span>' },
      { t: 'list', tag: 'ul', c: 'ul', items: [] },
      { t: 'code', label: '', lines: [] },
    ])
    expect(entries).toEqual([])
  })
})
