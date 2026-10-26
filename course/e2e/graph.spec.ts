import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// Экран «Граф знаний» в браузере: вход с главной, поиск узла, карточка и переходы, «Назад», телефон, тёмная тема,
// края (нет WebGL, кусок не загрузился) и куски сборки. Поиск и карточка работают и с рисунком, и без него,
// поэтому сценарии на рисунок не опираются; есть ли WebGL — проверяет отдельный сценарий

const card = (page: Page) => page.getByRole('complementary', { name: 'Узел графа' })
const cardTitle = (page: Page) => card(page).getByRole('heading', { level: 2 })
const field = (page: Page) => page.getByRole('combobox', { name: 'Найти на графе' })
const group = (page: Page, title: string) => card(page).getByRole('region', { name: new RegExp(`^${title}`) })
const HINT = 'Выберите узел на графе или найдите его поиском'

// Найти узел поиском на графе и выбрать первый вариант
async function pick(page: Page, query: string, option: RegExp) {
  await field(page).fill(query)
  await page.getByRole('option', { name: option }).first().click()
}

// Ошибки страницы: необработанные исключения и ошибки в консоли. Шрифты Google в закрытой сети не грузятся —
// это ошибки чужих адресов, не страницы
function problems(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && m.location().url.startsWith('http://localhost')) errors.push(m.text())
  })
  return errors
}

const overflows = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

