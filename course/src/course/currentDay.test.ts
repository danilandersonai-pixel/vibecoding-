import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import { DaySchema } from '../content/schema'
import fixture from '../content/fixtures/valid-day.json'
import { emptyProgress, markStep, type Progress } from '../progress/model'
import { finishDay } from '../test/progress'
import { currentDay } from './currentDay'

const days = getDays()

describe('currentDay', () => {
  it('новичок — день 1, не вернувшийся', () => {
    expect(currentDay(emptyProgress(), days)).toEqual({ n: 1, returning: false, allDone: false, doneCount: 0 })
  })

  it('день 1 пройден — текущий день 2, вернувшийся', () => {
    const p = finishDay(emptyProgress(), days[0])
    expect(currentDay(p, days)).toMatchObject({ n: 2, returning: true, allDone: false, doneCount: 1 })
  })

  it('дни не по порядку: пройден 3, не пройден 2 — текущий 2', () => {
    const p = finishDay(finishDay(emptyProgress(), days[0]), days[2])
    expect(currentDay(p, days)).toMatchObject({ n: 2, returning: true, doneCount: 2 })
  })

  it('серия без отметок — уже вернувшийся', () => {
    const p: Progress = { ...emptyProgress(), streak: { lastDate: '2026-10-22', count: 2 } }
    expect(currentDay(p, days)).toMatchObject({ n: 1, returning: true, doneCount: 0 })
  })

  it('начатый, но не пройденный день — вернувшийся, текущий тот же', () => {
    const p = markStep(emptyProgress(), days[0].id, days[0].practice[0].id, true)
    expect(currentDay(p, days)).toMatchObject({ n: 1, returning: true, doneCount: 0 })
  })

  it('все дни пройдены — allDone', () => {
    const three = [1, 2, 3].map((n) => DaySchema.parse({ ...fixture, number: n, id: `day-0${n}` }))
    const p = three.reduce(finishDay, emptyProgress())
    expect(currentDay(p, three)).toEqual({ n: 3, returning: true, allDone: true, doneCount: 3 })
  })
})
