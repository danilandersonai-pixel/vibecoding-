import { describe, expect, it } from 'vitest'
import type { PromptPart } from '../../content/schema'
import { evaluateBugs, evaluatePrompt, evaluateSort } from './evaluate'

const parts: PromptPart[] = [
  { key: 'goal', label: 'Цель', good: ['Показать прогресс подопечного'], bad: ['Сделай красиво'] },
  { key: 'context', label: 'Контекст', good: ['Данные в таблице workouts'], bad: ['Ну ты знаешь'] },
  { key: 'format', label: 'Формат', good: ['Один компонент и тест'], bad: [] },
]

describe('evaluatePrompt', () => {
  it('не выбранная часть — пропущена, плохой вариант — слабый', () => {
    const r = evaluatePrompt(parts, { goal: 'Показать прогресс подопечного', context: 'Ну ты знаешь' })
    expect(r).toEqual({ missing: ['format'], weak: ['context'], ok: false })
  })
  it('все части с хорошими вариантами — запрос собран', () => {
    const r = evaluatePrompt(parts, { goal: 'Показать прогресс подопечного', context: 'Данные в таблице workouts', format: 'Один компонент и тест' })
    expect(r).toEqual({ missing: [], weak: [], ok: true })
  })
})

describe('evaluateBugs', () => {
  it('делит нажатые строки на найденные, пропущенные и лишние', () => {
    expect(evaluateBugs([2, 5], [5, 7])).toEqual({ found: [5], missed: [2], wrong: [7] })
  })
})

describe('evaluateSort', () => {
  it('верно и неверно разложенные, неразложенное — неверно', () => {
    const items = [
      { id: 'a', text: 'Обновить библиотеки', bucket: 'agent' },
      { id: 'b', text: 'Политики доступа', bucket: 'me' },
      { id: 'c', text: 'Тексты кнопок', bucket: 'agent' },
    ]
    expect(evaluateSort(items, { a: 'agent', b: 'agent' })).toEqual({ correct: ['a'], wrong: ['b', 'c'] })
  })
})
