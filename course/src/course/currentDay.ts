import type { Day } from '../content/schema'
import { dayStatus, type Progress } from '../progress/model'

export type CurrentDay = { n: number; returning: boolean; allDone: boolean; doneCount: number }

// Текущий день — первый по порядку, который не пройден (дни могли идти не по порядку).
// Вернувшийся — тот, у кого есть хоть одна отметка или серия дней.
export function currentDay(progress: Progress, days: Day[]): CurrentDay {
  const statuses = days.map((d) => dayStatus(progress, d))
  const first = statuses.findIndex((s) => s !== 'done')
  return {
    n: first === -1 ? days.length : days[first].number,
    returning: statuses.some((s) => s !== 'not-started') || progress.streak.count > 0,
    allDone: first === -1,
    doneCount: statuses.filter((s) => s === 'done').length,
  }
}