test('с главной «Граф»: поиск «Агент», связь в карточке меняет узел и адрес, «Назад» уводит с графа', async ({ page }) => {
  const errors = problems(page)
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Разделы' }).getByRole('button', { name: 'Граф' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeVisible()
  await expect(page).toHaveURL(/#\/graph$/)
  await expect(card(page)).toContainText(HINT)

  await pick(page, 'Агент', /^Агент Термин$/)
  await expect(cardTitle(page)).toHaveText('Агент')
  await expect(card(page).getByText(/^ИИ, который не только отвечает на вопросы/)).toBeVisible()
  await expect(group(page, 'Объясняется в главе')).toBeVisible()
  await expect(page).toHaveURL(/#\/graph\/term%3A1$/)

  await group(page, 'Объясняется в главе').getByRole('button', { name: 'Азбука' }).click()
  await expect(cardTitle(page)).toHaveText('Азбука')
  await expect(cardTitle(page)).toBeFocused()
  await expect(page).toHaveURL(/#\/graph\/ch%3Aabc$/)

  // выбор узлов не копит историю: «Назад» — сразу на главную
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
  // «Вперёд» — граф с последним выбранным узлом (адрес с узлом)
  await page.goForward()
  await expect(cardTitle(page)).toHaveText('Азбука')
  expect(errors).toEqual([])
})

test('«На графе» из окна поиска при открытом графе не копит историю: «Назад» уводит с графа', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Разделы' }).getByRole('button', { name: 'Граф' }).click()
  await pick(page, 'Агент', /^Агент Термин$/)
  await expect(cardTitle(page)).toHaveText('Агент')
  await page.keyboard.press('Control+KeyK')
  const dialog = page.getByRole('dialog', { name: 'Поиск' })
  await dialog.getByRole('searchbox', { name: 'Поиск по курсу и книге' }).fill('Код')
  const terms = dialog.getByRole('region', { name: /^Термины/ })
  await expect(terms.getByRole('listitem').first()).toContainText('Код')
  await terms.getByRole('listitem').first().getByRole('link', { name: 'На графе' }).click()
  await expect(dialog).toBeHidden()
  await expect(cardTitle(page)).toHaveText('Код')
  await expect(page).toHaveURL(/#\/graph\/term%3A\d+$/)
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
})

test('«Открыть день» у дня ведёт в день курса', async ({ page }) => {
  await page.goto('/#/graph')
  await pick(page, 'День 1', /^День 1 · .* День$/)
  await expect(card(page).getByText('День', { exact: true })).toBeVisible()
  await card(page).getByRole('link', { name: 'Открыть день' }).click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
})

test('холодный вход по адресу узла; неизвестный и битый id — общий вид', async ({ page }) => {
  const errors = problems(page)
  await page.goto('/#/graph/term%3A1')
  await expect(cardTitle(page)).toHaveText('Агент')
  for (const hash of ['#/graph/term%3A9999', '#/graph/%E0%A4%A']) {
    await page.goto('/' + hash)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeVisible()
    await expect(card(page)).toContainText(HINT)
  }
  expect(errors).toEqual([])
})

test('рисунок: WebGL есть — Sigma рисует без ошибок; щелчок по пустому месту снимает выбор', async ({ page }) => {
  const errors = problems(page)
  await page.goto('/#/graph/term%3A1')
  await expect(cardTitle(page)).toHaveText('Агент')
  const webgl = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl')))
  test.skip(!webgl, 'в этом браузере нет WebGL — рисунок проверяет сценарий «нет WebGL»')
  const stage = page.locator('.graph-canvas')
  await expect(stage).toHaveAttribute('aria-hidden', 'true')
  await expect(stage.locator('canvas').first()).toBeAttached()
  await expect(page.getByText('Рисунок графа не поддерживается')).toHaveCount(0)
  // правый верхний угол рисунка — пусто (облако узлов в середине, острова недель внизу): нажатие снимает выбор
  const box = (await stage.boundingBox())!
  await page.mouse.click(box.x + box.width - 12, box.y + 12)
  await expect(card(page)).toContainText(HINT)
  await expect(page).toHaveURL(/#\/graph$/)
  expect(errors).toEqual([])
})

test('нет WebGL — сообщение вместо рисунка, поиск и карточка работают', async ({ page }) => {
  const errors = problems(page)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    // как в браузере без WebGL: 2D есть, webgl/webgl2 — null
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      return type.includes('webgl') ? null : getContext.call(this, type, options)
    } as typeof getContext
  })
  await page.goto('/#/graph')
  await expect(page.getByText('Рисунок графа не поддерживается этим браузером — пользуйтесь поиском и карточками')).toBeVisible()
  await pick(page, 'Агент', /^Агент Термин$/)
  await expect(cardTitle(page)).toHaveText('Агент')
  await group(page, 'Объясняется в главе').getByRole('button', { name: 'Азбука' }).click()
  await expect(cardTitle(page)).toHaveText('Азбука')
  expect(errors).toEqual([])
})

test('данные графа не загрузились — «Граф сейчас недоступен» и «← Курс»', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  // кусок данных — graph-*.js (кусок экрана — GraphPage-*.js, с заглавной)
  await page.route(/\/graph-[^/]*\.js$/, (route) => route.abort())
  await page.goto('/#/graph')
  await expect(page.getByText('Граф сейчас недоступен')).toBeVisible()
  await page.getByRole('link', { name: 'Курс' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
  expect(errors).toEqual([])
})

test('кусок экрана графа не загрузился — «Граф сейчас недоступен», а не пустая страница', async ({ page }) => {
  await page.route(/\/GraphPage-[^/]*\.js$/, (route) => route.abort())
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Разделы' }).getByRole('button', { name: 'Граф' }).click()
  await expect(page.getByText('Граф сейчас недоступен')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Курс' })).toHaveAttribute('href', '#/')
})

// Телефон: поиск сверху, фильтры — полоса с прокруткой внутри себя, карточка — панель снизу до 60 % высоты.
// Длинное название раздела и раскрытая группа не выталкивают ничего вбок; «Закрыть» скрывает панель
for (const size of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
  test(`на ${size.width}×${size.height} без прокрутки вбок, карточка-панель закрывается`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(size)
    await page.goto('/#/graph')
    await expect(page.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeVisible()
    expect(await overflows(page)).toBe(false)
    const strip = page.getByRole('group', { name: 'Типы узлов' })
    expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    // узел не выбран — панели нет
    await expect(card(page)).toBeHidden()

    await pick(page, 'Будущее языков программирования', /^Будущее языков программирования/)
    await expect(cardTitle(page)).toHaveText(/^Будущее языков программирования и возможность разработки/)
    await group(page, 'Термины в тексте').getByRole('button', { name: /^Показать все \d+$/ }).click()
    const panel = page.locator('.graph-side')
    const box = (await panel.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(size.width + 0.5)
    expect(box.height).toBeLessThanOrEqual(size.height * 0.6 + 1)
    expect(await overflows(page)).toBe(false)
    expect(await panel.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false)
    // «Закрыть» видна и у прокрученной панели; нажимаемое — не меньше 44 px
    await panel.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    const close = page.getByRole('button', { name: 'Закрыть' })
    await expect(close).toBeInViewport()
    const closeBox = (await close.boundingBox())!
    expect(closeBox.height).toBeGreaterThanOrEqual(44)

    await close.click()
    await expect(card(page)).toBeHidden()
    await expect(page.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeFocused()
    // выбор остался: адрес с узлом, тот же узел снова открывает панель
    await expect(page).toHaveURL(/#\/graph\/sec%3As74$/)
    await pick(page, 'Будущее языков программирования', /^Будущее языков программирования/)
    await expect(card(page)).toBeVisible()
    // Esc: в поле с текстом — только очищает поле; в пустом — закрывает панель
    await page.keyboard.press('Escape')
    await expect(field(page)).toHaveValue('')
    await expect(card(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card(page)).toBeHidden()
  })
}

// Телефон: полоса фильтров прокручивается вбок. Таблетка в фокусе (Tab) встаёт в полосу целиком, с местом для рамки
// фокуса (2 px с отступом 2 px): сам Chrome к частично видной таблетке не докручивает. Нажатие мышью полосу не двигает —
// переключается та таблетка, что под указателем
for (const width of [390, 320]) {
  test(`на ${width} px Tab по фильтрам: таблетка в фокусе видна целиком, нажатие мышью полосу не двигает`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/#/graph')
    const strip = page.getByRole('group', { name: 'Типы узлов' })
    await expect(strip.getByRole('button')).toHaveCount(8)
    const pills = await strip.getByRole('button').all()
    await field(page).focus()
    for (const pill of pills) {
      await page.keyboard.press('Tab')
      await expect(pill).toBeFocused()
      await expect.poll(async () => (await pill.boundingBox())!.x).toBeGreaterThanOrEqual(4)
      const box = (await pill.boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(width - 4)
    }

    await page.mouse.click(1, 1)
    await strip.evaluate((el) => el.scrollTo(0, 0))
    // первая таблетка, которая видна только частично
    const boxes = await Promise.all(pills.map((p) => p.boundingBox()))
    const at = boxes.findIndex((b) => b!.x < width && b!.x + b!.width > width)
    expect(at).toBeGreaterThan(0)
    await page.mouse.click(boxes[at]!.x + 12, boxes[at]!.y + boxes[at]!.height / 2)
    await expect(pills[at]).toHaveAttribute('aria-pressed', 'false')
    expect(await strip.evaluate((el) => el.scrollLeft)).toBe(0)
  })
}

// Телефон: у «Графа» в верхней строке главной и в шапке дня только значок — нажатие 44 × 44, имя «Граф»
test('на 390 px «Граф» — значок, нажатие 44 × 44', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [url, where] of [['/', 'navigation'], ['/#/day/1', 'banner']] as const) {
    await page.goto(url)
    const scope = where === 'navigation' ? page.getByRole('navigation', { name: 'Разделы' }) : page.getByRole('banner')
    const box = (await scope.getByRole('button', { name: 'Граф' }).boundingBox())!
    expect([box.width >= 44 && box.width < 60, box.height >= 44]).toEqual([true, true])
  }
})

// Верхняя строка главной со знаком, «Поиском», «Графом», «Картой» и «Книгой» — в один ряд на всех телефонах:
// до 420 px название курса скрыто визуально (знак «В» остаётся, название читается с экрана)
for (const width of [320, 360, 375, 390, 414]) {
  test(`на ${width} px верхняя строка главной — в один ряд, без прокрутки вбок`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const center = async (name: string) => {
      const box = (await page.locator(name).boundingBox())!
      return box.y + box.height / 2
    }
    const brand = await center('.sitebar-brand')
    const links = page.getByRole('navigation', { name: 'Разделы' })
    for (const item of await links.locator(':scope > *').all()) {
      const box = (await item.boundingBox())!
      expect(Math.abs(box.y + box.height / 2 - brand)).toBeLessThan(4)
    }
    expect(await overflows(page)).toBe(false)
    await expect(page.getByText('Вайб-курс', { exact: true })).toBeAttached()
  })
}

test('тёмная тема: экран открывается без ошибок, смена темы при открытом графе — тоже', async ({ page }) => {
  const errors = problems(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/#/graph/term%3A1')
  await expect(cardTitle(page)).toHaveText('Агент')
  // цвет частей и глав на рисунке — переменная темы (сборка пишет цвета строчными)
  const ink = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--graph-book').trim().toUpperCase())
  expect(await ink()).toBe('#B2BAF0')
  await page.emulateMedia({ colorScheme: 'light' })
  expect(await ink()).toBe('#1D2B8F')
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  expect(await ink()).toBe('#B2BAF0')
  await pick(page, 'Код', /^Код Термин$/)
  await expect(cardTitle(page)).toHaveText('Код')
  expect(errors).toEqual([])
})

// Куски сборки: экран графа (с sigma и graphology) и данные графа — отдельные файлы, не в index-*.js;
// главная их не загружает, «Граф» — загружает
test('кусок экрана графа и данные — отдельные файлы сборки, главная их не грузит', async ({ page }) => {
  const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/assets')
  const files = readdirSync(assets).filter((f) => f.endsWith('.js'))
  const one = (re: RegExp) => {
    const found = files.filter((f) => re.test(f))
    expect(found).toHaveLength(1)
    return readFileSync(resolve(assets, found[0]), 'utf8')
  }
  const index = one(/^index-.*\.js$/)
  const screen = one(/^GraphPage-.*\.js$/)
  const data = one(/^graph-.*\.js$/)
  // метки: настройка Sigma, метод graphology, id схемы из graph.json
  expect(screen).toContain('labelRenderedSizeThreshold')
  expect(screen).toContain('mergeEdgeWithKey')
  expect(data).toContain('fig:abc_restaurant')
  for (const mark of ['labelRenderedSizeThreshold', 'mergeEdgeWithKey', 'fig:abc_restaurant']) expect(index).not.toContain(mark)
  expect(Buffer.byteLength(data)).toBeLessThan(500 * 1024)

  const loaded: string[] = []
  page.on('request', (r) => loaded.push(new URL(r.url()).pathname))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeVisible()
  expect(loaded.filter((p) => /\/(GraphPage|graph)-[^/]*\.js$/.test(p))).toEqual([])
  await page.getByRole('navigation', { name: 'Разделы' }).getByRole('button', { name: 'Граф' }).click()
  await expect(page.getByRole('combobox', { name: 'Найти на графе' })).toBeVisible()
  expect(loaded.filter((p) => /\/GraphPage-[^/]*\.js$/.test(p))).toHaveLength(1)
  expect(loaded.filter((p) => /\/graph-[^/]*\.js$/.test(p))).toHaveLength(1)
})
