import { bookSection } from '../book'
import type { Clock, FrameCtx, Rect } from '../frame'
import { MOTION, SAFE } from '../theme'
import { fitWidth, fitWrap } from './fit'
import { outsideSafe } from './geometry'
import { beatProblem } from './source'

/**
 * Итог: заголовок (последняя глава урока: «Итог» у ролика главы, «Проверьте у себя» у ролика дня; Golos 48 px 600) и пункты
 * с галочкой цвета ok (линия 3 px, не глиф шрифта; текст Golos 32 px ink) — каждый появляется на своей реплике at.
 * Заголовок и пункты — одна группа: она стоит по центру высоты SAFE, а если над блоком книги тесно — поднимается (но не выше SAFE.y).
 * Внизу, у нижнего края SAFE, «Книга:» (faint) и разделы книги из ctx.lesson.book по bookSection: «Азбука · Код, языки и чужие детали»,
 * по строке, 28 px soft; если так пункты не помещаются над блоком — разделы одной главы подряд одним абзацем: глава строкой, под ней
 * названия разделов через « · » (так у ролика главы 1: одиннадцать разделов). Блок появляется, когда последний пункт на месте.
 * Разделов нет — блока нет.
 * Части: 'frame', 'item:<k>', 'book'.
 */
export type RecapSpec = { type: 'recap'; items: { text: string; at: number }[] }

export const RECAP = {
  title: { size: 48, line: 60, base: 46, gap: 40 },
  item: { size: 32, line: 44, base: 33, gap: 20, indent: 48 }, // индент: место под «✓»
  book: { size: 28, line: 40, base: 30, labelGap: 24, gapAbove: 24 },
}
/** Подпись «Книга:» перед разделами: Golos 28 px, ширина по оценке. */
export const BOOK_LABEL = 'Книга:'
export const BOOK_X = SAFE.x + Math.ceil(fitWidth(BOOK_LABEL, RECAP.book.size)) + RECAP.book.labelGap

export type RecapItem = { lines: string[]; y: number; at: number; rect: Rect }
export type RecapBook = { sections: string[][]; y: number; h: number; rect: Rect }
type Plan = {
  title: { text: string; y: number }
  items: RecapItem[]
  book: RecapBook | null
  bookAt: number
  /** Заголовок и пункты вместе: от верха заголовка до низа последнего пункта. */
  group: Rect
  problems: string[]
}

