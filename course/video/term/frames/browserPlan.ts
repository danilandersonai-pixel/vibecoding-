import type { Clock, FrameCtx, Rect } from '../frame'
import { appear } from '../motion'
import { fitText, monoChars, textWidth, wrapText } from '../text'
import { MOTION, SAFE } from '../theme'
import { LH, WIN, cells, outsideSafe, rowTop, wrapWords } from './geometry'
import { beatProblem, consoleText, lookup, pick, rangeProblem } from './source'
import type { Range } from './source'

/**
 * Браузер: окно со вкладкой (title записи), строкой адреса `localhost:3000<путь>` и страницей, нарисованной векторно, Golos Text.
 * event — browser. Страница — строки `before` (до реплики at.action) и `after` (с неё) по порядку: первая — заголовок
 * (40 px, 600); строка, совпадающая с подписью поля из fields, — подпись и поле ввода со значением (Martian Mono);
 * строка, совпадающая с текстом из buttons, — кнопка (инверсия: фон ink, текст desk); остальные — текст 28 px.
 * Строки появляются очередью от реплики at.page; новые строки `after` — за MOTION.appear на реплике at.action,
 * нижние строки при этом сдвигаются, пропавшие растворяются. Без at.action страница остаётся такой, как `before`.
 * Строка адреса показывает url записи; если нажатие привело на другую страницу (у записи есть urlAfter), с реплики at.action — urlAfter.
 * marks — цвет текстовой строки страницы (точное совпадение текста): в записи нет ролей элементов, цвет задаёт автор;
 * одинаковые строки красятся все сразу.
 * Блок страницы (заголовок, поля, кнопка, текст — и до, и после action) стоит по центру окна по ширине самого широкого своего содержимого;
 * длинный текст переносится не шире PAGE.width.
 * pageLines — какие строки страницы показать, если вся она в окно не помещается (с 1, включительно, как lines у других кадров;
 * первая строка — заголовок; номера — «строки страницы» в print-event.mjs): окно браузера прокручено так, что первая выбранная строка
 * стоит вверху страницы, заголовком рисуется только первая строка записи. Только без at.action: до и после нажатия строки страницы разные.
 * console: true — снизу панель «Console» (около 40 % окна, семь строк): сообщения записи, как в DevTools, с реплики
 * at.console (по умолчанию — вместе со страницей, на at.page) очередью; consoleLines выбирает сообщения (с 1, включительно, как lines у других кадров).
 * Части: 'frame', 'url', 'page' (область страницы), 'field:<подпись>', 'button:<текст>', 'console' (панель),
 * 'console:<k>' (k — номер показанного сообщения с 0). Части — по странице в конце сцены (after, если есть at.action).
 */
export type BrowserSpec = {
  type: 'browser'
  session: string
  event: string
  console?: boolean
  consoleLines?: Range
  pageLines?: Range
  marks?: { line: string; tone: 'ok' | 'err' }[]
  at: { page: number; action?: number; console?: number }
}

/** Поля страницы и размеры её частей, px. */
export const PAGE = { width: 960, top: 20, bottom: 12, input: 520, labelMin: 160 }
export const FIELD_H = 52
/** Строка адреса в полосе окна: правее вкладки, на всю оставшуюся ширину. */
export const URL_BAR: Rect = { x: SAFE.x + 480, y: SAFE.y + 6, w: SAFE.w - 480 - WIN.pad, h: 36 }
/** Знаков адреса в строке адреса (Martian Mono 24 px, поле 16 px с обеих сторон): длинный адрес обрезается с «…», как в браузере. */
export const URL_CHARS = monoChars(URL_BAR.w - 32)
/** Вкладка: сколько знаков названия помещается левее строки адреса. */
export const TAB_CHARS = 26
/** Панель Console занимает нижние семь строк окна и полосу вкладки над ними. */
export const CONSOLE = { rows: 7, bar: 48, row0: WIN.rows - 7 }
export const CONSOLE_TOP = rowTop(CONSOLE.row0) - CONSOLE.bar
/** Знаков в строке сообщения: окно за вычетом полей и колонки значка. */
export const CONSOLE_COLS = monoChars(SAFE.w - 2 * WIN.pad - cells(2))

