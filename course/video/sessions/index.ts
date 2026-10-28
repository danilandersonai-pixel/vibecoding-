// Записи сессий пилота — работа над приложением тренера (demo-app). JSON пишет только рекордер:
// node scripts/record-session.mjs (из course/). Руками записи не правятся.
import s01Start from './s01-start.json'
import s02Sets from './s02-sets.json'
import { makeFind } from './types'
import type { Find, SessionRecord } from './types'

// По порядку цепочки: каждая следующая сессия продолжает предыдущую
export const sessions: Record<string, SessionRecord> = {
  's01-start': s01Start as SessionRecord,
  's02-sets': s02Sets as SessionRecord,
}

export const find: Find = makeFind(Object.values(sessions))
