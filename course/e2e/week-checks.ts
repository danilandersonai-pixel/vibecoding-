import { expect, type Locator, type Page } from '@playwright/test'
import bookIndex from '../content/book-index.json' with { type: 'json' }
import { PART_TITLES, type PartId } from '../src/course/dayParts'

// Общие проверки e2e недели (week-1.spec.ts, week-2.spec.ts): полный день — теория, тест, практика, наставник, карточки,
// у последнего дня недели — итоговый тест недели. Содержание — из файлов дней: проверка сверяет страницу с content/days

type BookRef = { section: string; label: string }
type Block = { type: string; id?: string; kind?: string; bookRef?: BookRef }
type Question = { correct: number }
export type DayJson = {
  id: string
  number: number
  week: number
  title: string
  blocks: Block[]
  quiz: Question[]
  weekTest?: Question[]
  practice: { title: string }[]
  mentor: { command: string }
  cards: string[]
}

const PARTS: PartId[] = ['why', 'theory', 'quiz', 'practice', 'mentor', 'summary']

// Разделы книги и их заголовки — из индекса книги (content/book-index.json собран из той же книги, что открывается в рамке)
const SECTION_TITLES = new Map(bookIndex.filter((e) => e.a && e.s).map((e) => [e.a, e.s]))

const BOOK_FRAME = 'iframe[title^="Книга"]'
const STORAGE_KEY = 'vibecourse:progress'

// Сохранённый результат теста по ключу прогресса: день (day-07) или неделя (week-1); нет записи — null
function savedQuiz(page: Page, key: string) {
  return page.evaluate(
    ([storageKey, k]) => {
      const raw = localStorage.getItem(storageKey)
      const quiz = raw ? JSON.parse(raw).days?.[k]?.quiz : undefined
      return quiz ? { best: quiz.best as number, total: quiz.total as number } : null
    },
    [STORAGE_KEY, key] as const,
  )
}

// Ответить на все вопросы теста верными вариантами — номера верных из файла дня
async function answerAll(quiz: Locator, questions: Question[]) {
  const items = quiz.getByTestId('quiz-question')
  await expect(items).toHaveCount(questions.length)
  for (const [i, q] of questions.entries()) await items.nth(i).getByRole('button').nth(q.correct).click()
}

const ideas = (day: DayJson) => day.blocks.filter((b) => b.type === 'idea')

// «дни 2–7» — по первому и последнему дню списка
export const daysLabel = (days: DayJson[]) => `дни ${days[0].number}–${days[days.length - 1].number}`

// День целиком: шесть частей наполнены тем, что в файле дня; у каждой мысли ссылка «В книге» на раздел, который есть в книге.
// ideaCount — сколько мыслей в теории: в неделе 1 полная теория (от трёх), в неделях 2–3 короткая (2–3)
export async function expectFullDay(page: Page, day: DayJson, { ideaCount: [min, max] }: { ideaCount: [number, number] }) {
  await page.goto(`/#/day/${day.number}`)
  await expect(page.getByRole('heading', { level: 1, name: day.title })).toBeVisible()

  // план дня: шесть частей, все нажимаются, ни одной «скоро»; черновой строки «Остальное готовится» нет
  const toc = page.getByRole('navigation', { name: 'План дня' })
  await expect(toc.getByRole('button')).toHaveCount(PARTS.length)
  for (const id of PARTS) {
    await expect(toc.getByRole('button', { name: PART_TITLES[id] })).toBeEnabled()
    await expect(page.getByRole('region', { name: PART_TITLES[id], exact: true })).toBeVisible()
  }
  await expect(toc.getByText('скоро')).toHaveCount(0)
  await expect(page.getByText('Остальное готовится')).toHaveCount(0)

  // части наполнены тем, что в файле дня
  const part = (id: PartId) => page.locator(`#part-${id}`)
  await expect(part('theory').locator('.block.idea')).toHaveCount(ideas(day).length)
  await expect(part('quiz').getByTestId('quiz-question')).toHaveCount(day.quiz.length + (day.weekTest?.length ?? 0))
  await expect(part('practice').getByRole('checkbox')).toHaveCount(day.practice.length)
  await expect(part('mentor').getByText(day.mentor.command, { exact: true })).toBeVisible()
  await expect(part('summary').locator('.card-term')).toHaveCount(day.cards.length)

  // каждая мысль — со ссылкой «В книге: …» на свой раздел книги (раздел есть в книге)
  expect(ideas(day).length).toBeGreaterThanOrEqual(min)
  expect(ideas(day).length).toBeLessThanOrEqual(max)
  for (const idea of ideas(day)) {
    const ref = idea.bookRef
    expect(ref, `у мысли ${idea.id} нет bookRef`).toBeDefined()
    expect(SECTION_TITLES.has(ref!.section), `раздела ${ref!.section} нет в книге`).toBe(true)
    const link = page.locator(`#block-${idea.id}`).getByRole('link', { name: /^В книге:/ })
    await expect(link).toHaveCount(1)
    await expect(link).toHaveText(`В книге: ${ref!.label}`)
    await expect(link).toHaveAttribute('href', `#/book/${ref!.section}`)
  }
}

