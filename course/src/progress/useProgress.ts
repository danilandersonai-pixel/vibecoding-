import { useCallback, useEffect, useRef, useState } from 'react'
import { getClaude, type DbLike, type UserLike } from '../claude'
import { mergeProgress, type Progress } from './model'
import { canUseLocalStorage, claudeStore, localStore, memoryStore, type ProgressStore } from './stores'

const SAVE_DELAY_MS = 800

function initialStore() {
  return canUseLocalStorage() ? localStore() : memoryStore()
}

// Сразу показывает прогресс из браузера, затем, если курс открыт в Claude, подтягивает базу и объединяет.
export function useProgress(): { progress: Progress; update(fn: (p: Progress) => Progress): void; storeKind: ProgressStore['kind'] } {
  const [boot] = useState(initialStore)
  const [progress, setProgress] = useState<Progress>(() => boot.read())
  const [storeKind, setStoreKind] = useState<ProgressStore['kind']>(boot.kind)
  const store = useRef<ProgressStore>(boot)
  const latest = useRef(progress)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saving = useRef(false)
  const again = useRef(false)

  const flush = useCallback(async () => {
    if (saving.current) {
      again.current = true
      return
    }
    saving.current = true
    // Одна запись за раз: правки, пришедшие во время записи, уходят следующей записью.
    do {
      again.current = false
      // Браузер — зеркало и при подключённой базе: без неё человек увидит свежий прогресс, а не старый.
      if (store.current !== boot) void boot.save(latest.current)
      try {
        await store.current.save(latest.current)
      } catch (e) {
        console.warn('Не удалось сохранить прогресс', e)
      }
    } while (again.current)
    saving.current = false
  }, [boot])

  useEffect(() => {
    latest.current = progress
    if (!dirty.current) return
    dirty.current = false
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      void flush()
    }, SAVE_DELAY_MS)
  }, [progress, flush])

  // Уход со страницы: несохранённое пишется сразу, не дожидаясь задержки.
  useEffect(() => {
    const now = () => {
      if (timer.current === undefined) return
      clearTimeout(timer.current)
      timer.current = undefined
      void flush()
    }
    const onVisibility = () => document.visibilityState === 'hidden' && now()
    window.addEventListener('pagehide', now)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', now)
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(timer.current)
    }
  }, [flush])

  useEffect(() => {
    const claude = getClaude()
    if (!claude) return
    let cancelled = false
    void (async () => {
      try {
        const [db, user] = (await Promise.all([claude.use('db'), claude.use('user')])) as [DbLike | null, UserLike | null]
        const id = db && user ? await user.id() : null
        if (!db || !id || cancelled) return
        const remoteStore = claudeStore(db, id)
        const remote = await remoteStore.load()
        if (cancelled) return
        store.current = remoteStore
        setStoreKind('claude')
        dirty.current = true
        setProgress((cur) => mergeProgress(cur, remote))
      } catch (e) {
        console.warn('База Claude недоступна, прогресс остаётся в браузере', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => {
      const next = fn(p)
      if (next === p) return p
      dirty.current = true
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  return { progress, update, storeKind }
}
