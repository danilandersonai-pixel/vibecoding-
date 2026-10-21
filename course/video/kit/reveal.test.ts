import { describe, expect, it } from 'vitest'
import { grow, revealCount, stepAt, typed } from './reveal'

describe('typed', () => {
  it('на кадре 15 при 30 знаках в секунду набрано 15 знаков', () => {
    expect(typed('client/17', 15, 0, 30)).toBe('client/17'.slice(0, 15))
  })

  it('до начала — пустая строка', () => {
    expect(typed('client/17', 0, 10, 30)).toBe('')
    expect(typed('client/17', 9, 10, 30)).toBe('')
  })

  it('после конца — вся строка', () => {
    expect(typed('client/17', 200, 10, 30)).toBe('client/17')
  })

  it('набирается по знаку в кадр при 30 знаках в секунду', () => {
    expect(typed('client/17', 4, 0, 30)).toBe('clie')
    expect(typed('client/17', 14, 10, 30)).toBe('clie')
  })

  it('медленнее при меньшем числе знаков в секунду', () => {
    expect(typed('client/17', 4, 0, 15)).toBe('cl')
  })

  it('по умолчанию 30 знаков в секунду', () => {
    expect(typed('client/17', 5, 0)).toBe('clien')
  })
})

describe('revealCount', () => {
  it('до начала ничего не показано', () => {
    expect(revealCount(0, 10, 5, 4)).toBe(0)
    expect(revealCount(9, 10, 5, 4)).toBe(0)
  })

  it('первый элемент появляется ровно на кадре start', () => {
    expect(revealCount(10, 10, 5, 4)).toBe(1)
  })

  it('растёт каждые every кадров', () => {
    expect(revealCount(14, 10, 5, 4)).toBe(1)
    expect(revealCount(15, 10, 5, 4)).toBe(2)
    expect(revealCount(20, 10, 5, 4)).toBe(3)
  })

  it('не больше total', () => {
    expect(revealCount(100, 10, 5, 4)).toBe(4)
    expect(revealCount(100, 10, 5, 0)).toBe(0)
  })
})

describe('grow', () => {
  it('0 в начале и 1 в конце', () => {
    expect(grow(20, 20, 30)).toBe(0)
    expect(grow(50, 20, 30)).toBe(1)
  })

  it('до начала 0, после конца 1', () => {
    expect(grow(0, 20, 30)).toBe(0)
    expect(grow(500, 20, 30)).toBe(1)
  })

  it('монотонно не убывает', () => {
    let prev = grow(0, 20, 30)
    for (let f = 1; f <= 70; f++) {
      const g = grow(f, 20, 30)
      expect(g).toBeGreaterThanOrEqual(prev)
      prev = g
    }
  })

  it('в середине строго между 0 и 1', () => {
    const mid = grow(35, 20, 30)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('нулевая длина — мгновенно', () => {
    expect(grow(9, 10, 0)).toBe(0)
    expect(grow(10, 10, 0)).toBe(1)
  })
})

describe('stepAt', () => {
  const steps: [number, string][] = [
    [0, 'stand'],
    [30, 'point'],
    [90, 'cheer'],
  ]

  it('берёт последний шаг, чей кадр уже наступил', () => {
    expect(stepAt(29, steps)).toBe('stand')
    expect(stepAt(30, steps)).toBe('point')
    expect(stepAt(89, steps)).toBe('point')
    expect(stepAt(500, steps)).toBe('cheer')
  })

  it('до первого шага — первый', () => {
    expect(stepAt(-5, [[10, 'a'], [20, 'b']])).toBe('a')
  })
})