export function plan(spec: RecapSpec, ctx: FrameCtx, clock: Clock): Plan {
  const problems: string[] = []
  const chapters = ctx.lesson.chapters
  const title = chapters.length >= 2 ? chapters[chapters.length - 1] : 'Итог'

  if (spec.items.length === 0) problems.push('items: в итоге нет ни одного пункта')
  spec.items.forEach((it, k) => {
    if (k > 0 && it.at < spec.items[k - 1].at) problems.push(`items[${k}]: пункты идут по порядку реплик, а реплика ${it.at} раньше реплики ${spec.items[k - 1].at}`)
  })

  // Пункты: строки по словам под галочкой; y пока от верха группы
  const header = RECAP.title.line + RECAP.title.gap
  let y = header
  const laid = spec.items.map((it) => {
    const lines = fitWrap(it.text, RECAP.item.size, SAFE.w - RECAP.item.indent)
    const h = lines.length * RECAP.item.line
    const w = RECAP.item.indent + Math.max(...lines.map((l) => fitWidth(l, RECAP.item.size)))
    const placed = { lines, y, h, w, at: clock.beat(it.at) }
    y += h + RECAP.item.gap
    return placed
  })
  const height = laid.length > 0 ? y - RECAP.item.gap : header

  // Разделы книги: «Азбука · Код, языки и чужие детали» по строке; неизвестный якорь — проблема. Если так пункты не помещаются
  // над блоком книги — разделы одной главы подряд одним абзацем: глава строкой, под ней названия разделов через « · »
  let book: RecapBook | null = null
  const found: { chapter: string; title: string }[] = []
  for (const id of ctx.lesson.book) {
    const s = bookSection(id)
    if (!s) problems.push(`book: раздела «${id}» нет в книге (book-sections.json)`)
    else found.push(s)
  }
  const width = SAFE.w - (BOOK_X - SAFE.x)
  const wrap = (t: string) => fitWrap(t, RECAP.book.size, width)
  const blockOf = (sections: string[][]): RecapBook => {
    const h = Math.max(RECAP.book.line, sections.reduce((sum, s) => sum + s.length * RECAP.book.line, 0))
    const top = SAFE.y + SAFE.h - h
    const w = BOOK_X - SAFE.x + Math.max(...sections.flat().map((l) => fitWidth(l, RECAP.book.size)))
    return { sections, y: top, h, rect: { x: SAFE.x, y: top, w: Math.min(w, SAFE.w), h } }
  }
  if (found.length > 0) {
    book = blockOf(found.map((s) => wrap(`${s.chapter} · ${s.title}`)))
    if (book.y - RECAP.book.gapAbove - SAFE.y < height) {
      const runs: { chapter: string; titles: string[] }[] = []
      for (const s of found) {
        const last = runs[runs.length - 1]
        if (last && last.chapter === s.chapter) last.titles.push(s.title)
        else runs.push({ chapter: s.chapter, titles: [s.title] })
      }
      book = blockOf(runs.flatMap((r) => (r.titles.length === 1 ? [wrap(`${r.chapter} · ${r.titles[0]}`)] : [[r.chapter], wrap(r.titles.join(' · '))])))
    }
  }
  const floor = book ? book.y - RECAP.book.gapAbove : SAFE.y + SAFE.h // до куда может дойти группа

  // Группа по центру SAFE; если над книгой тесно — выше, но не выше SAFE.y (тогда problems)
  const centered = SAFE.y + Math.floor((SAFE.h - height) / 2)
  const top = Math.max(SAFE.y, Math.min(centered, floor - height))
  if (laid.length > 0 && top + height > floor + 0.01) {
    problems.push(
      book
        ? `не помещается: пункты доходят до y ${Math.round(top + height)}, а блок книги начинается с y ${Math.round(floor + RECAP.book.gapAbove)} — сократите пункты или разделы`
        : `не помещается: пункты доходят до y ${Math.round(top + height)}, а окно кончается на y ${SAFE.y + SAFE.h}`,
    )
  }
  const items = laid.map((it): RecapItem => ({ lines: it.lines, y: top + it.y, at: it.at, rect: { x: SAFE.x, y: top + it.y, w: Math.min(it.w, SAFE.w), h: it.h } }))

  const last = spec.items.length > 0 ? Math.max(...spec.items.map((i) => i.at)) : 0
  return { title: { text: title, y: top }, items, book, bookAt: clock.beat(last) + MOTION.appear, group: { x: SAFE.x, y: top, w: SAFE.w, h: height }, problems }
}

export function recapLayout(spec: RecapSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx, { beat: () => 0, duration: 0, lines: 0 })
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  p.items.forEach((it, k) => (parts[`item:${k}`] = it.rect))
  if (p.book) parts.book = p.book.rect
  return parts
}

export function recapMoments(spec: RecapSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx, clock)
  return [...new Set([0, ...p.items.map((i) => i.at), ...(p.book ? [p.bookAt] : [])])].sort((a, b) => a - b)
}

export function recapProblems(spec: RecapSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx, clock)
  const bad = [...p.problems]
  spec.items.forEach((it, k) => {
    const why = beatProblem(it.at, clock.lines)
    if (why) bad.push(`items[${k}]: ${why}`)
  })
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(recapLayout(spec, ctx)))
  const last = Math.max(...p.items.map((i) => i.at + MOTION.appear), ...(p.book ? [p.bookAt + MOTION.appear] : []))
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последнее появление кончается на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
