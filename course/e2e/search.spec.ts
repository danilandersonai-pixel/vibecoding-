import { expect, test, type Page } from '@playwright/test'

// Окно поиска в браузере: выдача по трём источникам, переходы к найденному месту, клавиатура, телефон.
// Запросы взяты из данных: «RLS» есть в словаре, в шаге практики дня 1 и в книге.

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Поиск' })
const field = (page: Page) => page.getByRole('searchbox', { name: 'Поиск по курсу и книге' })
const group = (page: Page, name: string) => dialog(page).getByRole('region', { name: new RegExp(`^${name}`) })

// Ошибки страницы (необработанные исключения) — их быть не должно ни в одном сценарии
function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('с главной: «RLS» — в терминах, в курсе и в книге; материал курса открывает день и прокручивает к месту', async ({ page }) => {
  const errors = pageErrors(page)
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Поиск' })
  await button.click()
  await expect(dialog(page)).toBeVisible()
  await expect(field(page)).toBeFocused()
  await expect(dialog(page).getByText('Например:')).toBeVisible()

  await field(page).fill('RLS')
  await expect(dialog(page).getByText(/^Найдено: \d+$/)).toBeVisible()
  for (const name of ['Термины', 'В курсе', 'В книге']) await expect(group(page, name).getByRole('listitem').first()).toBeVisible()
  await expect(group(page, 'В книге').getByRole('link').first()).toHaveAttribute('href', /^book\.html#.+/)
  await expect(group(page, 'В книге').getByRole('link').first()).toHaveAttribute('target', '_blank')
  await expect(group(page, 'Термины').getByRole('listitem').first()).toContainText('Политики доступа к строкам (RLS)')

  // Esc закрывает и возвращает фокус на кнопку; запрос остаётся
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  await expect(button).toBeFocused()
  await button.click()
  await expect(field(page)).toHaveValue('RLS')

  await group(page, 'В курсе').getByRole('button', { name: /Запустить \/init/ }).click()
  await expect(dialog(page)).toBeHidden()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.locator('#part-practice')).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  expect(errors).toEqual([])
})