// Ссылка первой мысли дня — по-настоящему: экран книги внутри курса, рамка видна, на открытой странице читалки — заголовок раздела
export async function expectBookLinkOpens(page: Page, day: DayJson) {
  const [first] = ideas(day)
  const { section } = first.bookRef!
  await page.goto(`/#/day/${day.number}`)
  const link = page.locator(`#block-${first.id}`).getByRole('link', { name: /^В книге:/ })
  expect(await link.getAttribute('target')).toBeNull()
  await link.click()
  await expect(page).toHaveURL(new RegExp(`#/book/${section}$`))
  await expect(page.locator(BOOK_FRAME)).toBeVisible()
  const book = page.frameLocator(BOOK_FRAME)
  await expect(book.locator('#slotL, #slotR').getByRole('heading', { name: SECTION_TITLES.get(section)! })).toBeVisible()
  await page.getByRole('link', { name: 'К курсу' }).click()
  await expect(page).toHaveURL(new RegExp(`#/day/${day.number}$`))
  await expect(page.getByRole('heading', { level: 1, name: day.title })).toBeVisible()
}

// Тест дня проходится, результат лежит под ключом дня и виден после перезагрузки
export async function expectQuizPersists(page: Page, day: DayJson) {
  const n = day.quiz.length
  await page.goto(`/#/day/${day.number}`)
  const quiz = page.locator('#part-quiz')
  const toc = page.getByRole('navigation', { name: 'План дня' })
  await expect(toc.getByRole('button', { name: PART_TITLES.quiz, exact: true })).toBeVisible()

  await answerAll(quiz, day.quiz)
  await expect(quiz.getByTestId('quiz-result')).toContainText(`Результат: ${n} из ${n} — тест сдан.`)
  await expect.poll(() => savedQuiz(page, day.id)).toEqual({ best: n, total: n })

  await page.reload()
  await expect(quiz.getByTestId('quiz-best')).toHaveText(`Лучший результат: ${n} из ${n}`)
  // зачёт теста — отметка части в плане дня (имя пункта — «Проверка понимания, сделано»)
  await expect(toc.getByRole('button', { name: new RegExp(`^${PART_TITLES.quiz}\\s*, сделано$`) })).toBeVisible()
}

