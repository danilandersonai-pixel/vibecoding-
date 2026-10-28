import type { Clock, FrameCtx, Rect } from '../frame'
import { monoChars, wrapMono } from '../text'
import { MOTION, SAFE } from '../theme'
import { BODY, CELL, LH, WIN, cells, outsideSafe, rowTop } from './geometry'
import { addedLines, beatProblem, fileLines, lookup, pick, rangeProblem } from './source'
import type { Range } from './source'

/**
 * Редактор: слева дерево файлов (папки свёрнуты, раскрыта только папка файла события, сам файл выделен),
 * справа файл с номерами строк. event — file (показан файл после правки) или read (прочитанный файл).
 * tree — коммит, чьи файлы составляют дерево; без него кода во всё окно.
 * lines — показанные строки файла: с 1, включительно; без него — весь файл (в окне помещается 18 строк, считая перенос).
 * highlight — полоса под строками файла (номера файловые), растягивается за 9 кадров.
 * typing — новые строки диффа набираются, начиная с реплики at; ghost — те же строки серым с реплики at,
 * а на реплике accept — обычным цветом (подсказка принята). Оба — только у file, и не вместе.
 * Части: 'frame', 'tree', 'code', 'line:<n>' (n — номер строки файла).
 */
export type EditorSpec = {
  type: 'editor'
  session: string
  event: string
  tree?: { session: string; commit: string }
  lines?: Range
  highlight?: { at: number; lines: Range }[]
  typing?: { at: number }
  ghost?: { at: number; accept: number }
}

export const DIVIDER = 2
export const PANEL_PAD = WIN.pad
/** В окне, кроме строки с именем файла, помещается столько строк кода. */
const CODE_ROWS = WIN.rows - 1

export type TreeRow = { label: string; path: string; depth: number; kind: 'dir' | 'open' | 'file'; selected: boolean }
export type CodeLine = { n: number; text: string; rows: string[]; row: number; isNew: boolean }
export type Geo = { treeW: number; panelX: number; panelW: number; numRight: number; textX: number; cols: number }
type Plan = {
  kind: 'file' | 'read'
  path: string
  lines: CodeLine[]
  total: number
  codeRows: number
  tree: TreeRow[] | null
  geo: Geo
  problems: string[]
  ok: boolean
}

type Node = { name: string; path: string; dirs: Map<string, Node>; files: string[] }

// Дерево папок и файлов по путям; папки раньше файлов, внутри — по алфавиту без учёта регистра.
function buildTree(paths: string[], selected: string): TreeRow[] {
  const root: Node = { name: '', path: '', dirs: new Map(), files: [] }
  for (const path of new Set([...paths, selected])) {
    const parts = path.split('/')
    let node = root
    parts.slice(0, -1).forEach((name, i) => {
      if (!node.dirs.has(name)) node.dirs.set(name, { name, path: parts.slice(0, i + 1).join('/') + '/', dirs: new Map(), files: [] })
      node = node.dirs.get(name)!
    })
    node.files.push(path)
  }
  const byName = (a: string, b: string) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0)
  const rows: TreeRow[] = []
  const walk = (node: Node, depth: number) => {
    for (const name of [...node.dirs.keys()].sort(byName)) {
      // Цепочка папок с единственной вложенной папкой — одной строкой: «api/sets/»
      let dir = node.dirs.get(name)!
      let label = dir.name + '/'
      while (dir.files.length === 0 && dir.dirs.size === 1) {
        dir = [...dir.dirs.values()][0]
        label += dir.name + '/'
      }
      const open = selected.startsWith(dir.path)
      rows.push({ label, path: dir.path, depth, kind: open ? 'open' : 'dir', selected: false })
      if (open) walk(dir, depth + 1)
    }
    for (const path of node.files.sort((a, b) => byName(a.split('/').pop()!, b.split('/').pop()!))) {
      rows.push({ label: path.split('/').pop()!, path, depth, kind: 'file', selected: path === selected })
    }
  }
  walk(root, 0)
  return rows
}

