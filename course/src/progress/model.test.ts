import { describe, expect, it } from 'vitest'
import { DaySchema } from '../content/schema'
import fixture from '../content/fixtures/valid-day.json'
import { dayStatus, emptyProgress, markStep, mergeProgress, parseProgress, recordQuiz, setMentorAccepted, stampCompleted, touchStreak } from './model'

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

describe('время зачёта дня', () => {
  const done = () => setMentorAccepted(recordQuiz(day.practice.reduce((acc, s) => markStep(acc, day.id, s.id, true), emptyProgress()), day.id, {}, 5, 5), day.id, true)
  const T1 = '2026-10-20T19:00:00.000Z'
  const T2 = '2026-10-21T08:00:00.000Z'

  it('пройденный день получает время зачёта', () => {
    expect(stampCompleted(done(), [day], T1).days[day.id].completedAt).toBe(T1)
  })
  it('уже стоящее время не меняется', () => {
    const p = stampCompleted(done(), [day], T1)
    expect(stampCompleted(p, [day], T2).days[day.id].completedAt).toBe(T1)
  })
  it('день в процессе времени не получает', () => {
    const p = markStep(emptyProgress(), day.id, day.practice[0].id, true)
    expect(stampCompleted(p, [day], T1).days[day.id].completedAt).toBeUndefined()
  })
  it('снятая отметка убирает время, повторный зачёт ставит новое', () => {
    const undone = stampCompleted(setMentorAccepted(stampCompleted(done(), [day], T1), day.id, false), [day], T2)
    expect(undone.days[day.id].completedAt).toBeUndefined()
    expect(stampCompleted(setMentorAccepted(undone, day.id, true), [day], T2).days[day.id].completedAt).toBe(T2)
  })
  it('без изменений возвращает тот же объект', () => {
    const p = markStep(emptyProgress(), day.id, day.practice[0].id, true)
    expect(stampCompleted(p, [day], T1)).toBe(p)
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
  it('итоговый тест недели под ключом week-1 читается вместе с днями, без потерь', () => {
    const p = recordQuiz(recordQuiz(markStep(emptyProgress(), 'day-01', 's1', true), 'day-01', { q1: 0 }, 5, 6), 'week-1', { w1: 2, w2: 0 }, 9, 10)
    const back = parseProgress(JSON.parse(JSON.stringify(p)))
    expect(back).toEqual(p)
    expect(Object.keys(back.days).sort()).toEqual(['day-01', 'week-1'])
    expect(back.days['week-1'].quiz).toEqual({ best: 9, total: 10, answers: { w1: 2, w2: 0 } })
  })
})

describe('итоговый тест недели', () => {
  // Последний день недели 1 с тестом недели: зачёт дня — шаги, свой тест и наставник, тест недели не нужен
  const day7 = DaySchema.parse({
    ...fixture,
    id: 'day-07',
    number: 7,
    week: 1,
    weekTest: [{ id: 'w1', question: 'Вопрос недели', options: ['а', 'б'], correct: 0, explanation: 'Глава 1' }],
  })
  const finished = () => setMentorAccepted(recordQuiz(day7.practice.reduce((acc, s) => markStep(acc, day7.id, s.id, true), emptyProgress()), day7.id, {}, 5, 5), day7.id, true)

  it('день 7 пройден без теста недели', () => {
    expect(dayStatus(finished(), day7)).toBe('done')
  })
  it('результат теста недели не трогает тест дня 7', () => {
    const p = recordQuiz(finished(), 'week-1', { w1: 1 }, 0, 1)
    expect(p.days['day-07']).toEqual(finished().days['day-07'])
    expect(dayStatus(p, day7)).toBe('done')
  })
})
