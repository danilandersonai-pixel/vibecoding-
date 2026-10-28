import { describe, expect, it } from 'vitest'
import { appear, cubicBezier, easeIn, easeOut, typedCount, typedFrames } from './motion'
import { MOTION } from './theme'

describe('кривые движения', () => {
  it('ease-out: 0 → 0, 1 → 1, к середине уже почти всё', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
    expect(easeOut(0.5)).toBeGreaterThan(0.8)
  })

  it('ease-in: к середине едва началось', () => {
    expect(easeIn(0)).toBe(0)
    expect(easeIn(1)).toBe(1)
    expect(easeIn(0.5)).toBeLessThan(0.35)
  })

  it('обе кривые не убывают и не выходят из 0…1, за краями — зажаты', () => {
    for (const ease of [easeOut, easeIn]) {
      let prev = 0
      for (let i = 0; i <= 100; i++) {
        const y = ease(i / 100)
        expect(y).toBeGreaterThanOrEqual(prev - 1e-9)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(1)
        prev = y
      }
      expect(ease(-1)).toBe(0)
      expect(ease(2)).toBe(1)
    }
  })

  it('cubicBezier совпадает с известными точками CSS-кривых', () => {
    // linear: cubic-bezier(0,0,1,1); ease-in-out симметрична относительно середины
    const linear = cubicBezier(0, 0, 1, 1)
    for (const t of [0.1, 0.25, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 6)
    const inOut = cubicBezier(0.42, 0, 0.58, 1)
    expect(inOut(0.5)).toBeCloseTo(0.5, 6)
    expect(inOut(0.25) + inOut(0.75)).toBeCloseTo(1, 6)
  })
})

describe('appear', () => {
  it('до кадра at — 0, через 9 кадров — 1, посередине — между', () => {
    expect(appear(0, 10)).toBe(0)
    expect(appear(10, 10)).toBe(0)
    expect(appear(19, 10)).toBe(1)
    expect(appear(500, 10)).toBe(1)
    const mid = appear(14, 10)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('длина появления задаётся третьим аргументом', () => {
    expect(appear(30, 10, 20)).toBe(1)
    expect(appear(29, 10, 20)).toBeLessThan(1)
  })
})

describe('typedCount', () => {
  it('30 знаков в секунду — один знак на кадр', () => {
    expect(typedCount('abcdef', 10 + 3, 10)).toBe(3)
    expect(typedCount('abcdef', 10 + 1, 10)).toBe(1)
  })

  it('до начала — 0, после конца — вся длина', () => {
    expect(typedCount('abcdef', 5, 10)).toBe(0)
    expect(typedCount('abcdef', 10, 10)).toBe(0)
    expect(typedCount('abcdef', 10 + 6, 10)).toBe(6)
    expect(typedCount('abcdef', 1000, 10)).toBe(6)
    expect(typedCount('', 20, 10)).toBe(0)
  })
})

describe('typedCount и знаки Unicode', () => {
  it('считает знаки, а не кодовые единицы: «😀😀» — два знака', () => {
    expect(typedCount('😀😀', 1000, 0)).toBe(2)
    expect(typedCount('a😀', 1, 0)).toBe(1)
  })
})

describe('typedFrames', () => {
  it('сколько кадров набирается строка: при 30 знаках в секунду — кадр на знак', () => {
    expect(typedFrames('abcdef')).toBe(6)
    expect(typedFrames('')).toBe(0)
    expect(typedFrames('😀😀')).toBe(2)
  })

  it('к кадру at + typedFrames набрано ровно всё, на кадр раньше — ещё нет, при любой скорости набора', () => {
    const was = MOTION.typeCps
    try {
      for (const cps of [30, 15, 20, 7]) {
        MOTION.typeCps = cps
        for (const text of ['a', 'abcde', 'abcdefghijklmnopqrstuvwxyz0123']) {
          const n = typedFrames(text)
          expect(typedCount(text, 5 + n, 5), `${cps} знаков/с, «${text}»`).toBe(text.length)
          expect(typedCount(text, 5 + n - 1, 5), `${cps} знаков/с, «${text}»`).toBeLessThan(text.length)
        }
      }
      MOTION.typeCps = 15
      expect(typedFrames('abcdef')).toBe(12)
    } finally {
      MOTION.typeCps = was
    }
  })
})
