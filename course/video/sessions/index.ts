// Записи сессий пилота — работа над приложением тренера (demo-app). JSON пишет только рекордер:
// node scripts/record-session.mjs (из course/). Руками записи не правятся.
//
// Только для тестов и скриптов. Код набора (video/term) и уроков (video/lessons) этот файл не импортирует:
// он тянет в сборку все записи, а урок подключает свои сам — import s01 from '../../sessions/s01-start.json'
// и sessions: [s01, …] as SessionRecord[] (imports.test.ts следит). Новую запись добавляйте и сюда: sessions.test.ts сверяет всю цепочку.
import s01Start from './s01-start.json'
import s02Sets from './s02-sets.json'
import s03Spec from './s03-spec.json'
import s04Rules from './s04-rules.json'
import { makeFind } from './types'
import type { Find, SessionRecord } from './types'

// По порядку цепочки: каждая следующая сессия продолжает предыдущую
export const sessions: Record<string, SessionRecord> = {
  's01-start': s01Start as SessionRecord,
  's02-sets': s02Sets as SessionRecord,
  's03-spec': s03Spec as SessionRecord,
  's04-rules': s04Rules as SessionRecord,
}

export const find: Find = makeFind(Object.values(sessions))
