import { z } from 'zod'
import weeksData from '../../content/weeks.json'
import { DaySchema, WeekSchema, type Day, type Week } from './schema'

const files = import.meta.glob('../../content/days/*.json', { eager: true, import: 'default' })

// Дни проверяются схемой при загрузке: ошибка в данных видна сразу, а не в середине страницы
const days: Day[] = Object.values(files)
  .map((data) => DaySchema.parse(data))
  .sort((a, b) => a.number - b.number)

export function getDays(): Day[] {
  return days
}

export function getDay(n: number): Day | undefined {
  return days.find((d) => d.number === n)
}

// Недели — ровно три, по возрастанию номера; название и итог читают карта и шапка дня
const weeks: Week[] = z
  .array(WeekSchema)
  .length(3)
  .parse(weeksData)
  .sort((a, b) => a.number - b.number)

export function getWeeks(): Week[] {
  return weeks
}
