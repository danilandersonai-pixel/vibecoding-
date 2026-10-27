import { expect, test } from '@playwright/test'

for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
  test(`курс открывается на ${size.width}×${size.height} без горизонтальной прокрутки`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(fits).toBe(true)
  })
}

// Страница дня: шапка, полоса плана дня и схема не выталкивают страницу вбок — полоса и схема прокручиваются только внутри себя
for (const size of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
  test(`день 1 открывается на ${size.width}×${size.height} без горизонтальной прокрутки`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto('/#/day/1')
    await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(fits).toBe(true)
    const strip = page.getByRole('navigation', { name: 'План дня' }).getByRole('list')
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    const diagram = page.locator('.diagram-scroll').first()
    expect(await diagram.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  })
}

// Оболочка: шире 960 px боковая панель — колонка слева во всю высоту окна с «Сегодня» и прогрессом, рабочая область справа;
// до 960 px — строка сверху, прогресс и «Сегодня» скрыты
test('на 1440 px боковая панель — колонка слева во всю высоту, на 390 px — строка сверху', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const bar = page.getByRole('banner')
  const box = (await bar.boundingBox())!
  expect([box.x, box.y, box.width, box.height].map(Math.round)).toEqual([0, 0, 248, 900])
  const main = (await page.getByRole('main').boundingBox())!
  expect(main.x).toBeGreaterThanOrEqual(248)
  await expect(bar.getByRole('link', { name: 'Сегодня день 01' })).toBeVisible()
  await expect(bar.getByRole('region', { name: 'Прогресс' })).toBeVisible()
  await expect(bar.getByRole('region', { name: 'Прогресс' })).toContainText('Пройдено 0 из 21')
  // прокрутка: панель остаётся на месте
  await page.mouse.wheel(0, 1500)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect(Math.round((await bar.boundingBox())!.y)).toBe(0)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/1')
  const row = (await bar.boundingBox())!
  expect([row.x, row.width].map(Math.round)).toEqual([0, 390])
  expect(row.height).toBeLessThan(64)
  await expect(bar.getByRole('region', { name: 'Прогресс' })).toBeHidden()
  await expect(bar.getByRole('link', { name: /^Сегодня/ })).toBeHidden()
  // строка дней и план дня — под панелью
  const days = (await page.getByRole('navigation', { name: 'Дни курса' }).boundingBox())!
  expect(days.y).toBeGreaterThanOrEqual(row.y + row.height - 1)
})

// Тема: тёмная по умолчанию, системная настройка её не меняет; переключатель «Светлая тема» в боковой панели
// включает светлую, выбор хранится в браузере и после перезагрузки ставится до первой отрисовки (скрипт в index.html)
test('переключатель темы: светлая сохраняется после перезагрузки, системная настройка тему не меняет', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const body = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const toggle = page.getByRole('banner').getByRole('button', { name: 'Светлая тема' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-theme'))).toBe(false)
  expect(await body()).toBe('rgb(20, 22, 25)')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await body()).toBe('rgb(246, 246, 244)')
  expect(await page.evaluate(() => localStorage.getItem('vibe-course-theme'))).toBe('light')

  // после перезагрузки тема уже стоит, когда разбирается <body> — до первой отрисовки приложения
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') (window as unknown as { early?: string }).early = document.documentElement.dataset.theme ?? 'dark'
    })
  })
  await page.reload()
  expect(await page.evaluate(() => (window as unknown as { early?: string }).early)).toBe('light')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(await body()).toBe('rgb(246, 246, 244)')

  // обратно в тёмную: запись стёрта, после перезагрузки — тёмная
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => localStorage.getItem('vibe-course-theme'))).toBeNull()
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await body()).toBe('rgb(20, 22, 25)')
})
