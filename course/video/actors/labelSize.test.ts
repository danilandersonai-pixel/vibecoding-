import { describe, expect, it } from 'vitest'
import { labelFontSize } from './labelSize'

describe('labelFontSize', () => {
  it('в натуральную величину — 22 px', () => {
    expect(labelFontSize(1)).toBe(22)
  })

  it('при масштабе 0.5 — 36 px', () => {
    expect(labelFontSize(0.5)).toBe(36)
  })

  it('на экране подпись не мельче 18 px при любом масштабе', () => {
    for (const scale of [0.4, 0.42, 0.5, 0.55, 0.6, 0.7, 0.8, 0.95, 1, 1.25]) {
      expect(labelFontSize(scale) * scale).toBeGreaterThanOrEqual(18)
    }
    expect(labelFontSize(0.55) * 0.55).toBeGreaterThanOrEqual(18)
  })

  it('крупнее 1 подпись не растёт', () => {
    expect(labelFontSize(1.5)).toBe(22)
  })
})
