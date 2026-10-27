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

// Стили jsdom не загружает: правила читаем из самого blocks.css (как tokens.test.ts — tokens.css).
// Объявления всех правил, где селектор стоит отдельным пунктом списка: свойство → значение; пробелы и комментарии не мешают
const blocksCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../styles/blocks.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
function cssDecls(selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [, selectors, body] of blocksCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((x) => x.trim() === selector)) continue
    for (const decl of body.split(';')) {
      const colon = decl.indexOf(':')
      if (colon > 0) out[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim()
    }
  }
  return out
}

beforeEach(() => localStorage.clear())

describe('части дня', () => {
  it('тест: «Вопрос 1 из 6» и счёт «Верно: 1» после верного ответа', async () => {
    const user = userEvent.setup()
    renderDay()
    const quiz = part('quiz')
    const questions = quiz.getAllByTestId('quiz-question')
    expect(questions).toHaveLength(6)
    // вопрос — строка на фоне страницы, без «бумаги»
    expect(questions[0]).toHaveClass('quiz-question')
    expect(questions[0]).not.toHaveClass('paper')
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

  it('тест: «Пройти заново» обнуляет «Верно: k», лучший результат остаётся', async () => {
    const user = userEvent.setup()
    renderDay()
    const quiz = part('quiz')
    const questions = quiz.getAllByTestId('quiz-question')
    for (const [i, q] of day.quiz.entries()) await user.click(within(questions[i]).getAllByRole('button')[q.correct])
    expect(quiz.getByText('Верно: 6')).toBeInTheDocument()
    expect(quiz.getByTestId('quiz-result')).toHaveTextContent('Результат: 6 из 6')
    expect(quiz.getByTestId('quiz-result')).toHaveClass('quiz-result')
    expect(quiz.getByTestId('quiz-result')).not.toHaveClass('paper')

    await user.click(quiz.getByRole('button', { name: 'Пройти заново' }))
    expect(quiz.getByText('Верно: 0')).toBeInTheDocument()
    expect(quiz.queryByTestId('quiz-result')).toBeNull()
    expect(quiz.getByTestId('quiz-best')).toHaveTextContent('Лучший результат: 6 из 6')
    for (const option of within(questions[0]).getAllByRole('button')) expect(option).toBeEnabled()
  })

  it('практика: «Шаг 1. …», «Запрос для Claude Code», «Готово, когда:», счёт шагов', async () => {
    const user = userEvent.setup()
    renderDay()
    const practice = part('practice')
    const withPrompt = day.practice.filter((s) => s.prompt).length
    // Счёт шагов — один, справа в заголовке части
    expect(practice.getAllByText(/^сделано \d+ из \d+/i)).toHaveLength(1)
    expect(practice.getByText('сделано 0 из 6 шагов')).toHaveClass('part-extra')
    expect(practice.getByText('сделано 0 из 6 шагов').closest('.part-head')).not.toBeNull()
    expect(practice.getAllByText('Запрос для Claude Code')).toHaveLength(withPrompt)
    expect(practice.getAllByRole('button', { name: 'Скопировать' })).toHaveLength(withPrompt)
    expect(practice.getAllByText('Готово, когда:')).toHaveLength(day.practice.length)

    const step = practice.getByRole('checkbox', { name: `Шаг 1. ${day.practice[0].title}` })
    const card = step.closest('li')!
    expect(card).toHaveClass('practice-step')
    expect(card).not.toHaveClass('paper')
    expect(card).not.toHaveClass('is-done')
    await user.click(step)
    expect(step).toBeChecked()
    expect(card).toHaveClass('is-done')
    expect(practice.getByText('сделано 1 из 6 шагов')).toBeInTheDocument()
    expect(practice.getByRole('checkbox', { name: `Шаг 6. ${day.practice[5].title}` })).not.toBeChecked()
  })

  it('наставник: вводная фраза над блоком терминала, в нём команда /mentor 1 с «Скопировать» и вывод проверок', () => {
    renderDay()
    const mentor = part('mentor')
    const lead = mentor.getByText('Когда практика сделана, откройте проект приложения в Claude Code и запустите наставника:')
    expect(lead).toHaveClass('mentor-lead')
    const term = lead.nextElementSibling as HTMLElement
    expect(term).toHaveClass('mentor-term')

    // команда — в code, «$ » перед ней ставит CSS (для чтения с экрана — пусто)
    const code = mentor.getByText('/mentor 1')
    expect(code.tagName).toBe('CODE')
    expect(code.textContent).toBe('/mentor 1')
    expect(cssDecls('.mentor-command code::before').content).toBe('"$ "/""')
    const command = code.closest('.mentor-command') as HTMLElement
    expect(term.contains(command)).toBe(true)
    const copy = within(command).getByRole('button', { name: 'Скопировать' })
    expect(copy).toHaveClass('copy-btn', 'copy-btn-term')
    expect(copy).not.toHaveClass('copy-btn-cover')

    const checks = mentor.getByRole('heading', { level: 3, name: 'Что он проверит' }).closest('.mentor-checks') as HTMLElement
    expect(term.contains(checks)).toBe(true)
    expect(checks).not.toHaveClass('paper')
    for (const c of day.mentor.checklist) expect(within(checks).getByText(c.text)).toBeInTheDocument()
    expect(within(checks).getByRole('heading', { level: 3, name: 'О чём спросит' })).toBeInTheDocument()

    // отметка «принял» — под блоком терминала, без «бумаги»
    const accept = mentor.getByRole('checkbox', { name: 'Наставник принял день' })
    expect(accept).not.toBeChecked()
    const label = accept.closest('label')!
    expect(label).toHaveClass('mentor-accept')
    expect(label).not.toHaveClass('paper')
    expect(term.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('карточки терминов: кнопки «Знаю» и «Повторить» внутри своей карточки', async () => {
    const user = userEvent.setup()
    renderDay()
    const summary = part('summary')
    expect(summary.getByRole('textbox', { name: 'Заметки дня' })).toBeInTheDocument()
    for (const term of day.cards) {
      const card = summary.getByRole('button', { name: term }).closest('li')!
      expect(card).toHaveClass('paper')
      for (const name of ['Знаю', 'Повторить']) expect(within(card).getByRole('button', { name })).toHaveClass('btn', 'card-action')
    }
    // Поровну, но не уже своего слова: у .btn свой min-width:44px, без min-content кнопки не переносились бы друг под друга
    expect(cssDecls('.card-action')).toMatchObject({ flex: '1 1 0', 'min-width': 'min-content' })

    const [term] = day.cards
    const card = within(summary.getByRole('button', { name: term }).closest('li')!)
    await user.click(card.getByRole('button', { name: term }))
    expect(card.getByRole('button', { name: term })).toHaveAttribute('aria-expanded', 'true')
    await user.click(card.getByRole('button', { name: 'Знаю' }))
    expect(card.getByRole('button', { name: 'Знаю' })).toHaveAttribute('aria-pressed', 'true')
    expect(card.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-pressed', 'false')
  })
})
