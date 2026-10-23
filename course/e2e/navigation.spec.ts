import { expect, test } from '@playwright/test'

test('карта показывает 21 день, день 1 открывается и ведёт обратно', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('day-card')).toHaveCount(21)
  await page.getByTestId('day-card').first().click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByText('Понять, из чего состоит приложение')).toBeVisible()
  // Ссылку «Карта курса» на странице дня даст задача 8; пока возвращаемся по адресу
  await page.goto('/')
  await expect(page.getByTestId('day-card')).toHaveCount(21)
})

test('ссылка в книгу открывает нужный раздел', async ({ page, request }) => {
  await page.goto('/#/day/1')
  const link = page.locator('a[href$="book.html#s77"]').first()
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('target', '_blank')
  expect((await request.get('/book.html')).ok()).toBe(true)
})
