import type { QuizQuestion } from '../content/schema'

export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, number>): { score: number; total: number } {
  return { score: questions.filter((q) => answers[q.id] === q.correct).length, total: questions.length }
}
