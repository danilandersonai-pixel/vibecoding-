// Схемы книги как строки SVG: разбор на верхние элементы, размер самого мелкого текста, маркеры стрелок, прорисовка линии. Без React.
// Схемы лежат в content/figures/*.svg; в роликах их ставят как текст (`?raw`).

// Корневой тег и любой другой: имя и атрибуты (значения в кавычках могут содержать «>» и «/»).
const ATTRS = String.raw`(?:[^>"']|"[^"]*"|'[^']*')*?`
const ROOT = new RegExp(String.raw`<svg\b(${ATTRS})>`)
// Токены внутри <svg>: комментарий, закрывающий тег, открывающий тег (с «/» в конце — пустой элемент)
const TOKEN = new RegExp(String.raw`<!--[\s\S]*?-->|<\/([A-Za-z][\w:.-]*)\s*>|<([A-Za-z][\w:.-]*)(${ATTRS})(\/?)>`, 'g')

// Тег <path>: имя и атрибуты; «/» перед «>» — пустой элемент (в атрибутах значения в кавычках могут содержать «>» и «/»)
const PATH = new RegExp(String.raw`^<path\b(${ATTRS})(\/?)>`)

const attr = (attrs: string, name: string): string | null => {
  const m = new RegExp(String.raw`(?:^|\s)${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`).exec(attrs)
  return m ? (m[1] ?? m[2]) : null
}
const size = (value: string | null): number | null => {
  const n = value === null ? NaN : Number.parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Размер шрифта по умолчанию: font-size корня; у схем книги 13. Без него — 16, как у браузера. */
export function rootFontSize(svg: string): number {
  const m = ROOT.exec(svg)
  return (m && size(attr(m[1], 'font-size'))) || 16
}

/**
 * Схема на части: viewBox, верхние дочерние элементы по порядку (каждый — вся его разметка) и самый мелкий размер шрифта.
 * Размер берётся у текстов: свой font-size или, если его нет, корневой. Нет текстов — корневой размер.
 * Схемы книги состоят из плоских элементов (text, rect, path, circle, polygon); вложенный <g> тоже остаётся одним элементом.
 */
export function splitSvg(svg: string): { viewBox: [number, number, number, number]; children: string[]; minFont: number } {
  const root = ROOT.exec(svg)
  if (!root) throw new Error('это не схема: в тексте нет корневого элемента svg')
  const vb = attr(root[1], 'viewBox')
  const box = vb === null ? [] : vb.trim().split(/[\s,]+/).map(Number)
  if (box.length !== 4 || box.some((n) => !Number.isFinite(n))) throw new Error('у схемы нет верного viewBox')
  const viewBox: [number, number, number, number] = [box[0], box[1], box[2], box[3]]

  const start = root.index + root[0].length
  const end = svg.lastIndexOf('</svg>')
  const inner = svg.slice(start, end < start ? svg.length : end)

  const children: string[] = []
  let depth = 0
  let from = 0
  for (const m of inner.matchAll(TOKEN)) {
    if (m[0].startsWith('<!--')) continue
    if (m[1] !== undefined) {
      depth -= 1
      if (depth === 0) children.push(inner.slice(from, m.index + m[0].length))
    } else if (m[4] === '/') {
      if (depth === 0) children.push(m[0])
    } else {
      if (depth === 0) from = m.index
      depth += 1
    }
  }

  const rootSize = size(attr(root[1], 'font-size')) ?? 16
  const sizes = [...inner.matchAll(new RegExp(String.raw`<(?:text|tspan)\b(${ATTRS})>`, 'g'))].map((m) => size(attr(m[1], 'font-size')) ?? rootSize)
  return { viewBox, children, minFont: sizes.length > 0 ? Math.min(...sizes) : rootSize }
}

/** Содержимое <defs> файла _defs.svg — маркеры стрелок. Их ставят в видимый <defs> кадра: из display:none Chromium маркеры не рисует. */
export function defsOf(raw: string): string {
  return /<defs\b[^>]*>([\s\S]*?)<\/defs>/.exec(raw)?.[1] ?? ''
}

// Классы сплошных линий схем (figures.css) и пунктирных: у пунктира stroke-dasharray уже занят рисунком, прорисовать его штрихом нельзя.
const LINES = new Set(['fg-ln', 'fg-ln-acc', 'fg-ln-risk', 'fg-ln-ok', 'fg-curve', 'fg-okln', 'fg-riskln', 'fg-accln', 'fg-onln'])
const DASHED = new Set(['fg-dash', 'fg-dots', 'fg-grid', 'fg-ghost'])

/** Можно ли прорисовать элемент линией: сплошной <path>-штрих. Пунктир, сетка, залитые контуры и всё остальное — нет, они появляются. */
export function isDrawable(child: string): boolean {
  const m = PATH.exec(child)
  if (!m || /stroke-dasharray/.test(m[1])) return false
  const classes = (attr(m[1], 'class') ?? '').split(/\s+/).filter(Boolean)
  return classes.some((c) => LINES.has(c)) && !classes.some((c) => DASHED.has(c))
}

/**
 * Линия, прорисованная на долю p (0…1): pathLength="1", штрих длиной 1 и смещение 1 − p.
 * Наконечник стрелки (marker-end) рисуется у конца пути независимо от штриха, поэтому ждёт, пока линия не дорисована.
 */
export function drawn(child: string, p: number): string {
  const m = PATH.exec(child)
  if (!m) return child
  const offset = +(1 - Math.min(1, Math.max(0, p))).toFixed(4)
  let attrs = m[1]
  let own = ''
  attrs = attrs.replace(/\sstyle="([^"]*)"/, (_, s: string) => {
    own = s
    return ''
  })
  if (offset > 0) attrs = attrs.replace(/\smarker-end="[^"]*"/, '')
  const style = `stroke-dasharray:1;stroke-dashoffset:${offset}${own ? ';' + own : ''}`
  return `<path${attrs} pathLength="1" style="${style}"${m[2]}>${child.slice(m[0].length)}`
}

/**
 * Классы figures.css с зашитым цветом: терминальные цвета схем заданы #hex, а не var(--…), поэтому от темы кадра не зависят и не из T.
 * Тест сверяет список с файлом: появится правило с #hex — тест напомнит дописать сюда.
 */
export const HARD_COLORS = ['fg-term', 'fg-tbar', 'fg-tt', 'fg-tp', 'fg-tok', 'fg-terr', 'fg-tdim', 'fg-tyel']

/** Какие из HARD_COLORS использует схема (в порядке списка). */
export function hardColors(children: string[]): string[] {
  const used = new Set(children.flatMap((child) => [...child.matchAll(/\sclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/))))
  return HARD_COLORS.filter((c) => used.has(c))
}
