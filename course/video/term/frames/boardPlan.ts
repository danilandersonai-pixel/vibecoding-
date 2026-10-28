import type { Clock, FrameCtx, Rect } from '../frame'
import { appear, easeOut } from '../motion'
import { MOTION, SAFE, T } from '../theme'
import { fitWidth, fitWrap } from './fit'
import { outsideSafe } from './geometry'
import { beatProblem } from './source'

/**
 * Доска для понятий без записи: заголовок, таблица, карточки, шкала — блоками сверху вниз. Заголовок и блоки — одна группа: она стоит по центру
 * высоты SAFE (отступ заголовка от первого блока — TITLE.gap); группа выше SAFE — от верха.
 * Весь текст — Golos Text не мельче 28 px; длинный текст переносится по словам с запасом на ширину знаков (fit.ts).
 * title — Golos 48 px 600, у левого края. Появляется вместе с кадром.
 * table — как в книге: линия сверху 2 px ink, под шапкой и снизу soft, между строками edge. Шапка 600 soft, строки ink, 28 px.
 *   at[k] — реплика, на которой появляется строка k (шапка — вместе с первой). mark — подсветка строки на реплике at: подложка tone 14 %
 *   и полоса слева 4 px цвета tone (без tone — ink). Ширина столбцов — по тексту, но таблица не уже трети окна на столбец и не шире SAFE;
 *   не помещается — слова остаются целыми, а ячейки переносятся.
 * cards — карточки рядом (до трёх в ряд, четыре — два ряда по два): рамка edge 2 px на paper, заголовок 32 px 600, текст 28 px soft;
 *   tone красит рамку и заголовок. Карточки одного ряда одной высоты. Каждая появляется на своей реплике at.
 * scale — горизонтальная линия 2 px line между подписями краёв (28 px soft); пункты — точки на линии (pos 0…1) и подписи 32 px ink по очереди
 *   над и под линией, появляются на реплике at; marker — треугольник ink под линией: появляется на первой реплике и переезжает
 *   к pos следующей за MOTION.move.
 * Части: 'frame', 'title', 'row:<k>', 'card:<k>', 'item:<k>' (только подпись пункта), 'marker' (в конце сцены, у последнего положения).
 */
export type Tone = 'ok' | 'err' | 'warn'
export type BoardSpec = {
  type: 'board'
  title?: string
  table?: { head: string[]; rows: string[][]; at: number[]; mark?: { at: number; row: number; tone?: Tone }[] }
  cards?: { title: string; text: string[]; at: number; tone?: Tone }[]
  scale?: { left: string; right: string; items: { label: string; pos: number; at: number }[]; marker?: { at: number; pos: number }[] }
}

export const TONES: Record<Tone, string> = { ok: T.ok, err: T.err, warn: T.warn }
export const TEXT = { size: 28, line: 40, base: 30 } // кегль, высота строки и базовая линия от верха строки
export const TITLE = { size: 48, line: 60, base: 46, gap: 40, maxLines: 2 }
const GAP = 48 // между блоками
export const TABLE = { padX: 24, padY: 12, rule: 2, bar: 4, perCol: SAFE.w / 3 } // perCol: таблица не уже трети окна на столбец: три столбца — на всю ширину
export const CARD = { padX: 24, padY: 20, titleSize: 32, titleLine: 44, titleBase: 33, para: 8, gap: 36, max: 840 }
export const SCALE = {
  label: { size: 32, line: 44, base: 33 }, // подписи пунктов
  line: 2,
  dot: 10, // радиус точки пункта
  edgeGap: 32, // между подписью края и линией
  labelMax: 320, // ширина подписи пункта до переноса
  labelGap: 12, // между подписями одной стороны
  above: 32, // от линии до низа подписи над ней
  below: 66, // от линии до верха подписи под ней
  marker: { w: 32, h: 28, top: 20 }, // треугольник: ширина, высота, отступ его вершины от линии
  minLine: 600,
}

type Para = string[]
export type TableCol = { x: number; w: number }
export type TableRow = { y: number; h: number; cells: Para[]; at: number }
export type TablePlan = { x: number; y: number; w: number; h: number; cols: TableCol[]; head: { y: number; h: number; cells: Para[] }; rows: TableRow[] }
export type CardBox = { x: number; y: number; w: number; h: number; title: string[]; text: Para[]; at: number; tone?: Tone }
export type ItemBox = { cx: number; side: 'above' | 'below'; lines: string[]; box: Rect; at: number; rect: Rect }
export type ScalePlan = {
  y: number
  x0: number
  x1: number
  left: string
  right: string
  /** Подписи краёв: рамки текста на уровне линии. */
  edges: { left: Rect; right: Rect }
  items: ItemBox[]
  markers: { at: number; cx: number }[]
  h: number
}
type Plan = {
  title: { lines: string[]; rect: Rect } | null
  table: TablePlan | null
  cards: CardBox[]
  scale: ScalePlan | null
  problems: string[]
}

