import type { Day } from '../content/schema'
import type { DayProgress, Progress } from '../progress/model'

// Части страницы дня и их отметки — для «Плана дня». Чистые функции, как и модель прогресса.

export type PartId = 'why' | 'theory' | 'quiz' | 'practice' | 'mentor' | 'summary'
export type Part = { id: PartId; title: string; available: boolean; trackable: boolean; done: boolean }

export const PART_TITLES: Record<PartId, string> = {
  why: 'Зачем сегодня',
  theory: 'Теория',
  quiz: 'Проверка понимания',
  practice: 'Практика',
  mentor: 'Наставник',
  summary: 'Итог дня',
}

const PASS_SHARE = 0.8
const NO_PROGRESS: DayProgress = { steps: {}, quiz: { best: 0, total: 0, answers: {} }, trainers: {}, scenarios: {}, notes: '', mentorAccepted: false }

export function dayParts(day: Day, progress: Progress): Part[] {
  const d = progress.days[day.id] ?? NO_PROGRESS
  const trainers = day.blocks.filter((b) => b.type === 'trainer')
  const scenarios = day.blocks.filter((b) => b.type === 'scenario')
  const theoryTracked = trainers.length + scenarios.length > 0

  const hasQuiz = day.quiz.length > 0
  const hasPractice = day.practice.length > 0
  const hasMentor = day.mentor.checklist.length > 0
  const cardsMarked = day.cards.length > 0 && day.cards.every((term) => progress.cards[term])

  const part = (id: PartId, available: boolean, trackable: boolean, done: boolean): Part => ({
    id,
    title: PART_TITLES[id],
    available,
    trackable,
    done: trackable && done,
  })

  return [
    part('why', true, false, false),
    part('theory', day.blocks.length > 0, theoryTracked, trainers.every((t) => d.trainers[t.id]) && scenarios.every((s) => d.scenarios[s.id])),
    part('quiz', hasQuiz, hasQuiz, d.quiz.total > 0 && d.quiz.best / d.quiz.total >= PASS_SHARE),
    part('practice', hasPractice, hasPractice, day.practice.every((s) => d.steps[s.id])),
    part('mentor', hasMentor, hasMentor, d.mentorAccepted),
    part('summary', true, true, d.notes.trim() !== '' || cardsMarked),
  ]
}

// Сколько отслеживаемых частей сделано — для полосы «Сделано X из Y частей»
export function partsDone(parts: Part[]): { done: number; total: number } {
  const tracked = parts.filter((p) => p.trackable)
  return { done: tracked.filter((p) => p.done).length, total: tracked.length }
}
