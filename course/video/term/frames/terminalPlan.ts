import type { Clock, FrameCtx, Rect } from '../frame'
import { wrapMono } from '../text'
import { typedFrames } from '../motion'
import { MOTION, SAFE } from '../theme'
import { CELL, COLS, LH, TEXT_X, WIN, outsideSafe, rowTop, take, widest } from './geometry'
import { beatProblem, lookup, pick, rangeProblem } from './source'
import type { Range } from './source'

/**
 * Терминал: команды набираются, вывод идёт строками, окно прокручивается.
 * event — run, commit или browser: у browser показываются строки server (вывод работающего dev-сервера)
 * продолжением вывода, без команды и набора. at — реплика сцены, на которой начинается элемент.
 * lines — показанные строки вывода: с 1, включительно; без него — весь вывод. У команды с кодом выхода ≠ 0 последняя показанная
 * строка — цвета err.
 * Части: 'frame', 'cmd:<event>', 'out:<event>', 'line:<event>:<k>' (k — номер показанной строки вывода с 0).
 * layout не зависит от времени, поэтому все части — по одному снимку: окно в конце сцены, когда всё появилось и прокручено.
 * Часть, целиком ушедшая за верх окна, в layout нет; видная частично — прямоугольник, обрезанный окном.
 * Камера, наведённая на часть, видит её там, где она стоит в конце сцены.
 */
export type TerminalSpec = {
  type: 'terminal'
  title?: string
  items: { session: string; event: string; at: number; lines?: Range }[]
}

const CWD = '~/trainer-app'

type Line = { text: string; rows: string[]; row: number; err: boolean }
/**
 * Строка окна у команды: text — что в ней стоит целиком; lead — сколько её первых знаков faint (подсказка у первой строки, «> »
 * у строки после «\n» внутри команды, 0 у продолжения переноса); start — сколько знаков подсказки и команды («\n» — тоже знак:
 * его набирают Enter) набрано к первому знаку строки после lead. Строка видна, когда набрано start, — тогда же её lead.
 */
export type CmdRow = { text: string; lead: number; start: number }
type Entry = {
  event: string
  at: number
  /** Подсказка и команда; у browser пусто. */
  prompt: string
  cmd: string
  cmdRows: CmdRow[]
  cmdRow: number
  lines: Line[]
}

/** Подсказка продолжения: так bash показывает строки команды, набранные после Enter внутри кавычек (сообщение коммита в два абзаца). */
export const PS2 = '> '

/**
 * Строки окна у команды: подсказка и команда переносятся по COLS знаков, как в терминале; «\n» в команде (Enter внутри кавычек)
 * начинает новую строку окна с подсказкой продолжения PS2 — как показывает bash. Команда без «\n» — ровно wrapMono(подсказка + команда).
 */
export function commandRows(prompt: string, cmd: string): CmdRow[] {
  const rows: CmdRow[] = []
  let at = [...prompt].length
  cmd.split('\n').forEach((part, j) => {
    const lead = j === 0 ? prompt : PS2
    const n = [...lead].length
    wrapMono(lead + part, COLS).forEach((text, k) => rows.push({ text, lead: k === 0 ? n : 0, start: k === 0 ? at : at + k * COLS - n }))
    at += [...part].length + 1
  })
  return rows
}

/** Строка окна, в которой стоит курсор, когда набрано typed знаков подсказки и команды, и его отступ в знаках. */
export function cursorCell(rows: CmdRow[], typed: number): { row: number; col: number } {
  let row = 0
  rows.forEach((r, i) => {
    if (r.start <= typed) row = i
  })
  return { row, col: rows[row].lead + typed - rows[row].start }
}

/** Что видно в строке окна команды, когда набрано typed знаков: lead и набранная часть; строка, до которой не дошли, — пусто. */
export function cmdRowShown(r: CmdRow, typed: number): string {
  return typed < r.start ? '' : take(r.text, r.lead + typed - r.start)
}

type Plan = { entries: Entry[]; /** Сколько строк окна занимает всё вместе (до прокрутки). */ rows: number; problems: string[] }

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
    const cmdRows = ev.kind === 'browser' ? [] : commandRows(prompt, cmd)
    const cmdRow = row
    row += cmdRows.length
    // Код выхода ≠ 0: последняя показанная строка вывода цвета err — при диапазоне lines это строка, которую выбрал автор
    // (например, сама ошибка без хвоста про журнал)
    const failed = ev.kind === 'run' && ev.code !== null && ev.code !== 0
    const lines = shown.map((text, k) => {
      const rows = wrapMono(text, COLS)
      // Прокрутка уводит строки вверх, но одна строка вывода должна поместиться в окно целиком
      if (rows.length > WIN.rows) problems.push(`${who}: строка ${first + k} после переноса занимает ${rows.length} строк окна, а в окне помещается ${WIN.rows}`)
      const line = { text, rows, row, err: failed && k === shown.length - 1 }
      row += rows.length
      return line
    })
    entries.push({ event: ev.id, at: item.at, prompt, cmd, cmdRows, cmdRow, lines })
  })
  return { entries, rows: row, problems }
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
    const typedEnd = typed ? start + typedFrames(e.cmd) : start
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

