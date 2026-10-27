import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { navigate, parseRoute, transitionKind, useRoute } from './router'

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

  it('replace: адрес меняется без новой записи истории, маршрут переключается событием', async () => {
    window.location.hash = '#/graph/term%3A1'
    const length = window.history.length
    const replace = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => useRoute())
    act(() => navigate('#/graph/term%3A2', { replace: true }))
    expect(replace).toHaveBeenCalledWith(null, '', '#/graph/term%3A2')
    expect(window.location.hash).toBe('#/graph/term%3A2')
    expect(window.history.length).toBe(length)
    await waitFor(() => expect(result.current).toEqual({ name: 'graph', node: 'term:2' }))
    // history недоступна (чужая рамка) — маршрут всё равно переключается
    replace.mockImplementation(() => {
      throw new DOMException('Нет доступа', 'SecurityError')
    })
    act(() => navigate('#/graph/term%3A3', { replace: true }))
    await waitFor(() => expect(result.current).toEqual({ name: 'graph', node: 'term:3' }))
    replace.mockRestore()
    window.location.hash = ''
  })
})

describe('transitionKind', () => {
  it('листание дней: дальше — вперёд, раньше — назад, тот же день — без перехода', () => {
    expect(transitionKind({ name: 'day', n: 3 }, { name: 'day', n: 4 })).toBe('forward')
    expect(transitionKind({ name: 'day', n: 4 }, { name: 'day', n: 1 })).toBe('back')
    expect(transitionKind({ name: 'day', n: 4 }, { name: 'day', n: 4 })).toBeNull()
  })
  it('смена раздела — page; смена узла внутри графа — без перехода', () => {
    expect(transitionKind({ name: 'map' }, { name: 'day', n: 1 })).toBe('page')
    expect(transitionKind({ name: 'day', n: 1 }, { name: 'graph' })).toBe('page')
    expect(transitionKind({ name: 'graph', node: 'a' }, { name: 'graph', node: 'b' })).toBeNull()
  })
})

describe('useRoute и переход браузера', () => {
  it('листание дней идёт внутри перехода с нужным видом; повтор того же адреса перехода не запускает', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
    const kinds: (string | undefined)[] = []
    const start = vi.fn((update: () => void) => {
      kinds.push(document.documentElement.dataset.transition)
      update()
      return { finished: Promise.resolve() }
    })
    ;(document as unknown as { startViewTransition?: unknown }).startViewTransition = start
    const { result } = renderHook(() => useRoute())
    act(() => navigate('#/day/2'))
    expect(result.current).toEqual({ name: 'day', n: 2 })
    act(() => navigate('#/day/5'))
    act(() => navigate('#/day/3'))
    act(() => navigate('#/day/3'))
    expect(result.current).toEqual({ name: 'day', n: 3 })
    expect(kinds).toEqual(['page', 'forward', 'back'])
    Reflect.deleteProperty(document, 'startViewTransition')
    vi.unstubAllGlobals()
    window.location.hash = ''
  })
})
