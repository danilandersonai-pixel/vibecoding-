import type { CommitEvent } from '../../sessions/types'
import type { Clock, FrameCtx, Rect } from '../frame'
import { appear, easeOut } from '../motion'
import { MOTION, SAFE } from '../theme'
import { BODY, LH, cells, outsideSafe, rowTop } from './geometry'
import { beatProblem, lookup } from './source'

/**
 * История git: как `git log --graph`, только сверху вниз по порядку rows (родитель выше ребёнка). Строка — точка на дорожке
 * ветки, короткий хеш и сообщение. Ветка `main` идёт первой дорожкой, остальные — правее, по порядку появления; после слияния
 * fast-forward коммит `main` с родителем из другой ветки снова стоит на дорожке `main`. Линия от родителя к коммиту
 * прорисовывается за MOTION.draw кадров с реплики коммита.
 * rows — коммиты: event — commit, at — реплика, на которой он появляется.
 * heads — метки веток (рамка 2 px: main — ink, остальные — soft) в колонке справа от сообщений: на реплике at метка ветки
 * появляется у коммита или переезжает к нему за MOTION.move кадров. Меток нет, пока не заданы heads.
 * dirty — пунктирная строка «незакоммиченные правки: <text>» цвета warn от реплики at до until; стоит под последним коммитом,
 * который есть на реплике at, то есть на месте следующего коммита (он должен появиться не раньше until).
 * Части: 'frame', 'commit:<event>', 'head:<branch>' (в конце сцены), 'dirty'.
 */
export type GitLogSpec = {
  type: 'gitlog'
  rows: { session: string; event: string; at: number }[]
  heads?: { at: number; branch: string; commit: string }[]
  dirty?: { at: number; until: number; text: string }
}

/** Дорожки: x первой, шаг между ними и радиус точки. */
export const LANE = { x0: SAFE.x + 56, gap: 48, r: 10 }
/** Расстояние между строками: до 112 px, но не меньше 48 (две строки текста с зазором). */
export const PITCH = { max: 112, min: 48, pad: 36 }
/** Знаков в хеше. */
export const HASH = 7
/** Правое поле: дальше содержимое не идёт. */
const RIGHT = SAFE.x + SAFE.w - 24
export const LABEL_GAP = 16
export const DIRTY_LABEL = 'незакоммиченные правки: '

type Node = { event: string; hash: string; message: string; branch: string; parents: string[]; at: number; lane: number; slot: number; y: number }
type Edge = { child: Node; parent: Node; nth: number }
export type Label = { branch: string; x: number; w: number; entries: { at: number; y: number }[] }
type Dirty = { at: number; until: number; text: string; slot: number; y: number; head: Node | null }
type Plan = {
  nodes: Node[]
  edges: Edge[]
  lanes: string[]
  textX: number
  msgX: number
  labels: Label[]
  dirty: Dirty | null
  problems: string[]
}

export const laneX = (lane: number) => LANE.x0 + lane * LANE.gap
/** Строка окна (с долями), в которой текст высотой LH стоит по центру на y. */
export const rowFor = (y: number) => (y - LH / 2 - rowTop(0)) / LH

