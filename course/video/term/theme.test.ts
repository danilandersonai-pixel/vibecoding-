import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { alpha, CANVAS, HEADER, MOTION, SAFE, SUBS, T } from './theme'

// Тёмные токены курса: блок :root в src/styles/tokens.css.
function tokens() {
  const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../src/styles/tokens.css'), 'utf8')
  const root = css.slice(css.indexOf(':root{'), css.indexOf('}', css.indexOf(':root{')))
  return Object.fromEntries([...root.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]))
}

describe('цвета кадра', () => {
  it('совпадают с токенами курса', () => {
    const t = tokens()
    expect(T.desk).toBe(t['desk'])
    expect(T.paper).toBe(t['paper'])
    expect(T.raised).toBe(t['raised'])
    expect(T.edge).toBe(t['paper-edge'])
    expect(T.ink).toBe(t['ink'])
    expect(T.soft).toBe(t['ink-soft'])
    expect(T.faint).toBe(t['ink-faint'])
    expect(T.line).toBe(t['fig-line'])
    expect(T.grid).toBe(t['fig-grid'])
    expect(T.termBg).toBe(t['term-bg'])
    expect(T.ok).toBe(t['term-ok'])
    expect(T.err).toBe(t['term-err'])
    expect(T.warn).toBe(t['warn'])
  })

  it('шрифты — Golos Text для текста и Martian Mono для экранов', () => {
    expect(T.font).toContain('Golos Text')
    expect(T.mono).toContain('Martian Mono')
  })

  it('alpha() даёт rgba того же цвета', () => {
    expect(alpha(T.termBg, 0.88)).toBe('rgba(15,17,19,0.88)')
    expect(alpha('#FFFFFF', 0.1)).toBe('rgba(255,255,255,0.1)')
  })
})

describe('поля кадра и движение', () => {
  it('холст, безопасная область, шапка и субтитры по спецификации', () => {
    expect(CANVAS).toEqual({ w: 1920, h: 1080 })
    expect([SAFE.x, SAFE.y, SAFE.x + SAFE.w, SAFE.y + SAFE.h]).toEqual([96, 96, 1824, 872])
    expect([HEADER.y, HEADER.y + HEADER.h]).toEqual([32, 80])
    expect([SUBS.top, SUBS.bottom]).toEqual([896, 1040])
    expect(SUBS.size * SUBS.lineHeight * SUBS.maxLines).toBeLessThanOrEqual(SUBS.bottom - SUBS.top)
  })

  it('длительности — из дизайн-системы', () => {
    expect(MOTION).toEqual({ appear: 9, move: 18, draw: 19, stagger: 2, typeCps: 30, blink: 16, sceneFade: 8, sceneShift: 16, chapter: 12, maxStill: 120 })
  })
})
