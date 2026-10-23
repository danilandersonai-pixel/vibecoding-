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