const words = (s: string) => s.split(/\s+/).filter(Boolean)
const widest = (s: string, size: number) => Math.max(0, ...words(s).map((w) => fitWidth(w, size)))

// Блоки до вертикальной расстановки: у каждого высота и функция, которая кладёт его на y.
type Block = { h: number; place: (y: number) => void }

export function plan(spec: BoardSpec): Plan {
  const problems: string[] = []
  const blocks: Block[] = []
  let title: Plan['title'] = null
  let table: TablePlan | null = null
  let cards: CardBox[] = []
  let scale: ScalePlan | null = null

  if (spec.title !== undefined) {
    const lines = fitWrap(spec.title, TITLE.size, SAFE.w)
    if (lines.length > TITLE.maxLines) problems.push(`title: заголовок занимает ${lines.length} строк, а нужно не больше ${TITLE.maxLines}`)
    const w = Math.min(SAFE.w, Math.max(0, ...lines.map((l) => fitWidth(l, TITLE.size))))
    title = { lines, rect: { x: SAFE.x, y: SAFE.y, w, h: lines.length * TITLE.line } }
  }

  // Таблица
  const t = spec.table
  if (t) {
    const cols = t.head.length
    const bad = problems.length
    if (cols === 0) problems.push('table.head: в шапке нет столбцов')
    if (t.rows.length === 0) problems.push('table.rows: в таблице нет строк')
    t.rows.forEach((r, i) => {
      if (r.length !== cols) problems.push(`table.rows[${i}]: в строке ${r.length} ячеек, а в шапке ${cols}`)
    })
    if (t.at.length !== t.rows.length) problems.push(`table.at: ${t.at.length} реплик на ${t.rows.length} строк — у каждой строки своя реплика`)
    else {
      t.at.forEach((a, i) => {
        if (i > 0 && a < t.at[i - 1]) problems.push(`table.at[${i}]: строки идут по порядку реплик, а реплика ${a} раньше реплики ${t.at[i - 1]}`)
      })
    }
    ;(t.mark ?? []).forEach((m, i) => {
      if (!Number.isInteger(m.row) || m.row < 0 || m.row >= t.rows.length) problems.push(`table.mark[${i}]: строки ${m.row} нет, в таблице их ${t.rows.length} (с нуля)`)
      else if (t.at.length === t.rows.length && m.at < t.at[m.row]) problems.push(`table.mark[${i}]: метка на реплике ${m.at} раньше своей строки (реплика ${t.at[m.row]})`)
    })
    if (problems.length === bad) {
      table = planTable(t, problems)
      const tb = table
      blocks.push({ h: tb.h, place: (y) => shiftTable(tb, y) })
    }
  }

  // Карточки
  if (spec.cards && spec.cards.length > 0) {
    const planned = planCards(spec.cards, problems)
    cards = planned.cards
    const cs = cards
    blocks.push({ h: planned.h, place: (y) => cs.forEach((c) => (c.y += y)) })
  }

  // Шкала
  if (spec.scale) {
    const before = problems.length
    const s = planScale(spec.scale, problems)
    if (s && problems.length === before) {
      scale = s
      blocks.push({ h: s.h, place: (y) => shiftScale(s, y) })
    }
  }

  if (blocks.length === 0 && !title && problems.length === 0) problems.push('доска пуста: нужен title, table, cards или scale')

  // Вертикально: заголовок и блоки — одна группа по центру SAFE; выше SAFE — от верха
  const head = title ? title.rect.h + TITLE.gap : 0
  const total = blocks.reduce((sum, b) => sum + b.h, 0) + GAP * Math.max(0, blocks.length - 1)
  const group = head + total
  if (group > SAFE.h) problems.push(`не помещается: заголовок и блоки доски занимают ${Math.round(group)} px, а в окне помещается ${SAFE.h}`)
  const top = SAFE.y + Math.max(0, Math.floor((SAFE.h - group) / 2))
  if (title) title.rect.y = top
  let y = top + head
  for (const b of blocks) {
    b.place(y)
    y += b.h + GAP
  }
  return { title, table, cards, scale, problems }
}