// Ширины: дерево по самой длинной подписи, дальше колонка номеров и поле кода.
function geometry(tree: TreeRow[] | null, total: number): Geo {
  const need = tree ? Math.max(...tree.map((r) => r.depth * 2 + 2 + [...r.label].length)) : 0
  const treeW = tree ? Math.min(Math.max(Math.ceil(cells(need)) + 2 * PANEL_PAD, 320), 520) : 0
  const panelX = tree ? SAFE.x + treeW + DIVIDER : SAFE.x
  const panelW = SAFE.x + SAFE.w - panelX
  const numRight = panelX + PANEL_PAD + cells(Math.max(2, String(total).length))
  const textX = Math.round(numRight + 1.5 * CELL)
  return { treeW, panelX, panelW, numRight, textX, cols: monoChars(panelX + panelW - PANEL_PAD - textX) }
}

const EMPTY: Plan = { kind: 'file', path: '', lines: [], total: 0, codeRows: 0, tree: null, geo: geometry(null, 0), problems: [], ok: false }

export function plan(spec: EditorSpec, ctx: FrameCtx): Plan {
  const found = lookup(ctx, spec.session, spec.event, ['file', 'read'] as const)
  if (found.error !== undefined) return { ...EMPTY, problems: [`«${spec.event}»: ${found.error}`] }
  const ev = found.event
  const problems: string[] = []
  const all = fileLines(ev.kind === 'file' ? ev.after : ev.text)
  const added = ev.kind === 'file' ? addedLines(ev.diff) : new Set<number>()

  let tree: TreeRow[] | null = null
  if (spec.tree) {
    const commit = lookup(ctx, spec.tree.session, spec.tree.commit, ['commit'] as const)
    if (commit.error !== undefined) problems.push(`tree: ${commit.error}`)
    else tree = buildTree(commit.event.files.map((f) => f.path), ev.path)
  }
  const geo = geometry(tree, all.length)

  const bad = rangeProblem(spec.lines, all.length)
  if (bad) problems.push(bad)
  const { items: shown, first } = bad ? { items: [], first: 1 } : pick(all, spec.lines)
  // Длинная строка переносится по ширине поля кода; row — первая строка окна под вкладкой (с нуля)
  let row = 0
  const lines = shown.map((text, i) => {
    const rows = wrapMono(text, geo.cols)
    const line = { n: first + i, text, rows, row, isNew: added.has(first + i) }
    row += rows.length
    return line
  })
  return { kind: ev.kind, path: ev.path, lines, total: all.length, codeRows: row, tree, geo, problems, ok: true }
}

type Timing = {
  typing: { start: number; lineStart: Map<number, number>; end: number } | null
  ghost: { lineAt: Map<number, number>; accept: number } | null
  highlight: number[]
}

export function timeline(spec: EditorSpec, p: Plan, clock: Clock): Timing {
  const fresh = p.lines.filter((l) => l.isNew)
  let typing: Timing['typing'] = null
  if (spec.typing) {
    // Новые строки набираются по очереди, знак за кадр; между строками — кадр на перевод строки
    const start = clock.beat(spec.typing.at)
    const lineStart = new Map<number, number>()
    let offset = 0
    for (const l of fresh) {
      lineStart.set(l.n, start + offset)
      offset += [...l.text].length + 1
    }
    typing = { start, lineStart, end: start + Math.max(0, offset - 1) }
  }
  let ghost: Timing['ghost'] = null
  if (spec.ghost) {
    const at = clock.beat(spec.ghost.at)
    ghost = { lineAt: new Map(fresh.map((l, i) => [l.n, at + i * MOTION.stagger])), accept: clock.beat(spec.ghost.accept) }
  }
  return { typing, ghost, highlight: (spec.highlight ?? []).map((h) => clock.beat(h.at)) }
}

