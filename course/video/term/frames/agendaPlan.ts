import type { Clock, FrameCtx, Rect } from '../frame'
import { balanceText, fitText } from '../text'
import { MONO, MOTION, SAFE } from '../theme'
import { FIT, fitWidth, fitWrap } from './fit'
import { outsideSafe } from './geometry'
import { beatProblem } from './source'

/**
 * План ролика: кикер (название первой главы урока: «Что узнаете» у ролика главы, «Что строим сегодня» у ролика дня; Martian Mono 24 px
 * faint), под ним название урока (ctx.lesson.title, Golos 56 px 600 ink, переносится по ширине SAFE, не больше двух строк) и пункты
 * строками, как лог — номер (Martian Mono faint) и текст (Golos Text 36 px ink).
 * Пункты: если заданы items — они («что строим сегодня» у ролика дня), номера 01, 02 …; иначе — главы ctx.lesson.chapters без первой
 * и последней, номер — место главы в уроке (02 у первой тематической).
 * Текст пункта переносится по словам в ширину от NAME_X до правого края SAFE (строки выровнены по длине, без висячего слова), не больше
 * двух строк — больше проблема, как и слово шире строки и пункт без текста; следующий пункт опускается на перенесённую строку (шаг строк
 * растёт на перенос). Номер — у первой строки.
 * Кикер и название появляются вместе с кадром, пункты — на репликах at (по одной на пункт, по порядку) или очередью от реплики 0
 * с шагом MOTION.stagger × 3. Вся группа стоит по центру высоты SAFE; выше SAFE — от верха. Кикер — одна строка без переноса:
 * шире SAFE — проблема.
 * Части: 'frame', 'item:<k>' (все строки пункта k).
 */
export type AgendaSpec = { type: 'agenda'; at?: number[]; items?: string[] }

export const AGENDA = {
  kicker: { size: 24, line: 32, base: 24, gap: 8 }, // gap — до названия урока
  title: { size: 56, line: 68, base: 52, maxLines: 2, gap: 40 }, // gap — до первой строки пунктов
  name: { size: 36, line: 48, base: 37, maxLines: 2 }, // line — и шаг перенесённых строк пункта
  num: { size: 28, base: 35 }, // номер: Martian Mono 28 px, две цифры
  numGap: 32,
  pitch: { max: 88, min: 56 }, // шаг от пункта к пункту, если пункт в одну строку; перенос добавляет name.line
  step: MOTION.stagger * 3, // шаг очереди пунктов
}
/** Левый край текста пункта: после двух цифр номера. */
export const NAME_X = SAFE.x + 2 * AGENDA.num.size * MONO.advance + AGENDA.numGap
/** Ширина текста пункта: от NAME_X до правого края SAFE. */
export const NAME_W = SAFE.w - (NAME_X - SAFE.x)

/** Пункт плана: name — текст целиком, lines — он же по строкам (одна или две). */
export type AgendaItem = { name: string; lines: string[]; num: string; y: number; at: number; rect: Rect }
type Plan = {
  /** Кикер: текст, верх строки и ширина (Martian Mono 24 px). */
  kicker: { text: string; y: number; w: number }
  title: { lines: string[]; y: number }
  items: AgendaItem[]
  /** Шаг от пункта к пункту в одну строку; у перенесённого пункта к нему добавляется AGENDA.name.line на каждую лишнюю строку. */
  pitch: number
  /** Вся группа: от верха кикера до низа последней строки. */
  group: Rect
  problems: string[]
}

/** Перенос текста пункта: по словам в NAME_W с запасом FIT, строки выровнены по длине (как у субтитров). */
const wrapItem = (text: string): string[] => balanceText(text, AGENDA.name.size * FIT, NAME_W)

export function plan(spec: AgendaSpec, ctx: FrameCtx, clock: Clock): Plan {
  const chapters = ctx.lesson.chapters
  const problems: string[] = []
  // Пункты: items («что строим сегодня», с 01) или главы урока без первой и последней (номер — место главы, с 02)
  const own = spec.items !== undefined
  const names = spec.items ?? chapters.slice(1, -1)
  const first = own ? 1 : 2
  if (own && names.length === 0) problems.push('items: в плане нет ни одного пункта — перечислите, что строим сегодня')
  if (!own && names.length === 0) problems.push('в уроке нет тематических глав: между «Что узнаете» и «Итог» нужна хотя бы одна')
  const whose = own ? 'у каждого пункта своя реплика' : 'у каждой главы своя реплика'
  if (spec.at && spec.at.length !== names.length) problems.push(`at: ${spec.at.length} реплик на ${names.length} пунктов — ${whose}`)
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

  // Текст пунктов по строкам; перенос — по словам и не больше двух строк. Слово шире строки перенос режет посреди слова — проблема
  const wrapped = names.map((name, k) => {
    // Пустой пункт рисует один номер без текста
    if (!name.trim()) problems.push(`item:${k}: пункт без текста — впишите его или уберите`)
    const wide = name.split(/\s+/).find((word) => NAME_X - SAFE.x + fitWidth(word, AGENDA.name.size) > SAFE.w)
    if (wide) problems.push(`item:${k} «${fitText(name, 40)}»: слово «${fitText(wide, 24)}» шире строки (${Math.ceil(NAME_X - SAFE.x + fitWidth(wide, AGENDA.name.size))} px при ${SAFE.w})`)
    const rows = wrapItem(name)
    if (rows.length > AGENDA.name.maxLines) problems.push(`item:${k} «${fitText(name, 40)}»: пункт занимает ${rows.length} строки, а можно не больше ${AGENDA.name.maxLines} — сократите его`)
    return rows
  })
  // Перенесённые строки: на столько шаг строк растёт у пунктов ниже
  const extra = wrapped.reduce((sum, rows) => sum + (rows.length - 1) * AGENDA.name.line, 0)

  // Шаг строк: до 88 px, чтобы вся группа влезла в SAFE; меньше 56 — проблема, группа тогда выше SAFE и идёт от верха
  const room = SAFE.h - header - AGENDA.name.line - extra
  const fitPitch = names.length > 1 ? Math.floor(room / (names.length - 1)) : AGENDA.pitch.max
  if (names.length > 0 && fitPitch < AGENDA.pitch.min) problems.push(`не помещается: ${names.length} пунктов по ${AGENDA.pitch.min} px вместе с названием урока, в окне помещается ${Math.floor(room / AGENDA.pitch.min) + 1}`)
  const pitch = Math.min(AGENDA.pitch.max, Math.max(AGENDA.pitch.min, fitPitch))
  const height = header + Math.max(0, names.length - 1) * pitch + (names.length > 0 ? AGENDA.name.line : 0) + extra
  const top = SAFE.y + Math.max(0, Math.floor((SAFE.h - height) / 2))

  let y = top + header
  const items = names.map((name, k): AgendaItem => {
    const rows = wrapped[k]
    const w = NAME_X - SAFE.x + Math.max(...rows.map((r) => fitWidth(r, AGENDA.name.size)))
    const item: AgendaItem = {
      name,
      lines: rows,
      num: String(k + first).padStart(2, '0'),
      y,
      at: spec.at?.[k] === undefined ? clock.beat(0) + k * AGENDA.step : clock.beat(spec.at[k]),
      rect: { x: SAFE.x, y, w: Math.min(w, SAFE.w), h: rows.length * AGENDA.name.line },
    }
    y += pitch + (rows.length - 1) * AGENDA.name.line
    return item
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
