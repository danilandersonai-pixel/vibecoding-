import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { catalogIds, isFresh, LIMIT_BYTES, summary } from './render-all.mjs'

describe('catalogIds', () => {
  it('берёт id роликов из каталога по порядку', () => {
    const text = `export const catalog = {\n  'pilot-rls': {\n    title: 'А',\n  },\n  'ch-abc': {\n    title: 'Б',\n  },\n  'day-08': {\n    kind: 'day',\n  },\n}\n`
    expect(catalogIds(text)).toEqual(['pilot-rls', 'ch-abc', 'day-08'])
  })
})

describe('isFresh', () => {
  it('MP4 новее всех исходников — пропускаем', () => {
    expect(isFresh(100, [10, 50, 99])).toBe(true)
  })
  it('хоть один исходник новее MP4 — рендерим заново', () => {
    expect(isFresh(100, [10, 150])).toBe(false)
  })
  it('MP4 ещё нет — рендерим', () => {
    expect(isFresh(undefined, [10])).toBe(false)
  })
})

describe('summary', () => {
  it('таблица «ролик — длительность — МБ» и список файлов больше 20 МБ', () => {
    const rows = [
      { id: 'ch-01', seconds: 261.9, bytes: 3.8 * 1024 * 1024 },
      { id: 'day-08', seconds: 150, bytes: LIMIT_BYTES + 1 },
    ]
    const { lines, tooBig } = summary(rows)
    expect(lines).toEqual(['ch-01  4:22  3.8 МБ', 'day-08  2:30  20.0 МБ'])
    expect(tooBig).toEqual(['day-08'])
  })
})
