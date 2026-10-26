import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { navigate, parseRoute, useRoute } from './router'

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
  it('граф: общий вид, узел из адреса (id закодирован), битая кодировка — общий вид', () => {
    expect(parseRoute('#/graph')).toEqual({ name: 'graph' })
    expect(parseRoute('#/graph/term%3A12')).toEqual({ name: 'graph', node: 'term:12' })
    expect(parseRoute('#/graph/%E0%A4%A')).toEqual({ name: 'graph' })
    expect(parseRoute('#/graph/')).toEqual({ name: 'graph' })
    expect(parseRoute('#/graphs')).toEqual({ name: 'map' })
  })
})

describe('navigate', () => {
  it('переключает маршрут из скрипта', async () => {
    const { result } = renderHook(() => useRoute())
    act(() => navigate('#/day/2'))
    await waitFor(() => expect(result.current).toEqual({ name: 'day', n: 2 }))
    act(() => navigate('#/'))
    await waitFor(() => expect(result.current).toEqual({ name: 'map' }))
  })
})
