import { useCallback, useMemo, type ReactNode } from 'react'
import { CourseProgressContext } from './courseProgress'
import { touchStreak, type Progress } from './model'
import { useProgress } from './useProgress'

function today(): string {
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Любое действие в курсе продлевает серию дней подряд.
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { progress, update, storeKind } = useProgress()
  const act = useCallback(
    (fn: (p: Progress) => Progress) =>
      update((p) => {
        const next = fn(p)
        return next === p ? p : touchStreak(next, today())
      }),
    [update],
  )
  const value = useMemo(() => ({ progress, update: act, storeKind }), [progress, act, storeKind])
  return <CourseProgressContext.Provider value={value}>{children}</CourseProgressContext.Provider>
}
