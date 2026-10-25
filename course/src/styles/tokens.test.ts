/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Читаем сам файл токенов и разбираем три блока: светлый :root, тёмный внутри
// prefers-color-scheme и :root[data-theme="dark"]. Комментарии убираем заранее.
// Типы Node подключены только этому файлу: в tsconfig.app их нет, а ?raw для .css в vitest отдаёт пустую строку.
const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

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

const light = vars(blocks(css, ':root'))
const dark = vars(blocks(blocks(css, '@media (prefers-color-scheme: dark)').join('\n'), ':root:not([data-theme="light"])'))
const darkAttr = vars(blocks(css, ':root[data-theme="dark"]'))

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

// Переменные, которые есть во всех трёх блоках.
const EVERYWHERE = [
  '--desk', '--paper', '--paper-edge', '--rule', '--ink', '--ink-soft', '--accent', '--accent-ink', '--tint',
  '--cover-bg', '--cover-ink', '--cover-soft', '--cover-add', '--cover-del', '--cover-accent',
  '--fig-ok', '--fig-risk', '--term-bg', '--term-ink', '--term-soft', '--term-edge', '--shadow-raised', '--scrim',
]
// Не зависят от темы — только в светлом блоке.
const LIGHT_ONLY = ['--radius-xl', '--radius-l', '--radius-m', '--radius-s', '--content']

describe('tokens.css', () => {
  it('в светлой и тёмной теме есть все переменные', () => {
    for (const name of EVERYWHERE) {
      expect(light[name], `светлая тема: ${name}`).toBeTruthy()
      expect(dark[name], `тёмная тема (prefers-color-scheme): ${name}`).toBeTruthy()
      expect(darkAttr[name], `тёмная тема (data-theme): ${name}`).toBeTruthy()
    }
    for (const name of LIGHT_ONLY) expect(light[name], `светлая тема: ${name}`).toBeTruthy()
  })

  it('оба тёмных блока одинаковы', () => {
    expect(darkAttr).toEqual(dark)
  })

  it('фон страницы светлой темы — #F4F2EC', () => {
    expect(light['--desk'].toUpperCase()).toBe('#F4F2EC')
  })

  it('скругления — 20 / 16 / 14 / 10 px', () => {
    expect([light['--radius-xl'], light['--radius-l'], light['--radius-m'], light['--radius-s']]).toEqual(['20px', '16px', '14px', '10px'])
  })

  it('контраст текста не ниже 4,5 : 1', () => {
    expectContrast(4.5, [
      ['--ink', '--desk'], ['--ink', '--paper'], ['--ink-soft', '--paper'], ['--accent-ink', '--paper'],
      ['--ink-soft', '--desk'], ['--accent-ink', '--desk'],
      ['#FFFFFF', '--accent', true],
      ['--fig-on', '--accent'],
      ['--cover-ink', '--cover-bg'], ['--cover-soft', '--cover-bg'], ['--cover-add', '--cover-bg'], ['--cover-del', '--cover-bg'],
      ['--fig-ok', '--paper'], ['--fig-risk', '--paper'],
      ['--term-ink', '--term-bg'], ['--term-soft', '--term-bg'],
      // Карта-путь: номер недели; строка «сейчас» и строка под курсором (--tint на бумаге); метка «пройден» — и под курсором
      ['--accent', '--paper'],
      ['--ink', ['--paper', '--tint']], ['--ink-soft', ['--paper', '--tint']],
      ['--ink', ['--paper', ['--fig-ok', 0.12]]], ['--ink', ['--paper', '--tint', ['--fig-ok', 0.12]]],
      // Страница дня: метки шапки (10 % светлого на синем), «Результат дня» (8 %), текущий пункт плана, пройденная часть
      ['--cover-ink', ['--cover-bg', ['--cover-ink', 0.1]]],
      ['--cover-ink', ['--cover-bg', ['--cover-ink', 0.08]]], ['--cover-add', ['--cover-bg', ['--cover-ink', 0.08]]],
      ['--accent-ink', ['--paper', '--tint']],
      ['--fig-on', '--fig-ok'],
      // Тест, практика, наставник, итог дня: варианты и пояснения на зелёной и красной подкраске, ✓ / ✗ в кружке,
      // «Скопировать» в тёмном блоке и на синей карточке, команда наставника, нажатые «Знаю» / «Повторить»
      ['--ink', ['--paper', ['--fig-ok', 0.1]]], ['--ink', ['--paper', ['--fig-risk', 0.1]]], ['--ink', ['--paper', ['--warn', 0.1]]],
      ['--fig-on', '--fig-risk'],
      ['--term-ink', ['--term-bg', ['--term-ink', 0.08]]], ['--cover-bg', '--cover-ink'],
      ['--cover-ink', ['--cover-bg', ['--term-bg', 0.35]]],
      // Рамка 2 px нажатой «Повторить» на бумаге (рамке хватило бы 3 : 1; «Знаю» — пара --fig-ok выше)
      ['--warn', '--paper'],
    ])
  })

  it('рамки, по которым видно состояние, — не ниже 3 : 1 (WCAG 1.4.11)', () => {
    expectContrast(3, [
      // Карта-путь: рамка пустой точки дня «впереди» на бумаге недели и в легенде на фоне страницы
      ['--ink-soft', '--paper'], ['--ink-soft', '--desk'],
      // План дня полосой: акцентная рамка пройденной и одновременно текущей части на бумаге полосы
      ['--accent', '--paper'],
    ])
  })

  it('правила этих рамок берут проверенные выше переменные', () => {
    // Точка «впереди» — рамка --ink-soft; пройденная и текущая «таблетка» — кольцо --accent через просвет --paper
    expect(cssDecls('home.css', '.route-dot').border).toBe('2px solid var(--ink-soft)')
    expect(cssDecls('day.css', '.toc-item.is-done.is-current')['box-shadow']).toBe('0 0 0 2px var(--paper),0 0 0 4px var(--accent)')
  })

  it('затемнение под окном поиска темнит страницу в обеих темах, бумага окна светлее затемнённой страницы', () => {
    for (const [themeName, theme] of [['светлая', light], ['тёмная', dark]] as const) {
      for (const bg of ['--desk', '--paper', '--cover-bg']) {
        const dimmed = flatten([[theme[bg], 1], [theme['--scrim'], 1]])
        expect(luminance(dimmed), `${themeName}: ${bg} под затемнением`).toBeLessThan(luminance(theme[bg]))
      }
      expect(luminance(theme['--paper']), `${themeName}: бумага окна`).toBeGreaterThan(luminance(flatten([[theme['--desk'], 1], [theme['--scrim'], 1]])))
    }
    expect(cssDecls('search.css', '.search-layer').background).toBe('var(--scrim)')
  })

  it('метки обложки ролика — светлый текст на синей плашке 75 %: читаются даже на белом кадре', () => {
    // Затемнение обложки под метками не учитываем — худший случай: кадр ролика под плашкой белый
    expectContrast(4.5, [['--cover-ink', ['#FFFFFF', ['--cover-bg', 0.75]]]])
    const label = cssDecls('video.css', '.video-cover-label')
    expect(label.background).toBe('color-mix(in srgb,var(--cover-bg) 75%,transparent)')
    expect(label.color).toBe('var(--cover-ink)')
  })
})

