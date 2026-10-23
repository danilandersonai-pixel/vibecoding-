import { describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» хуки, задаёт тест.
const clock = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => clock.frame }))

import { useAppear, useTrack } from './hooks'
import { appear, CLAMP, trackAt } from './motion'

describe('CLAMP', () => {
  it('держит значение на краях диапазона', () => {
    expect(CLAMP).toEqual({ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  })
})

describe('appear', () => {
  it('до кадра at — 0, после at + length — 1', () => {
    expect(appear(0, 30)).toBe(0)
    expect(appear(30, 30)).toBe(0)
    expect(appear(30 + 12, 30)).toBe(1)
    expect(appear(500, 30)).toBe(1)
    expect(appear(50, 40, 20)).toBe(0.5)
    expect(appear(60, 40, 20)).toBe(1)
  })

  it('растёт монотонно и остаётся в пределах 0…1', () => {
    let prev = 0
    for (let f = -5; f <= 60; f++) {
      const v = appear(f, 10, 20)
      expect(v).toBeGreaterThanOrEqual(prev)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      prev = v
    }
  })
})

describe('trackAt', () => {
  const keys: [number, number, number][] = [
    [20, 100, 200],
    [60, 300, 400],
    [100, 300, 100],
  ]

  it('до первого ключа стоит в первом, после последнего — в последнем', () => {
    expect(trackAt(0, keys)).toEqual({ x: 100, y: 200 })
    expect(trackAt(20, keys)).toEqual({ x: 100, y: 200 })
    expect(trackAt(100, keys)).toEqual({ x: 300, y: 100 })
    expect(trackAt(999, keys)).toEqual({ x: 300, y: 100 })
  })

  it('в ключевых кадрах — ровно в ключах, между ними — плавно (на середине — посередине)', () => {
    expect(trackAt(60, keys)).toEqual({ x: 300, y: 400 })
    expect(trackAt(40, keys)).toEqual({ x: 200, y: 300 })
    const early = trackAt(25, keys)
    expect(early.x).toBeGreaterThan(100)
    expect(early.x).toBeLessThan(150) // разгон: за первую восьмую пути — меньше восьмой доли
  })
})

describe('хуки — обёртки над функциями движения', () => {
  it('useAppear и useTrack дают то же, что appear и trackAt на текущем кадре', () => {
    const keys: [number, number, number][] = [
      [10, 0, 0],
      [50, 80, 40],
    ]
    for (const f of [0, 10, 25, 49, 50, 80]) {
      clock.frame = f
      expect(useAppear(20, 16)).toBe(appear(f, 20, 16))
      expect(useAppear(20)).toBe(appear(f, 20))
      expect(useTrack(keys)).toEqual(trackAt(f, keys))
    }
  })
})
