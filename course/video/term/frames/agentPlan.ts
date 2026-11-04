import type { SessionEvent } from '../../sessions/types'
import type { Clock, FrameCtx, Rect } from '../frame'
import { typedFrames } from '../motion'
import { monoChars, textWidth, wrapMono, wrapText } from '../text'
import { MOTION, SAFE, T } from '../theme'
import { SIGNED, TEXT } from './diffPlan'
import { CELL, LH, WIN, outsideSafe, rowTop, widest, wrapWords } from './geometry'
import type { Wrapped } from './geometry'
import { beatProblem, diffBody, diffCounts, lookup, pick, rangeProblem } from './source'
import type { DiffKind, Range } from './source'

/**
 * Агент: сессия Claude Code в тёмном окне «Claude Code». Запрос `> …` в рамке ввода набирается, шаги записи —
 * строки как на схеме книги ch1_agent_session: `read` → «Reading <путь>», `file` → «Edited <путь> (+N −M)» и первые
 * diffLines строк диффа под ней (по умолчанию 6, с «@@», как в Diff; длинная строка кода переносится по словам, как в Diff), `run` и `commit` → `Run "<команда>"? [y / n]`
 * (если в команде есть «"» — `Run «<команда>»? [y / n]`) и «y», если id шага в ask, иначе просто `$ <команда>`; дальше вывод команды. Затем ответ агента абзацем soft
 * (Golos Text 28 px). mode — имя режима в нижней строке окна.
 * event — agent; at — реплики сцены: prompt — где начинает набираться запрос, steps — по реплике на каждый шаг записи
 * (шаг ждёт конца набора и конца предыдущего шага), reply — где появляется ответ.
 * chat: true — окно «Чат с ИИ», без шагов и без ответа агента (чат в проекте ничего не делает, а ответ записи — слова агента):
 * запрос и под ним код нового файла (добавленные строки диффа первого шага file, не больше diffLines; если строк больше — последней
 * строкой «…» faint) блоком; at.reply — реплика, на которой появляется код. Если первый file правит существующий файл — problems.
 * code — только у chat: какие строки нового файла показать (с 1, включительно; diffLines тогда код не обрезает) — так в блок попадает
 * нужное место файла, а не его начало; выше и ниже, если файл шире, — строка «…» faint.
 * diffLines — число строк диффа у всех шагов file или по шагам: { id шага: строк } (не указанный шаг — по умолчанию 6); так у одного
 * шага видна сама правка, а у других — только «Edited …».
 * outLines — какие строки вывода показать у шагов-команд (run, commit): { id шага: [от, до] } (с 1, включительно, как lines у Terminal);
 * без него — весь вывод. Скрытые строки выше и ниже диапазона — строкой «…» faint, чтобы не казалось, что вывод кончился.
 * Всё должно помещаться в окно: 19 строк, а с режимом — 18; иначе problems. Если дифф не лезет — уменьшайте diffLines.
 * Части: 'frame', 'prompt' (рамка ввода), 'step:<id>', 'reply' (не у chat), 'code' (только chat), 'mode'.
 * Части — один снимок, как у Terminal: окно в конце сцены, когда всё появилось.
 */
export type AgentSpec = {
  type: 'agent'
  session: string
  event: string
  mode?: 'Plan' | 'Manual' | 'Accept edits'
  chat?: boolean
  ask?: string[]
  diffLines?: number | Record<string, number>
  outLines?: Record<string, Range>
  code?: Range
  at: { prompt: number; steps: number[]; reply: number }
}