// Ячейки с абзацами строк; y пока от верха таблицы, place сдвигает на настоящий
function planTable(t: NonNullable<BoardSpec['table']>, problems: string[]): TablePlan {
  const cols = t.head.length
  const pad = 2 * TABLE.padX
  const natural = Array.from({ length: cols }, (_, c) => Math.max(fitWidth(t.head[c], TEXT.size), ...t.rows.map((r) => fitWidth(r[c], TEXT.size))) + pad)
  const least = Array.from({ length: cols }, (_, c) => Math.max(widest(t.head[c], TEXT.size), ...t.rows.map((r) => widest(r[c], TEXT.size))) + pad)
  const sumNatural = natural.reduce((a, b) => a + b, 0)
  const sumLeast = least.reduce((a, b) => a + b, 0)
  let widths: number[]
  if (sumNatural <= SAFE.w) {
    // Свободного места хватает: столбцы как есть, лишнее — по ширине текста, но таблица не уже трети окна на столбец
    const total = Math.min(SAFE.w, Math.max(sumNatural, TABLE.perCol * cols))
    widths = natural.map((w) => w + ((total - sumNatural) * w) / sumNatural)
  } else {
    if (sumLeast > SAFE.w) {
      problems.push(`table: самые длинные слова столбцов шире окна (${Math.ceil(sumLeast)} px при ${SAFE.w}) — сократите текст`)
      widths = least
    } else {
      // Не помещается: каждый столбец не уже самого длинного слова, остаток — по запасу переноса
      const spare = natural.map((w, c) => w - least[c])
      const sumSpare = spare.reduce((a, b) => a + b, 0)
      widths = least.map((w, c) => w + ((SAFE.w - sumLeast) * spare[c]) / sumSpare)
    }
  }
  const w = widths.reduce((a, b) => a + b, 0)
  const x = SAFE.x
  let cx = x
  const placed: TableCol[] = widths.map((cw) => {
    const c = { x: cx, w: cw }
    cx += cw
    return c
  })

  const wrapCell = (text: string, c: number) => fitWrap(text, TEXT.size, widths[c] - pad)
  const heightOf = (cells: Para[]) => Math.max(...cells.map((p) => p.length)) * TEXT.line + 2 * TABLE.padY
  const headCells = t.head.map((h, c) => wrapCell(h, c))
  const headH = TABLE.rule + heightOf(headCells) + TABLE.rule
  let y = headH
  const rows: TableRow[] = t.rows.map((r, k) => {
    const cells = r.map((text, c) => wrapCell(text, c))
    const h = heightOf(cells) + TABLE.rule
    const row = { y, h, cells, at: t.at[k] }
    y += h
    return row
  })
  return { x, y: 0, w, h: y, cols: placed, head: { y: 0, h: headH, cells: headCells }, rows }
}

function shiftTable(t: TablePlan, y: number): void {
  t.y += y
  t.head.y += y
  for (const r of t.rows) r.y += y
}

function planCards(list: NonNullable<BoardSpec['cards']>, problems: string[]): { cards: CardBox[]; h: number } {
  const n = list.length
  const perRow = n <= 3 ? n : n === 4 ? 2 : 3
  const w = Math.min(CARD.max, Math.floor((SAFE.w - (perRow - 1) * CARD.gap) / perRow))
  const inner = w - 2 * CARD.padX
  const x0 = SAFE.x + (SAFE.w - (perRow * w + (perRow - 1) * CARD.gap)) / 2
  const boxes = list.map((c, i) => {
    const who = `cards[${i}] «${c.title}»`
    const parts: [string, number][] = [[c.title, CARD.titleSize], ...c.text.map((t): [string, number] => [t, TEXT.size])]
    for (const [text, size] of parts) {
      const word = words(text).find((w) => fitWidth(w, size) > inner + 0.01)
      if (word !== undefined) {
        problems.push(`${who}: слово «${word}» шире карточки (${Math.ceil(fitWidth(word, size))} px при ${inner})`)
        break
      }
    }
    return { title: fitWrap(c.title, CARD.titleSize, inner), text: c.text.map((t) => fitWrap(t, TEXT.size, inner)), at: c.at, tone: c.tone }
  })
  const heightOf = (b: (typeof boxes)[number]) =>
    2 * CARD.padY + b.title.length * CARD.titleLine + (b.text.length > 0 ? CARD.para + b.text.reduce((sum, p) => sum + p.length * TEXT.line, 0) + CARD.para * (b.text.length - 1) : 0)
  const rowsCount = Math.ceil(n / perRow)
  const rowH = Array.from({ length: rowsCount }, (_, r) => Math.max(...boxes.slice(r * perRow, (r + 1) * perRow).map(heightOf)))
  const cards: CardBox[] = boxes.map((b, i) => {
    const r = Math.floor(i / perRow)
    const y = rowH.slice(0, r).reduce((sum, h) => sum + h + CARD.gap, 0)
    return { ...b, x: x0 + (i % perRow) * (w + CARD.gap), y, w, h: rowH[r] }
  })
  return { cards, h: rowH.reduce((sum, h) => sum + h, 0) + CARD.gap * (rowsCount - 1) }
}

