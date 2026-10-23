import { describe, expect, it } from 'vitest'
import { getDays, getWeeks } from './load'
import { WeekSchema } from './schema'

describe('недели курса', () => {
  it('три недели по порядку с названием и итогом', () => {
    expect(getWeeks().map((w) => w.number)).toEqual([1, 2, 3])
    expect(getWeeks()[0].result).toBe('Приложение на телефоне у первого тренера.')
  })

  it('схема отвергает неделю без итога', () => {
    expect(WeekSchema.safeParse({ number: 1, title: 'x', result: '' }).success).toBe(false)
  })

  it('у каждого дня есть его неделя', () => {
    const numbers = new Set(getWeeks().map((w) => w.number))
    const orphans = getDays().filter((d) => !numbers.has(d.week)).map((d) => d.id)
    expect(orphans).toEqual([])
  })
})
