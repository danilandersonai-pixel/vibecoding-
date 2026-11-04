/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDay } from '../content/load'
import { DayPage } from '../pages/DayPage'
import { useCourseProgress } from '../progress/courseProgress'
import { ProgressProvider } from '../progress/ProgressContext'

// Итоговый тест недели есть только у последнего дня недели, а день 7 пока черновик. Поэтому день 7 здесь подставной:
// тест, практика и наставник — дня 1, номер и неделя — дня 7, плюс 10 вопросов теста недели. Остальные дни — настоящие
vi.mock('../content/load', async (importOriginal) => {
  const load = await importOriginal<typeof import('../content/load')>()
  const { DaySchema } = await import('../content/schema')
  const weekTest = Array.from({ length: 10 }, (_, i) => ({ id: `week-q${i + 1}`, question: `Вопрос недели ${i + 1}`, options: ['а', 'б', 'в'], correct: i % 3, explanation: 'Глава 1' }))
  const day7 = DaySchema.parse({ ...load.getDay(1), id: 'day-07', number: 7, week: 1, weekTest })
  return { ...load, getDay: (n: number) => (n === 7 ? day7 : load.getDay(n)), getDays: () => load.getDays().map((d) => (d.number === 7 ? day7 : d)) }
})

// Части дня 1 после теории: тест, практика, наставник и итог дня. Прогресс настоящий — отметки меняют счёт
const day = getDay(1)!
const part = (id: string) => within(document.getElementById(`part-${id}`)!)

function renderDay(n = 1) {
  return render(
    <ProgressProvider>
      <DayPage n={n} />
      <ProgressProbe />
    </ProgressProvider>,
  )
}

// Прогресс по дням как есть — чтобы видеть, под каким ключом записан тест
function ProgressProbe() {
  const { progress } = useCourseProgress()
  return <output data-testid="progress">{JSON.stringify(progress.days)}</output>
}
const savedDays = () => JSON.parse(screen.getByTestId('progress').textContent!)

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

describe('итоговый тест недели', () => {
  const day7 = getDay(7)!
  const WEEK = 'Итоговый тест недели 1'
  // Тест недели — область с заголовком; вопросы теста дня — все остальные в части
  const quizzes = () => {
    const quiz = part('quiz')
    const week = quiz.getByRole('region', { name: WEEK })
    const own = quiz.getAllByTestId('quiz-question').filter((q) => !week.contains(q))
    return { quiz, week, own, weekQuestions: within(week).getAllByTestId('quiz-question') }
  }

  it('в «Проверке понимания» после теста дня — заголовок «Итоговый тест недели 1» и второй тест по weekTest', () => {
    renderDay(7)
    const { week, own, weekQuestions } = quizzes()
    const heading = within(week).getByRole('heading', { level: 3, name: WEEK })
    expect(own).toHaveLength(day7.quiz.length)
    expect(within(own[0]).getByText(`Вопрос 1 из ${day7.quiz.length}`)).toBeInTheDocument()
    expect(own[own.length - 1].compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(weekQuestions).toHaveLength(10)
    expect(within(weekQuestions[0]).getByText('Вопрос 1 из 10')).toBeInTheDocument()
    expect(within(weekQuestions[9]).getByText('Вопрос 10 из 10')).toBeInTheDocument()
    weekQuestions.forEach((q, i) => expect(within(q).getByText(day7.weekTest[i].question)).toBeInTheDocument())
    expect(within(week).getByText('Верно: 0')).toBeInTheDocument()
  })

  it('ответы теста недели пишутся в progress.days["week-1"] и не меняют тест дня 7', async () => {
    const user = userEvent.setup()
    renderDay(7)
    const { quiz, week, own, weekQuestions } = quizzes()
    for (const [i, q] of day7.quiz.entries()) await user.click(within(own[i]).getAllByRole('button')[q.correct])
    const dayQuiz = savedDays()['day-07'].quiz
    expect(dayQuiz).toMatchObject({ best: day7.quiz.length, total: day7.quiz.length })

    // в тесте недели верны 7 ответов из 10
    const answers: Record<string, number> = {}
    for (const [i, q] of day7.weekTest.entries()) {
      answers[q.id] = i < 7 ? q.correct : (q.correct + 1) % q.options.length
      await user.click(within(weekQuestions[i]).getAllByRole('button')[answers[q.id]])
    }
    const days = savedDays()
    expect(days['week-1'].quiz).toEqual({ best: 7, total: 10, answers })
    expect(days['day-07'].quiz).toEqual(dayQuiz)
    expect(within(week).getByTestId('quiz-result')).toHaveTextContent('Результат: 7 из 10 — для зачёта нужно 80 %.')
    expect(within(week).getByTestId('quiz-best')).toHaveTextContent('Лучший результат: 7 из 10')
    const ownBest = quiz.getAllByTestId('quiz-best').filter((el) => !week.contains(el))
    expect(ownBest).toHaveLength(1)
    expect(ownBest[0]).toHaveTextContent(`Лучший результат: ${day7.quiz.length} из ${day7.quiz.length}`)
  })

  it('день без теста недели — как прежде: один тест, без заголовка и второго теста', () => {
    renderDay(1)
    const quiz = part('quiz')
    expect(day.weekTest).toEqual([])
    expect(quiz.queryByRole('region')).toBeNull()
    expect(quiz.queryByRole('heading', { level: 3 })).toBeNull()
    expect(document.querySelectorAll('#part-quiz .quiz')).toHaveLength(1)
    expect(quiz.getAllByTestId('quiz-question')).toHaveLength(day.quiz.length)
  })
})