type Kind = 'title' | 'field' | 'button' | 'text'
/** Строка страницы: вид, текст после переноса, положение сверху и высота (px), ширина по оценке Golos Text. */
export type Item = { text: string; kind: Kind; lines: string[]; y: number; h: number; w: number; value?: string; tone?: 'ok' | 'err'; order: number }
/** Строка в движении: где была до action (from) и где встанет после (to); нет from — новая, нет to — пропала. */
export type Slot = { text: string; from: Item | null; to: Item | null }
type Message = { type: string; rows: string[]; row: number }
type Plan = {
  ok: boolean
  /** Адрес в строке до action и после него (без перехода или без action они равны). */
  url: string
  urlAfter: string
  title: string
  /** Страница до action и после него (без action обе — before). */
  before: Item[]
  after: Item[]
  slots: Slot[]
  /** Левый край блока страницы и колонки поля ввода: блок по центру окна. */
  x: number
  labelW: number
  inputX: number
  messages: Message[]
  pageBottom: number
  problems: string[]
}

const EMPTY: Plan = { ok: false, url: '', urlAfter: '', title: '', before: [], after: [], slots: [], x: 0, labelW: 0, inputX: 0, messages: [], pageBottom: SAFE.y + SAFE.h, problems: [] }

/** Тип сообщения консоли: error — ✕ и подложка err, warning — ▲ warn, остальные — без значка. */
export const isError = (type: string) => type === 'error'
export const isWarning = (type: string) => type === 'warning' || type === 'warn'

// Строки страницы сверху вниз: заголовок, поля, кнопки, текст. y — от верха области страницы. first — номер первой строки в записи (с 1):
// заголовок — только первая строка записи, а у прокрученной страницы (pageLines) первая показанная — уже не он.
function stack(lines: string[], fields: Map<string, string>, buttons: Set<string>, tones: Map<string, 'ok' | 'err'>, top: number, labelW: number, first = 1): Item[] {
  let y = top
  return lines.map((text, order) => {
    const kind: Kind = first + order === 1 ? 'title' : fields.has(text) ? 'field' : buttons.has(text) ? 'button' : 'text'
    let item: Item
    if (kind === 'title') {
      const wrapped = wrapText(text, 40, PAGE.width)
      item = { text, kind, lines: wrapped, y, h: wrapped.length * 52, w: Math.max(...wrapped.map((l) => textWidth(l, 40))), order }
      y += item.h + 8
    } else if (kind === 'field') {
      item = { text, kind, lines: [text], y, h: FIELD_H, w: labelW + PAGE.input, value: fields.get(text), order }
      y += FIELD_H + 8
    } else if (kind === 'button') {
      item = { text, kind, lines: [text], y, h: FIELD_H, w: textWidth(text, 28) + 64, order }
      y += FIELD_H + 12
    } else {
      const wrapped = wrapText(text, 28, PAGE.width)
      item = { text, kind, lines: wrapped, y, h: wrapped.length * 40, w: Math.max(...wrapped.map((l) => textWidth(l, 28))), tone: tones.get(text), order }
      y += item.h
    }
    return item
  })
}

/** Куда и как пройдёт каждая строка при action: по тексту, по порядку. */
function match(before: Item[], after: Item[]): Slot[] {
  const used = new Set<number>()
  const slots: Slot[] = after.map((to) => {
    const j = before.findIndex((b, k) => !used.has(k) && b.text === to.text && b.kind === to.kind)
    if (j >= 0) used.add(j)
    return { text: to.text, from: j >= 0 ? before[j] : null, to }
  })
  before.forEach((from, k) => {
    if (!used.has(k)) slots.push({ text: from.text, from, to: null })
  })
  return slots
}

