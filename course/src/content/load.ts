import { DaySchema, type Day } from './schema'

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
