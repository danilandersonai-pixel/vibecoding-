import { expect, test } from '@playwright/test'

test('карта показывает 21 день, день 1 открывается и ведёт обратно', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('day-card')).toHaveCount(21)
  // «Карта курса» — одна ссылка, в боковой панели; на главной — текущая страница
  const map = page.getByRole('link', { name: 'Карта курса' })
  await expect(map).toHaveCount(1)
  await expect(page.getByRole('banner').getByRole('link', { name: 'Карта курса' })).toHaveAttribute('aria-current', 'page')
  await page.getByTestId('day-card').first().click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByText('Понять, из чего состоит приложение')).toBeVisible()
  await expect(map).toHaveCount(1)
  await expect(map).not.toHaveAttribute('aria-current')
  await map.click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByTestId('day-card')).toHaveCount(21)
})

test('«Сегодня день 01» в боковой панели ведёт в текущий день', async ({ page }) => {
  await page.goto('/')
  const today = page.getByRole('banner').getByRole('link', { name: 'Сегодня день 01' })
  await expect(today).toBeVisible()
  await today.click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
})

test('план дня прокручивает к практике', async ({ page }) => {
  await page.goto('/#/day/1')
  const practice = page.locator('#part-practice')
  await expect(practice).not.toBeInViewport()
  await page.getByRole('navigation', { name: 'План дня' }).getByRole('button', { name: 'Практика' }).click()
  await expect(practice).toBeInViewport()
  await expect(page).toHaveURL(/#\/day\/1$/)
})

test('ссылка в книгу открывает нужный раздел', async ({ page, request }) => {
  await page.goto('/#/day/1')
  const link = page.locator('a[href$="book.html#s77"]').first()
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('target', '_blank')
  expect((await request.get('/book.html')).ok()).toBe(true)
})