function planScale(s: NonNullable<BoardSpec['scale']>, problems: string[]): ScalePlan | null {
  const bad = problems.length
  if (s.items.length === 0) problems.push('scale.items: на шкале нет пунктов')
  s.items.forEach((it, i) => {
    if (!(it.pos >= 0 && it.pos <= 1)) problems.push(`scale.items[${i}] «${it.label}»: pos ${it.pos} вне 0…1 — положение на линии, от левого края к правому`)
  })
  const marker = s.marker ?? []
  marker.forEach((m, i) => {
    if (!(m.pos >= 0 && m.pos <= 1)) problems.push(`scale.marker[${i}]: pos ${m.pos} вне 0…1 — положение на линии, от левого края к правому`)
    if (i > 0 && m.at < marker[i - 1].at) problems.push(`scale.marker[${i}]: реплика ${m.at} раньше реплики ${marker[i - 1].at} — маркер переезжает по порядку реплик`)
  })
  if (problems.length > bad) return null

  const leftW = fitWidth(s.left, TEXT.size)
  const rightW = fitWidth(s.right, TEXT.size)
  const x0 = SAFE.x + leftW + SCALE.edgeGap
  const x1 = SAFE.x + SAFE.w - rightW - SCALE.edgeGap
  if (x1 - x0 < SCALE.minLine) problems.push(`scale: линия между подписями краёв ${Math.round(x1 - x0)} px, а нужно не меньше ${SCALE.minLine} — сократите left и right`)
  const xOf = (pos: number) => x0 + pos * (x1 - x0)

  const items: ItemBox[] = s.items.map((it, k) => {
    const lines = fitWrap(it.label, SCALE.label.size, SCALE.labelMax)
    const w = Math.max(...lines.map((l) => fitWidth(l, SCALE.label.size)))
    // подпись центрирована на точке, но не выходит за SAFE
    const cx = xOf(it.pos)
    const left = Math.min(Math.max(cx - w / 2, SAFE.x), SAFE.x + SAFE.w - w)
    return { cx, side: k % 2 === 0 ? 'above' : 'below', lines, box: { x: left, y: 0, w, h: lines.length * SCALE.label.line }, at: it.at, rect: { x: 0, y: 0, w: 0, h: 0 } }
  })
  // Подписи одной стороны не налезают друг на друга
  items.forEach((a, i) => {
    items.slice(0, i).forEach((b, j) => {
      if (a.side === b.side && a.box.x < b.box.x + b.box.w + SCALE.labelGap && b.box.x < a.box.x + a.box.w + SCALE.labelGap) {
        problems.push(`scale.items[${i}] «${s.items[i].label}»: подпись налезает на подпись пункта ${j} «${s.items[j].label}» — разведите pos или сократите текст`)
      }
    })
  })

  const aboveLines = Math.max(0, ...items.filter((i) => i.side === 'above').map((i) => i.lines.length))
  const belowLines = Math.max(0, ...items.filter((i) => i.side === 'below').map((i) => i.lines.length))
  // от верха блока до линии, от линии до низа блока
  const up = aboveLines > 0 ? SCALE.above + aboveLines * SCALE.label.line : SCALE.dot
  const down = belowLines > 0 ? SCALE.below + belowLines * SCALE.label.line : SCALE.line + SCALE.marker.top + SCALE.marker.h
  const edge = (x: number, w: number): Rect => ({ x, y: up + SCALE.line / 2 - TEXT.line / 2, w, h: TEXT.line })
  return {
    y: up,
    x0,
    x1,
    left: s.left,
    right: s.right,
    edges: { left: edge(SAFE.x, leftW), right: edge(SAFE.x + SAFE.w - rightW, rightW) },
    items,
    markers: marker.map((m) => ({ at: m.at, cx: xOf(m.pos) })),
    h: up + down,
  }
}

