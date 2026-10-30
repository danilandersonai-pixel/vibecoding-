import { expect, test } from '@playwright/test'
import { day08Script } from '../video/day-08/script'

// Кнопка панели — «Смотреть» / «Пауза» точно: у обложки имя длиннее («Смотреть ролик «…»»)
const PLAY = { name: 'Смотреть', exact: true }
const PAUSE = { name: 'Пауза', exact: true }

// День 8 — старый ролик day-08 (1280 × 720): на нём проверяются обложка, пояснение зоны, отказ загрузки и телефон
test('ролик дня 8 запускается с обложки, на паузе открывается пояснение зоны', async ({ page }) => {
  await page.goto('/#/day/8')
  const time = page.getByTestId('video-time')
  await expect(time).toHaveText(/^0:00/)
  await page.getByRole('button', { name: 'Смотреть ролик «Отзывы и фоновые агенты»' }).click()
  await expect(time).not.toHaveText(/^0:00/, { timeout: 5000 })
  await page.getByRole('button', PAUSE).click()

  const zone = day08Script.hotspots.find((h) => h.title === 'Задача в четыре части')!
  await page.getByRole('slider', { name: 'Перемотка' }).fill(String(zone.from + 15))
  await page.getByRole('button', { name: 'Задача в четыре части' }).click()
  await expect(page.getByText(/Задача — одной фразой/)).toBeVisible()
})

test('если код ролика не загрузился, блок это говорит, а день остаётся на месте', async ({ page, request }) => {
  // ломаем все куски кода, кроме основного: ролик грузится отдельным файлом. Основной — то, что грузит сама страница
  // (index-*.js и общие с ленивыми кусками файлы из modulepreload в index.html)
  const html = await (await request.get('/')).text()
  const main = [...html.matchAll(/\.\/assets\/([^"]+\.js)"/g)].map((m) => `/assets/${m[1]}`)
  expect(main.some((f) => f.startsWith('/assets/index-'))).toBe(true)
  await page.route('**/assets/*.js', (route) => (main.some((f) => route.request().url().endsWith(f)) ? route.continue() : route.abort()))
  await page.goto('/#/day/8')
  await expect(page.getByText('Ролик не загрузился')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Отзывы и фоновые агенты' })).toBeVisible()
  // ни кнопки панели, ни обложки «Смотреть ролик «…»» (имя ищется по вхождению), ни перемотки
  await expect(page.getByRole('button', { name: 'Смотреть' })).toHaveCount(0)
  await expect(page.getByRole('slider', { name: 'Перемотка' })).toHaveCount(0)
})

test('день 8 с роликом на телефоне (390 px) — без горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/8')
  await expect(page.getByRole('button', PLAY)).toBeVisible()
  // кадр ролика уже нарисован: ленивый код сцен загрузился (svg внутри плеера, а не значок ▶ на обложке)
  await expect(page.locator('.video-frame svg').first()).toBeVisible()
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
  // под обложкой нарисован кадр ролика (svg внутри плеера, а не значок ▶), рамок горячих точек на обложке нет
  await expect(page.locator('.video-frame')).toHaveCount(2)
  for (const frame of await page.locator('.video-frame').all()) await expect(frame.locator('svg').first()).toBeVisible()
  await expect(page.locator('.video-hotspot')).toHaveCount(0)
  // тёмные ролики (кадр 1920 × 1080, мелкий код) — каждый во всю ширину сетки, друг под другом
  const rows = await page.locator('.video-grid .video-stage').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))
  const grid = await page.locator('.video-grid').first().evaluate((el) => el.getBoundingClientRect().width)
  expect(rows[1].top).toBeGreaterThan(rows[0].bottom)
  for (const r of rows) expect(Math.abs(r.width - grid)).toBeLessThan(2)
})

// День 8 — один старый ролик day-08 (1280 × 720): дня с двумя старыми роликами в курсе больше нет (ch-10 переделан, на дне 7
// рядом с ним старый ch-11). Одинокий ролик сетки — во всю её ширину (правило :only-child в video.css), а не в половину
test('старый ролик (1280 × 720) один на дне — во всю ширину сетки', async ({ page }) => {
  await page.goto('/#/day/8')
  await expect(page.locator('.video-grid .video-stage')).toHaveCount(1)
  await expect(page.locator('.video-grid .video-stage.is-dark')).toHaveCount(0)
  const stage = await page.locator('.video-grid .video-stage').evaluate((el) => el.getBoundingClientRect().width)
  const grid = await page.locator('.video-grid').evaluate((el) => el.getBoundingClientRect().width)
  expect(Math.abs(stage - grid)).toBeLessThan(2)
})

test('на обложке субтитров нет, после запуска — идут', async ({ page }) => {
  const poster = day08Script.hotspots[0].from
  const atPoster = day08Script.cues.find((c) => poster >= c.from && poster < c.to)!
  await page.goto('/#/day/8')
  const frame = page.locator('.video-frame')
  // кадр обложки уже нарисован, но реплики этого кадра в нём нет
  await expect(frame.locator('svg').first()).toBeVisible()
  await expect(frame.getByText(atPoster.text)).toHaveCount(0)
  await page.getByRole('button', { name: 'Смотреть ролик «Отзывы и фоновые агенты»' }).click()
  await expect(frame.getByText(day08Script.cues[0].text)).toBeVisible({ timeout: 5000 })
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
