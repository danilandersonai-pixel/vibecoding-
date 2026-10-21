// Размеры и раскладка экранов: чистые функции, без React (удобно проверять и считать в сценах).

/** Высота полосы заголовка окна. */
export const BAR = 40

/** Высота строки кода в терминале, редакторе и изменениях. */
export const LH = 32

// ---- Терминал ----

export type TermLine = { text: string; kind: 'cmd' | 'out' | 'ok' | 'err' }

export const TERM_PAD = 16
export const TERM_CPS = 24 // знаков в секунду при наборе команды
const AFTER_CMD = 10 // пауза после команды («Enter»), кадров
const AFTER_OUT = 6 // пауза между строками вывода, кадров

/** Кадры, с которых начинается каждая строка: команды набираются, вывод идёт построчно. */
export function terminalStarts(lines: TermLine[], at: number): number[] {
  const starts: number[] = []
  let t = at + 12
  for (const line of lines) {
    starts.push(t)
    t += line.kind === 'cmd' ? Math.ceil((line.text.length * 30) / TERM_CPS) + AFTER_CMD : AFTER_OUT
  }
  return starts
}

/** Высота окна терминала с n строками. */
export function terminalHeight(n: number): number {
  return BAR + TERM_PAD * 2 + n * LH
}

// ---- Редактор и изменения ----

export const EDITOR_PAD = 12
export const DIFF_PAD = 10

/** Высота окна редактора с n строками. */
export function editorHeight(n: number): number {
  return BAR + EDITOR_PAD * 2 + n * LH
}

/** Высота окна изменений с n строками. */
export function diffHeight(n: number): number {
  return BAR + DIFF_PAD * 2 + n * LH
}

// ---- Чат ----

export type ChatMessage = { from: 'me' | 'agent'; text: string }

export const CHAT_FONT = 20
export const CHAT_LINE = 28
export const CHAT_PAD_X = 16
export const CHAT_PAD_Y = 12
export const CHAT_MARGIN = 16
export const AGENT_CPS = 45 // «печатает» быстрее человека
const CHAT_CHAR = CHAT_FONT * 0.58 // средняя ширина знака, с запасом
const CHAT_GAP = 14
const CHAT_PAUSE = 14 // кадров между сообщениями

/** Перенос текста по словам; maxChars — знаков в строке. */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line !== '' && line.length + 1 + word.length > maxChars) {
      lines.push(line)
      line = word
    } else {
      line = line === '' ? word : `${line} ${word}`
    }
  }
  if (line !== '') lines.push(line)
  return lines
}

export type ChatItem = { from: ChatMessage['from']; text: string; lines: string[]; bubbleW: number; fullH: number; top: number; start: number }

/** Раскладка чата: строки, размеры пузырей, положение и кадр появления каждого сообщения. */
export function chatLayout(messages: ChatMessage[], w: number, at: number): { items: ChatItem[]; height: number } {
  const maxChars = Math.floor(((w - CHAT_MARGIN * 2) * 0.82 - CHAT_PAD_X * 2) / CHAT_CHAR)
  let top = BAR + CHAT_MARGIN
  let start = at + 12
  const items = messages.map((m) => {
    const lines = wrapText(m.text, maxChars)
    const bubbleW = Math.ceil(Math.max(...lines.map((l) => l.length), 1) * CHAT_CHAR) + CHAT_PAD_X * 2
    const fullH = lines.length * CHAT_LINE + CHAT_PAD_Y * 2
    const item = { from: m.from, text: m.text, lines, bubbleW, fullH, top, start }
    top += fullH + CHAT_GAP
    start += (m.from === 'agent' ? Math.ceil((m.text.length * 30) / AGENT_CPS) : 8) + CHAT_PAUSE
    return item
  })
  return { items, height: top - CHAT_GAP + CHAT_MARGIN }
}

/** Высота окна чата для этих сообщений. */
export function chatHeight(messages: ChatMessage[], w: number): number {
  return chatLayout(messages, w, 0).height
}

// ---- График ----

/** Красивый верх шкалы: не меньше максимума. */
export function niceMax(max: number): number {
  if (max <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(max))
  const step = [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((m) => m * p >= max) ?? 10
  return step * p
}

/** Высота окна графика при ширине w. */
export function chartHeight(w: number): number {
  return Math.round(w * 0.5)
}

// ---- Чек-лист ----

export const CHECK_ROW = 48
export const CHECK_PAD = 16

/** Высота окна чек-листа из n пунктов. */
export function checklistHeight(n: number): number {
  return CHECK_PAD * 2 + n * CHECK_ROW
}