/** Левый край текста сессии и рамки ввода: окно с полем под рамку. */
export const X0 = SAFE.x + 40
/** Знаков в строке сессии. */
export const COLS = monoChars(SAFE.w - 80)
/** Рамка ввода: на ширину окна за вычетом полей; текст внутри начинается на X0, значок «>» занимает две колонки. top и extra — выступ рамки над первой строкой и под последней, чтобы текст стоял в ней по центру. */
export const BOX = { x: SAFE.x + 20, w: SAFE.w - 40, top: -3, extra: 11 }
export const PROMPT_COLS = COLS - 2
/** Просвет между запросом, шагами, ответом и кодом, в строках окна. */
export const GAP = 0.5
/** Ответ агента: кегль, ширина абзаца и высота строки (px). */
export const REPLY = { size: 28, width: 1560, line: 40, base: 30 }
/** Блок кода у chat: поле над первой и под последней строкой, px. */
export const CODE_PAD = 8
/** Строка окна с режимом. */
export const MODE_ROW = WIN.rows - 1
/** Пауза между вопросом `[y / n]` и ответом «y»: человек читает вопрос. */
export const ANSWER = MOTION.move
/** Заголовок окна: сессия Claude Code и чат. */
export const TITLE = 'Claude Code'
export const CHAT_TITLE = 'Чат с ИИ'
/** Строк диффа под «Edited …» по умолчанию. */
export const DIFF_LINES = 6

/** Строка шага: что в ней написано и как. rows — после переноса, row — первая строка окна (с долями), col — отступ в знаках от X0. */
export type StepLine = {
  role: 'head' | 'ask' | 'answer' | 'cmd' | 'out' | 'diff'
  rows: string[]
  row: number
  col: number
  fill: string
  weight?: number
  /** Сколько знаков первой строки рисуются faint: `$ ` у команды. */
  dim?: number
  /** Строка диффа: вид (знак и заливка) и сам знак первой строки. */
  diff?: { kind: DiffKind; sign: string }
  /** Через сколько кадров после начала шага строка появляется. */
  delay: number
  /** Ширина в знаках от X0, со знаком диффа и отступом. */
  width: number
}
export type Step = { id: string; kind: 'read' | 'file' | 'run' | 'commit'; asked: boolean; row: number; rows: number; lines: StepLine[]; span: number }
export type CodeLine = { text: string; rows: string[]; row: number; /** Последняя строка «…»: код обрезан diffLines. */ more?: boolean }
type Plan = {
  ok: boolean
  promptText: string
  prompt: Wrapped[]
  steps: Step[]
  reply: { lines: string[]; row: number; rows: number }
  code: { lines: CodeLine[]; row: number; rows: number } | null
  problems: string[]
}

const EMPTY: Plan = { ok: false, promptText: '', prompt: [{ text: '', from: 0 }], steps: [], reply: { lines: [], row: 0, rows: 0 }, code: null, problems: [] }

const isCommand = (kind: string) => kind === 'run' || kind === 'commit'

type LineInit = Omit<StepLine, 'rows' | 'row' | 'width'> & { width?: number }

