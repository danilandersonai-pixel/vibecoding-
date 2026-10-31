import type { Clock, FrameCtx, Rect } from '../frame'
import { MOTION, SAFE, T, alpha } from '../theme'
import { COLS, LH, TEXT_X, WIN, outsideSafe, rowTop, widest, wrapWords } from './geometry'
import { beatProblem, diffBody, diffCounts, lookup, pick, rangeProblem } from './source'
import type { DiffKind, Range } from './source'

/**
 * Дифф: заголовок файла «путь  +N −M» (числа — по всему диффу события) и строки диффа от первого «@@»:
 * убранные — на подложке err 14 %, новые — на подложке ok 16 %, контекст soft; строки появляются очередью.
 * event — file; at — реплика, на которой файл появляется. Несколько файлов стоят друг под другом.
 * lines — показанные строки диффа: с 1 от первой строки «@@», включительно.
 * В окне помещается 19 строк с заголовками файлов, то есть 18 строк диффа у одного файла.
 * highlight — полоса под строками диффа события (номера те же, что у lines), растягивается за 9 кадров.
 * Части: 'frame', 'file:<event>' (заголовок и строки файла), 'line:<event>:<k>' (k — номер показанной строки с 0).
 */
export type DiffSpec = {
  type: 'diff'
  items: { session: string; event: string; at: number; lines?: Range }[]
  highlight?: { at: number; event: string; lines: Range }[]
}

type Line = { raw: string; kind: DiffKind; rows: string[]; row: number }
type Item = { event: string; path: string; add: number; del: number; at: number; headerRow: number; first: number; lines: Line[] }
type Plan = { items: Item[]; rows: number; problems: string[] }

export const SIGNED: DiffKind[] = ['add', 'del', 'ctx']
export const FILL: Partial<Record<DiffKind, string>> = { add: alpha(T.ok, 0.16), del: alpha(T.err, 0.14) }
export const SIGN: Partial<Record<DiffKind, string>> = { add: T.ok, del: T.err }
export const TEXT: Record<DiffKind, string> = { add: T.ink, del: T.ink, ctx: T.soft, hunk: T.faint, meta: T.faint }

// Что показать: заголовок и строки каждого файла подряд. Строка диффа после переноса занимает одну и более строк окна (row — первая).
export function plan(spec: DiffSpec, ctx: FrameCtx): Plan {
  const items: Item[] = []
  const problems: string[] = []
  const seen = new Set<string>()
  let row = 0
  spec.items.forEach((item, i) => {
    const who = `items[${i}] «${item.event}»`
    const found = lookup(ctx, item.session, item.event, ['file'] as const)
    if (found.error !== undefined) return void problems.push(`${who}: ${found.error}`)
    const ev = found.event
    if (seen.has(ev.id)) return void problems.push(`${who}: событие показано дважды`)
    seen.add(ev.id)
    const body = diffBody(ev.diff)
    const bad = rangeProblem(item.lines, body.length)
    if (bad) return void problems.push(`${who}: ${bad}`)
    const { items: shown, first } = pick(body, item.lines)

    const headerRow = row++
    const lines = shown.map(({ raw, kind }) => {
      // У строк с «+», «-» и пробелом первая колонка — знак, остальное — текст; длинный код переносится по словам
      const signed = SIGNED.includes(kind)
      const rows = wrapWords(signed ? raw.slice(1) : raw, COLS - (signed ? 1 : 0)).map((w) => w.text)
      const line = { raw, kind, rows, row }
      row += rows.length
      return line
    })
    items.push({ event: ev.id, path: ev.path, ...diffCounts(body), at: item.at, headerRow, first, lines })
  })

  const headers = items.length
  if (row > WIN.rows) {
    const shown = row - headers
    problems.push(`не помещается: показано ${shown} строк диффа при ${headers} заголовках файлов, в окне помещается ${WIN.rows - headers}`)
  }
  ;(spec.highlight ?? []).forEach((h, i) => {
    const item = items.find((it) => it.event === h.event)
    if (!item) return void problems.push(`highlight[${i}]: события «${h.event}» нет среди показанных файлов`)
    const [a, b] = h.lines
    if (!(Number.isInteger(a) && Number.isInteger(b) && a >= item.first && b >= a && b < item.first + item.lines.length)) {
      problems.push(`highlight[${i}]: lines: [${a}, ${b}] вне показанных строк «${h.event}» (${item.first}–${item.first + item.lines.length - 1})`)
    }
  })
  return { items, rows: row, problems }
}

/** Строки окна (первая и число) под строками диффа a…b события. */
export function span(item: Item, [a, b]: Range): { row: number; rows: number } | null {
  const from = item.lines[a - item.first]
  const to = item.lines[b - item.first]
  return from && to ? { row: from.row, rows: to.row + to.rows.length - from.row } : null
}

export function diffLayout(spec: DiffSpec, ctx: FrameCtx): Record<string, Rect> {
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  for (const it of plan(spec, ctx).items) {
    const end = it.lines.length > 0 ? it.lines[it.lines.length - 1].row + it.lines[it.lines.length - 1].rows.length : it.headerRow + 1
    parts[`file:${it.event}`] = { x: SAFE.x, y: rowTop(it.headerRow), w: SAFE.w, h: (end - it.headerRow) * LH }
    it.lines.forEach((l, k) => {
      parts[`line:${it.event}:${k}`] = { x: TEXT_X, y: rowTop(l.row), w: widest(l.rows, SIGNED.includes(l.kind) ? 1 : 0), h: l.rows.length * LH }
    })
  }
  return parts
}

/** Кадр, когда появляется строка k файла: за заголовком по строке за MOTION.stagger. */
export const lineAt = (start: number, k: number) => start + (k + 1) * MOTION.stagger

export function diffMoments(spec: DiffSpec, clock: Clock, ctx: FrameCtx): number[] {
  const at = new Set<number>([0])
  for (const it of plan(spec, ctx).items) {
    const start = clock.beat(it.at)
    at.add(start)
    it.lines.forEach((_, k) => at.add(lineAt(start, k)))
  }
  for (const h of spec.highlight ?? []) at.add(clock.beat(h.at))
  return [...at].sort((a, b) => a - b)
}

export function diffProblems(spec: DiffSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  spec.items.forEach((item, i) => {
    const why = beatProblem(item.at, clock.lines)
    if (why) bad.push(`items[${i}] «${item.event}»: ${why}`)
  })
  ;(spec.highlight ?? []).forEach((h, i) => {
    const why = beatProblem(h.at, clock.lines)
    if (why) bad.push(`highlight[${i}]: ${why}`)
  })
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(diffLayout(spec, ctx)))
  const last = Math.max(...diffMoments(spec, clock, ctx))
  if (last >= clock.duration) bad.push(`строки не успевают появиться до конца сцены: последняя на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
