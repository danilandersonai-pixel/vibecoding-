import { expect, test } from '@playwright/test'
import { pilotRlsScript } from '../video/pilot-rls/script'

test('ролик дня 4 играет, на паузе открывается пояснение зоны', async ({ page }) => {
  await page.goto('/#/day/4')
  const time = page.getByTestId('video-time')
  await expect(time).toHaveText(/^0:00/)
  await page.getByRole('button', { name: 'Смотреть' }).click()
  await expect(time).not.toHaveText(/^0:00/, { timeout: 5000 })
  await page.getByRole('button', { name: 'Пауза' }).click()

  const zone = pilotRlsScript.hotspots.find((h) => h.title === 'client/18')!
  await page.getByRole('slider', { name: 'Перемотка' }).fill(String(zone.from + 15))
  await page.getByRole('button', { name: 'client/18' }).click()
  await expect(page.getByText(/Подменённый номер/)).toBeVisible()
})

test('если код ролика не загрузился, блок это говорит, а день остаётся на месте', async ({ page }) => {
  // ломаем все куски кода, кроме основного: ролик грузится отдельным файлом
  await page.route('**/assets/*.js', (route) => (route.request().url().includes('/assets/index-') ? route.continue() : route.abort()))
  await page.goto('/#/day/4')
  await expect(page.getByText('Ролик не загрузился')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Вход для двух ролей и защита данных' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Смотреть' })).toHaveCount(0)
})