export function plan(spec: GitLogSpec, ctx: FrameCtx): Plan {
  const problems: string[] = []
  if (spec.rows.length === 0) problems.push('rows: нет ни одного коммита')
  const found: { row: GitLogSpec['rows'][number]; i: number; ev: CommitEvent }[] = []
  const seen = new Set<string>()
  spec.rows.forEach((row, i) => {
    const who = `rows[${i}] «${row.event}»`
    const got = lookup(ctx, row.session, row.event, ['commit'] as const)
    if (got.error !== undefined) return void problems.push(`${who}: ${got.error}`)
    if (seen.has(row.event)) return void problems.push(`${who}: коммит показан дважды`)
    seen.add(row.event)
    found.push({ row, i, ev: got.event })
  })

  // Дорожки: main первая, остальные по порядку появления
  const branches = [...new Set(found.map((f) => f.ev.branch))]
  const lanes = branches.includes('main') ? ['main', ...branches.filter((b) => b !== 'main')] : branches

  // Строки сверху вниз; под последним коммитом, который уже есть на реплике dirty.at, стоит строка dirty
  let dirtySlot = -1
  if (spec.dirty) {
    found.forEach((f, k) => {
      if (f.row.at <= spec.dirty!.at) dirtySlot = k + 1
    })
    if (dirtySlot < 0) dirtySlot = 0
  }
  const slots = Math.max(found.length, dirtySlot + 1, 1)
  const avail = BODY.h - 2 * PITCH.pad
  const pitch = Math.min(PITCH.max, Math.floor(avail / slots))
  if (pitch < PITCH.min) problems.push(`не помещается: ${slots} строк по ${PITCH.min} px, в окне помещается ${Math.floor(avail / PITCH.min)}`)
  const yOf = (slot: number) => BODY.y + PITCH.pad + pitch * (slot + 0.5)

  const nodes: Node[] = found.map((f, k) => ({
    event: f.row.event,
    hash: f.ev.hash,
    message: f.ev.message,
    branch: f.ev.branch,
    parents: f.ev.parents,
    at: f.row.at,
    lane: lanes.indexOf(f.ev.branch),
    slot: k,
    y: yOf(k),
  }))

  // Линии к родителям, которые тоже на экране; родитель выше ребёнка и появляется не позже
  const edges: Edge[] = []
  nodes.forEach((child) => {
    child.parents.forEach((hash, nth) => {
      const parent = nodes.find((n) => n.hash === hash)
      if (!parent) return
      if (parent.slot > child.slot) problems.push(`коммит «${child.event}» стоит выше своего родителя «${parent.event}» — порядок rows от старых коммитов к новым`)
      else if (parent.at > child.at) problems.push(`родитель «${parent.event}» появляется на реплике ${parent.at}, позже своего коммита «${child.event}» (реплика ${child.at})`)
      else edges.push({ child, parent, nth })
    })
  })

  // Колонки: дорожки, хеш, сообщение; справа метки веток
  const textX = LANE.x0 + Math.max(0, lanes.length - 1) * LANE.gap + 40
  const msgX = textX + cells(HASH + 2)
  const msgEnd = msgX + cells(Math.max(0, ...nodes.map((n) => [...n.message].length)))
  const heads = spec.heads ?? []
  const order = [...new Set(heads.map((h) => h.branch))].sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : 0))
  let x = msgEnd + cells(2)
  const labels: Label[] = order.map((branch) => {
    const w = cells([...branch].length + 2)
    const label: Label = { branch, x, w, entries: [] }
    x += w + LABEL_GAP
    return label
  })
  heads.forEach((h, i) => {
    const node = nodes.find((n) => n.event === h.commit)
    if (!h.branch) problems.push(`heads[${i}]: пустое имя ветки`)
    else if (!seen.has(h.commit)) problems.push(`heads[${i}]: коммита «${h.commit}» нет среди rows`)
    else if (node && h.at < node.at) problems.push(`heads[${i}]: метка «${h.branch}» указывает на коммит «${h.commit}» на реплике ${h.at}, а он появляется на реплике ${node.at}`)
    if (node) labels.find((l) => l.branch === h.branch)?.entries.push({ at: h.at, y: node.y })
  })
  for (const l of labels) l.entries.sort((a, b) => a.at - b.at)
  const right = labels.length > 0 ? x - LABEL_GAP : msgEnd
  if (right > RIGHT) problems.push(`не помещается: коммиты и метки веток занимают ${Math.round(right - SAFE.x)} px, а в окне помещается ${RIGHT - SAFE.x}`)

  let dirty: Dirty | null = null
  if (spec.dirty) {
    const d = spec.dirty
    const head = dirtySlot > 0 ? (nodes[dirtySlot - 1] ?? null) : null
    dirty = { ...d, slot: dirtySlot, y: yOf(dirtySlot), head }
    if (d.until <= d.at) problems.push(`dirty.until (${d.until}) должен быть позже dirty.at (${d.at})`)
    const next = nodes[dirtySlot]
    if (next && next.at < d.until) problems.push(`незакоммиченные правки висят до реплики ${d.until}, а коммит «${next.event}» на этой же строке появляется на реплике ${next.at}`)
    if (textX + cells([...DIRTY_LABEL, ...d.text].length) > RIGHT) problems.push(`не помещается: строка «${DIRTY_LABEL}${d.text}» шире окна`)
  }
  return { nodes, edges, lanes, textX, msgX, labels, dirty, problems }
}