// Область строк файла a…b в окне: от верха строки a до низа строки b (с учётом переноса).
export function span(p: Plan, [a, b]: Range): { y: number; h: number } | null {
  const from = p.lines.find((l) => l.n === a)
  const to = p.lines.find((l) => l.n === b)
  if (!from || !to) return null
  return { y: rowTop(1 + from.row), h: (to.row + to.rows.length - from.row) * LH }
}

const widest = (rows: string[]) => cells(Math.max(1, ...rows.map((r) => [...r].length)))

export function editorLayout(spec: EditorSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  if (!p.ok) return parts
  if (p.tree) parts.tree = { x: SAFE.x, y: BODY.y, w: p.geo.treeW, h: BODY.h }
  parts.code = { x: p.geo.panelX, y: rowTop(1), w: p.geo.panelW, h: Math.max(1, p.codeRows) * LH }
  for (const l of p.lines) parts[`line:${l.n}`] = { x: p.geo.textX, y: rowTop(1 + l.row), w: widest(l.rows), h: l.rows.length * LH }
  return parts
}

export function editorMoments(spec: EditorSpec, clock: Clock, ctx: FrameCtx): number[] {
  const t = timeline(spec, plan(spec, ctx), clock)
  const at = new Set<number>([0, ...t.highlight])
  if (t.typing) [...t.typing.lineStart.values(), t.typing.end].forEach((f) => at.add(f))
  if (t.ghost) [...t.ghost.lineAt.values(), t.ghost.accept].forEach((f) => at.add(f))
  return [...at].sort((a, b) => a - b)
}

export function editorProblems(spec: EditorSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  if (!p.ok) return bad
  if (p.kind === 'read') {
    if (spec.ghost) bad.push('ghost есть только у события file: у read нет новых строк')
    if (spec.typing) bad.push('typing есть только у события file: у read нет новых строк')
  }
  if (spec.typing && spec.ghost) bad.push('typing и ghost вместе: строки либо набираются, либо появляются подсказкой')
  if ((spec.typing || spec.ghost) && p.kind === 'file' && !p.lines.some((l) => l.isNew)) bad.push('typing/ghost: среди показанных строк нет новых')
  if (spec.ghost && spec.ghost.accept <= spec.ghost.at) bad.push(`ghost: accept (${spec.ghost.accept}) должна идти после at (${spec.ghost.at})`)
  const beats: [string, number][] = [
    ...(spec.typing ? [['typing.at', spec.typing.at] as [string, number]] : []),
    ...(spec.ghost ? ([['ghost.at', spec.ghost.at], ['ghost.accept', spec.ghost.accept]] as [string, number][]) : []),
    ...(spec.highlight ?? []).map((h, i): [string, number] => [`highlight[${i}].at`, h.at]),
  ]
  for (const [name, at] of beats) {
    const why = beatProblem(at, clock.lines)
    if (why) bad.push(`${name}: ${why}`)
  }
  ;(spec.highlight ?? []).forEach((h, i) => {
    const why = rangeProblem(h.lines, p.total)
    if (why) bad.push(`highlight[${i}]: ${why}`)
    else if (!span(p, h.lines)) bad.push(`highlight[${i}]: строки ${h.lines[0]}–${h.lines[1]} не показаны в окне`)
  })
  if (p.codeRows > CODE_ROWS) bad.push(`не помещается: показано ${p.codeRows} строк с переносом, в окне помещается ${CODE_ROWS} строк`)
  if (p.tree && p.tree.length > WIN.rows) bad.push(`дерево не помещается: ${p.tree.length} строк, в окне помещается ${WIN.rows}`)
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(editorLayout(spec, ctx)))
  const last = Math.max(...editorMoments(spec, clock, ctx))
  if (last >= clock.duration) bad.push(`набор или подсказка не успевают до конца сцены: последнее изменение на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
