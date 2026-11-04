import { expect, it } from 'vitest'
import type { VideoScript } from '../../video/types'
import oldVideo from './fixtures/old-video.json'
import { isTermScript } from './termScript'

// Замороженный сценарий старого ролика 1280 × 720: тесты не зависят от роликов каталога
const oldVideoFixture = oldVideo as VideoScript

it('ролик «Репозиторий» — кадр 1920 × 1080, старые ролики 1280 × 720 — нет', () => {
  expect(isTermScript({ ...oldVideoFixture, width: 1920 })).toBe(true)
  expect(isTermScript(oldVideoFixture)).toBe(false)
})

it('признаку хватает ширины кадра', () => {
  expect(isTermScript({ width: 1920 })).toBe(true)
  expect(isTermScript({ width: 1280 })).toBe(false)
})
