// Загрузка данных графа: graph.json — отдельный кусок сборки, грузится при первом открытии экрана.
import { useSyncExternalStore } from 'react'
import { indexGraph, type GraphData, type GraphIndex } from './model'

export type GraphState = { status: 'loading' | 'ready' | 'failed'; index?: GraphIndex }

export type GraphStore = { subscribe: (listener: () => void) => () => void; getSnapshot: () => GraphState }

// Хранилище загрузки вне React: одно на приложение, экран читает его через useSyncExternalStore.
// Загрузка начинается с первой подписки и идёт один раз: не загрузилось — failed до перезагрузки страницы
// (браузер запоминает неудачную загрузку того же куска и ответил бы той же ошибкой). Загрузчик — параметр, чтобы тесты подменяли import().
export function createGraphStore(load: () => Promise<GraphData>): GraphStore {
  let state: GraphState = { status: 'loading' }
  let started = false
  const listeners = new Set<() => void>()

  function set(next: GraphState) {
    state = next
    for (const l of listeners) l()
  }

  async function start() {
    if (started) return
    started = true
    try {
      set({ status: 'ready', index: indexGraph(await load()) })
    } catch {
      set({ status: 'failed' })
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      void start()
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => state,
  }
}

// Данные графа — отдельный кусок сборки (import()), как индекс книги в окне поиска
const shared = createGraphStore(() => import('../../content/graph.json').then((m) => m.default as GraphData))

export function useGraph(): GraphState {
  return useSyncExternalStore(shared.subscribe, shared.getSnapshot)
}
