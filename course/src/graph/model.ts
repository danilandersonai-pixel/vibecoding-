// Модель графа знаний: типы узлов и связей, подписи, соседи по группам, поиск узла.
// Данные — course/content/graph.json (собирает scripts/build-graph.mjs); рисует и показывает их экран графа.
import { normalize, queryWords } from '../search/normalize'

export type NodeType = 'part' | 'chapter' | 'section' | 'figure' | 'term' | 'week' | 'day' | 'video'

export type EdgeKind =
  | 'part-ch'
  | 'ch-sec'
  | 'sec-fig'
  | 'ch-fig'
  | 'term-ch'
  | 'term-term'
  | 'term-text'
  | 'week-day'
  | 'day-video'
  | 'day-term'
  | 'day-sec'
  | 'day-fig'
  | 'video-ch'

// book — якорь книги («Открыть в книге»); day — номер дня; video — id ролика; figure — id схемы для миниатюры
export type GraphNode = {
  id: string
  type: NodeType
  label: string
  text: string
  x: number
  y: number
  size: number
  book?: string
  day?: number
  video?: string
  figure?: string
}

// s — откуда, t — куда, w — вес (только у term-text: число фрагментов с упоминанием)
export type GraphEdge = { s: string; t: string; kind: EdgeKind; w?: number }

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] }

// Порядок типов: фильтры, ничьи в поиске
export const TYPE_ORDER: NodeType[] = ['part', 'chapter', 'section', 'figure', 'term', 'week', 'day', 'video']

export const TYPE_LABEL: Record<NodeType, string> = {
  part: 'Часть',
  chapter: 'Глава',
  section: 'Раздел',
  figure: 'Схема',
  term: 'Термин',
  week: 'Неделя',
  day: 'День',
  video: 'Видеоурок',
}

export const TYPE_FILTER_LABEL: Record<NodeType, string> = {
  part: 'Части',
  chapter: 'Главы',
  section: 'Разделы',
  figure: 'Схемы',
  term: 'Термины',
  week: 'Недели',
  day: 'Дни',
  video: 'Видеоуроки',
}

// Цвет типа — имя переменной темы (спецификация §5): точка в фильтрах — var(<имя>), узлы рисунка — значение переменной
// из getComputedStyle. Задаётся только здесь, чтобы фильтры и рисунок не разошлись. Части и главы — --graph-book:
// голубой, единственный цвет вне состояний, чтобы книга отличалась от видеоуроков (--warn) и терминов (--accent = --ink)
export const TYPE_COLOR_VAR: Record<NodeType, string> = {
  part: '--graph-book',
  chapter: '--graph-book',
  section: '--ink-soft',
  figure: '--fig-line',
  term: '--accent',
  week: '--fig-ok',
  day: '--fig-ok',
  video: '--warn',
}

// Подписи групп карточки (спецификация §3): out — у узла «откуда» (смотрит на концы связей), in — у узла «куда».
// Порядок ключей — порядок строк таблицы: в таком порядке группы идут в карточке
export const GROUP_TITLES: Record<EdgeKind, { out: string; in: string }> = {
  'part-ch': { out: 'Главы', in: 'Часть' },
  'ch-sec': { out: 'Разделы', in: 'Глава' },
  'sec-fig': { out: 'Схемы', in: 'Раздел' },
  'ch-fig': { out: 'Схемы', in: 'Глава' },
  'term-ch': { out: 'Объясняется в главе', in: 'Термины главы' },
  'term-term': { out: 'Упоминает термины', in: 'Упоминается в терминах' },
  'term-text': { out: 'Встречается в тексте', in: 'Термины в тексте' },
  'week-day': { out: 'Дни', in: 'Неделя' },
  'day-video': { out: 'Видеоуроки', in: 'День' },
  'day-term': { out: 'Термины дня', in: 'В курсе' },
  'day-sec': { out: 'Разделы книги', in: 'В курсе' },
  'day-fig': { out: 'Схемы', in: 'В курсе' },
  'video-ch': { out: 'По главе', in: 'Видеоуроки по главе' },
}

export type GraphIndex = {
  nodes: GraphNode[]
  byId: Map<string, GraphNode>
  edges: GraphEdge[]
  counts: Record<NodeType, number>
}