// Строки шага подряд с первой строки окна row; at — следующая свободная строка. Возвращает шаг и первую свободную строку после него.
function buildStep(
  id: string,
  ev: Extract<SessionEvent, { kind: 'read' | 'file' | 'run' | 'commit' }>,
  row: number,
  asked: boolean,
  diffLines: number,
  out?: Range,
): { step: Step; end: number } {
  const lines: StepLine[] = []
  let at = row
  const push = (init: LineInit, rows: string[]) => {
    const signed = init.diff !== undefined && SIGNED.includes(init.diff.kind)
    const width = init.width ?? init.col + Math.max(1, ...rows.map((r) => [...r].length)) + (signed ? 1 : 0)
    lines.push({ ...init, rows, row: at, width })
    at += rows.length
  }
  if (ev.kind === 'read') {
    push({ role: 'head', col: 0, fill: T.faint, delay: 0 }, wrapMono(`Reading ${ev.path}`, COLS))
  } else if (ev.kind === 'file') {
    const body = diffBody(ev.diff)
    const { add, del } = diffCounts(body)
    push({ role: 'head', col: 0, fill: T.ok, delay: 0 }, wrapMono(`Edited ${ev.path} (+${add} −${del})`, COLS))
    body.slice(0, diffLines).forEach(({ raw, kind }, k) => {
      const signed = SIGNED.includes(kind)
      // Код — по словам, как в Diff (слово длиннее строки — по знакам); вывод команд ниже — по знакам, как в терминале
      const rows = wrapWords(signed ? raw.slice(1) : raw, COLS - 2 - (signed ? 1 : 0)).map((w) => w.text)
      push({ role: 'diff', col: 2, fill: TEXT[kind], diff: { kind, sign: signed ? (raw[0] ?? ' ') : '' }, delay: (k + 1) * MOTION.stagger }, rows)
    })
  } else {
    if (asked) {
      // Как в книге — прямые кавычки; если в самой команде есть «"», внешние — «ёлочки»
      const [open, close] = ev.cmd.includes('"') ? ['«', '»'] : ['"', '"']
      const question = wrapMono(`Run ${open}${ev.cmd}${close}? [y / n]`, COLS)
      push({ role: 'ask', col: 0, fill: T.warn, delay: 0 }, question)
      // «y» — на той же строке, если помещается, иначе на следующей
      const last = [...question[question.length - 1]].length
      const same = last + 2 <= COLS
      if (same) at -= 1
      push({ role: 'answer', col: same ? last + 1 : 0, fill: T.ink, weight: 700, delay: ANSWER, width: same ? last + 2 : 1 }, ['y'])
    } else {
      push({ role: 'cmd', col: 0, fill: T.ink, weight: 700, dim: 2, delay: 0 }, wrapMono(`$ ${ev.cmd}`, COLS))
    }
    // Код выхода ≠ 0: последняя показанная строка вывода — цвета err (как у Terminal). Скрытые outLines строки — «…» faint
    const failed = ev.kind === 'run' && ev.code !== null && ev.code !== 0
    const { items: shown } = pick(ev.out, out)
    const above = out !== undefined && out[0] > 1
    const below = out !== undefined && out[1] < ev.out.length
    const rows: { text: string; fill: string }[] = [
      ...(above ? [{ text: '…', fill: T.faint }] : []),
      ...shown.map((text, j) => ({ text, fill: failed && j === shown.length - 1 ? T.err : T.soft })),
      ...(below ? [{ text: '…', fill: T.faint }] : []),
    ]
    rows.forEach(({ text, fill }, j) => {
      push({ role: 'out', col: 2, fill, delay: (asked ? ANSWER : 0) + (j + 1) * MOTION.stagger }, wrapMono(text, COLS - 2))
    })
  }
  const span = Math.max(...lines.map((l) => l.delay))
  return { step: { id, kind: ev.kind, asked, row, rows: at - row, lines, span }, end: at }
}

