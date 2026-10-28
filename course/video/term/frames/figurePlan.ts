import type { Clock, FrameCtx, Rect } from '../frame'
import { appear } from '../motion'
import { MIN_TEXT, MOTION, SAFE } from '../theme'
import { beatProblem } from './source'
import { isDrawable, splitSvg } from './svg'

/**
 * Схема книги (content/figures/*.svg, `?raw`). Вписывается в SAFE с сохранением пропорций и по центру; crop [x, y, w, h] в координатах
 * схемы показывает только часть: так мелкий текст схемы (11–12 px) растёт до 24 px и больше. Масштаб × самый мелкий шрифт < 24 — problems.
 * Элементы схемы появляются по порядку между репликами reveal.from и reveal.to (равномерно, последний кончает на beat(to));
 * без reveal все появляются на реплике 0 и к beat(0) + MOTION.draw схема готова. Сплошные линии (<path>) прорисовываются за MOTION.draw,
 * остальное появляется за MOTION.appear.
 * focus — рамка ink 2 px вокруг части схемы (rect в координатах схемы), остальное приглушается до 35 %; focus идут по очереди,
 * следующий заменяет предыдущий (растворение за MOTION.appear). Название части 'focus:<name>'.
 * Части: 'frame' (SAFE), 'focus:<name>' (на холсте).
 */
export type Box = [number, number, number, number]
export type FigureSpec = {
  type: 'figure'
  svg: string
  crop?: Box
  reveal?: { from: number; to: number }
  focus?: { at: number; name: string; rect: Box }[]
}

/** Подложка focus: desk с этой непрозрачностью (остальное — 35 %), рамка ink и скругление. */
export const FOCUS = { dim: 0.65, radius: 8, stroke: 2 }

export type Parsed = { ok: true; viewBox: Box; children: string[]; minFont: number } | { ok: false; error: string }

