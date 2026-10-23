import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import { DaySchema } from '../content/schema'
import {
  emptyProgress,
  markStep,
  recordQuiz,
  setCard,
  setMentorAccepted,
  setNotes,
  setScenarioEnding,
  setTrainerDone,
  type Progress,
} from '../progress/model'
import { dayParts, partsDone, PART_TITLES, type Part, type PartId } from './dayParts'

const [day1] = getDays()
const day10 = getDays()[9]
const ORDER: PartId[] = ['why', 'theory', 'quiz', 'practice', 'mentor', 'summary']

// День с тестом, но без практики и наставника
const quizOnly = DaySchema.parse({
  id: 'day-11',
  number: 11,
  week: 2,
  status: 'draft',
  title: 'Тест без практики',
  goal: 'Проверить частичный день',
  quiz: [
    { id: 'q1', question: 'В1', options: ['а', 'б'], correct: 0, explanation: 'Потому что' },
    { id: 'q2', question: 'В2', options: ['а', 'б'], correct: 1, explanation: 'Потому что' },
  ],
})

const part = (parts: Part[], id: PartId): Part => parts.find((p) => p.id === id)!

describe('dayParts', () => {
  it('у дня 1 доступны все шесть частей', () => {
    const parts = dayParts(day1, emptyProgress())
    expect(parts.map((p) => p.id)).toEqual(ORDER)
    expect(parts.map((p) => p.title)).toEqual(ORDER.map((id) => PART_TITLES[id]))
    expect(parts.every((p) => p.available)).toBe(true)
  })

  it('названия частей', () => {
    expect(PART_TITLES).toEqual({
      why: 'Зачем сегодня',
      theory: 'Теория',
      quiz: 'Проверка понимания',
      practice: 'Практика',
      mentor: 'Наставник',
      summary: 'Итог дня',
    })
  })

  it('у чернового дня 10 тест, практика и наставник недоступны', () => {
    const parts = dayParts(day10, emptyProgress())
    expect(parts.map((p) => p.id)).toEqual(ORDER)
    expect(part(parts, 'theory').available).toBe(true)
    expect(part(parts, 'summary').available).toBe(true)
    expect(part(parts, 'why').available).toBe(true)
    for (const id of ['quiz', 'practice', 'mentor'] as const) expect(part(parts, id).available).toBe(false)
  })

  it('день с тестом, но без практики', () => {
    const parts = dayParts(quizOnly, emptyProgress())
    expect(part(parts, 'quiz').available).toBe(true)
    expect(part(parts, 'practice').available).toBe(false)
    expect(part(parts, 'mentor').available).toBe(false)
    expect(part(parts, 'theory').available).toBe(false)
  })

  it('отслеживаются: why — никогда, теория — только с тренажёром или ситуацией, остальные — когда доступны', () => {
    const track = (parts: Part[]) => parts.filter((p) => p.trackable).map((p) => p.id)
    expect(track(dayParts(day1, emptyProgress()))).toEqual(['theory', 'quiz', 'practice', 'mentor', 'summary'])
    expect(track(dayParts(day10, emptyProgress()))).toEqual(['summary'])
    expect(track(dayParts(quizOnly, emptyProgress()))).toEqual(['quiz', 'summary'])
  })

  it('отметки: тест сдан на 5 из 6, практика сделана, наставник принял', () => {
    let p: Progress = recordQuiz(emptyProgress(), day1.id, {}, 5, 6)
    p = day1.practice.reduce((acc, s) => markStep(acc, day1.id, s.id, true), p)
    p = setMentorAccepted(p, day1.id, true)
    const parts = dayParts(day1, p)
    for (const id of ['quiz', 'practice', 'mentor'] as const) expect(part(parts, id).done).toBe(true)
  })

  it('на 4 из 6 тест не сдан; практика без последнего шага не сделана', () => {
    let p: Progress = recordQuiz(emptyProgress(), day1.id, {}, 4, 6)
    p = day1.practice.slice(0, -1).reduce((acc, s) => markStep(acc, day1.id, s.id, true), p)
    const parts = dayParts(day1, p)
    expect(part(parts, 'quiz').done).toBe(false)
    expect(part(parts, 'practice').done).toBe(false)
    expect(part(parts, 'mentor').done).toBe(false)
  })

  it('пустой прогресс — ничего не сделано, даже у дня без практики', () => {
    for (const day of [day1, day10, quizOnly]) {
      expect(dayParts(day, emptyProgress()).some((p) => p.done)).toBe(false)
    }
  })

  it('теория дня 1 пройдена, когда пройдены тренажёр и ситуация', () => {
    const trainer = day1.blocks.find((b) => b.type === 'trainer')!
    const scenario = day1.blocks.find((b) => b.type === 'scenario')!
    const theoryDone = (p: Progress) => part(dayParts(day1, p), 'theory').done

    const onlyTrainer = setTrainerDone(emptyProgress(), day1.id, trainer.id, true)
    expect(theoryDone(onlyTrainer)).toBe(false)

    const onlyScenario = setScenarioEnding(emptyProgress(), day1.id, scenario.id, 'good')
    expect(theoryDone(onlyScenario)).toBe(false)

    const both = setScenarioEnding(onlyTrainer, day1.id, scenario.id, 'good')
    expect(theoryDone(both)).toBe(true)

    const trainerUndone = setTrainerDone(both, day1.id, trainer.id, false)
    expect(theoryDone(trainerUndone)).toBe(false)
  })

  it('итог дня — по заметкам', () => {
    const summaryDone = (p: Progress) => part(dayParts(day1, p), 'summary').done
    expect(summaryDone(emptyProgress())).toBe(false)
    expect(summaryDone(setNotes(emptyProgress(), day1.id, '   '))).toBe(false)
    expect(summaryDone(setNotes(emptyProgress(), day1.id, 'Главное — спрашивать модель по частям'))).toBe(true)
  })

  it('итог дня — по терминам: нужны все', () => {
    const summaryDone = (p: Progress) => part(dayParts(day1, p), 'summary').done
    const marked = (terms: string[]) => terms.reduce((acc, t) => setCard(acc, t, 'know'), emptyProgress())
    expect(summaryDone(marked(day1.cards.slice(0, -1)))).toBe(false)
    expect(summaryDone(marked(day1.cards))).toBe(true)
  })

  it('у дня без терминов итог не считается сделанным без заметок', () => {
    expect(part(dayParts(day10, emptyProgress()), 'summary').done).toBe(false)
  })

  it('не меняет прогресс другого дня', () => {
    const p = recordQuiz(emptyProgress(), 'day-02', {}, 6, 6)
    expect(part(dayParts(day1, p), 'quiz').done).toBe(false)
  })
})

describe('partsDone', () => {
  it('считает только отслеживаемые части', () => {
    expect(partsDone(dayParts(day1, emptyProgress()))).toEqual({ done: 0, total: 5 })
  })

  it('растёт вместе с отметками', () => {
    const p = setMentorAccepted(recordQuiz(emptyProgress(), day1.id, {}, 6, 6), day1.id, true)
    expect(partsDone(dayParts(day1, p))).toEqual({ done: 2, total: 5 })
  })

  it('у чернового дня без тестов и практики отслеживается один итог', () => {
    expect(partsDone(dayParts(day10, emptyProgress()))).toEqual({ done: 0, total: 1 })
  })
})
