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

/** Контраст двух цветов #RRGGBB по формуле WCAG 2. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Переменные, которые есть во всех трёх блоках.
const EVERYWHERE = [
  '--desk', '--paper', '--paper-edge', '--rule', '--ink', '--ink-soft', '--accent', '--accent-ink', '--tint',
  '--cover-bg', '--cover-ink', '--cover-soft', '--cover-add', '--cover-del',
  '--fig-ok', '--fig-risk', '--term-bg', '--term-ink', '--term-soft', '--term-edge', '--shadow-raised',
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
    // [текст, фон, только светлая тема]; значение с «#» берётся как есть, «--имя» — из темы.
    const pairs: [string, string, boolean?][] = [
      ['--ink', '--desk'], ['--ink', '--paper'], ['--ink-soft', '--paper'], ['--accent-ink', '--paper'],
      ['--ink-soft', '--desk'], ['--accent-ink', '--desk'],
      ['#FFFFFF', '--accent', true],
      ['--fig-on', '--accent'],
      ['--cover-ink', '--cover-bg'], ['--cover-soft', '--cover-bg'], ['--cover-add', '--cover-bg'], ['--cover-del', '--cover-bg'],
      ['--fig-ok', '--paper'], ['--fig-risk', '--paper'],
      ['--term-ink', '--term-bg'], ['--term-soft', '--term-bg'],
    ]
    const themes: [string, Record<string, string>][] = [['светлая', light], ['тёмная', dark]]
    for (const [themeName, theme] of themes) {
      const color = (token: string) => {
        const value = token.startsWith('#') ? token : theme[token]
        if (!value) throw new Error(`${themeName} тема: нет переменной ${token}`)
        return value
      }
      for (const [text, bg, lightOnly] of pairs) {
        if (lightOnly && theme !== light) continue
        expect(contrast(color(text), color(bg)), `${themeName}: ${text} на ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
