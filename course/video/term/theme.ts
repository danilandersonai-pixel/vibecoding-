import type { CSSProperties } from 'react'

// Тема набора кадров «Репозиторий»: тёмная, как вид курса «Репозиторий» (тёмные токены в src/styles/tokens.css, блок :root).
// Цвета кадра берутся только отсюда; theme.test.ts сверяет их с токенами курса.
export const T = {
  desk: '#141619', // фон кадра
  paper: '#1A1D21', // окна
  raised: '#22262B', // приподнятое: панели, заголовки окон
  edge: '#2B3036', // рамки
  ink: '#E9EBEE', // основной текст; выделение — инверсией или рамкой ink 2 px
  soft: '#A3A9B1', // вторичный текст
  faint: '#868D96', // шапка, подписи
  line: '#7A818A', // линии схем
  grid: '#3A4048', // сетка схем
  termBg: '#0F1113', // терминал и плашка субтитров
  ok: '#5BC78F', // цвет только у состояний, как в диффе
  err: '#F07C70',
  warn: '#E3B45C',
  // Имена семейств — из пакетов @fontsource-variable (подключены в video/index.ts); запасные — на случай, если файлы не загрузились.
  font: "'Golos Text Variable', 'Golos Text', system-ui, sans-serif",
  mono: "'Martian Mono Variable', 'Martian Mono', ui-monospace, Menlo, Consolas, monospace",
} as const

/** Цвет темы с прозрачностью: alpha(T.termBg, 0.88) → rgba(15,17,19,0.88). Другие цвета не нужны — только тема. */
export function alpha(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/**
 * Переменные схем книги: figures.css красит схемы токенами курса (--fig-*, --accent, --ink-soft) и берёт шрифты из --font-body,
 * а в роликах шрифты зовутся «… Variable», и тема всегда тёмная, как бы ни стояла тема страницы. Этот стиль ставят на обёртку схемы
 * (div.figure или <g> кадра Figure): тёмные значения из T и Golos Text. Тест Figure сверяет набор с src/styles/figures.css.
 */
export const FIGURE_VARS = {
  '--font-body': T.font,
  '--font-ui': T.mono,
  '--font-code': T.mono,
  '--ink': T.ink,
  '--ink-soft': T.soft,
  '--paper': T.paper,
  '--accent': T.ink, // главное и текущее — инверсией, без отдельного цвета
  '--accent-ink': T.ink,
  '--fig-ink': T.ink,
  '--fig-soft': T.soft,
  '--fig-line': T.line,
  '--fig-grid': T.grid,
  '--fig-zone': alpha(T.ink, 0.035),
  '--fig-risk': T.err,
  '--fig-ok': T.ok,
  '--fig-on': T.desk,
} as CSSProperties

export const CANVAS = { w: 1920, h: 1080 }
export const FPS = 30
/** Поля кадра: всё содержимое — внутри этого прямоугольника (x 96–1824, y 96–872). */
export const SAFE = { x: 96, y: 96, w: 1728, h: 776 }
/** Шапка: полоса y 32–80. */
export const HEADER = { y: 32, h: 48 }
/** Субтитры: полоса y 896–1040, не больше двух строк и 1500 px. */
export const SUBS = { top: 896, bottom: 1040, size: 40, lineHeight: 1.4, maxWidth: 1500, maxLines: 2 }
/** Текст в кадре не мельче 24 px. */
export const MIN_TEXT = 24

// Замер шрифтов — node scripts/measure-fonts.mjs (Chromium, woff2 из @fontsource-variable/*), 2026-10-28.
// Martian Mono, все веса 400–700 и знаки «0», «ш», «M»: 0,70000 em на знак (ось ширины на 100 %; на 87,5 % — 0,65, на 75 % — 0,60).
// Golos Text 500 по репликам прежних (светлых) роликов ch-abc и ch-01 (93 реплики, 6279 знаков): в среднем 0,53146 em на знак —
// замер исторический: новые уроки его не меняют, measure-fonts.mjs теперь берёт реплики урока из lessons/<id>/script.gen.json.
// Константы ниже — замер, округлённый вверх до 0,01 em, чтобы текст не вылезал за окно; text.test.ts сверяет их с замером.
export const MEASURED_ADVANCE = 0.7
export const MEASURED_GOLOS = 0.53146

/** Моноширинный текст экранов: кегль, ширина знака (em) и высота строки (px). */
export const MONO = { size: 24, advance: 0.7, line: 36 }
/** Golos Text 500: средняя ширина знака русского текста (em) — для оценки ширины и переноса. */
export const GOLOS = { avg: 0.54 }

/** Движение в кадрах при 30 кадров/с (кривые — в motion.ts). */
export const MOTION = {
  appear: 9, // появление элемента
  move: 18, // камера и смена окна
  draw: 19, // прорисовка линии схемы
  stagger: 2, // шаг очереди строк вывода
  typeCps: 30, // набор команды, знаков в секунду
  blink: 16, // курсор мигает раз в столько кадров
  sceneFade: 8, // смена сцены: растворение
  sceneShift: 16, // и сдвиг на столько px
  chapter: 12, // смена главы в шапке
  maxStill: 120, // дольше кадр без изменений стоять не может
}
