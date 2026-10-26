import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import realGraph from '../../content/graph.json'
import { createGraphStore, useGraph } from './load'
import {
  findNodes,
  GROUP_TITLES,
  indexGraph,
  neighborGroups,
  nodeActions,
  TYPE_FILTER_LABEL,
  TYPE_LABEL,
  TYPE_ORDER,
  type EdgeKind,
  type GraphData,
  type GraphEdge,
  type GraphIndex,
  type GraphNode,
  type NodeType,
} from './model'

// Узел для проверок: координаты и размер не важны
function node(id: string, type: NodeType, label: string, extra: Partial<GraphNode> = {}): GraphNode {
  return { id, type, label, text: '', x: 0, y: 0, size: 5, ...extra }
}

const edge = (s: string, t: string, kind: EdgeKind, w?: number): GraphEdge => (w === undefined ? { s, t, kind } : { s, t, kind, w })

// Маленький граф: по связи каждого вида. Порядок узлов и связей нарочно разный — порядок в группах берётся из узлов
const SMALL: GraphData = {
  nodes: [
    node('part:I', 'part', 'Часть I · Основы'),
    node('ch:ch1', 'chapter', 'Глава 1 · Введение', { book: 'ch1' }),
    node('ch:ch2', 'chapter', 'Глава 2 · Модели', { book: 'ch2' }),
    node('sec:s1', 'section', 'Первый раздел', { book: 's1' }),
    node('sec:s2', 'section', 'Второй раздел', { book: 's2' }),
    node('sec:s3', 'section', 'Агент в работе', { book: 's3' }),
    node('fig:f0', 'figure', 'Рис. 1.0 · вводная схема', { book: 's1', figure: 'f0' }),
    node('fig:f1', 'figure', 'Рис. 1.1 · схема', { book: 's1', figure: 'f1' }),
    node('term:1', 'term', 'Агент', { book: 'abc' }),
    node('term:2', 'term', 'Агент фонового программирования'),
    node('term:3', 'term', 'MCP', { book: 'ch2' }),
    node('term:4', 'term', 'Model Context Protocol (MCP)'),
    node('term:5', 'term', 'Ёлка'),
    node('term:6', 'term', 'Модель'),
    node('week:1', 'week', 'Неделя 1 · Первая версия'),
    node('day:1', 'day', 'День 1 · Азбука', { day: 1 }),
    node('video:ch-01', 'video', 'Как работает агент', { day: 1, video: 'ch-01' }),
  ],
  edges: [
    edge('part:I', 'ch:ch1', 'part-ch'),
    edge('ch:ch1', 'sec:s2', 'ch-sec'),
    edge('ch:ch1', 'sec:s1', 'ch-sec'),
    edge('sec:s1', 'fig:f1', 'sec-fig'),
    edge('ch:ch1', 'fig:f0', 'ch-fig'),
    edge('term:3', 'ch:ch1', 'term-ch'),
    edge('term:1', 'ch:ch1', 'term-ch'),
    edge('term:2', 'term:1', 'term-term'),
    edge('term:1', 'term:6', 'term-term'),
    edge('term:3', 'term:4', 'term-term'),
    edge('term:4', 'term:3', 'term-term'),
    edge('term:1', 'sec:s1', 'term-text', 2),
    edge('term:1', 'sec:s2', 'term-text', 5),
    edge('term:1', 'ch:ch1', 'term-text', 5),
    edge('term:3', 'ch:ch1', 'term-text', 1),
    edge('week:1', 'day:1', 'week-day'),
    edge('day:1', 'video:ch-01', 'day-video'),
    edge('day:1', 'term:1', 'day-term'),
    edge('day:1', 'sec:s1', 'day-sec'),
    edge('day:1', 'fig:f1', 'day-fig'),
    edge('video:ch-01', 'ch:ch1', 'video-ch'),
  ],
}

const small = () => indexGraph(SMALL)
const real = () => indexGraph(realGraph as GraphData)

const titles = (idx: GraphIndex, id: string) => neighborGroups(idx, id).map((g) => g.title)

// Узел настоящего графа по подписи: номера терминов при пересборке словаря сдвигаются, подписи — нет
function byLabel(idx: GraphIndex, label: string, type: NodeType): GraphNode {
  const found = idx.nodes.find((n) => n.type === type && n.label === label)
  if (!found) throw new Error(`в графе нет узла «${label}» (${type})`)
  return found
}

