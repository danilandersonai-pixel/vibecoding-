import type { Clock, FrameCtx, Rect } from '../frame'
import { fitText } from '../text'
import { MONO, MOTION, SAFE } from '../theme'
import { fitWidth, fitWrap } from './fit'
import { outsideSafe } from './geometry'
import { beatProblem } from './source'

/**
 * План ролика: кикер «Что узнаете» (название первой главы урока, Martian Mono 24 px faint), под ним название урока (ctx.lesson.title,
 * Golos 56 px 600 ink, переносится по ширине SAFE, не больше двух строк) и главы строками, как лог — номер места главы в уроке
 * (02 у первой тематической, Martian Mono faint) и название (Golos Text 36 px ink). Пункты — главы ctx.lesson.chapters без первой и последней.
 * Кикер и название появляются вместе с кадром, пункты — на репликах at (по одной на пункт, по порядку) или очередью от реплики 0
 * с шагом MOTION.stagger × 3. Вся группа стоит по центру высоты SAFE; выше SAFE — от верха. Кикер — одна строка без переноса:
 * шире SAFE — проблема.
 * Части: 'frame', 'item:<k>'.
 */
export type AgendaSpec = { type: 'agenda'; at?: number[] }

export const AGENDA = {
  kicker: { size: 24, line: 32, base: 24, gap: 8 }, // gap — до названия урока
  title: { size: 56, line: 68, base: 52, maxLines: 2, gap: 40 }, // gap — до первой строки глав
  name: { size: 36, line: 48, base: 37 },
  num: { size: 28, base: 35 }, // номер: Martian Mono 28 px, две цифры
  numGap: 32,
  pitch: { max: 88, min: 56 },
  step: MOTION.stagger * 3, // шаг очереди пунктов
}
/** Левый край названия главы: после двух цифр номера. */
export const NAME_X = SAFE.x + 2 * AGENDA.num.size * MONO.advance + AGENDA.numGap

export type AgendaItem = { name: string; num: string; y: number; at: number; rect: Rect }
type Plan = {
  /** Кикер: текст, верх строки и ширина (Martian Mono 24 px). */
  kicker: { text: string; y: number; w: number }
  title: { lines: string[]; y: number }
  items: AgendaItem[]
  pitch: number
  /** Вся группа: от верха кикера до низа последней строки. */
  group: Rect
  problems: string[]
}

export function plan(spec: AgendaSpec, ctx: FrameCtx, clock: Clock): Plan {
  const chapters = ctx.lesson.chapters
  const problems: string[] = []
  const names = chapters.slice(1, -1)
  if (names.length === 0) problems.push('в уроке нет тематических глав: между «Что узнаете» и «Итог» нужна хотя бы одна')
  if (spec.at && spec.at.length !== names.length) problems.push(`at: ${spec.at.length} реплик на ${names.length} пунктов — у каждой главы своя реплика`)
  else if (spec.at) {
    spec.at.forEach((a, k) => {
      if (k > 0 && a < spec.at![k - 1]) problems.push(`at[${k}]: пункты идут по порядку реплик, а реплика ${a} раньше реплики ${spec.at![k - 1]}`)
    })
  }

  // Кикер — строка Martian Mono без переноса: ширина точная, знак за знаком
  const kicker = chapters[0] ?? 'Что узнаете'
  const kickerW = [...kicker].length * AGENDA.kicker.size * MONO.advance
  if (kickerW > SAFE.w + 0.01) problems.push(`кикер «${fitText(kicker, 40)}»: шире строки (${Math.ceil(kickerW)} px при ${SAFE.w}) — сократите название первой главы урока`)

  const lines = fitWrap(ctx.lesson.title, AGENDA.title.size, SAFE.w)
  if (lines.length > AGENDA.title.maxLines) problems.push(`название урока занимает ${lines.length} строк, а нужно не больше ${AGENDA.title.maxLines}`)
  const header = AGENDA.kicker.line + AGENDA.kicker.gap + lines.length * AGENDA.title.line + AGENDA.title.gap

  // Шаг строк: до 88 px, чтобы вся группа влезла в SAFE; меньше 56 — проблема, группа тогда выше SAFE и идёт от верха
  const fitPitch = names.length > 1 ? Math.floor((SAFE.h - header - AGENDA.name.line) / (names.length - 1)) : AGENDA.pitch.max
  if (names.length > 0 && fitPitch < AGENDA.pitch.min) problems.push(`не помещается: ${names.length} пунктов по ${AGENDA.pitch.min} px вместе с названием урока, в окне помещается ${Math.floor((SAFE.h - header - AGENDA.name.line) / AGENDA.pitch.min) + 1}`)
  const pitch = Math.min(AGENDA.pitch.max, Math.max(AGENDA.pitch.min, fitPitch))
  const height = header + Math.max(0, names.length - 1) * pitch + (names.length > 0 ? AGENDA.name.line : 0)
  const top = SAFE.y + Math.max(0, Math.floor((SAFE.h - height) / 2))

  const rows = top + header
  const items = names.map((name, k): AgendaItem => {
    const w = NAME_X - SAFE.x + fitWidth(name, AGENDA.name.size)
    if (w > SAFE.w) problems.push(`item:${k} «${name}»: название шире строки (${Math.ceil(w)} px при ${SAFE.w})`)
    const y = rows + k * pitch
    return {
      name,
      num: String(k + 2).padStart(2, '0'),
      y,
      at: spec.at?.[k] === undefined ? clock.beat(0) + k * AGENDA.step : clock.beat(spec.at[k]),
      rect: { x: SAFE.x, y, w: Math.min(w, SAFE.w), h: AGENDA.name.line },
    }
  })
  return {
    kicker: { text: kicker, y: top, w: kickerW },
    title: { lines, y: top + AGENDA.kicker.line + AGENDA.kicker.gap },
    items,
    pitch,
    group: { x: SAFE.x, y: top, w: SAFE.w, h: height },
    problems,
  }
}

export function agendaLayout(spec: AgendaSpec, ctx: FrameCtx): Record<string, Rect> {
  // Положение пунктов не зависит от часов: реплика нужна только для времени
  const p = plan(spec, ctx, { beat: () => 0, duration: 0, lines: 0 })
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  p.items.forEach((it, k) => (parts[`item:${k}`] = it.rect))
  return parts
}

export function agendaMoments(spec: AgendaSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx, clock)
  return [...new Set([0, ...p.items.map((i) => i.at)])].sort((a, b) => a - b)
}

export function agendaProblems(spec: AgendaSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx, clock)
  const bad = [...p.problems]
  spec.at?.forEach((a, k) => {
    const why = beatProblem(a, clock.lines)
    if (why) bad.push(`at[${k}]: ${why}`)
  })
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(agendaLayout(spec, ctx)))
  const last = Math.max(MOTION.appear, ...p.items.map((i) => i.at + MOTION.appear))
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последнее появление кончается на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
