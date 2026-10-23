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
