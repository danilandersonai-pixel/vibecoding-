import type { Clock, FrameCtx, Rect } from '../frame'
import { MONO, MOTION, SAFE } from '../theme'
import { fitWidth } from './fit'
import { outsideSafe } from './geometry'
import { beatProblem } from './source'

/**
 * План ролика: «Что узнаете» и главы урока строками, как лог — номер места главы в уроке (02 у первой тематической, Martian Mono faint)
 * и название (Golos Text 36 px ink). Пункты — главы ctx.lesson.chapters без первой и последней; заголовок — первая глава урока
 * («Что узнаете» у ролика главы, «Что строим сегодня» у ролика дня), Golos 48 px 600. Пункты появляются на репликах at (по одной на пункт,
 * по порядку) или очередью от реплики 0 с шагом MOTION.stagger × 3.
 * Части: 'frame', 'item:<k>'.
 */
export type AgendaSpec = { type: 'agenda'; at?: number[] }

export const AGENDA = {
  title: { size: 48, line: 60, base: 46, gap: 40 },
  name: { size: 36, line: 48, base: 37 },
  num: { size: 28, base: 35 }, // номер: Martian Mono 28 px, две цифры
  numGap: 32,
  pitch: { max: 88, min: 56 },
  step: MOTION.stagger * 3, // шаг очереди пунктов
}
/** Левый край названия: после двух цифр номера. */
export const NAME_X = SAFE.x + 2 * AGENDA.num.size * MONO.advance + AGENDA.numGap

export type AgendaItem = { name: string; num: string; y: number; at: number; rect: Rect }
type Plan = { title: string; items: AgendaItem[]; pitch: number; problems: string[] }

/** Пункты берутся из глав урока; first — реплика 0 (там начинается очередь). */
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
  const room = SAFE.h - AGENDA.title.line - AGENDA.title.gap
  const pitch = Math.min(AGENDA.pitch.max, Math.floor(room / Math.max(1, names.length)))
  if (names.length > 0 && pitch < AGENDA.pitch.min) problems.push(`не помещается: ${names.length} пунктов по ${AGENDA.pitch.min} px, в окне помещается ${Math.floor(room / AGENDA.pitch.min)}`)
  const top = SAFE.y + AGENDA.title.line + AGENDA.title.gap
  const items = names.map((name, k): AgendaItem => {
    const w = NAME_X - SAFE.x + fitWidth(name, AGENDA.name.size)
    if (w > SAFE.w) problems.push(`item:${k} «${name}»: название шире строки (${Math.ceil(w)} px при ${SAFE.w})`)
    const y = top + k * pitch
    return {
      name,
      num: String(k + 2).padStart(2, '0'),
      y,
      at: spec.at?.[k] === undefined ? clock.beat(0) + k * AGENDA.step : clock.beat(spec.at[k]),
      rect: { x: SAFE.x, y, w: Math.min(w, SAFE.w), h: AGENDA.name.line },
    }
  })
  return { title: chapters[0] ?? 'Что узнаете', items, pitch, problems }
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
