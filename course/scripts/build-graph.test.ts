import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { buildNodes, structureEdges } from './build-graph.mjs'

type GraphNode = { id: string; type: string; label: string; text: string; book?: string; day?: number; video?: string; figure?: string }
type GraphEdge = { s: string; t: string; kind: string; w?: number }

const header = (title: string) => `<header class="ch-open"><h2>${title}</h2></header>`
const chapter = (id: string, head: string, title: string) => ({
  t: 'ch',
  id,
  head,
  h: head.startsWith('Глава')
    ? `<header class="ch-open"><div class="ch-kicker">Глава</div><div class="ch-big">${head.match(/\d+/)![0]}</div><h2>${title}</h2></header>`
    : header(title),
})
const part = (id: string, num: string, title: string) => ({ t: 'part', id, num, title, h: `<div class="part-in"><h2 class="pt-title">${title}</h2></div>` })

// Маленькая книга-образец: до первой части — «Предисловие» и «Азбука», две части, приложения в конце,
// главы «Об авторе», «Оформление» и «Указатель» с разделом и схемой внутри — их в графе нет.
const BOOK = {
  blocks: [
    chapter('pre', 'Предисловие', 'Предисловие'),
    { t: 'fig', n: 'pre_map', cap: 'Рис. П.1 · карта книги' },
    chapter('abc', 'Азбука', 'Азбука: слова на каждый день'),
    part('p1', 'I', 'Основы'),
    chapter('ch1', 'Глава 1 · Введение', 'Введение: что такое вайб-кодинг?'),
    { t: 'fig', n: 'x0', cap: 'Рис. 1.1 · карта главы' },
    { t: 'p', h: 'Введение к главе.' },
    { t: 'h3', id: 's1', h: '<h3>Что такое <code>RLS</code></h3>' },
    { t: 'p', h: 'Политики строк защищают данные.' },
    { t: 'fig', n: 'x1', cap: 'Рис. 1.2 · политика строк' },
    chapter('ch2', 'Глава 2 · Запросы', 'Искусство составления запросов'),
    { t: 'h3', id: 's2', h: '<h3>Хороший запрос</h3>' },
    { t: 'fig', n: 'x2', cap: 'Рис. 2.1 · запрос' },
    part('p2', 'II', 'Практика'),
    chapter('ch3', 'Глава 3 · Проблема 70%', 'Проблема 70%: как работать по-настоящему'),
    chapter('glossary', 'Словарь терминов', 'Словарь терминов'),
    chapter('about', 'Об авторе', 'Об авторе'),
    { t: 'h3', id: 's9', h: '<h3>Кто я</h3>' },
    { t: 'fig', n: 'about_fig', cap: 'Рис. А.9 · автор' },
    chapter('design', 'Оформление книги', 'Оформление книги'),
    { t: 'fig', n: 'design_fig', cap: 'Рис. О.1 · оформление' },
    chapter('index', 'Алфавитный указатель', 'Алфавитный указатель'),
    { t: 'h3', id: 's10', h: '<h3>А</h3>' },
    chapter('sources', 'Источники', 'Источники'),
  ],
}

const BOOK_INDEX = [
  { a: 'ch1', c: 'Глава 1 · Введение', s: '', t: 'Введение к главе.' },
  { a: 's1', c: 'Глава 1 · Введение', s: 'Что такое RLS', t: 'Что такое RLS' },
  { a: 's1', c: 'Глава 1 · Введение', s: 'Что такое RLS', t: 'Политики строк защищают данные.' },
  { a: 's1', c: 'Глава 1 · Введение', s: 'Что такое RLS', t: 'Второй абзац раздела.' },
]

const GLOSSARY = [
  { term: 'Агент', definition: 'ИИ, который действует.', refs: ['ch1'] },
  // Повтор главы и глава, которой нет в графе, — связи только с ch1 и ch2, по одной.
  { term: 'Бенчмарк', definition: 'Набор задач.', refs: ['ch1', 'ch1', 'about', 'ch2'] },
  { term: 'Токен', definition: 'Кусочек текста.', refs: ['abc'] },
]