// Итоговый тест недели — отдельный тест последнего дня недели: свой ключ week-<неделя>, тест дня он не меняет, и наоборот
export async function expectWeekTestSeparate(page: Page, day: DayJson, week: number) {
  expect(day.week, `день ${day.number} — не из недели ${week}`).toBe(week)
  expect(day.weekTest?.length, `у дня ${day.number} нет итогового теста недели`).toBeGreaterThan(0)
  const weekTest = day.weekTest!
  const weekKey = `week-${week}`
  const own = day.quiz.length
  const total = weekTest.length
  await page.goto(`/#/day/${day.number}`)
  const part = page.getByRole('region', { name: PART_TITLES.quiz, exact: true })
  const weekQuiz = part.getByRole('region', { name: `Итоговый тест недели ${week}` })
  const dayQuiz = part.locator('.quiz:not(.quiz-week)')
  const toc = page.getByRole('navigation', { name: 'План дня' })
  await expect(dayQuiz.getByTestId('quiz-question')).toHaveCount(own)

  // тест дня не тронут: счёт 0, ни одного ответа, ни результата, ни лучшего результата
  async function dayQuizUntouched() {
    await expect(dayQuiz.locator('.quiz-score')).toHaveText('Верно: 0')
    await expect(dayQuiz.getByRole('button', { pressed: true })).toHaveCount(0)
    await expect(dayQuiz.locator('button:disabled')).toHaveCount(0)
    await expect(dayQuiz.getByTestId('quiz-result')).toHaveCount(0)
    await expect(dayQuiz.getByTestId('quiz-best')).toHaveCount(0)
    await expect(toc.getByRole('button', { name: PART_TITLES.quiz, exact: true })).toBeVisible()
  }

  await answerAll(weekQuiz, weekTest)
  await expect(weekQuiz.getByTestId('quiz-result')).toContainText(`Результат: ${total} из ${total} — тест сдан.`)
  await dayQuizUntouched()
  // в прогрессе неделя — под своим ключом, записи дня нет
  await expect.poll(() => savedQuiz(page, weekKey)).toEqual({ best: total, total })
  expect(await savedQuiz(page, day.id)).toBeNull()

  await page.reload()
  await expect(weekQuiz.getByTestId('quiz-best')).toHaveText(`Лучший результат: ${total} из ${total}`)
  await dayQuizUntouched()

  // и наоборот: тест дня сдаётся сам, лучший результат недели остаётся прежним
  await answerAll(dayQuiz, day.quiz)
  await expect(dayQuiz.getByTestId('quiz-result')).toContainText(`Результат: ${own} из ${own} — тест сдан.`)
  await expect.poll(() => savedQuiz(page, day.id)).toEqual({ best: own, total: own })
  expect(await savedQuiz(page, weekKey)).toEqual({ best: total, total })
  await expect(weekQuiz.getByTestId('quiz-best')).toHaveText(`Лучший результат: ${total} из ${total}`)
  await expect(weekQuiz.getByTestId('quiz-result')).toHaveCount(0)
}

export const NARROW = { width: 390, height: 844 }

// День на узком экране (NARROW): страница не шире экрана, каждый блок теории в ширине экрана,
// строки кода «Найди ошибку» прокручиваются внутри своего блока. Возвращает, сколько таких блоков проверено
export async function expectFitsNarrow(page: Page, day: DayJson): Promise<number> {
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  await page.goto(`/#/day/${day.number}`)
  await expect(page.getByRole('heading', { level: 1, name: day.title })).toBeVisible()
  await expect(page.locator('#part-theory .block.idea')).toHaveCount(ideas(day).length)
  expect(await fits()).toBe(true)

  // каждый блок теории — мысли, схемы, тренажёры, ситуации, ИИ на странице — в ширине экрана
  for (const b of day.blocks.filter((x) => x.type !== 'video')) {
    const box = await page.locator(`#block-${b.id}`).evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right }
    })
    expect(box.left, `${b.type} ${b.id}`).toBeGreaterThanOrEqual(0)
    expect(box.right, `${b.type} ${b.id}`).toBeLessThanOrEqual(NARROW.width)
  }

  // «Найди ошибку»: длинные строки кода прокручиваются внутри своего блока, а не двигают страницу
  let codeBlocks = 0
  for (const b of day.blocks.filter((x) => x.kind === 'find-the-bug')) {
    const code = page.locator(`#block-${b.id} .code-lines`)
    await code.scrollIntoViewIfNeeded()
    await expect(code).toBeVisible()
    expect(await code.evaluate((el) => el.scrollWidth > el.clientWidth), `строки ${b.id} не прокручиваются внутри блока`).toBe(true)
    expect(await code.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto')
    codeBlocks++
  }
  expect(await fits()).toBe(true)
  return codeBlocks
}
