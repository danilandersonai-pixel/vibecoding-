import { createContext, useContext } from 'react'
import type { useProgress } from './useProgress'

export type CourseProgress = ReturnType<typeof useProgress>

export const CourseProgressContext = createContext<CourseProgress | null>(null)

export function useCourseProgress(): CourseProgress {
  const value = useContext(CourseProgressContext)
  if (!value) throw new Error('useCourseProgress вне ProgressProvider')
  return value
}