const WEEKS = [{ number: 1, title: 'Вся книга и первая работающая версия', result: 'Приложение на телефоне.' }]

const DAYS = [
  {
    number: 1,
    week: 1,
    title: 'Прототип экранов',
    goal: 'Собрать прототип.',
    // «Нет такого» в словаре нет — пропускается без ошибки.
    cards: ['Агент', 'Токен', 'Нет такого'],
    blocks: [
      { type: 'video', videoId: 'ch-01', title: 'Введение в курс' },
      { type: 'video', videoId: 'ch-abc', title: 'Азбука вайб-кодинга' },
      { type: 'video', videoId: 'day-08', title: 'Выбор стека' },
      { type: 'idea', figure: 'x1', bookRef: { section: 's1', label: 'Что такое RLS' } },
      { type: 'diagram', figure: 'x2' },
    ],
  },
  // Без `cards` и с одним роликом — поля читаются с запасным значением.
  { number: 2, week: 1, title: 'Данные', goal: 'Подключить данные.', blocks: [{ type: 'video', videoId: 'pilot-rls', title: 'Пилот: RLS' }] },
]

const nodesOf = (days: object[] = DAYS): GraphNode[] =>
  buildNodes({ book: BOOK, glossary: GLOSSARY, bookIndex: BOOK_INDEX, weeks: WEEKS, days })
const edgesOf = (days: object[] = DAYS): GraphEdge[] => structureEdges({ book: BOOK, glossary: GLOSSARY, weeks: WEEKS, days })
const pairs = (edges: GraphEdge[], kind: string) => edges.filter((e) => e.kind === kind).map((e) => `${e.s} → ${e.t}`)

