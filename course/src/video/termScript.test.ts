import { expect, it } from 'vitest'
import { day08Script } from '../../video/day-08/script'
import { isTermScript } from './termScript'

it('ролик «Репозиторий» — кадр 1920 × 1080, старые ролики 1280 × 720 — нет', () => {
  expect(isTermScript({ ...day08Script, width: 1920 })).toBe(true)
  expect(isTermScript(day08Script)).toBe(false)
})

it('признаку хватает ширины кадра', () => {
  expect(isTermScript({ width: 1920 })).toBe(true)
  expect(isTermScript({ width: 1280 })).toBe(false)
})
