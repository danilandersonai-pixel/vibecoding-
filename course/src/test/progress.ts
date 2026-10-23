import type { Day } from '../content/schema'
import { markStep, recordQuiz, setMentorAccepted, type Progress } from '../progress/model'

// Помощник тестов: отмечает день пройденным — все шаги практики, тест без ошибок, наставник принял.
// Подходит для reduce: getDays().reduce(finishDay, emptyProgress())
export function finishDay(p: Progress, day: Day): Progress {
  const withSteps = day.practice.reduce((acc, s) => markStep(acc, day.id, s.id, true), p)
  const withQuiz = recordQuiz(withSteps, day.id, {}, day.quiz.length, day.quiz.length)
  return setMentorAccepted(withQuiz, day.id, true)
}
