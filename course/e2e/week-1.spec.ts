import { test } from '@playwright/test'
import day02 from '../content/days/day-02.json' with { type: 'json' }
import day03 from '../content/days/day-03.json' with { type: 'json' }
import day04 from '../content/days/day-04.json' with { type: 'json' }
import day05 from '../content/days/day-05.json' with { type: 'json' }
import day06 from '../content/days/day-06.json' with { type: 'json' }
import day07 from '../content/days/day-07.json' with { type: 'json' }
import { daysLabel, expectBookLinkOpens, expectFullDay, expectQuizPersists, expectWeekFitsNarrow, expectWeekTestSeparate, type DayJson } from './week-checks'

// Неделя 1 целиком: дни 2–7 — полные дни, как день 1 (теория, тест, практика, наставник, карточки), у дня 7 — итоговый тест недели.
// Проверки — общие с неделей 2 (week-checks.ts); содержание — из файлов дней, как в day-01.spec.ts

const DAYS: DayJson[] = [day02, day03, day04, day05, day06, day07]

test(`${daysLabel(DAYS)}: шесть частей дня, у каждой мысли ссылка «В книге» ведёт на экран книги`, async ({ page }) => {
  test.slow()
  // полная теория недели 1 — от трёх мыслей
  for (const day of DAYS) await test.step(`день ${day.number}`, () => expectFullDay(page, day, { ideaCount: [3, Infinity] }))
  await expectBookLinkOpens(page, day02)
})

test('день 2: тест проходится, результат сохраняется после перезагрузки', ({ page }) => expectQuizPersists(page, day02))

test('день 7: итоговый тест недели 1 — отдельный тест, его результат не меняет тест дня', ({ page }) => expectWeekTestSeparate(page, day07, 1))

test(`${daysLabel(DAYS)} на 390 px — без горизонтальной прокрутки`, async ({ page }) => {
  test.slow()
  // строки кода «Найди ошибку» — в тех днях, где тренажёр есть по файлам дней
  await expectWeekFitsNarrow(page, DAYS)
})