// Подписи групп из спецификации §3 — независимая копия таблицы: опечатка в GROUP_TITLES не пройдёт
const TABLE: [EdgeKind, string, string][] = [
  ['part-ch', 'Главы', 'Часть'],
  ['ch-sec', 'Разделы', 'Глава'],
  ['sec-fig', 'Схемы', 'Раздел'],
  ['ch-fig', 'Схемы', 'Глава'],
  ['term-ch', 'Объясняется в главе', 'Термины главы'],
  ['term-term', 'Упоминает термины', 'Упоминается в терминах'],
  ['term-text', 'Встречается в тексте', 'Термины в тексте'],
  ['week-day', 'Дни', 'Неделя'],
  ['day-video', 'Видеоуроки', 'День'],
  ['day-term', 'Термины дня', 'В курсе'],
  ['day-sec', 'Разделы книги', 'В курсе'],
  ['day-fig', 'Схемы', 'В курсе'],
  ['video-ch', 'По главе', 'Видеоуроки по главе'],
]

describe('модель графа: типы и индекс', () => {
  it('подписи типов и порядок типов', () => {
    expect(TYPE_ORDER).toEqual(['part', 'chapter', 'section', 'figure', 'term', 'week', 'day', 'video'])
    expect(TYPE_ORDER.map((t) => TYPE_LABEL[t])).toEqual(['Часть', 'Глава', 'Раздел', 'Схема', 'Термин', 'Неделя', 'День', 'Видеоурок'])
    expect(TYPE_ORDER.map((t) => TYPE_FILTER_LABEL[t])).toEqual(['Части', 'Главы', 'Разделы', 'Схемы', 'Термины', 'Недели', 'Дни', 'Видеоуроки'])
  })

  it('индекс: узлы по id, число узлов каждого типа', () => {
    const idx = small()
    expect(idx.byId.get('term:1')?.label).toBe('Агент')
    expect(idx.nodes).toBe(SMALL.nodes)
    expect(idx.edges).toBe(SMALL.edges)
    expect(idx.counts).toEqual({ part: 1, chapter: 2, section: 3, figure: 2, term: 6, week: 1, day: 1, video: 1 })
  })

  it('настоящий граф: числа узлов по типам из спецификации, у каждой связи оба конца есть', () => {
    const idx = real()
    expect(idx.counts).toEqual({ part: 4, chapter: 16, section: 99, figure: 112, term: 280, week: 3, day: 21, video: 27 })
    expect(Object.values(idx.counts).reduce((a, b) => a + b, 0)).toBe(idx.nodes.length)
    expect(idx.byId.size).toBe(idx.nodes.length)
    for (const e of idx.edges) {
      expect(idx.byId.has(e.s), `${e.kind}: нет узла ${e.s}`).toBe(true)
      expect(idx.byId.has(e.t), `${e.kind}: нет узла ${e.t}`).toBe(true)
      expect(e.kind in GROUP_TITLES, `вид ${e.kind}`).toBe(true)
    }
  })
})

