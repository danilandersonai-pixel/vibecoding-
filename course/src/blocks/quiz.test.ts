import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../content/schema'
import { scoreQuiz } from './quiz'

const q = (id: string, correct: number): QuizQuestion => ({ id, question: `Вопрос ${id}`, options: ['а', 'б', 'в'], correct, explanation: 'потому что' })

describe('scoreQuiz', () => {
  it('считает верные ответы из всех вопросов', () => {
    const questions = [q('1', 0), q('2', 1), q('3', 2), q('4', 0), q('5', 1), q('6', 2)]
    const answers = { '1': 0, '2': 1, '3': 2, '4': 0, '5': 0, '6': 1 }
    expect(scoreQuiz(questions, answers)).toEqual({ score: 4, total: 6 })
  })
  it('вопрос без ответа считается неверным', () => {
    expect(scoreQuiz([q('1', 0), q('2', 1)], { '1': 0 })).toEqual({ score: 1, total: 2 })
  })
})
