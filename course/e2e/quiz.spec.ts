import { expect, test } from '@playwright/test'

test('лучший результат теста сохраняется после перезагрузки', async ({ page }) => {
  await page.goto('/#/day/1')
  const questions = page.getByTestId('quiz-question')
  const count = await questions.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await questions.nth(i).getByRole('button').first().click()
  }
  await expect(page.getByTestId('quiz-result')).toContainText(`из ${count}`)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('vibecourse:progress') ?? '')).toContain('"best"')
  await page.reload()
  await expect(page.getByTestId('quiz-best')).toContainText(`из ${count}`)
})