// Что показать: строки окна подряд. Каждая строка после переноса занимает одну и более строк окна, строки ответа — по REPLY.line px.
export function plan(spec: AgentSpec, ctx: FrameCtx): Plan {
  const found = lookup(ctx, spec.session, spec.event, ['agent'] as const)
  if (found.error !== undefined) return { ...EMPTY, problems: [`«${spec.event}»: ${found.error}`] }
  const ev = found.event
  const problems: string[] = []
  const asked = new Set(spec.ask ?? [])
  // Строк диффа у шага: общее число или своё по id шага; неверное число — проблема, а шаг рисуется без диффа
  const okLines = (n: number) => Number.isInteger(n) && n >= 0
  const dl = spec.diffLines ?? DIFF_LINES
  if (typeof dl === 'number') {
    if (!okLines(dl)) problems.push(`diffLines: ${dl} — нужно целое число от нуля`)
  } else {
    for (const [id, n] of Object.entries(dl)) {
      if (!ev.steps.includes(id)) problems.push(`diffLines: шага «${id}» нет среди шагов записи (${ev.steps.join(', ')})`)
      else if (!okLines(n)) problems.push(`diffLines «${id}»: ${n} — нужно целое число от нуля`)
    }
  }
  const linesOf = (id: string) => {
    const n = typeof dl === 'number' ? dl : (dl[id] ?? DIFF_LINES)
    return okLines(n) ? n : 0
  }

  for (const id of asked) {
    if (!ev.steps.includes(id)) problems.push(`ask: шага «${id}» нет среди шагов записи (${ev.steps.join(', ')})`)
  }
  // Строки вывода у шага-команды: шаг из записи, команда, диапазон в её выводе; неверный — проблема, а шаг рисуется со всем выводом
  const outOf = (id: string, out: string[]): Range | undefined => {
    const range = spec.outLines?.[id]
    const bad = range ? rangeProblem(range, out.length) : null
    if (bad) problems.push(`outLines «${id}»: ${bad.replace(/^lines: /, '')}`)
    return bad ? undefined : range
  }
  for (const id of Object.keys(spec.outLines ?? {})) {
    if (!ev.steps.includes(id)) problems.push(`outLines: шага «${id}» нет среди шагов записи (${ev.steps.join(', ')})`)
  }
  if (spec.code && !spec.chat) problems.push('code: строки кода выбирают только у chat — в сессии агента код виден под «Edited …»')
  if (spec.outLines && spec.chat) problems.push('outLines: в чате нет шагов — строки вывода выбирают только в сессии агента')

  const prompt = wrapWords(ev.prompt, PROMPT_COLS)
  let row = prompt.length
  const steps: Step[] = []
  let code: Plan['code'] = null

  if (!spec.chat) {
    if (spec.at.steps.length !== ev.steps.length) problems.push(`at.steps: ${spec.at.steps.length} реплик, а в записи ${ev.steps.length} шагов`)
    if (ev.steps.length > 0) row += GAP
    ev.steps.forEach((id, i) => {
      const s = lookup(ctx, spec.session, id, ['read', 'file', 'run', 'commit'] as const)
      if (s.error !== undefined) return void problems.push(`шаг ${i + 1} «${id}»: ${s.error}`)
      if (asked.has(id) && !isCommand(s.event.kind)) problems.push(`ask: «${id}» — это ${s.event.kind}, вопрос [y / n] бывает только перед командой`)
      if (spec.outLines?.[id] && !isCommand(s.event.kind)) problems.push(`outLines: «${id}» — это ${s.event.kind}, строки вывода бывают только у команды`)
      const out = s.event.kind === 'run' || s.event.kind === 'commit' ? outOf(id, s.event.out) : undefined
      const { step, end } = buildStep(id, s.event, row, asked.has(id) && isCommand(s.event.kind), linesOf(id), out)
      steps.push(step)
      row = end
    })
  } else {
    // chat: код — добавленные строки диффа первого шага file
    const first = ev.steps.map((id) => ({ id, found: lookup(ctx, spec.session, id, ['file'] as const) })).find((f) => f.found.error === undefined)
    if (first?.found.event === undefined) problems.push('chat: среди шагов записи нет file — не из чего взять код')
    else if (first.found.event.before !== null) problems.push(`chat: в чате показывается код только нового файла, а «${first.id}» правит существующий (${first.found.event.path})`)
    else {
      const adds = diffBody(first.found.event.diff)
        .filter((l) => l.kind === 'add')
        .map((l) => l.raw.slice(1))
      const line = (text: string): CodeLine => ({ text, rows: wrapMono(text, COLS - 1), row: 0 })
      const more: CodeLine = { text: '…', rows: ['…'], row: 0, more: true }
      const bad = spec.code ? rangeProblem(spec.code, adds.length) : null
      if (bad) problems.push(`code: ${bad}`)
      if (spec.code && !bad) {
        // Выбранные строки файла; выше и ниже — «…», если файл шире
        const [a, b] = spec.code
        code = { lines: [...(a > 1 ? [more] : []), ...adds.slice(a - 1, b).map(line), ...(b < adds.length ? [{ ...more }] : [])], row: 0, rows: 0 }
      } else {
        const limit = linesOf(first.id)
        const shown = adds.slice(0, limit).map(line)
        // Обрезан — последней строкой «…», чтобы не казалось, что файл кончился
        if (adds.length > limit) shown.push(more)
        code = { lines: shown, row: 0, rows: 0 }
      }
    }
  }

  // Ответ агента — только в сессии агента: чат в проекте ничего не делает, его ответ — сам код
  row += GAP
  const lines = spec.chat ? [] : wrapText(ev.reply, REPLY.size, REPLY.width)
  const reply = { lines, row, rows: (lines.length * REPLY.line) / LH }
  row += reply.rows
  if (code) {
    if (reply.lines.length > 0) row += GAP
    code.row = row
    let at = row + CODE_PAD / LH
    for (const l of code.lines) {
      l.row = at
      at += l.rows.length
    }
    code.rows = at - row + CODE_PAD / LH
    row += code.rows
  }

  const limit = spec.mode ? MODE_ROW : WIN.rows
  if (row > limit + 1e-6) problems.push(`не помещается: нужно ${Math.ceil(row * 10) / 10} строк окна, а в окне помещается ${limit}${spec.mode ? ' (нижняя строка занята режимом)' : ''}`)
  return { ok: true, promptText: ev.prompt, prompt, steps, reply, code, problems }
}