describe('соседи узла по группам', () => {
  it('группы карточки в порядке таблицы и с подписями', () => {
    const idx = small()
    expect(titles(idx, 'term:1')).toEqual(['Объясняется в главе', 'Упоминает термины', 'Упоминается в терминах', 'Встречается в тексте', 'В курсе'])
    expect(titles(idx, 'ch:ch1')).toEqual(['Часть', 'Разделы', 'Схемы', 'Термины главы', 'Термины в тексте', 'Видеоуроки по главе'])
    expect(titles(idx, 'sec:s1')).toEqual(['Глава', 'Схемы', 'Термины в тексте', 'В курсе'])
    expect(titles(idx, 'fig:f1')).toEqual(['Раздел', 'В курсе'])
    expect(titles(idx, 'part:I')).toEqual(['Главы'])
    expect(titles(idx, 'week:1')).toEqual(['Дни'])
    expect(titles(idx, 'day:1')).toEqual(['Неделя', 'Видеоуроки', 'Термины дня', 'Разделы книги', 'Схемы'])
    expect(titles(idx, 'video:ch-01')).toEqual(['День', 'По главе'])
  })

  it('те же подписи на настоящих данных: «Агент» и глава со схемами', () => {
    const idx = real()
    expect(titles(idx, byLabel(idx, 'Агент', 'term').id)).toEqual(['Объясняется в главе', 'Упоминает термины', 'Упоминается в терминах', 'Встречается в тексте', 'В курсе'])
    expect(titles(idx, 'ch:ch3')).toEqual(['Часть', 'Разделы', 'Схемы', 'Термины главы', 'Термины в тексте', 'Видеоуроки по главе'])
  })

  it('подпись группы — по виду связи и стороне, как в таблице §3', () => {
    expect(Object.keys(GROUP_TITLES)).toEqual(TABLE.map(([kind]) => kind))
    const idx = small()
    for (const [kind, out, inn] of TABLE) {
      const e = SMALL.edges.find((x) => x.kind === kind)!
      expect(GROUP_TITLES[kind]).toEqual({ out, in: inn })
      expect(neighborGroups(idx, e.s).find((g) => g.kind === kind && g.items.some((i) => i.node.id === e.t))?.title, `${kind}: у «откуда»`).toBe(out)
      expect(neighborGroups(idx, e.t).find((g) => g.kind === kind && g.items.some((i) => i.node.id === e.s))?.title, `${kind}: у «куда»`).toBe(inn)
    }
  })

  it('«В курсе» у термина, раздела и схемы — три разные группы по виду связи', () => {
    const idx = small()
    const course = (id: string) => neighborGroups(idx, id).find((g) => g.title === 'В курсе')
    expect(course('term:1')?.kind).toBe('day-term')
    expect(course('sec:s1')?.kind).toBe('day-sec')
    expect(course('fig:f1')?.kind).toBe('day-fig')
  })

  it('в группе — соседи в порядке узлов в данных, а не связей', () => {
    const idx = small()
    const ch = neighborGroups(idx, 'ch:ch1')
    expect(ch.find((g) => g.title === 'Разделы')?.items.map((i) => i.node.id)).toEqual(['sec:s1', 'sec:s2'])
    expect(ch.find((g) => g.title === 'Термины главы')?.items.map((i) => i.node.id)).toEqual(['term:1', 'term:3'])
  })

  it('взаимные связи терминов: сосед — и в «Упоминает», и в «Упоминается в»', () => {
    const idx = small()
    const groups = neighborGroups(idx, 'term:3')
    const ids = (title: string) => groups.find((g) => g.title === title)?.items.map((i) => i.node.id)
    expect(ids('Упоминает термины')).toEqual(['term:4'])
    expect(ids('Упоминается в терминах')).toEqual(['term:4'])

    const idxReal = real()
    const fromData = neighborGroups(idxReal, byLabel(idxReal, 'MCP', 'term').id)
    const mcp = (title: string) => fromData.find((g) => g.title === title)?.items.map((i) => i.node.label)
    expect(mcp('Упоминает термины')).toContain('Model Context Protocol (MCP)')
    expect(mcp('Упоминается в терминах')).toContain('Model Context Protocol (MCP)')
  })

  it('пустых групп нет; узел без связей и неизвестный id — пустой список', () => {
    const idx = small()
    expect(neighborGroups(idx, 'term:5')).toEqual([])
    expect(neighborGroups(idx, 'нет-такого')).toEqual([])
    // на настоящих данных: пустых групп нет, каждая связь узла попала ровно в одну группу
    const big = real()
    for (const n of big.nodes) {
      const groups = neighborGroups(big, n.id)
      for (const g of groups) expect(g.items.length, `${n.id}: пустая группа «${g.title}»`).toBeGreaterThan(0)
      const degree = big.edges.filter((e) => e.s === n.id || e.t === n.id).length
      expect(groups.reduce((sum, g) => sum + g.items.length, 0), n.id).toBe(degree)
    }
  })

  it('«Встречается в тексте» — по числу упоминаний', () => {
    const idx = small()
    // вес по убыванию; при равном весе — по подписи: «Второй раздел» раньше «Глава 1 · Введение»
    const out = neighborGroups(idx, 'term:1').find((g) => g.kind === 'term-text')!
    expect(out.items.map((i) => [i.node.label, i.w])).toEqual([
      ['Второй раздел', 5],
      ['Глава 1 · Введение', 5],
      ['Первый раздел', 2],
    ])
    // та же сортировка у «Термины в тексте»
    const inn = neighborGroups(idx, 'ch:ch1').find((g) => g.title === 'Термины в тексте')!
    expect(inn.items.map((i) => [i.node.id, i.w])).toEqual([
      ['term:1', 5],
      ['term:3', 1],
    ])
    // «Глава 4» раньше «Глава 12» при равном весе (числа в подписях сравниваются как числа), хотя в данных глава 12 стоит первой
    const chapters = indexGraph({
      nodes: [node('term:1', 'term', 'Агент'), node('ch:ch12', 'chapter', 'Глава 12 · Итоги'), node('ch:ch4', 'chapter', 'Глава 4 · Контекст')],
      edges: [edge('term:1', 'ch:ch12', 'term-text', 3), edge('term:1', 'ch:ch4', 'term-text', 3)],
    })
    expect(neighborGroups(chapters, 'term:1')[0].items.map((i) => i.node.id)).toEqual(['ch:ch4', 'ch:ch12'])

    // у связей без веса поля w нет
    expect(neighborGroups(idx, 'ch:ch1').find((g) => g.title === 'Разделы')!.items[0]).toEqual({ node: idx.byId.get('sec:s1') })

    // на настоящих данных: у всех терминов вес не растёт
    const big = real()
    for (const n of big.nodes.filter((x) => x.type === 'term')) {
      const g = neighborGroups(big, n.id).find((x) => x.kind === 'term-text')
      const ws = g?.items.map((i) => i.w ?? 0) ?? []
      expect(ws, n.id).toEqual([...ws].sort((a, b) => b - a))
    }
  })
})

