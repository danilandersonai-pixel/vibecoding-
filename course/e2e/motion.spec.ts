import { expect, test } from '@playwright/test'

// Движение: короткие анимации в ответ на действие, при «уменьшить движение» — ничего, всё сразу на месте.

test.describe('движение включено', () => {
  test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'no-preference' }))

  test('«Как проходит день» печатается при показе и остаётся читаемым; карта прорисовывается, когда до неё докрутили', async ({ page }) => {
    await page.goto('/')
    const how = page.locator('#how')
    await expect(how).toHaveAttribute('data-reveal', 'go')
    // текст в разметке сразу — и для поиска на странице, и для дикторов
    await expect(how.getByRole('heading', { name: 'Наставник проверяет' })).toBeAttached()
    const log = page.locator('.route-log')
    await log.scrollIntoViewIfNeeded()
    await expect(log).toHaveAttribute('data-reveal', 'go')
    // после прорисовки строки на месте: видимы и без сдвига
    const row = page.locator('.route-day').nth(5)
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
  })

  test('смена экрана идёт переходом браузера: на время перехода вид — на <html>, после — снят; боковая панель — свой слой', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.sitebar')).toHaveCSS('view-transition-name', 'sitebar')
    const kinds = page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const seen: string[] = []
          const obs = new MutationObserver(() => {
            const k = document.documentElement.dataset.transition
            if (k) seen.push(k)
          })
          obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-transition'] })
          setTimeout(() => {
            obs.disconnect()
            resolve(seen)
          }, 2500)
        }),
    )
    await page.getByTestId('day-card').first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
    await page.getByRole('link', { name: 'Следующий день' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Эталоны и спецификация' })).toBeVisible()
    expect(await kinds).toEqual(['page', 'forward'])
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.transition ?? null)).toBeNull()
  })

  test('флажок практики — свой, с галочкой; отмечается и снимается как обычный', async ({ page }) => {
    await page.goto('/#/day/1')
    const box = page.locator('.practice-step input').first()
    await expect(box).toHaveCSS('appearance', 'none')
    await box.check()
    await expect(box).toBeChecked()
    await box.uncheck()
    await expect(box).not.toBeChecked()
  })
})

test.describe('«уменьшить движение»', () => {
  test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }))

  test('блоки сразу в готовом виде, переходов нет, анимаций на странице нет', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
    await expect(page.locator('#how')).not.toHaveAttribute('data-reveal', /.*/)
    await expect(page.locator('.route-log')).not.toHaveAttribute('data-reveal', /.*/)
    await page.getByTestId('day-card').first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.dataset.transition ?? null)).toBeNull()
    await page.locator('.practice-step input').first().check()
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  })
})