export type Timing = {
  promptAt: number
  typedEnd: number
  /** Кадр, когда начинается каждый шаг. */
  steps: number[]
  /** Кадр, когда появляется первая строка ответа; строки — через MOTION.stagger. */
  reply: number
  /** Кадр, когда появляется блок кода у chat; строки — через MOTION.stagger. */
  code: number | null
  /** Последний кадр, на котором что-то появляется. */
  last: number
}

// Время: запрос набирается с реплики prompt; каждый следующий шаг ждёт, пока кончится набор и предыдущий шаг, но не начинается раньше своей реплики.
export function timeline(spec: AgentSpec, p: Plan, clock: Clock): Timing {
  const promptAt = clock.beat(spec.at.prompt)
  const typedEnd = promptAt + typedFrames(p.promptText)
  let free = typedEnd + MOTION.stagger
  let last = typedEnd
  const steps = p.steps.map((s, i) => {
    const start = Math.max(clock.beat(spec.at.steps[i] ?? 0), free)
    free = start + s.span + MOTION.stagger
    last = Math.max(last, start + s.span)
    return start
  })
  const reply = Math.max(clock.beat(spec.at.reply), free)
  const lines = p.reply.lines.length
  last = Math.max(last, reply + Math.max(0, lines - 1) * MOTION.stagger)
  let code: number | null = null
  if (p.code) {
    code = reply + lines * MOTION.stagger
    last = Math.max(last, code + Math.max(0, p.code.lines.length - 1) * MOTION.stagger)
  }
  return { promptAt, typedEnd, steps, reply, code, last }
}

/** Кадр, до которого у запроса стоит курсор: пока не появилось следующее после него (первый шаг, а без шагов — ответ). */
export function cursorUntil(t: Timing): number {
  return t.steps.length > 0 ? t.steps[0] : t.reply
}

/** Прямоугольник рамки ввода на n строк текста. */
export function boxRect(n: number): Rect {
  return { x: BOX.x, y: rowTop(0) + BOX.top, w: BOX.w, h: n * LH + BOX.extra }
}

