/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Читаем сам файл токенов и разбираем два блока: тёмный :root (тема по умолчанию) и светлый :root[data-theme="light"].
// Комментарии убираем заранее.
// Типы Node подключены только этому файлу: в tsconfig.app их нет, а ?raw для .css в vitest отдаёт пустую строку.
const here = dirname(fileURLToPath(import.meta.url))
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
const css = stripComments(readFileSync(resolve(here, 'tokens.css'), 'utf8'))

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Тела всех блоков с этим селектором; вложенные скобки учитываются. */
function blocks(src: string, selector: string): string[] {
  const bodies: string[] = []
  const re = new RegExp(`${escapeRe(selector)}\\s*\\{`, 'g')
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const open = m.index + m[0].length - 1
    let depth = 0
    for (let i = open; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}' && --depth === 0) {
        bodies.push(src.slice(open + 1, i))
        break
      }
    }
  }
  return bodies
}

/** Переменные из тел блоков: имя → значение. */
function vars(bodies: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const body of bodies) {
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) out[m[1]] = m[2].trim()
  }
  return out
}

const darkBlocks = blocks(css, ':root')
const lightBlocks = blocks(css, ':root[data-theme="light"]')
const dark = vars(darkBlocks)
// Светлый блок переопределяет только цвета; общие для тем переменные (скругления, шрифты) берутся из :root
const lightOwn = vars(lightBlocks)
const light = { ...dark, ...lightOwn }

/** Относительная яркость цвета #RRGGBB по WCAG 2. */
function luminance(hex: string): number {
  const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/** Контраст двух цветов #RRGGBB по формуле WCAG 2. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Фон из слоёв снизу вверх: нижний — непрозрачный, выше — rgba(…) или [цвет, доля] (как color-mix(… доля, transparent)).
type Layer = string | [string, number]

/** rgba(r, g, b, a) или #RRGGBB → [r, g, b, a]. */
function channels(value: string): number[] {
  const m = value.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/)
  return m ? m.slice(1).map(Number) : [...[1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)), 1]
}

