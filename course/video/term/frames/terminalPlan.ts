import type { Clock, FrameCtx, Rect } from '../frame'
import { wrapMono } from '../text'
import { MOTION, SAFE } from '../theme'
import { CELL, COLS, LH, TEXT_X, WIN, cells, outsideSafe, rowTop } from './geometry'
import { beatProblem, lookup, pick, rangeProblem } from './source'
import type { Range } from './source'

/**
 * Терминал: команды набираются, вывод идёт строками, окно прокручивается.
 * event — run, commit или browser: у browser показываются строки server (вывод работающего dev-сервера)
 * продолжением вывода, без команды и набора. at — реплика сцены, на которой начинается элемент.
 * lines — показанные строки вывода: с 1, включительно; без него — весь вывод.
 * Части: 'frame', 'cmd:<event>', 'out:<event>', 'line:<event>:<k>' (k — номер показанной строки вывода с 0).
 */
export type TerminalSpec = {
  type: 'terminal'
  title?: string
  items: { session: string; event: string; at: number; lines?: Range }[]
}

const CWD = '~/trainer-app'

type Line = { text: string; rows: string[]; row: number; err: boolean }
type Entry = {
  event: string
  at: number
  /** Подсказка и команда; у browser пусто. */
  prompt: string
  cmd: string
  cmdRows: string[]
  cmdRow: number
  lines: Line[]
}
type Plan = { entries: Entry[]; problems: string[] }

// Что показать: строки терминала по порядку. Каждая строка вывода после переноса занимает одну и более строк окна (row — первая).
export function plan(spec: TerminalSpec, ctx: FrameCtx): Plan {
  const entries: Entry[] = []
  const problems: string[] = []
  const seen = new Set<string>()
  let row = 0
  spec.items.forEach((item, i) => {
    const who = `items[${i}] «${item.event}»`
    const found = lookup(ctx, item.session, item.event, ['run', 'commit', 'browser'] as const)
    if (found.error !== undefined) return void problems.push(`${who}: ${found.error}`)
    const ev = found.event
    if (seen.has(ev.id)) return void problems.push(`${who}: событие показано дважды`)
    seen.add(ev.id)
    const all = ev.kind === 'browser' ? ev.server : ev.out
    const bad = rangeProblem(item.lines, all.length)
    if (bad) return void problems.push(`${who}: ${bad}`)
    const { items: shown, first } = pick(all, item.lines)

    const prompt = ev.kind === 'browser' ? '' : `${ev.kind === 'run' ? ev.cwd : CWD} $ `
    const cmd = ev.kind === 'browser' ? '' : ev.cmd
    const cmdRows = ev.kind === 'browser' ? [] : wrapMono(prompt + cmd, COLS)
    const cmdRow = row
    row += cmdRows.length
    // Код выхода ≠ 0: последняя строка вывода цвета err (если она среди показанных)
    const failed = ev.kind === 'run' && ev.code !== null && ev.code !== 0
    const lines = shown.map((text, k) => {
      const rows = wrapMono(text, COLS)
      // Прокрутка уводит строки вверх, но одна строка вывода должна поместиться в окно целиком
      if (rows.length > WIN.rows) problems.push(`${who}: строка ${first + k} после переноса занимает ${rows.length} строк окна, а в окне помещается ${WIN.rows}`)
      const line = { text, rows, row, err: failed && first + k === all.length }
      row += rows.length
      return line
    })
    entries.push({ event: ev.id, at: item.at, prompt, cmd, cmdRows, cmdRow, lines })
  })
  return { entries, problems }
}

type Timing = {
  /** Кадр, когда на экране появляется подсказка (с этого кадра курсор ждёт). */
  promptAt: number
  /** Кадр, когда команда начинает набираться. */
  start: number
  typedEnd: number
  /** Кадр, когда появляется каждая строка вывода. */
  lineAt: number[]
}

// Время: следующая команда ждёт, пока кончится вывод предыдущей, но не начнётся раньше своей реплики.
// Первая строка вывода идёт через MOTION.stagger кадров после набора, дальше — по строке за MOTION.stagger.
export function timeline(p: Plan, clock: Clock): Timing[] {
  let free = 0
  return p.entries.map((e) => {
    const typed = e.cmdRows.length > 0
    const promptAt = free
    const start = Math.max(clock.beat(e.at), free)
    const typedEnd = typed ? start + [...e.cmd].length : start
    const first = typed ? typedEnd + MOTION.stagger : start
    const lineAt = e.lines.map((_, k) => first + k * MOTION.stagger)
    free = lineAt.length > 0 ? lineAt[lineAt.length - 1] + MOTION.stagger : typed ? typedEnd + MOTION.stagger : start
    return { promptAt, start, typedEnd, lineAt }
  })
}

// Последняя строка окна (с нуля), уже появившаяся на кадре frame: от неё зависит прокрутка.
export function lastRow(p: Plan, tl: Timing[], frame: number): number {
  let last = -1
  p.entries.forEach((e, i) => {
    if (e.cmdRows.length > 0 && frame >= tl[i].promptAt) last = Math.max(last, e.cmdRow + e.cmdRows.length - 1)
    e.lines.forEach((l, k) => {
      if (frame >= tl[i].lineAt[k]) last = Math.max(last, l.row + l.rows.length - 1)
    })
  })
  return last
}

/** На сколько строк прокручено окно, когда последняя появившаяся строка — last. */
export const scrollAt = (last: number) => Math.max(0, last + 1 - WIN.rows)

// Прямоугольник строк first…last окна в тот миг, когда появилась строка last (так видит её камера); что ушло выше окна — отрезано.
function place(first: number, last: number, w: number): Rect {
  const s = scrollAt(last)
  const top = Math.max(first - s, 0)
  return { x: TEXT_X, y: rowTop(top), w: Math.max(w, CELL), h: (last - s - top + 1) * LH }
}

const widest = (rows: string[]) => cells(Math.max(1, ...rows.map((r) => [...r].length)))

export function terminalLayout(spec: TerminalSpec, ctx: FrameCtx): Record<string, Rect> {
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  for (const e of plan(spec, ctx).entries) {
    if (e.cmdRows.length > 0) parts[`cmd:${e.event}`] = place(e.cmdRow, e.cmdRow + e.cmdRows.length - 1, widest(e.cmdRows))
    if (e.lines.length === 0) continue
    const lastLine = e.lines[e.lines.length - 1]
    parts[`out:${e.event}`] = place(e.lines[0].row, lastLine.row + lastLine.rows.length - 1, widest(e.lines.flatMap((l) => l.rows)))
    e.lines.forEach((l, k) => {
      parts[`line:${e.event}:${k}`] = place(l.row, l.row + l.rows.length - 1, widest(l.rows))
    })
  }
  return parts
}

export function terminalMoments(spec: TerminalSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx)
  const at = new Set<number>([0])
  timeline(p, clock).forEach((t, i) => {
    if (p.entries[i].cmdRows.length > 0) [t.promptAt, t.start, t.typedEnd].forEach((f) => at.add(f))
    t.lineAt.forEach((f) => at.add(f))
  })
  return [...at].sort((a, b) => a - b)
}

export function terminalProblems(spec: TerminalSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  spec.items.forEach((item, i) => {
    const why = beatProblem(item.at, clock.lines)
    if (why) bad.push(`items[${i}] «${item.event}»: ${why}`)
  })
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(terminalLayout(spec, ctx)))
  const last = Math.max(...terminalMoments(spec, clock, ctx))
  if (last >= clock.duration) bad.push(`вывод не успевает появиться до конца сцены: последняя строка на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
