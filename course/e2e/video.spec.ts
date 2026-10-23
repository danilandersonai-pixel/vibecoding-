import { expect, test } from '@playwright/test'
import { pilotRlsScript } from '../video/pilot-rls/script'

// Кнопка панели — «Смотреть» / «Пауза» точно: у обложки имя длиннее («Смотреть ролик «…»»)
const PLAY = { name: 'Смотреть', exact: true }
const PAUSE = { name: 'Пауза', exact: true }

test('ролик дня 4 запускается с обложки, на паузе открывается пояснение зоны', async ({ page }) => {
  await page.goto('/#/day/4')
  const time = page.getByTestId('video-time')
  await expect(time).toHaveText(/^0:00/)
  await page.getByRole('button', { name: 'Смотреть ролик «Почему тренер не увидит чужих подопечных»' }).click()
  await expect(time).not.toHaveText(/^0:00/, { timeout: 5000 })
  await page.getByRole('button', PAUSE).click()

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
  // ни кнопки панели, ни обложки «Смотреть ролик «…»» (имя ищется по вхождению), ни перемотки
  await expect(page.getByRole('button', { name: 'Смотреть' })).toHaveCount(0)
  await expect(page.getByRole('slider', { name: 'Перемотка' })).toHaveCount(0)
})

test('день 4 с роликом на телефоне (390 px) — без горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/4')
  await expect(page.getByRole('button', PLAY)).toBeVisible()
  // кадр ролика уже нарисован: ленивый код сцен загрузился
  await expect(page.locator('.video-stage svg').first()).toBeVisible()
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(fits).toBe(true)
})

test('до запуска ролик не пустой: видна обложка с кнопкой ▶', async ({ page }) => {
  await page.goto('/#/day/1')
  const covers = page.getByRole('button', { name: /^Смотреть ролик «/ })
  await expect(covers).toHaveCount(2)
  await expect(covers.first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Смотреть ролик «Как устроено приложение»' })).toContainText('Видеоурок 1')
  await expect(page.getByRole('button', { name: 'Смотреть ролик «Вайб-кодинг: шкала, а не выключатель»' })).toContainText('Видеоурок 2')
  // под обложкой нарисован кадр ролика, рамок горячих точек на обложке нет
  await expect(page.locator('.video-stage').first().locator('svg').first()).toBeVisible()
  await expect(page.locator('.video-hotspot')).toHaveCount(0)
  // два ролика на компьютере — в один ряд
  const [a, b] = await page.locator('.video-grid .video-stage').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(a).toBe(b)
})

test('на дне 1 два ролика: запуск второго ставит первый на паузу', async ({ page }) => {
  await page.goto('/#/day/1')
  await expect(page.getByRole('button', { name: /^Смотреть ролик «/ })).toHaveCount(2)
  await expect(page.getByRole('button', PLAY)).toHaveCount(2)
  const times = page.getByTestId('video-time')
  await page.getByRole('button', PLAY).first().click()
  await expect(times.first()).not.toHaveText(/^0:00/, { timeout: 5000 })
  await page.getByRole('button', { name: 'Смотреть ролик «Вайб-кодинг: шкала, а не выключатель»' }).click()
  // первый плеер снова предлагает «Смотреть», второй — «Пауза»
  await expect(page.getByRole('button', PLAY)).toHaveCount(1)
  await expect(page.getByRole('button', PAUSE)).toHaveCount(1)
  const firstAt = await times.first().textContent()
  await page.waitForTimeout(1200)
  await expect(times.first()).toHaveText(firstAt ?? '')
})

test('в конце ролика — «Смотреть ещё раз» и «Дальше»; «Дальше» прокручивает, адрес не меняется', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/1')
  const first = page.locator('figure.video').first()
  const seek = first.getByRole('slider', { name: 'Перемотка' })
  await seek.fill(await seek.getAttribute('max') ?? '0')
  await expect(first.getByRole('button', { name: 'Смотреть ещё раз' })).toBeVisible()
  await first.getByRole('button', { name: 'Дальше' }).click()
  // следующий материал — второй ролик: он поднимается к верху экрана, под полосу плана дня
  const second = page.locator('figure.video').nth(1)
  await expect.poll(async () => (await second.boundingBox())?.y ?? 0).toBeLessThan(200)
  expect(new URL(page.url()).hash).toBe('#/day/1')

  await first.getByRole('button', { name: 'Смотреть ещё раз' }).click()
  await expect(first.getByRole('button', PAUSE)).toBeVisible()
  await expect(first.getByRole('button', { name: 'Смотреть ещё раз' })).toHaveCount(0)
})