/** Слои, наложенные друг на друга, → #RRGGBB. */
function flatten(layers: [string, number][]): string {
  const [base, ...rest] = layers.map(([value, share]) => {
    const [r, g, b, a] = channels(value)
    return [r, g, b, a * share]
  })
  const out = rest.reduce((under, [r, g, b, a]) => [r, g, b].map((c, i) => c * a + under[i] * (1 - a)), base.slice(0, 3))
  return `#${out.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

// Не зависят от темы — только в :root, светлый блок их не трогает
const SHARED = ['--radius-xl', '--radius-l', '--radius-m', '--radius-s', '--content', '--sidebar', '--font-body', '--font-ui', '--font-code']
// Цвета и тени, которые должны быть в обеих темах (новые --raised, --edge, --ink-faint, --term-ok, --term-err — тоже)
const THEMED = [
  '--desk', '--desk-ink', '--desk-soft', '--paper', '--paper-edge', '--raised', '--ink', '--ink-soft', '--ink-faint',
  '--rule', '--edge', '--accent', '--accent-ink', '--tint', '--code-bg', '--warn',
  '--term-bg', '--term-ink', '--term-soft', '--term-edge', '--term-ok', '--term-err',
  '--fig-ink', '--fig-soft', '--fig-line', '--fig-grid', '--fig-zone', '--fig-risk', '--fig-ok', '--fig-on', '--graph-book',
  '--shadow-raised', '--scrim',
]

describe('tokens.css', () => {
  it('тёмная тема — по умолчанию (:root), светлая — по data-theme="light"; системная настройка тему не меняет', () => {
    expect(darkBlocks).toHaveLength(1)
    expect(lightBlocks).toHaveLength(1)
    expect(darkBlocks[0]).toMatch(/color-scheme\s*:\s*dark/)
    expect(lightBlocks[0]).toMatch(/color-scheme\s*:\s*light/)
    // ни в токенах, ни в других стилях тема не зависит от prefers-color-scheme, отдельного тёмного блока по атрибуту нет
    expect(css).not.toContain('data-theme="dark"')
    for (const file of styleFiles()) expect(read(file), file).not.toContain('prefers-color-scheme')
  })

  it('в тёмной и светлой теме есть все переменные', () => {
    for (const name of THEMED) {
      expect(dark[name], `тёмная тема: ${name}`).toBeTruthy()
      expect(lightOwn[name], `светлая тема: ${name}`).toBeTruthy()
    }
    for (const name of SHARED) {
      expect(dark[name], `:root: ${name}`).toBeTruthy()
      expect(lightOwn[name], `светлая тема не переопределяет ${name}`).toBeUndefined()
    }
    // светлый блок переопределяет ровно все цвета тёмного — ничего не забыто и ничего лишнего
    expect(Object.keys(lightOwn).sort()).toEqual(Object.keys(dark).filter((k) => !SHARED.includes(k)).sort())
    // токенов обложки больше нет
    expect(css).not.toMatch(/--cover-/)
  })

  it('на каждую var(--…) в стилях и компонентах есть переменная', () => {
    // Свои переменные компонентов (например --dot у фильтров графа) задаются в стилях или в style={{ '--…' }}
    const sources = [...styleFiles(), ...sourceFiles()].map(read)
    const local = new Set(sources.flatMap((s) => [...s.matchAll(/(?:^|[;{\s'"])(--[\w-]+)['"]?\s*:/g)].map((m) => m[1])))
    const used = new Set(sources.flatMap((s) => [...s.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])))
    const missing = [...used].filter((name) => !(name in dark) && !local.has(name))
    expect(missing).toEqual([])
  })

  it('фон страницы, монохромный акцент и цвет частей на графе', () => {
    expect(dark['--desk'].toUpperCase()).toBe('#141619')
    expect(light['--desk'].toUpperCase()).toBe('#F6F6F4')
    // --accent — это цвет текста: главное действие и текущее место — инверсией
    for (const theme of [dark, light]) {
      expect(theme['--accent']).toBe(theme['--ink'])
      expect(theme['--accent-ink']).toBe(theme['--ink'])
    }
    expect([dark['--graph-book'].toUpperCase(), light['--graph-book'].toUpperCase()]).toEqual(['#8AA9F0', '#3555B8'])
  })

  it('скругления — 8 / 6 / 4 / 3 px', () => {
    expect([dark['--radius-xl'], dark['--radius-l'], dark['--radius-m'], dark['--radius-s']]).toEqual(['8px', '6px', '4px', '3px'])
  })

  it('контраст текста не ниже 4,5 : 1', () => {
    expectContrast(4.5, [
      // Текст на фоне страницы, панели и подложке под курсором (--raised)
      ['--ink', '--desk'], ['--ink', '--paper'], ['--ink', '--raised'],
      ['--ink-soft', '--desk'], ['--ink-soft', '--paper'], ['--ink-soft', '--raised'],
      ['--ink-faint', '--desk'], ['--ink-faint', '--paper'], ['--ink-faint', '--raised'],
      ['--accent-ink', '--desk'], ['--accent-ink', '--paper'],
      // Цвета состояний: сделано и верно, ошибка, готовится и «повторить»
      ['--fig-ok', '--desk'], ['--fig-ok', '--paper'],
      ['--fig-risk', '--desk'], ['--fig-risk', '--paper'],
      ['--warn', '--desk'], ['--warn', '--paper'],
      // Блок терминала: текст, комментарии, «+» результата дня и ошибки
      ['--term-ink', '--term-bg'], ['--term-soft', '--term-bg'], ['--term-ok', '--term-bg'], ['--term-err', '--term-bg'],
      // Главная кнопка, строка «сейчас», HEAD и текущий пункт плана — инверсия: --desk на --ink; главная кнопка под курсором
      ['--desk', '--ink'], ['--desk', ['--ink', ['--desk', 0.14]]],
      // «✓ пройден» на карте и ✓ в плане под курсором; ✓ / ✗ в кружке ответа теста
      ['--fig-ok', '--raised'], ['--fig-on', '--fig-ok'], ['--fig-on', '--fig-risk'],
      // Подсветка под курсором и выбранное в выдаче поиска и графа (--tint на панели), нажатый фильтр графа на фоне страницы,
      // найденное слово в поиске
      ['--ink', ['--paper', '--tint']], ['--ink-soft', ['--paper', '--tint']], ['--accent-ink', ['--paper', '--tint']],
      ['--ink', ['--desk', '--tint']], ['--ink-soft', ['--desk', '--tint']],
      ['--ink', ['--paper', ['--accent', 0.18]]],
      // «Найди ошибку»: выбранная, найденная и неверная строка, номер строки и «Скопировать» под курсором
      ['--term-ink', ['--term-bg', ['--term-ink', 0.16]]], ['--term-ink', ['--term-bg', ['--term-ok', 0.22]]],
      ['--term-ink', ['--term-bg', ['--term-err', 0.22]]], ['--term-soft', ['--term-bg', ['--term-ink', 0.08]]],
      ['--term-ink', ['--term-bg', ['--term-ink', 0.08]]],
      // Конец ролика поверх кадра (худший случай — белый кадр): «Смотреть ещё раз» и «Дальше»
      ['--term-ink', ['#FBFAF6', ['--term-bg', 0.8]]], ['--term-bg', '--term-ink'],
    ])
  })

  it('рамки, по которым видно состояние, — не ниже 3 : 1 (WCAG 1.4.11)', () => {
    expectContrast(3, [
      // --edge: рамки кнопок и полей, точка дня «впереди», кружок варианта ответа, пунктир «готовится» —
      // на фоне страницы, на панели и на подложке под курсором
      ['--edge', '--desk'], ['--edge', '--paper'], ['--edge', '--raised'],
      // Клетка текущего дня в боковой панели (рамка цвета текста на --paper); точки пройденного и текущего на линии ветки
      ['--ink', '--paper'], ['--ink', '--desk'],
      // Знак ✓ у сделанной части в плане и у пройденного дня — на фоне страницы
      ['--fig-ok', '--desk'],
      // Рамка «Смотреть ещё раз» в конце ролика поверх белого кадра
      ['--term-soft', ['#FBFAF6', ['--term-bg', 0.8]]],
    ])
  })

  it('правила этих рамок берут проверенные выше переменные', () => {
    expect(cssDecls('base.css', '.btn').border).toBe('1px solid var(--edge)')
    expect(cssDecls('home.css', '.route-day::before')).toMatchObject({ border: '2px solid var(--edge)', background: 'var(--desk)' })
    expect(cssDecls('blocks.css', '.quiz-dot').border).toBe('2px solid var(--edge)')
    expect(cssDecls('day.css', '.draft-notice').border).toBe('1px dashed var(--edge)')
    expect(cssDecls('day.css', '.day-aside').background).toBe('var(--desk)')
    expect(cssDecls('home.css', '.sitebar').background).toBe('var(--paper)')
    expect(cssDecls('home.css', '.sitebar-cells li.is-now')['box-shadow']).toBe('inset 0 0 0 2px var(--ink)')
    expect(cssDecls('video.css', '.video-end .btn')['border-color']).toBe('var(--term-soft)')
    expect(cssDecls('video.css', '.video-end').background).toBe('color-mix(in srgb,var(--term-bg) 80%,transparent)')
    expect(cssDecls('base.css', '.btn-primary:hover:not(:disabled)').background).toBe('color-mix(in srgb,var(--ink) 86%,var(--desk))')
  })

  it('затемнение под окном поиска темнит страницу в обеих темах, бумага окна светлее затемнённой страницы', () => {
    for (const [themeName, theme] of [['тёмная', dark], ['светлая', light]] as const) {
      for (const bg of ['--desk', '--paper', '--raised']) {
        const dimmed = flatten([[theme[bg], 1], [theme['--scrim'], 1]])
        expect(luminance(dimmed), `${themeName}: ${bg} под затемнением`).toBeLessThan(luminance(theme[bg]))
      }
      // Блок терминала и так тёмный: в светлой теме цвет затемнения почти равен --term-bg, поэтому темнее он не становится,
      // но и светлее — тоже нет
      expect(luminance(flatten([[theme['--term-bg'], 1], [theme['--scrim'], 1]])), `${themeName}: --term-bg под затемнением`).toBeLessThanOrEqual(
        luminance(theme['--term-bg']),
      )
      expect(luminance(theme['--paper']), `${themeName}: бумага окна`).toBeGreaterThan(luminance(flatten([[theme['--desk'], 1], [theme['--scrim'], 1]])))
    }
    expect(cssDecls('search.css', '.search-layer').background).toBe('var(--scrim)')
    expect(cssDecls('base.css', '.paper').background).toBe('var(--paper)')
  })

  it('метки обложки ролика — светлый текст на плашке терминала 88 %: читаются даже на белом кадре', () => {
    // Затемнение обложки под метками не учитываем — худший случай: кадр ролика под плашкой белый (#FBFAF6 — бумага роликов)
    expect(cssDecls('video.css', '.video-stage').background).toBe('#FBFAF6')
    expectContrast(4.5, [['--term-ink', ['#FBFAF6', ['--term-bg', 0.88]]]])
    const label = cssDecls('video.css', '.video-cover-label')
    expect(label.background).toBe('color-mix(in srgb,var(--term-bg) 88%,transparent)')
    expect(label.color).toBe('var(--term-ink)')
  })
})

/** Все файлы стилей курса. */
function styleFiles(): string[] {
  return readdirSync(here)
    .filter((f) => f.endsWith('.css'))
    .map((f) => resolve(here, f))
}

/** Исходники компонентов (без тестов): там тоже бывают var(--…) и свои переменные в style. */
function sourceFiles(): string[] {
  const src = resolve(here, '..')
  return (readdirSync(src, { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => resolve(src, f))
}

function read(file: string): string {
  return stripComments(readFileSync(file, 'utf8'))
}

/** Объявления правил файла стилей, где селектор стоит отдельным пунктом списка (и внутри @media): свойство → значение.
 *  Стили jsdom не загружает, поэтому читаем сам файл — как parts.test.tsx читает blocks.css. */
function cssDecls(file: string, selector: string): Record<string, string> {
  const src = read(resolve(here, file))
  const out: Record<string, string> = {}
  for (const [, selectors, body] of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((x) => x.trim() === selector)) continue
    for (const decl of body.split(';')) {
      const colon = decl.indexOf(':')
      if (colon > 0) out[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim()
    }
  }
  return out
}

/** Пары [цвет, фон] — контраст не ниже min в тёмной и светлой теме.
 *  Значение с «#» берётся как есть, «--имя» — из темы; фон-массив — слои снизу вверх. */
function expectContrast(min: number, pairs: [string, string | Layer[]][]) {
  const themes: [string, Record<string, string>][] = [['тёмная', dark], ['светлая', light]]
  for (const [themeName, theme] of themes) {
    const color = (token: string) => {
      const value = token.startsWith('#') ? token : theme[token]
      if (!value) throw new Error(`${themeName} тема: нет переменной ${token}`)
      return value
    }
    const background = (bg: string | Layer[]) =>
      typeof bg === 'string' ? color(bg) : flatten(bg.map((l): [string, number] => (typeof l === 'string' ? [color(l), 1] : [color(l[0]), l[1]])))
    for (const [text, bg] of pairs) {
      expect(contrast(color(text), background(bg)), `${themeName}: ${text} на ${JSON.stringify(bg)}`).toBeGreaterThanOrEqual(min)
    }
  }
}
