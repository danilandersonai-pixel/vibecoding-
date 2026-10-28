import type { FrameCtx } from '../frame'
import type { SessionEvent } from '../../sessions/types'

// Данные кадров записи: события сессий, диапазоны строк, разбор диффа. Без React.

/** Диапазон строк: с 1, включительно с обоих концов. */
export type Range = [number, number]

/** Событие по сессии, id и одному из видов; нет события или вид другой — понятная ошибка. */
export function lookup<K extends SessionEvent['kind']>(
  ctx: FrameCtx,
  session: string,
  id: string,
  kinds: readonly K[],
): { event: Extract<SessionEvent, { kind: K }>; error?: undefined } | { event?: undefined; error: string } {
  let why = ''
  for (const kind of kinds) {
    try {
      return { event: ctx.find(session, id, kind) }
    } catch (e) {
      why ||= e instanceof Error ? e.message : String(e)
    }
  }
  return { error: `нет события вида ${kinds.join(' | ')} (${why})` }
}

/** Проблема диапазона lines при total строках в записи; null — диапазон верный или не задан. */
export function rangeProblem(range: Range | undefined, total: number): string | null {
  if (!range) return null
  const [from, to] = range
  const ok = Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= from && to <= total
  return ok ? null : `lines: [${from}, ${to}] вне записи — в ней ${total} строк, диапазон идёт с 1 и включает оба конца`
}

/** Показанные строки: весь список или диапазон; first — номер первой показанной, с 1. */
export function pick<T>(all: T[], range?: Range): { items: T[]; first: number } {
  if (!range) return { items: all, first: 1 }
  return { items: all.slice(range[0] - 1, range[1]), first: range[0] }
}

/** Реплика сцены: целое от 0 до числа реплик. */
export const beatProblem = (at: number, lines: number): string | null =>
  Number.isInteger(at) && at >= 0 && at < lines ? null : `реплики ${at} нет в сцене — в ней ${lines}`

/** Строки текста файла: без пустого хвоста после последнего перевода строки. */
export function fileLines(text: string): string[] {
  if (text === '') return []
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

export type DiffKind = 'hunk' | 'add' | 'del' | 'ctx' | 'meta'
export type DiffLine = { raw: string; kind: DiffKind }

/** Строки диффа от первого «@@» (git-шапку с путями и хешами кадр не показывает). */
export function diffBody(diff: string[]): DiffLine[] {
  const start = diff.findIndex((l) => l.startsWith('@@'))
  if (start < 0) return []
  return diff.slice(start).map((raw) => ({
    raw,
    kind: raw.startsWith('@@') ? 'hunk' : raw.startsWith('+') ? 'add' : raw.startsWith('-') ? 'del' : raw.startsWith('\\') ? 'meta' : 'ctx',
  }))
}

/** «+N −M» файла: все строки диффа, а не показанный диапазон. */
export function diffCounts(body: DiffLine[]): { add: number; del: number } {
  return { add: body.filter((l) => l.kind === 'add').length, del: body.filter((l) => l.kind === 'del').length }
}

/** Номера строк нового файла, которые добавил дифф (с 1). */
export function addedLines(diff: string[]): Set<number> {
  const added = new Set<number>()
  let n = 0
  for (const { raw, kind } of diffBody(diff)) {
    if (kind === 'hunk') n = Number(/\+(\d+)/.exec(raw)?.[1] ?? 1)
    else if (kind === 'add') added.add(n++)
    else if (kind === 'ctx') n++
  }
  return added
}

// Имена свойств CSS, которые ставят в console.log(«%c…», стиль): по первому слову, «font-weight» → «font». «localhost:3000» среди них нет.
const CSS_PROPS = new Set(['color', 'background', 'font', 'border', 'margin', 'padding', 'text', 'line', 'letter', 'word', 'display', 'width', 'height', 'opacity', 'cursor', 'outline', 'box', 'white', 'vertical', 'overflow'])
// Один аргумент-стиль в конце: объявления «свойство:значение» через «;», значения без пробелов
const STYLE_TAIL = /\s+((?:[a-z-]+:\s*[^\s;]+)(?:;\s*[a-z-]+:\s*[^\s;]+)*;?)$/i

/**
 * Как сообщение показывает DevTools: «%c» убирается вместе с аргументом-стилем — с хвоста снимается столько стилей, сколько было маркеров
 * (в записи аргументы склеены через пробел), и только настоящих: «Server ready on localhost:3000» без стиля остаётся целиком.
 */
export function consoleText(text: string): string {
  const marks = text.split('%c').length - 1
  let rest = text.replaceAll('%c', '')
  for (let i = 0; i < marks; i++) {
    const m = STYLE_TAIL.exec(rest)
    const props = m ? [...m[1].matchAll(/(?:^|;)\s*([a-z-]+):/gi)].map((p) => p[1].toLowerCase().split('-')[0]) : []
    if (!m || props.length === 0 || !props.every((p) => CSS_PROPS.has(p))) break
    rest = rest.slice(0, m.index)
  }
  return rest
}