/**
 * Часть терминала (cmd:, out:, line:) к концу сцены стоит не там, где появилась: после её появления окно прокрутилось дальше.
 * Так бывает с частями ранних элементов и с ранними строками последнего, если его же вывод уводит их вверх. Камера и пояснение
 * смотрят на снимок конца сцены (layout) — такую часть они ищут не там, где зритель её увидел. Не часть терминала — false.
 */
export function terminalPartMoves(spec: TerminalSpec, ctx: FrameCtx, clock: Clock, name: string): boolean {
  const p = plan(spec, ctx)
  const final = scrollAt(p.rows - 1)
  if (final === 0) return false
  const m = /^(cmd|out):(.+)$/.exec(name) ?? /^(line):(.+):(\d+)$/.exec(name)
  const i = m ? p.entries.findIndex((e) => e.event === m[2]) : -1
  if (!m || i < 0) return false
  const e = p.entries[i]
  const tl = timeline(p, clock)
  // Миг, когда часть появилась целиком: команда — с подсказкой, вывод — с последней строкой, строка — сама
  const at = m[1] === 'cmd' ? tl[i].promptAt : m[1] === 'out' ? tl[i].lineAt[e.lines.length - 1] : tl[i].lineAt[Number(m[3])]
  if (at === undefined) return false
  return scrollAt(lastRow(p, tl, at)) !== final
}

// Прямоугольник строк first…last на снимке «конец сцены» (окно прокручено на scroll строк); целиком выше окна — нет, частично — обрезан.
function place(first: number, last: number, w: number, scroll: number): Rect | null {
  const bottom = last - scroll
  if (bottom < 0) return null
  const top = Math.max(first - scroll, 0)
  return { x: TEXT_X, y: rowTop(top), w: Math.max(w, CELL), h: (bottom - top + 1) * LH }
}

export function terminalLayout(spec: TerminalSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx)
  const scroll = scrollAt(p.rows - 1)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  const put = (name: string, rect: Rect | null) => {
    if (rect) parts[name] = rect
  }
  for (const e of p.entries) {
    if (e.cmdRows.length > 0) put(`cmd:${e.event}`, place(e.cmdRow, e.cmdRow + e.cmdRows.length - 1, widest(e.cmdRows.map((r) => r.text)), scroll))
    if (e.lines.length === 0) continue
    const lastLine = e.lines[e.lines.length - 1]
    put(`out:${e.event}`, place(e.lines[0].row, lastLine.row + lastLine.rows.length - 1, widest(e.lines.flatMap((l) => l.rows)), scroll))
    e.lines.forEach((l, k) => put(`line:${e.event}:${k}`, place(l.row, l.row + l.rows.length - 1, widest(l.rows), scroll)))
  }
  return parts
}

export function terminalMoments(spec: TerminalSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx)
  const at = new Set<number>([0])
  timeline(p, clock).forEach((t, i) => {
    const e = p.entries[i]
    if (e.cmdRows.length > 0) {
      for (const f of [t.promptAt, t.start, t.typedEnd]) at.add(f)
      // Длинная команда набирается долго: начало каждой её следующей строки окна (перенос или Enter внутри кавычек) — тоже
      // перемена в кадре (как у запроса агента)
      e.cmdRows.forEach((row, k) => {
        const typed = row.start - [...e.prompt].length
        if (k > 0 && typed > 0) at.add(t.start + typedFrames(take(e.cmd, typed)))
      })
    }
    t.lineAt.forEach((f) => at.add(f))
  })
  return [...at].sort((a, b) => a - b)
}

/**
 * С какого кадра части видны (FrameDef.appears): команда — когда набрана целиком (30 знаков/с от начала набора; недонабранную не прочесть),
 * строка вывода — на своём кадре очереди (через MOTION.stagger после набора и дальше по строке), вывод — с первой строки. У события browser
 * команды нет, строки server идут с самой реплики. Камера и пояснение смотрят на конец сцены, поэтому место части здесь не важно — только время.
 */
export function terminalAppears(spec: TerminalSpec, clock: Clock, ctx: FrameCtx): Map<string, number> {
  const p = plan(spec, ctx)
  const at = new Map<string, number>()
  timeline(p, clock).forEach((t, i) => {
    const e = p.entries[i]
    if (e.cmdRows.length > 0) at.set(`cmd:${e.event}`, t.typedEnd)
    e.lines.forEach((_, k) => at.set(`line:${e.event}:${k}`, t.lineAt[k]))
    if (e.lines.length > 0) at.set(`out:${e.event}`, t.lineAt[0])
  })
  return at
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