describe('поиск узла', () => {
  it('поиск узла: точное, начало, слова; ё и регистр', () => {
    const idx = small()
    expect(findNodes(idx, 'АГЕНТ')[0].label).toBe('Агент')
    // точное → начало → слова в подписи (порядок типов внутри ранга проверяет тест ниже: здесь разделы и так стоят в данных раньше терминов)
    expect(findNodes(idx, 'агент').map((n) => n.label)).toEqual(['Агент', 'Агент в работе', 'Агент фонового программирования', 'Как работает агент'])
    // все слова запроса есть в подписи, порядок слов не важен
    expect(findNodes(idx, 'программирования фонового').map((n) => n.id)).toEqual(['term:2'])
    expect(findNodes(idx, 'агент нет такого')).toEqual([])
    // «ё» = «е», регистр не важен
    expect(findNodes(idx, 'елка').map((n) => n.id)).toEqual(['term:5'])
    expect(findNodes(idx, 'ЁЛКА').map((n) => n.id)).toEqual(['term:5'])
    expect(findNodes(idx, 'mcp').map((n) => n.id)).toEqual(['term:3', 'term:4'])
  })

  it('при равном ранге — по типу (TYPE_ORDER), при равном типе — порядок данных; ранг важнее типа', () => {
    // в данных типы нарочно идут не по TYPE_ORDER: день, термин, раздел, термин; часть с «агент» в середине подписи — первой
    const idx = indexGraph({
      nodes: [
        node('part:I', 'part', 'Про агент'),
        node('day:1', 'day', 'Агент день', { day: 1 }),
        node('term:1', 'term', 'Агент X'),
        node('sec:s1', 'section', 'Агент Y', { book: 's1' }),
        node('term:2', 'term', 'Агент Z'),
      ],
      edges: [],
    })
    // все четыре «Агент …» начинаются с запроса: раздел, термины в порядке данных, день; часть — позже, у неё ранг ниже
    expect(findNodes(idx, 'агент').map((n) => n.id)).toEqual(['sec:s1', 'term:1', 'term:2', 'day:1', 'part:I'])
  })

  it('запрос короче 2 знаков и лимит', () => {
    const idx = small()
    expect(findNodes(idx, 'а')).toEqual([])
    expect(findNodes(idx, '')).toEqual([])
    expect(findNodes(idx, '  — ')).toEqual([])
    expect(findNodes(idx, 'агент', 2).map((n) => n.id)).toEqual(['term:1', 'sec:s3'])
    // по умолчанию — не больше 8
    expect(findNodes(real(), 'ра').length).toBeLessThanOrEqual(8)
  })

  it('на настоящем графе: «Агент» первым, запрос без букв — пусто', () => {
    const idx = real()
    expect(findNodes(idx, 'АГЕНТ')[0].label).toBe('Агент')
    expect(findNodes(idx, 'а')).toEqual([])
    expect(findNodes(idx, 'rls').length).toBeGreaterThan(0)
    expect(findNodes(idx, '🙂🙂')).toEqual([])
  })
})

