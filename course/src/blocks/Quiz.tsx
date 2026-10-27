import { useState } from 'react'
import type { Day } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { recordQuiz } from '../progress/model'
import { scoreQuiz } from './quiz'

// Тест дня: ответ проверяется сразу, после последнего вопроса результат записывается в прогресс.
// Над вопросами — «Верно: k» по текущим ответам; вопрос — карточка, варианты — строки с кружком.
// После ответа верный вариант отмечен ✓, выбранный неверный — ✗; для чтения с экрана — подписью
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
      <div className="quiz-head">
        <p className="quiz-score">Верно: {score}</p>
        {saved && saved.total > 0 && (
          <p className="quiz-best" data-testid="quiz-best">
            Лучший результат: {saved.best} из {saved.total}
          </p>
        )}
      </div>
      <ol className="quiz-list">
        {day.quiz.map((q, n) => {
          const chosen = answers[q.id]
          const answered = chosen !== undefined
          return (
            <li key={q.id} className="quiz-question" data-testid="quiz-question">
              <p className="quiz-num">
                Вопрос {n + 1} из {total}
              </p>
              <p className="quiz-q">{q.question}</p>
              <div className="quiz-options">
                {q.options.map((opt, i) => {
                  const state = !answered ? '' : i === q.correct ? 'is-correct' : i === chosen ? 'is-wrong' : ''
                  return (
                    <button key={i} type="button" className={`quiz-option ${state}`.trim()} disabled={answered} aria-pressed={chosen === i} onClick={() => answer(q.id, i)}>
                      <span className="quiz-dot" aria-hidden="true">
                        {state === 'is-correct' ? '✓' : state === 'is-wrong' ? '✗' : ''}
                      </span>
                      <span>{opt}</span>
                      {state && <span className="visually-hidden">{state === 'is-correct' ? ', верный ответ' : ', неверный ответ'}</span>}
                    </button>
                  )
                })}
              </div>
              {answered && (
                <p className={`quiz-explain ${chosen === q.correct ? 'is-correct' : 'is-wrong'}`}>
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
          <button type="button" className="btn" onClick={() => setAnswers({})}>
            Пройти заново
          </button>
        </div>
      )}
    </div>
  )
}
