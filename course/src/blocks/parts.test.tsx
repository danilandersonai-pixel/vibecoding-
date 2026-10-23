/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDay } from '../content/load'
import { DayPage } from '../pages/DayPage'
import { ProgressProvider } from '../progress/ProgressContext'

// Части дня 1 после теории: тест, практика, наставник и итог дня. Прогресс настоящий — отметки меняют счёт
const day = getDay(1)!
const part = (id: string) => within(document.getElementById(`part-${id}`)!)

function renderDay() {
  return render(
    <ProgressProvider>
      <DayPage n={1} />
    </ProgressProvider>,
  )
}

// Стили jsdom не загружает: правило кнопок карточки читаем из самого blocks.css (как tokens.test.ts — tokens.css)
const blocksCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../styles/blocks.css'), 'utf8')
const cssRule = (selector: string) => blocksCss.match(new RegExp(`(?:^|\\})\\s*${selector.replace('.', '\\.')}\\{([^}]*)\\}`, 'm'))?.[1] ?? ''

beforeEach(() => localStorage.clear())

describe('части дня', () => {
  it('тест: «Вопрос 1 из 6» и счёт «Верно: 1» после верного ответа', async () => {
    const user = userEvent.setup()
    renderDay()
    const quiz = part('quiz')
    const questions = quiz.getAllByTestId('quiz-question')
    expect(questions).toHaveLength(6)
    expect(questions[0]).toHaveClass('paper')
    expect(within(questions[0]).getByText('Вопрос 1 из 6')).toBeInTheDocument()
    expect(within(questions[5]).getByText('Вопрос 6 из 6')).toBeInTheDocument()
    expect(quiz.getByText('Верно: 0')).toBeInTheDocument()

    const [q1, q2] = day.quiz
    const first = within(questions[0]).getAllByRole('button')
    expect(first).toHaveLength(q1.options.length)
    await user.click(first[q1.correct])
    expect(quiz.getByText('Верно: 1')).toBeInTheDocument()
    expect(first[q1.correct]).toHaveClass('is-correct')
    // Состояние не только цветом: в кружке ✓, а для чтения с экрана — «верный ответ»
    expect(first[q1.correct]).toHaveTextContent('✓')
    expect(first[q1.correct]).toHaveAccessibleName(`${q1.options[q1.correct]}, верный ответ`)
    expect(within(questions[0]).getByText('Верно.')).toBeInTheDocument()

    // Неверный ответ: выбранный — красный с ✗, верный — зелёный, счёт не растёт
    const second = within(questions[1]).getAllByRole('button')
    const wrong = (q2.correct + 1) % q2.options.length
    await user.click(second[wrong])
    expect(second[wrong]).toHaveClass('is-wrong')
    expect(second[wrong]).toHaveTextContent('✗')
    expect(second[wrong]).toHaveAccessibleName(`${q2.options[wrong]}, неверный ответ`)
    expect(second[q2.correct]).toHaveClass('is-correct')
    expect(within(questions[1]).getByText('Неверно.')).toBeInTheDocument()
    expect(quiz.getByText('Верно: 1')).toBeInTheDocument()
  })

  it('практика: «Шаг 1. …», «Запрос для Claude Code», «Готово, когда:», счёт шагов', async () => {
    const user = userEvent.setup()
    renderDay()
    const practice = part('practice')
    const withPrompt = day.practice.filter((s) => s.prompt).length
    // Счёт шагов — один, справа в заголовке части
    expect(practice.getAllByText(/^Сделано \d+ из \d+/)).toHaveLength(1)
    expect(practice.getByText('Сделано 0 из 6 шагов').closest('.part-head')).not.toBeNull()
    expect(practice.getAllByText('Запрос для Claude Code')).toHaveLength(withPrompt)
    expect(practice.getAllByRole('button', { name: 'Скопировать' })).toHaveLength(withPrompt)
    expect(practice.getAllByText('Готово, когда:')).toHaveLength(day.practice.length)

    const step = practice.getByRole('checkbox', { name: `Шаг 1. ${day.practice[0].title}` })
    const card = step.closest('li')!
    expect(card).toHaveClass('paper')
    expect(card).not.toHaveClass('is-done')
    await user.click(step)
    expect(step).toBeChecked()
    expect(card).toHaveClass('is-done')
    expect(practice.getByText('Сделано 1 из 6 шагов')).toBeInTheDocument()
    expect(practice.getByRole('checkbox', { name: `Шаг 6. ${day.practice[5].title}` })).not.toBeChecked()
  })

  it('наставник: команда /mentor 1 с кнопкой «Скопировать»', () => {
    renderDay()
    const mentor = part('mentor')
    const run = mentor.getByText('/mentor 1').closest('.mentor-run') as HTMLElement
    expect(run).not.toBeNull()
    expect(within(run).getByRole('button', { name: 'Скопировать' })).toHaveClass('copy-btn-cover')
    const checks = mentor.getByRole('heading', { level: 3, name: 'Что он проверит' }).closest('.mentor-checks') as HTMLElement
    expect(checks).toHaveClass('paper')
    for (const c of day.mentor.checklist) expect(within(checks).getByText(c.text)).toBeInTheDocument()
    expect(within(checks).getByRole('heading', { level: 3, name: 'О чём спросит' })).toBeInTheDocument()
    expect(mentor.getByRole('checkbox', { name: 'Наставник принял день' })).not.toBeChecked()
  })

  it('карточки терминов: кнопки «Знаю» и «Повторить» внутри своей карточки', async () => {
    const user = userEvent.setup()
    renderDay()
    const summary = part('summary')
    expect(summary.getByRole('textbox', { name: 'Заметки дня' })).toBeInTheDocument()
    for (const term of day.cards) {
      const card = summary.getByRole('button', { name: term }).closest('li')!
      expect(card).toHaveClass('paper')
      const buttons = within(card).getAllByRole('button')
      const know = within(card).getByRole('button', { name: 'Знаю' })
      const repeat = within(card).getByRole('button', { name: 'Повторить' })
      expect(buttons).toEqual(expect.arrayContaining([know, repeat]))
      for (const b of [know, repeat]) expect(b).toHaveClass('btn', 'card-action')
    }
    expect(cssRule('.card-action')).toContain('flex:1 1 0')

    const [term] = day.cards
    const card = within(summary.getByRole('button', { name: term }).closest('li')!)
    await user.click(card.getByRole('button', { name: term }))
    expect(card.getByRole('button', { name: term })).toHaveAttribute('aria-expanded', 'true')
    await user.click(card.getByRole('button', { name: 'Знаю' }))
    expect(card.getByRole('button', { name: 'Знаю' })).toHaveAttribute('aria-pressed', 'true')
    expect(card.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-pressed', 'false')
  })
})
