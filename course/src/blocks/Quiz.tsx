import { useState } from 'react'
import type { Day } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { recordQuiz } from '../progress/model'
import { scoreQuiz } from './quiz'

// Тест дня: ответ проверяется сразу, после последнего вопроса результат записывается в прогресс.
export function Quiz({ day }: { day: Day }) {
  const { progress, update } = useCourseProgress()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const saved = progress.days[day.id]?.quiz
  const finished = day.quiz.every((q) => q.id in answers)
  const { score, total } = scoreQuiz(day.quiz, answers)

  function answer(questionId: string, option: number) {
    if (questionId in answers) return
    const next = { ...answers, [questionId]: option }
    setAnswers(next)
    if (day.quiz.every((q) => q.id in next)) {
      const result = scoreQuiz(day.quiz, next)
      update((p) => recordQuiz(p, day.id, next, result.score, result.total))
    }
  }

  return (
    <div className="quiz">
      {saved && saved.total > 0 && (
        <p className="quiz-best" data-testid="quiz-best">
          Лучший результат: {saved.best} из {saved.total}
        </p>
      )}
      <ol className="quiz-list">
        {day.quiz.map((q) => {
          const chosen = answers[q.id]
          const answered = chosen !== undefined
          return (
            <li key={q.id} className="quiz-question" data-testid="quiz-question">
              <p className="quiz-q">{q.question}</p>
              <div className="quiz-options">
                {q.options.map((opt, i) => {
                  const state = !answered ? '' : i === q.correct ? ' is-correct' : i === chosen ? ' is-wrong' : ''
                  return (
                    <button key={i} type="button" className={`quiz-option${state}`} disabled={answered} aria-pressed={chosen === i} onClick={() => answer(q.id, i)}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {answered && (
                <p className={`quiz-explain${chosen === q.correct ? ' is-correct' : ' is-wrong'}`}>
                  <strong>{chosen === q.correct ? 'Верно.' : 'Неверно.'}</strong> {q.explanation}
                </p>
              )}
            </li>
          )
        })}
      </ol>
      {finished && (
        <div className="quiz-result" data-testid="quiz-result">
          <p>
            Результат: {score} из {total}
            {score / total >= 0.8 ? ' — тест сдан.' : ' — для зачёта нужно 80 %.'}
          </p>
          <button
            type="button"
            onClick={() => setAnswers({})}
          >
            Пройти заново
          </button>
        </div>
      )}
    </div>
  )
}
