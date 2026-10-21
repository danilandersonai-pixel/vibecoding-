import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('parseRoute', () => {
  it('открывает день по номеру', () => {
    expect(parseRoute('#/day/3')).toEqual({ name: 'day', n: 3 })
  })
  it('несуществующий день и мусор ведут на карту', () => {
    expect(parseRoute('#/day/99')).toEqual({ name: 'map' })
    expect(parseRoute('#/day/0')).toEqual({ name: 'map' })
    expect(parseRoute('#/abc')).toEqual({ name: 'map' })
    expect(parseRoute('')).toEqual({ name: 'map' })
  })
})
