import { expect, test } from '@playwright/test'
import day08 from '../content/days/day-08.json' with { type: 'json' }
import day09 from '../content/days/day-09.json' with { type: 'json' }
import day10 from '../content/days/day-10.json' with { type: 'json' }
import day11 from '../content/days/day-11.json' with { type: 'json' }
import day12 from '../content/days/day-12.json' with { type: 'json' }
import day13 from '../content/days/day-13.json' with { type: 'json' }
import day14 from '../content/days/day-14.json' with { type: 'json' }
import { daysLabel, expectBookLinkOpens, expectFitsNarrow, expectFullDay, expectQuizPersists, expectWeekTestSeparate, NARROW, type DayJson } from './week-checks'

// Неделя 2 целиком: дни 8–14 — готовые дни с короткой теорией (2–3 мысли, один тренажёр или ситуация, ИИ на странице),
// тест, практика, наставник и карточки; у дня 14 — итоговый тест недели 2 (ключ прогресса week-2).
// Проверки — общие с неделей 1 (week-checks.ts); содержание — из файлов дней

const DAYS: DayJson[] = [day08, day09, day10, day11, day12, day13, day14]

test(`${daysLabel(DAYS)}: шесть частей дня, у каждой мысли ссылка «В книге» ведёт на экран книги`, async ({ page }) => {
  test.slow()
  // короткая теория недели 2 — две-три мысли
  for (const day of DAYS) await test.step(`день ${day.number}`, () => expectFullDay(page, day, { ideaCount: [2, 3] }))
  await expectBookLinkOpens(page, day08)
})

test('день 8: тест проходится, результат сохраняется после перезагрузки', ({ page }) => expectQuizPersists(page, day08))

test('день 14: итоговый тест недели 2 — отдельный тест, его результат не меняет тест дня', ({ page }) => expectWeekTestSeparate(page, day14, 2))

test(`${daysLabel(DAYS)} на 390 px — без горизонтальной прокрутки`, async ({ page }) => {
  test.slow()
  await page.setViewportSize(NARROW)
  const codeDays: number[] = []
  for (const day of DAYS) {
    await test.step(`день ${day.number}`, async () => {
      if ((await expectFitsNarrow(page, day)) > 0) codeDays.push(day.number)
    })
  }
  // «Найди ошибку» с кодом — в днях 10 и 11: проверка строк кода не пустая
  expect(codeDays).toEqual(expect.arrayContaining([10, 11]))
})