test('из другого дня: день открывается и после отрисовки прокручивается к блоку', async ({ page }) => {
  await page.goto('/#/day/5')
  await page.getByRole('banner').getByRole('button', { name: 'Поиск' }).click()
  await field(page).fill('Бенчмарки цифрам')
  await group(page, 'В курсе').getByRole('button', { name: /Бенчмарки: каким цифрам верить/ }).click()
  await expect(page).toHaveURL(/#\/day\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
  await expect(page.locator('#block-benchmarks')).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(page.locator('#block-benchmarks')).toBeFocused()
})

test('выбор с клавиатуры: фокус на найденном месте, следующий Tab не уводит страницу наверх', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/day/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
  const button = page.getByRole('banner').getByRole('button', { name: 'Поиск' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(field(page)).toBeFocused()
  await page.keyboard.type('ресторан')
  const hit = group(page, 'В курсе').getByRole('button', { name: /Приложение устроено как ресторан/ })
  await expect(hit).toBeVisible()
  for (let i = 0; i < 10 && !(await hit.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(hit).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog(page)).toBeHidden()

  const block = page.locator('#block-restaurant')
  await expect(block).toBeFocused()
  await expect(block).toBeInViewport()
  await expect(button).not.toBeFocused()
  const before = await page.evaluate(() => window.scrollY)
  expect(before).toBeGreaterThan(0)

  await page.keyboard.press('Tab')
  // следующий элемент — внутри блока или после него, а не стрелка дня в шапке
  expect(
    await block.evaluate((b) => Boolean(b.compareDocumentPosition(document.activeElement!) & (Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY))),
  ).toBe(true)
  await expect(page.locator(':focus')).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(before - 20)
})

test('на странице дня: Ctrl+K открывает окно; результат того же дня — прокрутка без перезагрузки; «/» в заметках — просто символ', async ({ page }) => {
  await page.goto('/#/day/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeVisible()
  await page.evaluate(() => Object.assign(window, { searchMarker: 1 }))

  const notes = page.getByRole('textbox', { name: /Заметки дня/ })
  await notes.click()
  await page.keyboard.press('/')
  await expect(dialog(page)).toBeHidden()
  await expect(notes).toHaveValue('/')

  await page.keyboard.press('Control+KeyK')
  await expect(dialog(page)).toBeVisible()
  await expect(field(page)).toBeFocused()
  await expect(notes).toHaveValue('/')

  // Tab ходит по кругу внутри окна
  await field(page).fill('модель')
  await expect(group(page, 'В курсе').getByRole('listitem').first()).toBeVisible()
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog(page).evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }

  await field(page).fill('Подписки токены лимиты')
  await group(page, 'В курсе').getByRole('button', { name: /Подписки, токены и лимиты/ }).click()
  await expect(dialog(page)).toBeHidden()
  await expect(page.locator('#block-limits')).toBeInViewport()
  await expect(page).toHaveURL(/#\/day\/1$/)
  expect(await page.evaluate(() => (window as unknown as { searchMarker?: number }).searchMarker)).toBe(1)
})

test('кусок книги не загрузился: «Поиск по книге сейчас недоступен», термины и курс работают', async ({ page }) => {
  const errors = pageErrors(page)
  await page.route(/book-index-[^/]*\.js$/, (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Поиск' }).click()
  await field(page).fill('RLS')
  await expect(group(page, 'В книге')).toContainText('Поиск по книге сейчас недоступен')
  await expect(group(page, 'Термины').getByRole('listitem').first()).toBeVisible()
  await expect(group(page, 'В курсе').getByRole('button').first()).toBeVisible()
  expect(errors).toEqual([])
})

// Затемнение под окном темнит страницу в обеих темах: цвет слоя поверх фона страницы темнее самого фона.
// Тема — выбор ученика (запись в браузере, её читает скрипт index.html); системная настройка — нарочно противоположная
for (const theme of ['dark', 'light'] as const) {
  test(`затемнение под окном темнее страницы (${theme === 'light' ? 'светлая' : 'тёмная'} тема)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' })
    if (theme === 'light') await page.addInitScript(() => localStorage.setItem('vibe-course-theme', 'light'))
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark')).toBe(theme)
    await page.getByRole('button', { name: 'Поиск' }).click()
    const [desk, dimmed] = await dialog(page).evaluate((d) => {
      // rgb(…) / rgba(…) или color(srgb 0…1 / a) → [r, g, b, a] в 0…255
      const parse = (css: string) => {
        const n = css.match(/[\d.]+/g)!.map(Number)
        const k = css.startsWith('color(') ? 255 : 1
        return [n[0] * k, n[1] * k, n[2] * k, n[3] ?? 1]
      }
      const lum = ([r, g, b]: number[]) =>
        [r, g, b].map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
      const bg = parse(getComputedStyle(document.body).backgroundColor)
      const [r, g, b, a] = parse(getComputedStyle(d.parentElement!).backgroundColor)
      return [lum(bg), lum([r, g, b].map((c, i) => c * a + bg[i] * (1 - a)))]
    })
    expect(dimmed).toBeLessThan(desk)
  })
}

// Телефон: боковая панель — строка сверху (и на главной, и в дне); у «Поиска» только лупа — нажатие 44 × 44, имя «Поиск»;
// на 390 px строка — в один ряд
test('на 390 px «Поиск» — значок лупы, верхняя строка главной в один ряд', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Поиск' })
  const box = (await button.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.width).toBeLessThan(60)
  expect(box.height).toBeGreaterThanOrEqual(44)
  const brand = (await page.locator('.sitebar-brand').boundingBox())!
  expect(Math.abs(brand.y + brand.height / 2 - (box.y + box.height / 2))).toBeLessThan(4)

  await page.goto('/#/day/1')
  const day = (await page.getByRole('banner').getByRole('button', { name: 'Поиск' }).boundingBox())!
  expect([day.width >= 44 && day.width < 60, day.height >= 44]).toEqual([true, true])
})

// Телефон: окно на весь экран; длинный термин и длинный фрагмент книги с кодом переносятся, вбок ничего не прокручивается
for (const size of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
  test(`на ${size.width}×${size.height} окно на весь экран, без прокрутки вбок`, async ({ page }) => {
    // «уменьшить движение»: окно появляется без анимации и сразу на месте
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(size)
    await page.goto('/')
    await page.getByRole('button', { name: 'Поиск' }).click()
    const box = (await dialog(page).boundingBox())!
    expect([box.x, box.y, box.width, box.height].map(Math.round)).toEqual([0, 0, size.width, size.height])

    for (const query of ['RLS', 'Карточка модели', 'onConflictDoNothing']) {
      await field(page).fill(query)
      await expect(dialog(page).getByRole('listitem').first()).toBeVisible()
      const overflow = await page.evaluate(() => {
        const wide = (el: Element) => el.scrollWidth > el.clientWidth
        return {
          page: document.documentElement.scrollWidth > window.innerWidth,
          panel: wide(document.querySelector('[role="dialog"]')!),
          items: [...document.querySelectorAll('[role="dialog"] li')].filter(wide).length,
        }
      })
      expect(overflow).toEqual({ page: false, panel: false, items: 0 })
    }
  })
}
