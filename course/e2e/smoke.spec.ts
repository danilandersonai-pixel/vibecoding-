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
