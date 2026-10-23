import { describe, expect, it } from 'vitest'
import glossary from '../../content/glossary.json'
import { getDays } from './load'

describe('содержание курса', () => {
  it('все 21 день на месте и проходят схему', () => {
    expect(getDays().map((d) => d.number)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1))
  })

  it('каждая карточка — точный термин из словаря книги', () => {
    const terms = new Set(glossary.map((g) => g.term))
    const missing = getDays().flatMap((d) => d.cards.filter((c) => !terms.has(c)).map((c) => `${d.id}: ${c}`))
    expect(missing).toEqual([])
  })
})
