import { describe, expect, it } from 'vitest'
import { svgId } from './ids'

describe('svgId', () => {
  it('id внутри SVG ролика: имя и id ролика — два ролика на странице не делят ни одного', () => {
    expect(svgId('ch-abc', 'header-number')).toBe('term-header-number-ch-abc')
    expect(svgId('ch-01', 'header-number')).toBe('term-header-number-ch-01')
    expect(svgId('ch-abc', 'view')).not.toBe(svgId('ch-01', 'view'))
    expect(svgId('ch-abc', 'view')).not.toBe(svgId('ch-abc', 'fade-top'))
  })

  it('годится для url(#…) и CSS-селектора: только буквы, цифры, «-» и «_», остальное в id ролика заменяется', () => {
    expect(svgId('урок 1 (черновик)', 'view')).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(svgId('a.b', 'view')).toBe('term-view-a_b')
  })

  it('детерминирован: один и тот же вызов — один и тот же id (рендер Remotion не расходится между кадрами)', () => {
    expect(svgId('ch-01', 'fade-left')).toBe(svgId('ch-01', 'fade-left'))
  })
})