export function plan(spec: BrowserSpec, ctx: FrameCtx): Plan {
  const found = lookup(ctx, spec.session, spec.event, ['browser'] as const)
  if (found.error !== undefined) return { ...EMPTY, problems: [`«${spec.event}»: ${found.error}`] }
  const ev = found.event
  const problems: string[] = []

  // Адрес в строке: хост, путь и запрос; не помещается в строку адреса (ошибка формы в адресе — %-коды) — обрезан с «…»
  const address = (url: string) => {
    try {
      const u = new URL(url)
      return fitText(u.host + u.pathname + u.search, URL_CHARS)
    } catch {
      problems.push(`адрес «${url}» не разбирается`)
      return ''
    }
  }
  const host = address(ev.url)
  const hostAfter = ev.urlAfter === undefined ? host : address(ev.urlAfter)

  const fields = new Map(ev.fields.map((f) => [f.label, f.value]))
  const buttons = new Set(ev.buttons)
  const tones = new Map((spec.marks ?? []).map((m) => [m.line, m.tone]))
  const labelW = Math.max(PAGE.labelMin, ...ev.fields.map((f) => Math.ceil(textWidth(f.label, 28)) + 40))
  if (labelW + PAGE.input > PAGE.width) problems.push(`не помещается: подписи полей и поле ввода шире колонки страницы (${Math.round(labelW + PAGE.input)} px при ${PAGE.width})`)
  const top = SAFE.y + WIN.bar + PAGE.top
  const withConsole = spec.console === true
  const pageBottom = withConsole ? CONSOLE_TOP : SAFE.y + SAFE.h
  // Прокрученная страница: только выбранные строки, первая — вверху окна
  const badPage = rangeProblem(spec.pageLines, ev.before.length)
  if (badPage) problems.push(`pageLines: ${badPage.replace(/^lines: /, '')}`)
  if (spec.pageLines && spec.at.action !== undefined) problems.push('pageLines — только без at.action: до и после нажатия у страницы разные строки')
  const page = badPage ? { items: ev.before, first: 1 } : pick(ev.before, spec.pageLines)
  const before = stack(page.items, fields, buttons, tones, top, labelW, page.first)
  const after = spec.at.action === undefined ? before : stack(ev.after, fields, buttons, tones, top, labelW)
  const slots = spec.at.action === undefined ? before.map((b) => ({ text: b.text, from: b, to: b })) : match(before, after)
  // Блок по центру окна по самой широкой строке до и после action (кнопка стоит в колонке поля ввода)
  const contentW = Math.max(1, ...[...before, ...after].map((i) => (i.kind === 'button' ? labelW + i.w : i.w)))
  const x = Math.round(SAFE.x + (SAFE.w - contentW) / 2)

  if (before.length === 0) problems.push('у события нет строк страницы (before)')
  if (spec.at.action !== undefined && after.length === 0) problems.push('at.action задан, а у события нет строк after')
  for (const [name, items] of [['before', before], ['after', after]] as const) {
    if (name === 'after' && spec.at.action === undefined) continue
    const end = Math.max(top, ...items.map((i) => i.y + i.h))
    if (end > pageBottom - PAGE.bottom) problems.push(`не помещается: страница (${name}) занимает ${Math.round(end - top)} px, а в окне помещается ${Math.round(pageBottom - PAGE.bottom - top)}`)
  }

  // Метки цвета: только текстовые строки страницы
  const texts = new Set([...before, ...after].filter((i) => i.kind === 'text').map((i) => i.text))
  ;(spec.marks ?? []).forEach((m, i) => {
    if (!texts.has(m.line)) problems.push(`marks[${i}]: строки «${m.line}» нет среди текстовых строк страницы (подписи полей, кнопки и заголовок не красятся)`)
  })

  // Консоль
  const messages: Message[] = []
  if (withConsole) {
    if (ev.console.length === 0) problems.push('console: true, а в записи нет сообщений консоли')
    else {
      const bad = rangeProblem(spec.consoleLines, ev.console.length)
      if (bad) problems.push(`consoleLines: ${bad}`)
      else {
        let row = CONSOLE.row0
        for (const m of pick(ev.console, spec.consoleLines).items) {
          const text = consoleText(m.text)
          const rows = text.split('\n').flatMap((line) => wrapWords(line, CONSOLE_COLS).map((r) => r.text))
          messages.push({ type: m.type, rows, row })
          row += rows.length
        }
        if (row > CONSOLE.row0 + CONSOLE.rows) problems.push(`не помещается: сообщения консоли занимают ${row - CONSOLE.row0} строк, а в панели помещается ${CONSOLE.rows} — выберите consoleLines`)
      }
    }
  } else if (spec.consoleLines) problems.push('consoleLines задан без console: true')

  return { ok: true, url: host, urlAfter: hostAfter, title: ev.title, before, after, slots, x, labelW, inputX: x + labelW, messages, pageBottom, problems }
}

export function browserLayout(spec: BrowserSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  if (!p.ok) return parts
  parts.url = { ...URL_BAR }
  parts.page = { x: SAFE.x, y: SAFE.y + WIN.bar, w: SAFE.w, h: p.pageBottom - (SAFE.y + WIN.bar) }
  for (const i of p.after) {
    if (i.kind === 'field') parts[`field:${i.text}`] = { x: p.x, y: i.y, w: i.w, h: i.h }
    if (i.kind === 'button') parts[`button:${i.text}`] = { x: p.inputX, y: i.y, w: i.w, h: i.h }
  }
  if (spec.console === true) {
    parts.console = { x: SAFE.x, y: CONSOLE_TOP, w: SAFE.w, h: SAFE.y + SAFE.h - CONSOLE_TOP }
    p.messages.forEach((m, k) => {
      parts[`console:${k}`] = { x: SAFE.x + WIN.pad, y: rowTop(m.row), w: SAFE.w - 2 * WIN.pad, h: m.rows.length * LH }
    })
  }
  return parts
}

