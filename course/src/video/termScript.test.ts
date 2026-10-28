import { expect, it } from 'vitest'
import { pilotRlsScript } from '../../video/pilot-rls/script'
import { isTermScript } from './termScript'

it('ролик «Репозиторий» — кадр 1920 × 1080, старые ролики 1280 × 720 — нет', () => {
  expect(isTermScript({ ...pilotRlsScript, width: 1920 })).toBe(true)
  expect(isTermScript(pilotRlsScript)).toBe(false)
})

it('признаку хватает ширины кадра', () => {
  expect(isTermScript({ width: 1920 })).toBe(true)
  expect(isTermScript({ width: 1280 })).toBe(false)
})