/** Объявления правил файла стилей, где селектор стоит отдельным пунктом списка (и внутри @media): свойство → значение.
 *  Стили jsdom не загружает, поэтому читаем сам файл — как parts.test.tsx читает blocks.css. */
function cssDecls(file: string, selector: string): Record<string, string> {
  const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
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

/** Пары [цвет, фон, только светлая тема] — контраст не ниже min в светлой и тёмной теме.
 *  Значение с «#» берётся как есть, «--имя» — из темы; фон-массив — слои снизу вверх. */
function expectContrast(min: number, pairs: [string, string | Layer[], boolean?][]) {
  const themes: [string, Record<string, string>][] = [['светлая', light], ['тёмная', dark]]
  for (const [themeName, theme] of themes) {
    const color = (token: string) => {
      const value = token.startsWith('#') ? token : theme[token]
      if (!value) throw new Error(`${themeName} тема: нет переменной ${token}`)
      return value
    }
    const background = (bg: string | Layer[]) =>
      typeof bg === 'string' ? color(bg) : flatten(bg.map((l): [string, number] => (typeof l === 'string' ? [color(l), 1] : [color(l[0]), l[1]])))
    for (const [text, bg, lightOnly] of pairs) {
      if (lightOnly && theme !== light) continue
      expect(contrast(color(text), background(bg)), `${themeName}: ${text} на ${JSON.stringify(bg)}`).toBeGreaterThanOrEqual(min)
    }
  }
}