export function agentLayout(spec: AgentSpec, ctx: FrameCtx): Record<string, Rect> {
  const p = plan(spec, ctx)
  const parts: Record<string, Rect> = { frame: { ...SAFE } }
  if (!p.ok) return parts
  parts.prompt = boxRect(p.prompt.length)
  for (const s of p.steps) parts[`step:${s.id}`] = { x: X0, y: rowTop(s.row), w: Math.max(1, ...s.lines.map((l) => l.width)) * CELL, h: s.rows * LH }
  if (p.reply.lines.length > 0) parts.reply = { x: X0, y: rowTop(p.reply.row), w: Math.max(1, ...p.reply.lines.map((l) => textWidth(l, REPLY.size))), h: p.reply.lines.length * REPLY.line }
  if (p.code) parts.code = { x: BOX.x, y: rowTop(p.code.row), w: BOX.w, h: p.code.rows * LH }
  if (spec.mode) parts.mode = { x: X0, y: rowTop(MODE_ROW), w: widest([spec.mode]), h: LH }
  return parts
}

export function agentMoments(spec: AgentSpec, clock: Clock, ctx: FrameCtx): number[] {
  const p = plan(spec, ctx)
  const at = new Set<number>([0])
  const t = timeline(spec, p, clock)
  // Запрос набирается всё это время: начало каждой его строки — тоже перемена в кадре
  for (const r of p.prompt) at.add(t.promptAt + r.from)
  at.add(t.typedEnd)
  p.steps.forEach((s, i) => {
    for (const l of s.lines) at.add(t.steps[i] + l.delay)
  })
  const lines = p.reply.lines.length
  for (let j = 0; j < lines; j++) at.add(t.reply + j * MOTION.stagger)
  if (p.code && t.code !== null) {
    at.add(t.code)
    p.code.lines.forEach((_, k) => at.add(t.code! + k * MOTION.stagger))
  }
  return [...at].sort((a, b) => a - b)
}

/**
 * С какого кадра части видны (FrameDef.appears): запрос — когда набран целиком (30 знаков/с с реплики at.prompt), шаг — со своей первой
 * строки (шаги ждут конца набора запроса и предыдущего шага: на короткой реплике шаг приходит позже неё), ответ агента — когда начала
 * проявляться первая строка (на самом кадре начала непрозрачность 0), код чата — с первой строки. Рамка ввода и режим видны с начала
 * сцены — их в карте нет.
 */
export function agentAppears(spec: AgentSpec, clock: Clock, ctx: FrameCtx): Map<string, number> {
  const p = plan(spec, ctx)
  const at = new Map<string, number>()
  if (!p.ok) return at
  const t = timeline(spec, p, clock)
  at.set('prompt', t.typedEnd)
  p.steps.forEach((s, i) => at.set(`step:${s.id}`, t.steps[i]))
  if (p.reply.lines.length > 0) at.set('reply', t.reply + 1)
  if (p.code && t.code !== null) at.set('code', t.code)
  return at
}

export function agentProblems(spec: AgentSpec, ctx: FrameCtx, clock: Clock): string[] {
  const p = plan(spec, ctx)
  const bad = [...p.problems]
  const beats: [string, number][] = [['at.prompt', spec.at.prompt], ...spec.at.steps.map((b, i): [string, number] => [`at.steps[${i}]`, b]), ['at.reply', spec.at.reply]]
  for (const [name, b] of beats) {
    const why = beatProblem(b, clock.lines)
    if (why) bad.push(`${name}: ${why}`)
  }
  if (bad.length > 0) return bad
  const order = [spec.at.prompt, ...(spec.chat ? [] : spec.at.steps), spec.at.reply]
  if (order.some((b, i) => i > 0 && b < order[i - 1])) bad.push(`реплики идут не по порядку: запрос ${spec.at.prompt}, шаги ${spec.at.steps.join(', ')}, ответ ${spec.at.reply} — каждая не раньше предыдущей`)
  bad.push(...outsideSafe(agentLayout(spec, ctx)))
  const { last } = timeline(spec, p, clock)
  if (last >= clock.duration) bad.push(`не успевает до конца сцены: последняя строка на кадре ${last}, сцена кончается на кадре ${clock.duration}`)
  return bad
}
