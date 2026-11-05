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

// Книга — экран внутри курса: рамка srcdoc с читалкой, а не новая вкладка (её просмотрщик Claude открывает не книгой)
const BOOK_FRAME = 'Книга «Вайб-кодинг на практике»'

test('«В книге» дня открывает экран книги на разделе, «К курсу» возвращает в день', async ({ page }) => {
  await page.goto('/#/day/1')
  const link = page.locator('a[href="#/book/s77"]').first()
  await expect(link).toBeVisible()
  expect(await link.getAttribute('target')).toBeNull()
  await link.click()
  await expect(page).toHaveURL(/#\/book\/s77$/)
  await expect(page.getByTitle(BOOK_FRAME)).toBeVisible()
  const book = page.frameLocator(`iframe[title="${BOOK_FRAME}"]`)
  await expect(book.locator('#brandTitle')).toHaveText('Вайб-кодинг на практике')
  // открыт нужный раздел: заголовок s77 — на видимой странице читалки (страницы — в #slotL и #slotR)
  await expect(book.locator('#slotL, #slotR').getByRole('heading', { name: 'Как понять, что представляет собой модель' })).toBeVisible()
  await page.getByRole('link', { name: 'К курсу' }).click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
})

test('«Книга» в шапке главной открывает книгу; на 390 px нет прокрутки вбок', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const button = page.getByRole('banner').getByRole('link', { name: 'Книга' })
  expect(await button.getAttribute('target')).toBeNull()
  await button.click()
  await expect(page).toHaveURL(/#\/book$/)
  await expect(page.getByTitle(BOOK_FRAME)).toBeVisible()
  const book = page.frameLocator(`iframe[title="${BOOK_FRAME}"]`)
  await expect(book.locator('#brandTitle')).toBeVisible()
  await expect(book.locator('#slotR .page')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Вайб-кодинг на практике' })).toBeVisible()
  // ни страница курса, ни читалка в рамке не шире экрана; рамка — до низа окна
  const wide = (el: Element) => el.scrollWidth - el.clientWidth
  expect(await page.locator('html').evaluate(wide)).toBe(0)
  expect(await book.locator('html').evaluate(wide)).toBe(0)
  const box = (await page.getByTitle(BOOK_FRAME).boundingBox())!
  expect(box.width).toBe(390)
  expect(Math.round(box.y + box.height)).toBe(844)
  // открыли с главной — «К курсу» назад по истории, туда же (адрес главной — без якоря, как её открыли)
  await page.getByRole('link', { name: 'К курсу' }).click()
  await expect(page).toHaveURL(/:\d+\/(#\/)?$/)
  await expect(page.getByTestId('day-card')).toHaveCount(21)
})
