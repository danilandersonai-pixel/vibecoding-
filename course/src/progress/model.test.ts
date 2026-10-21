import { describe, expect, it } from 'vitest'
import { DaySchema } from '../content/schema'
import fixture from '../content/fixtures/valid-day.json'
import { dayStatus, emptyProgress, markStep, mergeProgress, parseProgress, recordQuiz, setMentorAccepted, touchStreak } from './model'

const day = DaySchema.parse(fixture)

describe('серия дней', () => {
  it('в тот же день не меняется', () => {
    const p = touchStreak(emptyProgress(), '2026-10-21')
    expect(touchStreak(p, '2026-10-21').streak).toEqual({ lastDate: '2026-10-21', count: 1 })
  })
  it('на следующий день растёт', () => {
    const p = touchStreak(emptyProgress(), '2026-10-31')
    expect(touchStreak(p, '2026-11-01').streak).toEqual({ lastDate: '2026-11-01', count: 2 })
  })
  it('после пропуска начинается заново', () => {
    const p = touchStreak(touchStreak(emptyProgress(), '2026-10-20'), '2026-10-21')
    expect(touchStreak(p, '2026-10-23').streak).toEqual({ lastDate: '2026-10-23', count: 1 })
  })
})

describe('тест дня', () => {
  it('лучший результат не уменьшается', () => {
    const p = recordQuiz(emptyProgress(), 'day-09', { q1: 0 }, 4, 5)
    const q = recordQuiz(p, 'day-09', { q1: 1 }, 2, 5).days['day-09'].quiz
    expect(q.best).toBe(4)
    expect(q.answers).toEqual({ q1: 1 })
  })
})

describe('состояние дня', () => {
  const allSteps = (p = emptyProgress()) => day.practice.reduce((acc, s) => markStep(acc, day.id, s.id, true), p)

  it('ничего не сделано — не начат', () => {
    expect(dayStatus(emptyProgress(), day)).toBe('not-started')
  })
  it('часть сделана — в процессе', () => {
    expect(dayStatus(markStep(emptyProgress(), day.id, day.practice[0].id, true), day)).toBe('in-progress')
  })
  it('шаги, тест на 80 % и принятие наставником — пройден', () => {
    const p = setMentorAccepted(recordQuiz(allSteps(), day.id, {}, 4, 5), day.id, true)
    expect(dayStatus(p, day)).toBe('done')
  })
  it('тест ниже 80 % — ещё в процессе', () => {
    const p = setMentorAccepted(recordQuiz(allSteps(), day.id, {}, 3, 5), day.id, true)
    expect(dayStatus(p, day)).toBe('in-progress')
  })
})

describe('объединение прогресса', () => {
  it('сохраняет отмеченные шаги обеих сторон и лучший результат', () => {
    const a = recordQuiz(markStep(emptyProgress(), 'day-01', 's1', true), 'day-01', {}, 5, 5)
    const b = recordQuiz(markStep(emptyProgress(), 'day-01', 's2', true), 'day-01', {}, 3, 5)
    const m = mergeProgress(a, b)
    expect(m.days['day-01'].steps).toEqual({ s1: true, s2: true })
    expect(m.days['day-01'].quiz.best).toBe(5)
    expect(mergeProgress(b, a).days['day-01'].quiz.best).toBe(5)
  })
  it('заметки берёт из более нового прогресса', () => {
    const old = { ...emptyProgress(), updatedAt: '2026-10-01T00:00:00.000Z' }
    const fresh = { ...emptyProgress(), updatedAt: '2026-10-02T00:00:00.000Z' }
    const a = { ...old, days: { 'day-01': { ...markStep(old, 'day-01', 's1', true).days['day-01'], notes: 'старое' } } }
    const b = { ...fresh, days: { 'day-01': { ...markStep(fresh, 'day-01', 's1', true).days['day-01'], notes: 'новое' } } }
    expect(mergeProgress(a, b).days['day-01'].notes).toBe('новое')
    expect(mergeProgress(b, a).days['day-01'].notes).toBe('новое')
  })
})

describe('разбор сохранённого прогресса', () => {
  it('чужая версия и мусор дают пустой прогресс', () => {
    expect(parseProgress({ version: 99 })).toEqual(emptyProgress())
    expect(parseProgress('мусор')).toEqual(emptyProgress())
  })
  it('свой формат читается обратно', () => {
    const p = markStep(emptyProgress(), 'day-01', 's1', true)
    expect(parseProgress(JSON.parse(JSON.stringify(p)))).toEqual(p)
  })
})
