import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { normalize as searchNormalize } from '../src/search/normalize'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { buildGraph, buildNodes, layout, mentionEdges, mentions, normalize, readSources, structureEdges, termVariants } from './build-graph.mjs'

type GraphNode = { id: string; type: string; label: string; text: string; book?: string; day?: number; video?: string; figure?: string }
type GraphEdge = { s: string; t: string; kind: string; w?: number }
type PlacedNode = GraphNode & { x: number; y: number; size: number }

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
    // Глава без номера в id внутри части — часть ей даёт позиция, а не id.
    chapter('ch2a', 'Глава 2 · Дополнение', 'Дополнение к главе 2'),
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
    expect([count('part'), count('chapter'), count('section'), count('figure')]).toEqual([2, 8, 2, 4])
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

  it('сущности в заголовках главы, раздела и подписи схемы разобраны', () => {
    const book = {
      blocks: [
        chapter('ch1', 'Глава 1 · Тесты &amp; отладка', 'Тесты &amp;&nbsp;отладка'),
        { t: 'h3', id: 's1', h: '<h3>Код&nbsp;&amp; <code>данные</code></h3>' },
        { t: 'fig', n: 'x1', cap: 'Рис. 1.1 · A&nbsp;&amp;&nbsp;B' },
      ],
    }
    const nodes: GraphNode[] = buildNodes({ book, glossary: [], bookIndex: [], weeks: [], days: [] })
    const byId = (id: string) => nodes.find((n) => n.id === id)
    expect(byId('ch:ch1')).toMatchObject({ label: 'Глава 1 · Тесты & отладка', text: 'Тесты & отладка' })
    expect(byId('sec:s1')).toMatchObject({ label: 'Код & данные' })
    expect(byId('fig:x1')).toMatchObject({ label: 'Рис. 1.1 · A & B' })
  })

  it('термин без refs — без ключа book', () => {
    const glossary = [{ term: 'Песочница', definition: 'Изолированная среда.', refs: [] }]
    const [node] = buildNodes({ book: { blocks: [] }, glossary, bookIndex: [], weeks: [], days: [] })
    expect(node).toEqual({ id: 'term:1', type: 'term', label: 'Песочница', text: 'Изолированная среда.' })
    expect(node).not.toHaveProperty('book')
  })
})