/** Кадр, когда появляется страница, и кадр, когда сообщение k консоли. */
export const pageAt = (spec: BrowserSpec, clock: Clock) => clock.beat(spec.at.page)
export const consoleAt = (spec: BrowserSpec, clock: Clock, k: number) => clock.beat(spec.at.console ?? spec.at.page) + k * MOTION.stagger

export function browserMoments(spec: BrowserSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx)
  const at = new Set<number>([0, pageAt(spec, clock)])
  p.before.forEach((_, i) => at.add(pageAt(spec, clock) + i * MOTION.stagger))
  if (spec.at.action !== undefined) at.add(clock.beat(spec.at.action))
  p.messages.forEach((_, k) => at.add(consoleAt(spec, clock, k)))
  return [...at].sort((a, b) => a - b)
}

/**
 * С какого кадра части видны (FrameDef.appears): поле и кнопка — когда начали проявляться в очереди страницы (от at.page по MOTION.stagger;
 * на самом кадре начала непрозрачность 0, поэтому кадром позже); новые после action — когда начали проявляться после него; сдвинутые
 * action — когда пошли на своё место (их часть — место после action). Сообщение консоли — на своём кадре очереди от at.console,
 * панель 'console' — с первым сообщением. Строка адреса и область страницы видны с начала сцены — их в карте нет.
 */
export function browserAppears(spec: BrowserSpec, clock: Clock, ctx: FrameCtx): Map<string, number> {
  const p = plan(spec, ctx)
  const at = new Map<string, number>()
  if (!p.ok) return at
  const action = spec.at.action === undefined ? null : clock.beat(spec.at.action)
  for (const { from, to } of p.slots) {
    if (!to || (to.kind !== 'field' && to.kind !== 'button')) continue
    const start = from ? pageAt(spec, clock) + from.order * MOTION.stagger : action!
    const moved = from !== null && action !== null && from.y !== to.y ? action : -1
    at.set(`${to.kind}:${to.text}`, Math.max(start, moved) + 1)
  }
  p.messages.forEach((_, k) => at.set(`console:${k}`, consoleAt(spec, clock, k)))
  if (p.messages.length > 0) at.set('console', consoleAt(spec, clock, 0))
  return at
}

export function browserProblems(spec: BrowserSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  const beats: [string, number | undefined][] = [['at.page', spec.at.page], ['at.action', spec.at.action], ['at.console', spec.at.console]]
  for (const [name, b] of beats) {
    if (b === undefined) continue
    const why = beatProblem(b, clock.lines)
    if (why) bad.push(`${name}: ${why}`)
  }
  // Действие и консоль не раньше страницы
  for (const name of ['action', 'console'] as const) {
    const b = spec.at[name]
    if (b !== undefined && b < spec.at.page) bad.push(`at.${name} (${b}) раньше at.page (${spec.at.page}) — страницы ещё нет`)
  }
  if (bad.length > 0) return bad
  bad.push(...outsideSafe(browserLayout(spec, ctx)))
  const ends = [
    pageAt(spec, clock) + Math.max(0, p.before.length - 1) * MOTION.stagger + MOTION.appear,
    ...(spec.at.action === undefined ? [] : [clock.beat(spec.at.action) + MOTION.appear]),
    ...p.messages.map((_, k) => consoleAt(spec, clock, k)),
  ]
  const last = Math.max(...ends)
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последнее появление на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}

/** Адрес в строке на кадре frame (для Browser.tsx): urlAfter — с реплики at.action, до неё и без action — url. */
export function urlAt(p: Plan, spec: BrowserSpec, clock: Clock, frame: number): string {
  return spec.at.action !== undefined && frame >= clock.beat(spec.at.action) ? p.urlAfter : p.url
}

/** Положение строки и прозрачность на кадре frame (для Browser.tsx): прогресс action, очередь появления. */
export function slotAt(slot: Slot, spec: BrowserSpec, clock: Clock, frame: number): { y: number; opacity: number } {
  const act = spec.at.action === undefined ? 0 : appear(frame, clock.beat(spec.at.action))
  const shown = (item: Item) => appear(frame, pageAt(spec, clock) + item.order * MOTION.stagger)
  if (slot.from && slot.to) return { y: slot.from.y + (slot.to.y - slot.from.y) * act, opacity: shown(slot.from) }
  if (slot.to) return { y: slot.to.y, opacity: act }
  return { y: slot.from!.y, opacity: shown(slot.from!) * (1 - act) }
}