function shiftScale(s: ScalePlan, y: number): void {
  s.y += y
  s.edges.left.y += y
  s.edges.right.y += y
  for (const it of s.items) {
    it.box.y = it.side === 'above' ? s.y - SCALE.above - it.lines.length * SCALE.label.line : s.y + SCALE.below
    // Часть item — только подпись: точка на линии и маркер к ней не относятся
    it.rect = { ...it.box }
  }
}

/** Прямоугольник маркера с центром в cx. */
export const markerRect = (s: ScalePlan, cx: number): Rect => ({ x: cx - SCALE.marker.w / 2, y: s.y + SCALE.line + SCALE.marker.top, w: SCALE.marker.w, h: SCALE.marker.h })

/** Центр маркера на кадре frame: нет до первой реплики; первое положение — на месте, дальше — переезд за MOTION.move кадров (ease-out). */
export function markerAt(s: ScalePlan, clock: Clock, frame: number): { cx: number; opacity: number } | null {
  let k = -1
  s.markers.forEach((m, i) => {
    if (frame >= clock.beat(m.at)) k = i
  })
  if (k < 0) return null
  const m = s.markers[k]
  if (k === 0) return { cx: m.cx, opacity: appear(frame, clock.beat(m.at)) }
  const from = s.markers[k - 1].cx
  return { cx: from + (m.cx - from) * easeOut((frame - clock.beat(m.at)) / MOTION.move), opacity: 1 }
}

export function boardLayout(spec: BoardSpec): Record<string, Rect> {
  const p = plan(spec)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  if (p.title) parts.title = p.title.rect
  if (p.table) p.table.rows.forEach((r, k) => (parts[`row:${k}`] = { x: p.table!.x, y: r.y, w: p.table!.w, h: r.h }))
  p.cards.forEach((c, k) => (parts[`card:${k}`] = { x: c.x, y: c.y, w: c.w, h: c.h }))
  if (p.scale) {
    p.scale.items.forEach((it, k) => (parts[`item:${k}`] = { ...it.rect }))
    const last = p.scale.markers[p.scale.markers.length - 1]
    if (last) parts.marker = markerRect(p.scale, last.cx)
  }
  return parts
}

/** Реплики, на которых что-то меняется в доске. */
function beats(spec: BoardSpec): number[] {
  const t = spec.table
  return [
    ...(t ? [...t.at, ...(t.mark ?? []).map((m) => m.at)] : []),
    ...(spec.cards ?? []).map((c) => c.at),
    ...(spec.scale ? [...spec.scale.items.map((i) => i.at), ...(spec.scale.marker ?? []).map((m) => m.at)] : []),
  ]
}

/** Кадр, на котором появляются шапка таблицы и линия шкалы с подписями краёв: вместе с первым, что к ним относится. */
export const headAt = (spec: BoardSpec, clock: Clock) => clock.beat(Math.min(...(spec.table?.at ?? [0])))
export const scaleAt = (spec: BoardSpec, clock: Clock) => clock.beat(Math.min(...(spec.scale?.items.map((i) => i.at) ?? [0])))

export function boardMoments(spec: BoardSpec, clock: Clock): number[] {
  return [...new Set([0, ...beats(spec).map((b) => clock.beat(b))])].sort((a, b) => a - b)
}

export function boardProblems(spec: BoardSpec, _ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec)
  const bad = [...p.problems]
  const check = (name: string, at: number) => {
    const why = beatProblem(at, clock.lines)
    if (why) bad.push(`${name}: ${why}`)
  }
  spec.table?.at.forEach((a, i) => check(`table.at[${i}]`, a))
  spec.table?.mark?.forEach((m, i) => check(`table.mark[${i}].at`, m.at))
  spec.cards?.forEach((c, i) => check(`cards[${i}].at`, c.at))
  spec.scale?.items.forEach((it, i) => check(`scale.items[${i}].at`, it.at))
  spec.scale?.marker?.forEach((m, i) => check(`scale.marker[${i}].at`, m.at))
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(boardLayout(spec)))
  // Конец последней анимации: появление или переезд маркера
  const ends = [
    ...(spec.title ? [MOTION.appear] : []),
    ...beats(spec).map((b) => clock.beat(b) + MOTION.appear),
    ...(spec.scale?.marker ?? []).slice(1).map((m) => clock.beat(m.at) + MOTION.move),
  ]
  const last = Math.max(0, ...ends)
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последняя анимация кончается на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