describe('build-graph: связи', () => {
  it('главы до первой части и после последней главы части — без части', () => {
    const partCh = pairs(edgesOf(), 'part-ch')
    expect(partCh).toEqual(['part:I → ch:ch1', 'part:I → ch:ch2', 'part:I → ch:ch2a', 'part:II → ch:ch3'])
    for (const free of ['ch:pre', 'ch:abc', 'ch:glossary', 'ch:sources']) {
      expect(edgesOf().filter((e) => e.kind === 'part-ch' && e.t === free)).toEqual([])
    }
  })

  it('глава внутри части получает часть по позиции, а не по id', () => {
    expect(pairs(edgesOf(), 'part-ch')).toContain('part:I → ch:ch2a')
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

describe('build-graph: упоминания терминов', () => {
  it('варианты термина: без скобок и из скобок', () => {
    expect(termVariants('Политики доступа к строкам (RLS)')).toEqual(['политики доступа к строкам', 'rls'])
    expect(termVariants('Агент')).toEqual(['агент'])
    // Скобки без латинских букв — не вариант: «ии» иначе нашлось бы почти в каждом разделе.
    expect(termVariants('Модель (ИИ)')).toEqual(['модель'])
    expect(termVariants('Код ответа (401, 400, 404, 201)')).toEqual(['код ответа'])
    // Скобки с запятыми — несколько вариантов, каждый по тому же правилу латиницы; повторов нет.
    expect(termVariants('Карточка модели (model card, system card)')).toEqual(['карточка модели', 'model card', 'system card'])
    expect(termVariants('Копилефт (например, GPL)')).toEqual(['копилефт', 'gpl'])
    expect(termVariants('MCP (MCP)')).toEqual(['mcp'])
  })

  it('короткие слова — только целиком', () => {
    // Кириллица до 2 букв и латиница — только целым словом.
    expect(mentions(['ос'], 'своя ос')).toBe(true)
    expect(mentions(['ос'], 'осы и осень')).toBe(false)
    expect(mentions(['rls'], 'политики rls')).toBe(true)
  })

  it('слово из 3 букв — само и до 2 букв окончания', () => {
    expect(mentions(['код'], 'пишет код')).toBe(true)
    expect(mentions(['код'], 'нет кода')).toBe(true)
    expect(mentions(['код'], 'с кодом')).toBe(true)
    expect(mentions(['код'], 'коды ответа')).toBe(true)
    expect(mentions(['код'], 'кодинг и кодовая база')).toBe(false)
    expect(mentions(['код'], 'перекодировка')).toBe(false)
    // Окончание — после слова, не приставка перед ним: «лог» не находит «блог».
    expect(mentions(['лог'], 'свой блог')).toBe(false)
  })

  it('латинские слова — только целиком, любой длины', () => {
    expect(mentions(['api'], 'ключ api')).toBe(true)
    expect(mentions(['api'], 'два apis')).toBe(false)
    expect(mentions(['model'], 'model')).toBe(true)
    expect(mentions(['model'], 'models')).toBe(false)
    expect(mentions(['model card'], 'model card модели')).toBe(true)
    expect(mentions(['model card'], 'models cards')).toBe(false)
  })

  it('слово из 4 букв — само и до 3 букв окончания', () => {
    expect(mentions(['тест'], 'тест')).toBe(true)
    expect(mentions(['тест'], 'тесты')).toBe(true)
    expect(mentions(['тест'], 'тестов')).toBe(true)
    expect(mentions(['тест'], 'тестами')).toBe(true)
    // Окончание длиннее 3 букв — уже другое слово по правилу (§3.1).
    expect(mentions(['тест'], 'тестовая')).toBe(false)
    expect(mentions(['тест'], 'тестирование')).toBe(false)
    expect(mentions(['тест'], 'автотест')).toBe(false)
    expect(mentions(['тест'], 'протест')).toBe(false)
  })

  it('слово из 5 букв на гласную, «ь» или «й» — первые 4 буквы и до 3 букв окончания', () => {
    expect(mentions(['ветка'], 'ветки')).toBe(true)
    expect(mentions(['ветка'], 'ветку')).toBe(true)
    expect(mentions(['ветка'], 'веткой')).toBe(true)
    expect(mentions(['ветка'], 'ветками')).toBe(true)
    expect(mentions(['точка'], 'точки')).toBe(true)
    expect(mentions(['копия'], 'копии')).toBe(true)
    // Так же — на «ь» и «й».
    expect(mentions(['связь'], 'связи')).toBe(true)
    expect(mentions(['музей'], 'музеями')).toBe(true)
    // Окончание длиннее 3 букв — уже другое слово: «копия» не находит «копирует» и «копирование».
    expect(mentions(['копия'], 'копирует')).toBe(false)
    expect(mentions(['копия'], 'копирование')).toBe(false)
  })

  it('длинные слова — по началу', () => {
    expect(mentions(['агент'], 'два агентов')).toBe(true)
    // Пятибуквенное на согласную — по началу из 5 букв, окончание не ограничено.
    expect(mentions(['агент'], 'с агентами')).toBe(true)
    expect(mentions(['релиз'], 'между релизами')).toBe(true)
    expect(mentions(['модель'], 'модели')).toBe(true)
    expect(mentions(['политики доступа к строкам'], 'политики доступа к строкам базы')).toBe(true)
    expect(mentions(['политики доступа к строкам'], 'политики доступа и к строкам')).toBe(false)
    // Начало длиной max(5, длина − 2): «модель» → «модел…», «скрипт» → «скрип…», «агент» → «агент…».
    expect(mentions(['модель'], 'модерация')).toBe(false)
    expect(mentions(['скрипт'], 'скринридер')).toBe(false)
    expect(mentions(['скрипт'], 'скрипты')).toBe(true)
    expect(mentions(['агент'], 'агенда')).toBe(false)
    expect(mentions(['программирования'], 'программирование')).toBe(true)
    expect(mentions(['программирования'], 'программа')).toBe(false)
    expect(mentions(['строкам'], 'строки')).toBe(true)
    // Совпадает начало слова, а не середина.
    expect(mentions(['модель'], 'супермодели')).toBe(false)
    // Совпадает любой из вариантов.
    expect(mentions(['политики доступа к строкам', 'rls'], 'включите rls')).toBe(true)
    expect(mentions(['агент'], '')).toBe(false)
  })

  it('нормализация совпадает с поиском курса', () => {
    const samples = [
      'Ёжик в «тумане» — ЁЛКА',
      '“Кавычки” и „лапки“ – короткое тире',
      'Политики доступа к строкам (RLS)!!!',
      '  ИИ-агент:   читает файлы…  ',
      'Cafe\u0301 İstanbul 2026 — №5 🙂',
    ]
    for (const text of samples) expect(normalize(text)).toBe(searchNormalize(text))
    expect(normalize(samples[0])).toBe('ежик в тумане елка')
  })

  it('упоминания: термин в определении и в тексте раздела с весом', () => {
    expect(mentionEdges({ glossary: MENTION_GLOSSARY, bookIndex: MENTION_INDEX, chapterOf: new Map([['ch1', 'ch1'], ['s1', 'ch1']]) })).toEqual(MENTIONS)
  })
})

// Словарь для упоминаний: «Агент» (в своём определении упоминает себя — связи нет), составной термин
// «Агент фонового программирования» (упоминает «Агент» в названии), термин с сокращением в скобках, короткое «Код»,
// «Модель (ИИ)» (скобки без латиницы — «ИИ» не вариант) и «Тест» из 4 букв: короткие слова находят окончания («кода», «тестами»).
const MENTION_GLOSSARY = [
  { term: 'Агент', definition: 'ИИ-агент, который сам действует.', refs: ['ch1'] },
  { term: 'Агент фонового программирования', definition: 'ИИ-система в изолированной среде.', refs: ['ch1'] },
  { term: 'Бенчмарк', definition: 'Набор задач для агентов: кодинг и кодовая база.', refs: ['ch1'] },
  { term: 'Политики доступа к строкам (RLS)', definition: 'Правила базы: какие строки видит пользователь.', refs: ['ch1'] },
  { term: 'Код', definition: 'Текст программы.', refs: ['ch1'] },
  { term: 'Модель (ИИ)', definition: 'Нейросеть, которая пишет код.', refs: ['ch1'] },
  { term: 'Тест', definition: 'Проверка программы.', refs: ['ch1'] },
]

const entryOf = (a: string, s: string, t: string) => ({ a, c: 'Глава 1 · Введение', s, t })
// Индекс книги-образца: введение главы ch1, раздел s1 (его заголовок — не текст) и раздел s9 главы «Об авторе» вне графа.
const MENTION_INDEX = [
  entryOf('ch1', '', 'Введение к главе: агенты пишут код.'),
  entryOf('ch1', '', 'Модели ошибаются.'),
  entryOf('s1', 'Что такое RLS', 'Что такое RLS'),
  entryOf('s1', 'Что такое RLS', 'Политики строк защищают данные.'),
  entryOf('s1', 'Что такое RLS', 'Включите RLS для каждой таблицы.'),
  entryOf('s1', 'Что такое RLS', 'Политики доступа к строкам базы проверяет агент.'),
  entryOf('s1', 'Что такое RLS', 'Кодинг и кодовая база.'),
  entryOf('s1', 'Что такое RLS', 'Модерация ответов ИИ.'),
  entryOf('s1', 'Что такое RLS', 'Тесты, а не тестирование вручную.'),
  entryOf('s1', 'Что такое RLS', 'Ревью кода вместе с тестами.'),
  { a: 's9', c: 'Об авторе', s: 'Кто я', t: 'Агент и код.' },
]

const MENTIONS = [
  { s: 'term:2', t: 'term:1', kind: 'term-term' },
  { s: 'term:3', t: 'term:1', kind: 'term-term' },
  { s: 'term:6', t: 'term:5', kind: 'term-term' },
  { s: 'term:1', t: 'ch:ch1', kind: 'term-text', w: 1 },
  { s: 'term:1', t: 'sec:s1', kind: 'term-text', w: 1 },
  { s: 'term:4', t: 'sec:s1', kind: 'term-text', w: 2 },
  { s: 'term:5', t: 'ch:ch1', kind: 'term-text', w: 1 },
  { s: 'term:5', t: 'sec:s1', kind: 'term-text', w: 1 },
  { s: 'term:6', t: 'ch:ch1', kind: 'term-text', w: 1 },
  { s: 'term:7', t: 'sec:s1', kind: 'term-text', w: 2 },
]

describe('build-graph: раскладка и сборка', () => {
  it('раскладка повторяется и без NaN', () => {
    const nodes = nodesOf()
    const edges = edgesOf()
    const random = vi.spyOn(Math, 'random')
    const first: PlacedNode[] = layout(nodes, edges)
    const again: PlacedNode[] = layout(nodes, edges, 1)
    expect(random).not.toHaveBeenCalled()
    random.mockRestore()
    expect(again).toEqual(first)
    // Те же узлы в том же порядке, к ним добавлены x, y, size.
    expect(first).toMatchObject(nodes)
    for (const n of first) {
      for (const v of [n.x, n.y, n.size]) {
        expect(Number.isFinite(v)).toBe(true)
        expect(Math.round(v * 10) / 10).toBe(v)
      }
      expect(n.size).toBeGreaterThanOrEqual(3)
      expect(n.size).toBeLessThanOrEqual(14)
    }
  })

  it('размер узла — логарифм от числа связей: 3 без связей, 14 у самого связанного', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => ({ id, type: 'term', label: id, text: '' }))
    const edges = [
      { s: 'a', t: 'b', kind: 'term-term' },
      { s: 'a', t: 'c', kind: 'term-term' },
    ]
    const sizes = Object.fromEntries((layout(nodes, edges) as PlacedNode[]).map((n) => [n.id, n.size]))
    // 3 + 11 · ln 2 / ln 3 ≈ 9,94
    expect(sizes).toEqual({ a: 14, b: 9.9, c: 9.9, d: 3 })
  })

  it('сборка на образце: связи строения, затем упоминания; разделы глав вне графа пропущены', () => {
    const sources = { book: BOOK, glossary: MENTION_GLOSSARY, bookIndex: MENTION_INDEX, weeks: WEEKS, days: DAYS }
    const { nodes, edges }: { nodes: PlacedNode[]; edges: GraphEdge[] } = buildGraph(sources)
    expect(nodes).toMatchObject(buildNodes(sources))
    expect(edges).toEqual([...structureEdges(sources), ...MENTIONS])
  })
})

type Day = { number: number; cards?: string[]; blocks?: { figure?: string; bookRef?: { section: string } }[] }
type Sources = { glossary: { term: string; refs: string[] }[]; days: Day[] }

describe('build-graph: настоящие данные', () => {
  const CONTENT = join(__dirname, '..', 'content')
  const BOOK_FILE = join(__dirname, '..', '..', 'vibe-coding-na-praktike-2026-10.html')
  let sources: Sources
  let graph: { nodes: PlacedNode[]; edges: GraphEdge[] }
  beforeAll(() => {
    sources = readSources(BOOK_FILE, CONTENT)
    graph = buildGraph(sources)
  }, 60_000)
  const termId = (name: string) => `term:${sources.glossary.findIndex((g) => g.term === name) + 1}`
  const count = (kind: string) => graph.edges.filter((e) => e.kind === kind).length

  it('настоящий граф: число узлов по типам', () => {
    const byType = (type: string) => graph.nodes.filter((n) => n.type === type).length
    const types = ['part', 'chapter', 'section', 'figure', 'term', 'week', 'day', 'video']
    expect(types.map(byType)).toEqual([4, 16, 99, 112, 280, 3, 21, 27])
    expect(graph.nodes).toHaveLength(562)
  })

  it('настоящий граф: связи целы', () => {
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.size).toBe(graph.nodes.length)
    expect(graph.edges.filter((e) => !ids.has(e.s) || !ids.has(e.t))).toEqual([])
    expect(graph.edges.filter((e) => e.s === e.t)).toEqual([])
    const keys = graph.edges.map((e) => `${e.kind} ${e.s} ${e.t}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('настоящий граф: связи строения совпадают со счётом в источниках', () => {
    // Опечатка в данных (ссылка на несуществующую главу, раздел, схему или термин) не теряется молча.
    const blocks = sources.days.flatMap((d) => d.blocks ?? [])
    expect(count('part-ch')).toBe(12)
    expect(count('term-ch')).toBe(new Set(sources.glossary.flatMap((g, i) => g.refs.map((r) => `${i} ${r}`))).size)
    expect(count('day-term')).toBe(sources.days.flatMap((d) => d.cards ?? []).length)
    expect(count('day-sec')).toBe(blocks.filter((b) => b.bookRef).length)
    expect(count('day-fig')).toBe(blocks.filter((b) => b.figure).length)
  })

  it('RLS связан с разделом s43', () => {
    expect(graph.edges).toContainEqual(expect.objectContaining({ s: termId('Политики доступа к строкам (RLS)'), t: 'sec:s43', kind: 'term-text' }))
  })

  it('«Агент фонового программирования» упоминает «Агент»', () => {
    expect(graph.edges).toContainEqual({ s: termId('Агент фонового программирования'), t: termId('Агент'), kind: 'term-term' })
  })

  it('настоящий граф: островов нет — каждый узел не дальше 2,5 × 95-го процентиля узлов книги от центра', () => {
    // Недели 2–3 с днями и роликами связаны только между собой: без притяжения к центру они улетают далеко от облака
    // книги, и общий вид на экране графа становится мелким
    const n = graph.nodes.length
    const cx = graph.nodes.reduce((s, p) => s + p.x, 0) / n
    const cy = graph.nodes.reduce((s, p) => s + p.y, 0) / n
    const dist = (p: PlacedNode) => Math.hypot(p.x - cx, p.y - cy)
    const BOOK_TYPES = new Set(['part', 'chapter', 'section', 'figure', 'term'])
    const book = graph.nodes
      .filter((p) => BOOK_TYPES.has(p.type))
      .map(dist)
      .sort((a, b) => a - b)
    const limit = 2.5 * book[Math.floor(0.95 * (book.length - 1))]
    expect(graph.nodes.filter((p) => dist(p) > limit).map((p) => p.id)).toEqual([])
  })

  it('graph.json совпадает со свежей сборкой', () => {
    expect(readFileSync(join(CONTENT, 'graph.json'), 'utf8')).toBe(JSON.stringify(graph) + '\n')
  })

  it('graph.json не больше 500 КБ', () => {
    expect(statSync(join(CONTENT, 'graph.json')).size).toBeLessThanOrEqual(500 * 1024)
  })
})
