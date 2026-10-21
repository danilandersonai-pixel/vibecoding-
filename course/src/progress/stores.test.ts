import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress, markStep } from './model'
import { claudeStore, localStore } from './stores'
import { useProgress } from './useProgress'

const KEY = 'vibecourse:progress'

function fakeDb(initial?: unknown) {
  const writes: { path: string; data: unknown }[] = []
  const db = {
    doc(path: string) {
      return {
        get: async () => ({ exists: initial !== undefined, data: () => initial as Record<string, unknown> | undefined }),
        set: async (data: Record<string, unknown>) => {
          writes.push({ path, data })
        },
      }
    },
  }
  return { db, writes }
}

const throwing = {
  getItem: () => {
    throw new Error('нет доступа')
  },
  setItem: () => {
    throw new Error('нет доступа')
  },
  removeItem: () => {
    throw new Error('нет доступа')
  },
} as unknown as Storage

describe('localStore', () => {
  it('недоступное хранилище не роняет загрузку и сохранение', async () => {
    const store = localStore(throwing)
    await expect(store.load()).resolves.toEqual(emptyProgress())
    await expect(store.save(emptyProgress())).resolves.toBeUndefined()
  })
  it('испорченные данные дают пустой прогресс', async () => {
    localStorage.setItem(KEY, '{не json')
    await expect(localStore().load()).resolves.toEqual(emptyProgress())
    localStorage.clear()
  })
})

describe('claudeStore', () => {
  it('пишет ровно в документ data/users/u1/progress', async () => {
    const { db, writes } = fakeDb()
    await claudeStore(db, 'u1').save(emptyProgress())
    expect(writes.map((w) => w.path)).toEqual(['data/users/u1/progress'])
  })
})

describe('useProgress', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    delete (window as { claude?: unknown }).claude
  })

  it('без Claude остаётся на хранилище браузера', async () => {
    const { result } = renderHook(() => useProgress())
    expect(result.current.storeKind).toBe('local')
    act(() => result.current.update((p) => markStep(p, 'day-01', 's1', true)))
    await waitFor(() => expect(localStorage.getItem(KEY)).toContain('s1'), { timeout: 2000 })
    expect(result.current.storeKind).toBe('local')
  })

  it('объединяет прогресс из браузера и из базы Claude', async () => {
    localStorage.setItem(KEY, JSON.stringify(markStep(emptyProgress(), 'day-01', 's2', true)))
    const { db } = fakeDb(markStep(emptyProgress(), 'day-01', 's1', true))
    const user = { id: async () => 'u1' }
    ;(window as { claude?: unknown }).claude = { use: async (name: string) => (name === 'db' ? db : name === 'user' ? user : null) }
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.storeKind).toBe('claude'))
    expect(result.current.progress.days['day-01'].steps).toEqual({ s1: true, s2: true })
  })
})