describe('build-graph: узлы', () => {
  it('узлы всех типов с id, подписями и текстом', () => {
    const nodes = nodesOf()
    const byId = (id: string) => nodes.find((n) => n.id === id)
    expect(byId('part:I')).toEqual({ id: 'part:I', type: 'part', label: 'Часть I · Основы', text: '' })
    expect(byId('ch:ch1')).toEqual({
      id: 'ch:ch1',
      type: 'chapter',
      label: 'Глава 1 · Введение',
      text: 'Введение: что такое вайб-кодинг?',
      book: 'ch1',
    })
    expect(byId('sec:s1')).toEqual({
      id: 'sec:s1',
      type: 'section',
      label: 'Что такое RLS',
      text: 'Политики строк защищают данные.',
      book: 's1',
    })
    expect(byId('fig:x1')).toEqual({ id: 'fig:x1', type: 'figure', label: 'Рис. 1.2 · политика строк', text: '', book: 's1', figure: 'x1' })
    // Схема до первого раздела главы указывает на главу.
    expect(byId('fig:x0')).toMatchObject({ book: 'ch1', figure: 'x0' })
    expect(byId('term:1')).toEqual({ id: 'term:1', type: 'term', label: 'Агент', text: 'ИИ, который действует.', book: 'ch1' })
    expect(byId('term:2')).toMatchObject({ label: 'Бенчмарк', book: 'ch1' })
    expect(byId('week:1')).toEqual({
      id: 'week:1',
      type: 'week',
      label: 'Неделя 1 · Вся книга и первая работающая версия',
      text: 'Приложение на телефоне.',
    })
    expect(byId('day:1')).toEqual({ id: 'day:1', type: 'day', label: 'День 1 · Прототип экранов', text: 'Собрать прототип.', day: 1 })
    expect(byId('video:ch-01')).toEqual({
      id: 'video:ch-01',
      type: 'video',
      label: 'Введение в курс',
      text: 'День 1 · Прототип экранов',
      day: 1,
      video: 'ch-01',
    })
    expect(byId('video:pilot-rls')).toMatchObject({ day: 2, text: 'День 2 · Данные' })
    // Текст главы — полный заголовок из `h2`, без «Глава» и номера; подпись — короткое `head`.
    expect(byId('ch:abc')).toMatchObject({ label: 'Азбука', text: 'Азбука: слова на каждый день' })
  })

  it('число узлов по типам и неповторяющиеся id', () => {
    const nodes = nodesOf()
    const count = (type: string) => nodes.filter((n) => n.type === type).length
    expect([count('part'), count('chapter'), count('section'), count('figure')]).toEqual([2, 7, 2, 4])
    expect([count('term'), count('week'), count('day'), count('video')]).toEqual([3, 1, 2, 4])
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length)
  })

  it('главы about, design, index и всё в них не входят', () => {
    const ids = nodesOf().map((n) => n.id)
    for (const gone of ['ch:about', 'ch:design', 'ch:index', 'sec:s9', 'sec:s10', 'fig:about_fig', 'fig:design_fig']) {
      expect(ids).not.toContain(gone)
    }
    const touched = edgesOf().filter((e) => /about|design|index|s9|s10/.test(e.s + e.t))
    expect(touched).toEqual([])
  })

  it('текст раздела — первый фрагмент индекса, не равный заголовку, обрезанный до 240 знаков по границе слова', () => {
    // Пробел приходится ровно на 240-й знак («слово » × 60) и на середину слова («абвгдежз » × 40).
    const longs = { a: 'слово '.repeat(60).trim(), d: 'абвгдежз '.repeat(40).trim() }
    const exact = 'я'.repeat(240)
    const heading = (id: string, title: string) => ({ t: 'h3', id, h: `<h3>${title}</h3>` })
    const book = {
      blocks: [chapter('ch1', 'Глава 1 · Введение', 'Введение'), heading('a', 'Длинный'), heading('b', 'Пустой'), heading('c', 'Ровно'), heading('d', 'Длинный 2')],
    }
    const entry = (a: string, s: string, text: string) => ({ a, c: 'Глава 1 · Введение', s, t: text })
    const bookIndex = [
      entry('a', 'Длинный', 'Длинный'),
      entry('a', 'Длинный', longs.a),
      entry('a', 'Длинный', 'Другой абзац.'),
      entry('b', 'Пустой', 'Пустой'),
      entry('c', 'Ровно', exact),
      entry('d', 'Длинный 2', longs.d),
    ]
    const nodes: GraphNode[] = buildNodes({ book, glossary: [], bookIndex, weeks: [], days: [] })
    const text = (id: string) => nodes.find((n) => n.id === id)!.text
    for (const [id, long] of Object.entries(longs)) {
      const cut = text(`sec:${id}`)
      expect(cut.length).toBeLessThanOrEqual(240)
      expect(cut.endsWith('…')).toBe(true)
      expect(cut).not.toMatch(/\s…$/)
      const head = cut.slice(0, -1)
      expect(long.startsWith(head)).toBe(true)
      expect(long[head.length]).toBe(' ') // оборвано на границе слова, а не посреди «абвгдежз»
    }
    expect(text('sec:b')).toBe('')
    expect(text('sec:c')).toBe(exact)
  })
})

