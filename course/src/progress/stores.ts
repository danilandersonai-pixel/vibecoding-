import type { DbLike } from '../claude'
import { emptyProgress, parseProgress, type Progress } from './model'

export const LOCAL_KEY = 'vibecourse:progress'

export type ProgressStore = { kind: 'claude' | 'local' | 'memory'; load(): Promise<Progress>; save(p: Progress): Promise<void> }

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// Хранилище браузера. Любая ошибка доступа или испорченные данные — пустой прогресс, без падения.
export function localStore(storage: Storage | undefined = defaultStorage()): ProgressStore & { read(): Progress } {
  const read = (): Progress => {
    try {
      const raw = storage?.getItem(LOCAL_KEY)
      return raw ? parseProgress(JSON.parse(raw)) : emptyProgress()
    } catch {
      return emptyProgress()
    }
  }
  return {
    kind: 'local',
    read,
    load: async () => read(),
    save: async (p) => {
      try {
        storage?.setItem(LOCAL_KEY, JSON.stringify(p))
      } catch {
        // Приватный режим или переполнение — прогресс остаётся только в памяти.
      }
    },
  }
}

export function canUseLocalStorage(storage: Storage | undefined = defaultStorage()): boolean {
  try {
    if (!storage) return false
    storage.setItem(`${LOCAL_KEY}:probe`, '1')
    storage.removeItem(`${LOCAL_KEY}:probe`)
    return true
  } catch {
    return false
  }
}

export function memoryStore(initial: Progress = emptyProgress()): ProgressStore & { read(): Progress } {
  let value = initial
  return { kind: 'memory', read: () => value, load: async () => value, save: async (p) => void (value = p) }
}

// База Claude: один документ на зрителя в его личном поддереве data/users/<id>/.
export function claudeStore(db: DbLike, userId: string): ProgressStore {
  const ref = db.doc(`data/users/${userId}/progress`)
  return {
    kind: 'claude',
    load: async () => {
      const snap = await ref.get()
      return snap.exists ? parseProgress(snap.data()) : emptyProgress()
    },
    save: (p) => ref.set(p as unknown as Record<string, unknown>),
  }
}
