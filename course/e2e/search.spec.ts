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
