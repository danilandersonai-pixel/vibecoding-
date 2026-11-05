import { DAY_COUNT } from '../router'

export type WeekTestName = { title: string; header: string; search: string }

// Как называется итоговый тест последнего дня недели: заголовок на странице, строка «тест» в шапке дня, подпись в поиске.
// У последнего дня курса он проверяет весь курс, у дней 7 и 14 — свою неделю. Ключ прогресса от названия не зависит: week-<неделя>.
// Нужны только номер дня и недели: e2e передаёт день прямо из JSON
export function weekTestName(day: { number: number; week: number }): WeekTestName {
  if (day.number === DAY_COUNT) return { title: 'Итоговый тест курса', header: 'итоговый тест курса', search: 'Тест курса' }
  return { title: `Итоговый тест недели ${day.week}`, header: 'итоговый тест недели', search: 'Тест недели' }
}