/** Положение и прозрачность метки на кадре frame: нет до первой реплики; первая — появляется на месте; дальше переезжает за MOTION.move кадров. */
export function headAt(entries: Label['entries'], frame: number, clock: Clock): { y: number; opacity: number } | null {
  let k = -1
  entries.forEach((e, i) => {
    if (frame >= clock.beat(e.at)) k = i
  })
  if (k < 0) return null
  const e = entries[k]
  if (k === 0) return { y: e.y, opacity: appear(frame, clock.beat(e.at)) }
  const from = entries[k - 1].y
  return { y: from + (e.y - from) * easeOut((frame - clock.beat(e.at)) / MOTION.move), opacity: 1 }
}

/** Линия от точки родителя (x1, y1) к точке коммита (x2, y2): прямая на одной дорожке, плавная кривая между дорожками. */
export function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const n = (v: number) => +v.toFixed(2)
  if (x1 === x2) return `M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}`
  const ym = (y1 + y2) / 2
  return `M${n(x1)} ${n(y1)} C${n(x1)} ${n(ym)} ${n(x2)} ${n(ym)} ${n(x2)} ${n(y2)}`
}

const strip = (x: number, y: number, w: number): Rect => ({ x, y: y - LH / 2, w, h: LH })

export function gitLogLayout(spec: GitLogSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  for (const n of p.nodes) {
    const x = laneX(n.lane) - LANE.r - 12
    parts[`commit:${n.event}`] = strip(x, n.y, p.msgX + cells([...n.message].length) - x)
  }
  for (const l of p.labels) {
    const last = l.entries[l.entries.length - 1]
    if (last) parts[`head:${l.branch}`] = strip(l.x, last.y, l.w)
  }
  if (p.dirty) {
    const x = laneX(p.dirty.head?.lane ?? 0) - LANE.r - 12
    parts.dirty = strip(x, p.dirty.y, p.textX + cells([...DIRTY_LABEL, ...p.dirty.text].length) - x)
  }
  return parts
}

export function gitLogMoments(spec: GitLogSpec, clock: Clock): number[] {
  const at = new Set<number>([0])
  for (const r of spec.rows) at.add(clock.beat(r.at))
  for (const h of spec.heads ?? []) at.add(clock.beat(h.at))
  if (spec.dirty) {
    at.add(clock.beat(spec.dirty.at))
    at.add(clock.beat(spec.dirty.until))
  }
  return [...at].sort((a, b) => a - b)
}

export function gitLogProblems(spec: GitLogSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  spec.rows.forEach((r, i) => {
    const why = beatProblem(r.at, clock.lines)
    if (why) bad.push(`rows[${i}] «${r.event}»: ${why}`)
  })
  ;(spec.heads ?? []).forEach((h, i) => {
    const why = beatProblem(h.at, clock.lines)
    if (why) bad.push(`heads[${i}]: ${why}`)
  })
  if (spec.dirty) {
    for (const key of ['at', 'until'] as const) {
      const why = beatProblem(spec.dirty[key], clock.lines)
      if (why) bad.push(`dirty.${key}: ${why}`)
    }
  }
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(gitLogLayout(spec, ctx)))
  // Конец последней анимации: линия, переезд метки, растворение dirty
  const ends = [
    ...spec.rows.map((r) => clock.beat(r.at) + MOTION.draw),
    ...(spec.heads ?? []).map((h) => clock.beat(h.at) + MOTION.move),
    ...(spec.dirty ? [clock.beat(spec.dirty.until) + MOTION.appear] : []),
  ]
  const last = Math.max(...ends)
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последняя анимация кончается на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
