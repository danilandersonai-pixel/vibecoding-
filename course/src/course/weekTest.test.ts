import { describe, expect, it } from 'vitest'
import { weekTestName } from './weekTest'

describe('weekTestName: как называется итоговый тест последнего дня недели', () => {
  it('у дней 7 и 14 — тест своей недели: заголовок с номером, в шапке и поиске — «недели»', () => {
    expect(weekTestName({ number: 7, week: 1 })).toEqual({ title: 'Итоговый тест недели 1', header: 'итоговый тест недели', search: 'Тест недели' })
    expect(weekTestName({ number: 14, week: 2 })).toEqual({ title: 'Итоговый тест недели 2', header: 'итоговый тест недели', search: 'Тест недели' })
  })

  it('у дня 21 — тест всего курса, а не недели 3', () => {
    expect(weekTestName({ number: 21, week: 3 })).toEqual({ title: 'Итоговый тест курса', header: 'итоговый тест курса', search: 'Тест курса' })
  })
})
