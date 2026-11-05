import { test } from '@playwright/test'
import day15 from '../content/days/day-15.json' with { type: 'json' }
import day16 from '../content/days/day-16.json' with { type: 'json' }
import day17 from '../content/days/day-17.json' with { type: 'json' }
import day18 from '../content/days/day-18.json' with { type: 'json' }
import day19 from '../content/days/day-19.json' with { type: 'json' }
import day20 from '../content/days/day-20.json' with { type: 'json' }
import day21 from '../content/days/day-21.json' with { type: 'json' }
import { weekTestName } from '../src/course/weekTest'
import { daysLabel, expectBookLinkOpens, expectFullDay, expectQuizPersists, expectWeekFitsNarrow, expectWeekTestSeparate, type DayJson } from './week-checks'

// Неделя 3 целиком: дни 15–21 — готовые дни с короткой теорией (2–3 мысли, один тренажёр или ситуация, ИИ на странице),
// тест, практика, наставник и карточки; у дня 21 — итоговый тест курса (ключ прогресса week-3, название — weekTestName).
// Проверки — общие с неделями 1 и 2 (week-checks.ts); содержание — из файлов дней

const DAYS: DayJson[] = [day15, day16, day17, day18, day19, day20, day21]

test(`${daysLabel(DAYS)}: шесть частей дня, у каждой мысли ссылка «В книге» ведёт на экран книги`, async ({ page }) => {
  test.slow()
  // короткая теория недели 3 — две-три мысли
  for (const day of DAYS) await test.step(`день ${day.number}`, () => expectFullDay(page, day, { ideaCount: [2, 3] }))
  await expectBookLinkOpens(page, day15)
})

// День 15, а не 21: у дня 21 в части теста два теста — тест дня и тест курса
test('день 15: тест проходится, результат сохраняется после перезагрузки', ({ page }) => expectQuizPersists(page, day15))

test(`день 21: «${weekTestName(day21).title}» — отдельный тест под ключом week-3, тест дня и зачёт дня он не меняет`, ({ page }) =>
  expectWeekTestSeparate(page, day21, 3))

test(`${daysLabel(DAYS)} на 390 px — без горизонтальной прокрутки`, async ({ page }) => {
  test.slow()
  // строки кода «Найди ошибку» — в тех днях, где тренажёр есть по файлам дней (в неделе 3 — дни 15 и 17)
  await expectWeekFitsNarrow(page, DAYS)
})