// Разбор схемы повторяется в каждом кадре и в каждой проверке; схема — строка, ключ по ней.
const parsed = new Map<string, Parsed>()
export function parse(svg: string): Parsed {
  const known = parsed.get(svg)
  if (known) return known
  let out: Parsed
  try {
    out = { ok: true, ...splitSvg(svg) }
  } catch (e) {
    out = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  if (parsed.size >= 64) parsed.clear()
  parsed.set(svg, out)
  return out
}

const finite = (b: Box) => b.length === 4 && b.every((n) => Number.isFinite(n))
const EPS = 1e-6
/** Прямоугольник b лежит внутри a. */
const within = (b: Box, a: Box) => b[0] >= a[0] - EPS && b[1] >= a[1] - EPS && b[0] + b[2] <= a[0] + a[2] + EPS && b[1] + b[3] <= a[1] + a[3] + EPS

/** Показанная часть схемы: верный crop или весь viewBox. */
export function viewOf(spec: FigureSpec, viewBox: Box): Box {
  const c = spec.crop
  return c && finite(c) && c[2] > 0 && c[3] > 0 && within(c, viewBox) ? c : viewBox
}

export type Fit = { view: Box; scale: number; rect: Rect }
/** Вписать view в SAFE: масштаб одинаковый по осям, схема по центру. */
export function fit(view: Box): Fit {
  const scale = Math.min(SAFE.w / view[2], SAFE.h / view[3])
  const w = view[2] * scale
  const h = view[3] * scale
  return { view, scale, rect: { x: SAFE.x + (SAFE.w - w) / 2, y: SAFE.y + (SAFE.h - h) / 2, w, h } }
}

/** Прямоугольник в координатах схемы → на холсте. */
export function toCanvas(f: Fit, b: Box): Rect {
  return { x: f.rect.x + (b[0] - f.view[0]) * f.scale, y: f.rect.y + (b[1] - f.view[1]) * f.scale, w: b[2] * f.scale, h: b[3] * f.scale }
}

/** Сколько кадров элемент приходит: линия прорисовывается, остальное появляется. */
export const lenOf = (child: string) => (isDrawable(child) ? MOTION.draw : MOTION.appear)

/** Кадр, на котором начинает появляться каждый элемент схемы. */
export function starts(spec: FigureSpec, clock: Clock, children: string[]): number[] {
  if (!spec.reveal) return children.map(() => clock.beat(0))
  const a = clock.beat(spec.reveal.from)
  const b = clock.beat(spec.reveal.to)
  const n = children.length
  // последний элемент кончает на beat(to), остальные идут до него равным шагом
  const step = n > 1 ? Math.max(0, (b - a - lenOf(children[n - 1])) / (n - 1)) : 0
  return children.map((_, k) => Math.round(a + k * step))
}

/** Какие focus видны на кадре frame и насколько: текущий — appear, предыдущий — уходит за те же MOTION.appear. */
export function focusLayers(spec: FigureSpec, clock: Clock, frame: number): { index: number; o: number }[] {
  const list = spec.focus ?? []
  let cur = -1
  list.forEach((f, i) => {
    if (frame >= clock.beat(f.at)) cur = i
  })
  if (cur < 0) return []
  const o = appear(frame, clock.beat(list[cur].at))
  const layers = o > 0 ? [{ index: cur, o }] : []
  if (cur > 0 && o < 1) layers.unshift({ index: cur - 1, o: 1 - o })
  return layers
}

export function figureLayout(spec: FigureSpec): Record<string, Rect> {
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  const p = parse(spec.svg)
  if (!p.ok) return parts
  const f = fit(viewOf(spec, p.viewBox))
  for (const fo of spec.focus ?? []) if (finite(fo.rect)) parts[`focus:${fo.name}`] = toCanvas(f, fo.rect)
  return parts
}

export function figureMoments(spec: FigureSpec, clock: Clock): number[] {
  const p = parse(spec.svg)
  const at = new Set<number>([0])
  if (p.ok) for (const s of starts(spec, clock, p.children)) at.add(s)
  for (const fo of spec.focus ?? []) at.add(clock.beat(fo.at))
  return [...at].sort((a, b) => a - b)
}

export function figureProblems(spec: FigureSpec, _ctx: FrameCtx, clock: Clock): string[] {
  const p = parse(spec.svg)
  if (!p.ok) return [`схема: ${p.error}`]
  const bad: string[] = []
  const { viewBox } = p
  if (p.children.length === 0) bad.push('в схеме нет ни одного элемента')
  if (spec.crop) {
    const c = spec.crop
    if (!finite(c) || c[2] <= 0 || c[3] <= 0 || !within(c, viewBox)) {
      bad.push(`crop [${c.join(', ')}] вне viewBox [${viewBox.join(', ')}]: x, y, ширина и высота — в координатах схемы, не за её границы`)
    }
  }
  const reveal = spec.reveal
  if (reveal) {
    for (const key of ['from', 'to'] as const) {
      const why = beatProblem(reveal[key], clock.lines)
      if (why) bad.push(`reveal.${key}: ${why}`)
    }
    if (bad.length === 0 && reveal.to < reveal.from) bad.push(`reveal.to (${reveal.to}) раньше reveal.from (${reveal.from}): схема показывается от реплики from до реплики to`)
  }
  if (bad.length > 0) return bad

  const f = fit(viewOf(spec, viewBox))
  const small = f.scale * p.minFont
  if (small < MIN_TEXT - EPS) {
    bad.push(`мелкий текст: при масштабе ${f.scale.toFixed(2)} самый мелкий шрифт схемы (${p.minFont} px) станет ${small.toFixed(1)} px, а в кадре нужно не меньше ${MIN_TEXT} — обрежьте схему crop`)
  }

  const names = new Set<string>()
  const list = spec.focus ?? []
  list.forEach((fo, i) => {
    const who = `focus[${i}] «${fo.name}»`
    const why = beatProblem(fo.at, clock.lines)
    if (why) bad.push(`${who}: ${why}`)
    if (!fo.name) bad.push(`${who}: у части нет имени`)
    else if (names.has(fo.name)) bad.push(`${who}: имя повторяется — части называются по-разному`)
    names.add(fo.name)
    if (!finite(fo.rect) || fo.rect[2] <= 0 || fo.rect[3] <= 0) bad.push(`${who}: rect [${fo.rect.join(', ')}] — нужны x, y, ширина и высота больше нуля`)
    else if (!within(fo.rect, viewOf(spec, viewBox))) bad.push(`${who}: rect [${fo.rect.join(', ')}] вне показанной части схемы [${viewOf(spec, viewBox).join(', ')}]`)
    if (i > 0 && !why && fo.at <= list[i - 1].at) bad.push(`${who}: реплика ${fo.at} не позже реплики ${list[i - 1].at} — focus идут по порядку реплик`)
  })
  if (bad.length > 0) return bad

  const ends = [
    ...starts(spec, clock, p.children).map((s, k) => s + lenOf(p.children[k])),
    ...list.map((fo) => clock.beat(fo.at) + MOTION.appear),
  ]
  const last = Math.max(...ends)
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последняя анимация кончается на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