describe('build-graph: связи', () => {
  it('главы до первой части и после последней главы части — без части', () => {
    const partCh = pairs(edgesOf(), 'part-ch')
    expect(partCh).toEqual(['part:I → ch:ch1', 'part:I → ch:ch2', 'part:II → ch:ch3'])
    for (const free of ['ch:pre', 'ch:abc', 'ch:glossary', 'ch:sources']) {
      expect(edgesOf().filter((e) => e.kind === 'part-ch' && e.t === free)).toEqual([])
    }
  })

  it('связи строения книги', () => {
    const edges = edgesOf()
    expect(pairs(edges, 'ch-sec')).toEqual(['ch:ch1 → sec:s1', 'ch:ch2 → sec:s2'])
    expect(pairs(edges, 'sec-fig')).toEqual(['sec:s1 → fig:x1', 'sec:s2 → fig:x2'])
    // Схема до первого раздела главы — прямая связь главы со схемой, не раздела.
    expect(pairs(edges, 'ch-fig')).toEqual(['ch:pre → fig:pre_map', 'ch:ch1 → fig:x0'])
  })

  it('связи курса', () => {
    const edges = edgesOf()
    expect(pairs(edges, 'week-day')).toEqual(['week:1 → day:1', 'week:1 → day:2'])
    expect(pairs(edges, 'day-video')).toEqual([
      'day:1 → video:ch-01',
      'day:1 → video:ch-abc',
      'day:1 → video:day-08',
      'day:2 → video:pilot-rls',
    ])
    // Термин находится по названию из `cards`; «Нет такого» пропущен, у дня 2 нет `cards`.
    expect(pairs(edges, 'day-term')).toEqual(['day:1 → term:1', 'day:1 → term:3'])
    expect(pairs(edges, 'day-sec')).toEqual(['day:1 → sec:s1'])
    expect(pairs(edges, 'day-fig')).toEqual(['day:1 → fig:x1', 'day:1 → fig:x2'])
    // ch-01 → ch1 (без ведущего нуля), ch-abc → abc; ролики дней и пилот без главы.
    expect(pairs(edges, 'video-ch')).toEqual(['video:ch-01 → ch:ch1', 'video:ch-abc → ch:abc'])
  })

  it('номер главы ролика читается без ведущего нуля', () => {
    const days = [
      {
        number: 1,
        week: 1,
        title: 'Т',
        goal: 'Ц',
        blocks: [
          { type: 'video', videoId: 'ch-03', title: 'Три' },
          { type: 'video', videoId: 'ch-07', title: 'Семь, главы нет' },
        ],
      },
    ]
    expect(pairs(edgesOf(days), 'video-ch')).toEqual(['video:ch-03 → ch:ch3'])
  })

  it('термин связан с главами из refs, без повторов', () => {
    const edges = edgesOf()
    expect(pairs(edges, 'term-ch')).toEqual(['term:1 → ch:ch1', 'term:2 → ch:ch1', 'term:2 → ch:ch2', 'term:3 → ch:abc'])
  })

  it('нет петель и повторов пары и вида', () => {
    // Дни с повторами: те же ролик, термин, схема и раздел названы дважды.
    const tangled = [
      {
        number: 1,
        week: 1,
        title: 'Т',
        goal: 'Ц',
        cards: ['Агент', 'Агент'],
        blocks: [
          { type: 'video', videoId: 'ch-01', title: 'Введение' },
          { type: 'video', videoId: 'ch-01', title: 'Введение ещё раз' },
          { type: 'idea', figure: 'x1', bookRef: { section: 's1', label: 'RLS' } },
          { type: 'diagram', figure: 'x1', bookRef: { section: 's1', label: 'RLS' } },
        ],
      },
      { number: 2, week: 1, title: 'Т2', goal: 'Ц2', blocks: [{ type: 'video', videoId: 'ch-01', title: 'Введение' }] },
    ]
    for (const days of [DAYS, tangled]) {
      const edges = edgesOf(days)
      const keys = edges.map((e) => `${e.kind} ${e.s} ${e.t}`)
      expect(new Set(keys).size).toBe(keys.length)
      expect(edges.filter((e) => e.s === e.t)).toEqual([])
      const ids = new Set(nodesOf(days).map((n) => n.id))
      expect(edges.filter((e) => !ids.has(e.s) || !ids.has(e.t))).toEqual([])
    }
    // Один видеоурок в двух днях и дважды в одном — один узел, остаётся у первого дня и с первым названием.
    const videos = nodesOf(tangled).filter((n) => n.type === 'video')
    expect(videos).toEqual([{ id: 'video:ch-01', type: 'video', label: 'Введение', text: 'День 1 · Т', day: 1, video: 'ch-01' }])
  })
})