describe('действия узла', () => {
  it('действия узла', () => {
    const idx = small()
    const actions = (id: string) => nodeActions(idx.byId.get(id)!)
    expect(actions('sec:s1')).toEqual({ book: 's1' })
    expect(actions('ch:ch1')).toEqual({ book: 'ch1' })
    expect(actions('fig:f1')).toEqual({ book: 's1' })
    expect(actions('term:1')).toEqual({ book: 'abc' })
    expect(actions('day:1')).toEqual({ day: 1 })
    expect(actions('video:ch-01')).toEqual({ videoDay: 1 })
    expect(actions('part:I')).toEqual({})
    expect(actions('week:1')).toEqual({})
    // термин без ссылок словаря — без «Открыть в книге»
    expect(actions('term:2')).toEqual({})
  })

  it('на настоящих данных: ролик и день ведут туда, куда ведут связи графа', () => {
    const idx = real()
    const videos = idx.nodes.filter((n) => n.type === 'video')
    expect(videos.length).toBeGreaterThan(0)
    for (const v of videos) {
      const { videoDay } = nodeActions(v)
      expect(videoDay, v.id).toEqual(expect.any(Number))
      // ролик лежит в том дне, из которого к нему идёт связь day-video
      expect(idx.edges.some((e) => e.kind === 'day-video' && e.s === `day:${videoDay}` && e.t === v.id), v.id).toBe(true)
    }
    for (const d of idx.nodes.filter((n) => n.type === 'day')) expect(`day:${nodeActions(d).day}`).toBe(d.id)
  })
})

describe('загрузка графа', () => {
  // ждём, пока хранилище скажет, что загрузка закончилась
  async function settled(store: ReturnType<typeof createGraphStore>) {
    await vi.waitFor(() => expect(store.getSnapshot().status).not.toBe('loading'))
    return store.getSnapshot()
  }

  it('загрузка: ready и failed', async () => {
    // данные пришли: ready и индекс
    const ok = createGraphStore(() => Promise.resolve(SMALL))
    expect(ok.getSnapshot()).toEqual({ status: 'loading' })
    const seen = vi.fn()
    const off = ok.subscribe(seen)
    const ready = await settled(ok)
    expect(ready.status).toBe('ready')
    expect(ready.index?.byId.get('term:1')?.label).toBe('Агент')
    expect(seen).toHaveBeenCalled()
    off()

    // загрузка не удалась: failed, индекса нет
    const bad = createGraphStore(() => Promise.reject(new Error('нет сети')))
    bad.subscribe(() => {})
    expect(await settled(bad)).toEqual({ status: 'failed' })

    // загрузчик упал сразу, не вернув обещания, — тоже failed
    const thrown = createGraphStore(() => {
      throw new Error('сразу')
    })
    thrown.subscribe(() => {})
    expect((await settled(thrown)).status).toBe('failed')
  })

  it('загрузка идёт при первой подписке и один раз; состояние не пересоздаётся без причины', async () => {
    const load = vi.fn(() => Promise.resolve(SMALL))
    const store = createGraphStore(load)
    expect(load).not.toHaveBeenCalled()
    store.getSnapshot()
    expect(load).not.toHaveBeenCalled()
    const a = store.subscribe(() => {})
    const b = store.subscribe(() => {})
    const ready = await settled(store)
    expect(load).toHaveBeenCalledTimes(1)
    a()
    b()
    // вторая подписка после отписки загрузку не повторяет, снимок прежний
    store.subscribe(() => {})
    expect(load).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toBe(ready)
  })

  it('useGraph: настоящий graph.json подгружается и индексируется', async () => {
    const { result } = renderHook(() => useGraph())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.index?.nodes.length).toBe(realGraph.nodes.length)
    // второй вызов видит то же готовое состояние
    const again = renderHook(() => useGraph())
    expect(again.result.current.index).toBe(result.current.index)
  })
})