export function indexGraph(data: GraphData): GraphIndex {
  const byId = new Map<string, GraphNode>()
  const counts = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<NodeType, number>
  for (const n of data.nodes) {
    byId.set(n.id, n)
    counts[n.type]++
  }
  return { nodes: data.nodes, byId, edges: data.edges, counts }
}

export type NeighborGroup = { kind: EdgeKind; title: string; items: { node: GraphNode; w?: number }[] }

const KINDS = Object.keys(GROUP_TITLES) as EdgeKind[]

// Порядок подписей: по-русски, числа как числа («Глава 4» раньше «Глава 12»)
const LABEL_ORDER = new Intl.Collator('ru', { numeric: true })

// Соседи узла группами для карточки. Группы идут в порядке строк таблицы §3, в строке сначала «откуда» (узел — начало
// связи, соседи — её концы), потом «куда». Пустых групп нет. Внутри группы соседи стоят в порядке узлов в данных,
// кроме term-text: там по убыванию числа упоминаний, при равенстве — по подписи.
// У двух терминов с взаимными связями один сосед окажется и в «Упоминает термины», и в «Упоминается в терминах».
export function neighborGroups(index: GraphIndex, id: string): NeighborGroup[] {
  type Item = { node: GraphNode; w?: number; at: number }
  const found = new Map<string, Item[]>()
  let position: Map<string, number> | undefined
  const add = (kind: EdgeKind, side: 'out' | 'in', otherId: string, w: number | undefined) => {
    const node = index.byId.get(otherId)
    if (!node) return
    position ??= new Map(index.nodes.map((n, i) => [n.id, i]))
    const key = `${kind}:${side}`
    const item: Item = w === undefined ? { node, at: position.get(otherId)! } : { node, w, at: position.get(otherId)! }
    const list = found.get(key)
    if (list) list.push(item)
    else found.set(key, [item])
  }
  for (const e of index.edges) {
    if (e.s === id) add(e.kind, 'out', e.t, e.w)
    if (e.t === id) add(e.kind, 'in', e.s, e.w)
  }

  const groups: NeighborGroup[] = []
  for (const kind of KINDS) {
    for (const side of ['out', 'in'] as const) {
      const list = found.get(`${kind}:${side}`)
      if (!list) continue
      list.sort(
        kind === 'term-text'
          ? (a, b) => (b.w ?? 0) - (a.w ?? 0) || LABEL_ORDER.compare(a.node.label, b.node.label) || a.at - b.at
          : (a, b) => a.at - b.at,
      )
      groups.push({ kind, title: GROUP_TITLES[kind][side], items: list.map(({ node, w }) => (w === undefined ? { node } : { node, w })) })
    }
  }
  return groups
}

const TYPE_RANK = Object.fromEntries(TYPE_ORDER.map((t, i) => [t, i])) as Record<NodeType, number>

// Поиск узла по подписи, как поиск курса по названию: подпись совпадает с запросом целиком → начинается с него →
// содержит все его слова. При равенстве — по типу (TYPE_ORDER), затем в порядке данных. Запрос короче 2 знаков — пусто.
export function findNodes(index: GraphIndex, query: string, limit = 8): GraphNode[] {
  const words = queryWords(query)
  if (words.length === 0) return []
  const phrase = normalize(query)

  const found: { node: GraphNode; rank: number; order: number }[] = []
  index.nodes.forEach((node, order) => {
    const title = normalize(node.label)
    const rank = title === phrase ? 0 : title.startsWith(phrase) ? 1 : words.every((w) => title.includes(w)) ? 2 : -1
    if (rank >= 0) found.push({ node, rank, order })
  })
  found.sort((x, y) => x.rank - y.rank || TYPE_RANK[x.node.type] - TYPE_RANK[y.node.type] || x.order - y.order)
  return found.slice(0, limit).map((x) => x.node)
}

// Что можно открыть из карточки: место в книге (раздел, глава, схема, термин со ссылками словаря), день, день ролика
export function nodeActions(node: GraphNode): { book?: string; day?: number; videoDay?: number } {
  switch (node.type) {
    case 'section':
    case 'chapter':
    case 'figure':
    case 'term':
      return node.book === undefined ? {} : { book: node.book }
    case 'day':
      return node.day === undefined ? {} : { day: node.day }
    case 'video':
      return node.day === undefined ? {} : { videoDay: node.day }
    default:
      return {}
  }
}
