import { expect, test, type Locator, type Page } from '@playwright/test'
import { inflateSync } from 'node:zlib'
import { clock } from '../src/video/chapters'
import type { VideoScript } from '../video/types'
import ch01Data from '../video/lessons/ch-01/script.gen.json' with { type: 'json' }
import chAbcData from '../video/lessons/ch-abc/script.gen.json' with { type: 'json' }

// Главы новых роликов дня 1 в плеере: список «Главы ролика», подпись текущей главы, переход по кнопке, телефон,
// светлая тема страницы и пояснения на паузе тёмного ролика.

const PAUSE = { name: 'Пауза', exact: true }
const ABC = 'Как устроено приложение'
const CH01 = 'Вайб-кодинг: шкала, а не выключатель'
// #141619 — desk, фон кадра набора «Репозиторий» и сцены (.video-stage.is-dark); #E9EBEE — ink, светлая рамка пояснений
const DESK = 'rgb(20, 22, 25)'
const INK = 'rgb(233, 235, 238)'
// #7A818A — line, линии схем книги в кадре (и их наконечники)
const LINE = 'rgb(122, 129, 138)'

// Сценарии сайта — script.gen.json: их читают ch-abc/script.ts и ch-01/script.ts (там import без атрибута json, Node в Playwright его не берёт)
const chAbcScript = chAbcData as VideoScript
const ch01Script = ch01Data as VideoScript
const chapters = chAbcScript.chapters!

// Блок ролика на странице по названию (заголовок — h3 внутри figure)
function videoFigure(page: Page, title: string): Locator {
  return page.locator('figure.video').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

// «1:17 / 4:29» → 77 (секунды прошедшего времени)
function seconds(text: string | null): number {
  const m = /^(\d+):(\d{2})/.exec(text ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1
}

// Светлая тема — выбор ученика (запись в браузере, её читает скрипт index.html до первой отрисовки); системная настройка нарочно
// противоположная: на кадр ролика не должны влиять ни та ни другая
async function openDay1(page: Page, theme: 'dark' | 'light') {
  await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' })
  if (theme === 'light') await page.addInitScript(() => localStorage.setItem('vibe-course-theme', 'light'))
  await page.goto('/#/day/1')
  expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark')).toBe(theme)
}

// Снимок элемента (PNG 8 бит, RGB или RGBA, без чересстрочности — так сохраняет Chromium) → пиксели [r, g, b]
function decodePng(png: Buffer) {
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')
  let width = 0
  let height = 0
  let channels = 0
  const data: Buffer[] = []
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at)
    const type = png.subarray(at + 4, at + 8).toString('latin1')
    const body = png.subarray(at + 8, at + 8 + length)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      expect([body[8], body[12]]).toEqual([8, 0]) // 8 бит на канал, без чересстрочности
      expect([2, 6]).toContain(body[9]) // RGB или RGBA
      channels = body[9] === 6 ? 4 : 3
    }
    if (type === 'IDAT') data.push(body)
    at += 12 + length
  }
  const raw = inflateSync(Buffer.concat(data))
  const stride = width * channels
  const pixels = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i]
      const left = i >= channels ? pixels[y * stride + i - channels] : 0
      const up = y > 0 ? pixels[(y - 1) * stride + i] : 0
      const upLeft = y > 0 && i >= channels ? pixels[(y - 1) * stride + i - channels] : 0
      const paeth = () => {
        const p = left + up - upLeft
        const [a, b, c] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - upLeft)]
        return a <= b && a <= c ? left : b <= c ? up : upLeft
      }
      pixels[y * stride + i] = (x + [0, left, up, (left + up) >> 1, paeth()][filter]) & 255
    }
  }
  return { width, height, at: (x: number, y: number) => [0, 1, 2].map((c) => pixels[y * stride + x * channels + c]) }
}

for (const [title, script] of [
  [ABC, chAbcScript],
  [CH01, ch01Script],
] as const) {
  test(`у ролика «${title}» список «Главы ролика» повторяет главы сценария`, async ({ page }) => {
    await page.goto('/#/day/1')
    const items = videoFigure(page, title).getByRole('list', { name: 'Главы ролика' }).getByRole('listitem')
    await expect(items).toHaveCount(7)
    expect(script.chapters).toHaveLength(7)
    for (const [i, c] of script.chapters!.entries()) {
      await expect(items.nth(i)).toContainText(c.title)
      await expect(items.nth(i)).toContainText(clock(c.from, script.fps))
    }
    // до запуска текущая — первая глава
    await expect(items.nth(0).getByRole('button')).toHaveAttribute('aria-current', 'true')
  })
}

test('нажатие на третью главу: ролик идёт с её начала, подпись «3/7», пункт отмечен текущим', async ({ page }) => {
  await page.goto('/#/day/1')
  const figure = videoFigure(page, ABC)
  const items = figure.getByRole('list', { name: 'Главы ролика' }).getByRole('listitem')
  await expect(items).toHaveCount(7)
  const third = chapters[2]
  expect(third.title).toBe('Git: история проекта')

  await items.nth(2).getByRole('button').click()

  // ролик идёт: кнопка «Пауза», перемотка не раньше начала главы (точно, в кадрах), время — не раньше секунды её начала
  await expect(figure.getByRole('button', PAUSE)).toBeVisible()
  const seek = figure.getByRole('slider', { name: 'Перемотка' })
  await expect.poll(async () => Number(await seek.inputValue())).toBeGreaterThanOrEqual(third.from)
  const time = figure.getByTestId('video-time')
  await expect.poll(async () => seconds(await time.textContent())).toBeGreaterThanOrEqual(Math.floor(third.from / chAbcScript.fps))
  await expect(figure.getByTestId('video-chapter')).toHaveText(/^3\/7/)
  await expect(figure.getByTestId('video-chapter')).toHaveText(`3/7 · ${third.title}`)
  await expect(items.nth(2).getByRole('button')).toHaveAttribute('aria-current', 'true')
  await expect(items.nth(0).getByRole('button')).not.toHaveAttribute('aria-current', 'true')

  // и дальше идёт, а не стоит на первом кадре главы: через секунду перемотка уехала вперёд
  const at = Number(await seek.inputValue())
  await expect.poll(async () => Number(await seek.inputValue()), { timeout: 5000 }).toBeGreaterThan(at)
  // нажатие «Пауза» ставит ролик на паузу и она не отменяется (после перемотки глава запускается через pause → seekTo → play)
  await figure.getByRole('button', PAUSE).click()
  await expect(figure.getByRole('button', { name: 'Смотреть', exact: true })).toBeVisible()
  const paused = await seek.inputValue()
  await page.waitForTimeout(700)
  expect(await seek.inputValue()).toBe(paused)
})

test('перемотка ползунком в другую главу меняет подпись и текущий пункт списка', async ({ page }) => {
  await page.goto('/#/day/1')
  const figure = videoFigure(page, ABC)
  const items = figure.getByRole('list', { name: 'Главы ролика' }).getByRole('listitem')
  await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(chapters[4].from + 5))
  await expect(figure.getByTestId('video-chapter')).toHaveText(`5/7 · ${chapters[4].title}`)
  await expect(items.nth(4).getByRole('button')).toHaveAttribute('aria-current', 'true')
})

// Review Focus 1: на телефоне страница дня не шире экрана, список глав виден и до него можно дотянуться пальцем
test('день 1 на 390 px: без горизонтальной прокрутки, списки глав видны', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/1')
  const lists = page.getByRole('list', { name: 'Главы ролика' })
  await expect(lists).toHaveCount(2)
  for (const list of await lists.all()) {
    await list.scrollIntoViewIfNeeded()
    await expect(list).toBeVisible()
    await expect(list.getByRole('listitem')).toHaveCount(7)
    // пункт целиком в ширине экрана и не ниже 44 px
    for (const button of await list.getByRole('button').all()) {
      const box = (await button.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  // запущенный ролик с подписью главы в панели тоже не расширяет страницу
  const figure = videoFigure(page, ABC)
  await figure.getByRole('list', { name: 'Главы ролика' }).getByRole('listitem').nth(2).getByRole('button').click()
  await expect(figure.getByTestId('video-chapter')).toHaveText(/^3\/7/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

// Ролик всегда тёмный, от темы страницы не зависит: ни сцена плеера, ни нарисованный кадр не светлеют
test('в светлой теме страницы кадр тёмного ролика остаётся #141619', async ({ page }) => {
  await openDay1(page, 'light')
  // страница действительно светлая (иначе проверка ничего не доказывает): фон body светлее половины шкалы
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const [r, g, b] = bodyBg.match(/\d+/g)!.map(Number)
  expect((r + g + b) / 3).toBeGreaterThan(200)

  // 1) сцена плеера — фон под кадром, пока тот не нарисован, и вокруг него
  const stages = page.locator('.video-stage.is-dark')
  await expect(stages).toHaveCount(2)
  for (const stage of await stages.all()) await expect(stage).toHaveCSS('background-color', DESK)

  // 2) нарисованный кадр: первый svg в .video-frame — композиция 1920 × 1080; первый непрозрачный фон за ним (корень композиции) — #141619
  const frames = page.locator('.video-frame')
  await expect(frames).toHaveCount(2)
  for (const frame of await frames.all()) await expect(frame.locator('svg').first()).toBeVisible()
  const roots = await frames.evaluateAll((els) =>
    els.map((el) => {
      const svg = el.querySelector('svg')!
      for (let at = svg.parentElement; at; at = at.parentElement) {
        const bg = getComputedStyle(at).backgroundColor
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return { viewBox: svg.getAttribute('viewBox'), bg }
      }
      return { viewBox: svg.getAttribute('viewBox'), bg: null }
    }),
  )
  expect(roots).toEqual([
    { viewBox: '0 0 1920 1080', bg: DESK },
    { viewBox: '0 0 1920 1080', bg: DESK },
  ])

  // 3) что видит ученик: в снимке элемента верхняя кромка кадра (над шапкой: y 0–32 из 1080, на экране — первые пиксели) — сплошной #141619.
  // Берём средние 80 % ширины (углы сцены скруглены, за ними видна страница) и строки 1–3: нулевая строка у масштабированного кадра
  // сглажена с краем (19, 21, 24). Допуск — один уровень на канал
  for (const frame of await frames.all()) {
    await frame.scrollIntoViewIfNeeded()
    const shot = decodePng(await frame.screenshot())
    for (let x = Math.floor(shot.width * 0.1); x < shot.width * 0.9; x++) {
      for (const y of [1, 2, 3]) {
        const [r, g, b] = shot.at(x, y)
        expect(Math.max(Math.abs(r - 20), Math.abs(g - 22), Math.abs(b - 25))).toBeLessThanOrEqual(1)
      }
    }
  }
})

// Кадр сцены по номеру: сцены идут подряд, начало — сумма длин предыдущих
function sceneFrame(script: VideoScript, id: string, offset: number): number {
  let start = 0
  for (const s of script.scenes) {
    if (s.id === id) return start + offset
    start += s.durationInFrames
  }
  throw new Error(`нет сцены ${id}`)
}

// Перемотать ролик на кадр (с обложки — запустив его и поставив на паузу); ждём, пока в кадре нарисуется схема (path со стрелкой)
async function seekFigure(figure: Locator, frame: number) {
  const cover = figure.getByRole('button', { name: /^Смотреть ролик «/ })
  if (await cover.count()) {
    await cover.click()
    await figure.getByRole('button', PAUSE).click()
  }
  await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(frame))
  await expect(figure.locator('.video-frame [data-figure] path[marker-end]').first()).toBeAttached()
}

// id внутри SVG ролика уникальны для ролика: на странице дня два кадра рядом, а url(#id) в браузере находит первый элемент с таким id
// во всём документе. Общий id у двух роликов делает чужой клип/маркер/градиент своим (у «ch-01» терялась первая цифра номера главы).
test('день 1: id внутри двух роликов не пересекаются, каждая ссылка url(#…) ведёт в элемент своего ролика', async ({ page }) => {
  await page.goto('/#/day/1')
  // кадры со схемами: шапка, обрезка кадра, растушёвка и маркеры стрелок — всё на месте
  await seekFigure(videoFigure(page, ABC), sceneFrame(chAbcScript, 'parts-restaurant', 400))
  await seekFigure(videoFigure(page, CH01), sceneFrame(ch01Script, 'modes-map', 500))

  const frames = page.locator('.video-frame')
  await expect(frames).toHaveCount(2)
  const found = await frames.evaluateAll((els) =>
    els.map((el) => {
      const ids = [...el.querySelectorAll('[id]')].map((e) => e.id)
      const refs = [...el.querySelectorAll('*')].flatMap((e) =>
        [...e.attributes].flatMap((a) => [...a.value.matchAll(/url\(#([^)]+)\)/g)].map((m) => ({ id: m[1], attr: a.name, own: el.contains(document.getElementById(m[1])) }))),
      )
      return { ids, refs }
    }),
  )
  for (const f of found) {
    expect(f.ids.length).toBeGreaterThan(5)
    expect(f.refs.length).toBeGreaterThan(5)
    // внутри ролика один id — один элемент
    expect(f.ids.filter((id, i) => f.ids.indexOf(id) !== i)).toEqual([])
    // ссылки находят свой элемент: клип обрезки кадра, клип номера главы, градиенты растушёвки, маркеры стрелок
    expect(f.refs.filter((r) => !r.own)).toEqual([])
    expect(f.refs.map((r) => r.attr)).toEqual(expect.arrayContaining(['clip-path', 'marker-end']))
  }
  expect(found[0].ids.filter((id) => found[1].ids.includes(id))).toEqual([])
})

// Наконечники стрелок схем в кадре красятся по теме кадра (FIGURE_VARS обёртки), а не страницы: FigureDefs страницы стоит раньше в документе
// и объявляет те же маркеры; светлая тема страницы красила бы наконечники своими токенами (у ch1_trust ось пропадала).
test('в светлой теме страницы наконечники стрелок схем в кадре — цвета кадра, маркеры лежат в самом кадре', async ({ page }) => {
  await openDay1(page, 'light')
  const heads = async (figure: Locator) =>
    figure.locator('.video-frame').evaluate((frame) =>
      [...frame.querySelectorAll('[data-figure] path[marker-end]')].map((path) => {
        const id = /url\(#([^)]+)\)/.exec(path.getAttribute('marker-end')!)![1]
        // маркер, который рисует браузер: первый элемент с таким id в документе
        const marker = document.getElementById(id)!
        return { id, own: frame.contains(marker), fill: getComputedStyle(marker.querySelector('path')!).fill }
      }),
    )

  // ch-01, «Пять режимов»: линии схемы цвета line — #7A818A (rgb(122, 129, 138)), а не цвет страницы
  const ch01 = videoFigure(page, CH01)
  await seekFigure(ch01, sceneFrame(ch01Script, 'modes-map', 500))
  const lines = await heads(ch01)
  expect(lines.length).toBeGreaterThan(0)
  for (const h of lines) expect(h, h.id).toMatchObject({ own: true, fill: LINE })

  // ch-01, «Бенчмарки»: ось схемы ch1_trust с акцентом — в кадре акцент это ink (#E9EBEE), на странице — синий
  await seekFigure(ch01, sceneFrame(ch01Script, 'bench-trust', 380))
  const accent = await heads(ch01)
  expect(accent.length).toBeGreaterThan(0)
  for (const h of accent) expect(h, h.id).toMatchObject({ own: true, fill: INK })

  // ch-abc: схема «ресторан» — линии
  const abc = videoFigure(page, ABC)
  await seekFigure(abc, sceneFrame(chAbcScript, 'parts-restaurant', 400))
  const restaurant = await heads(abc)
  expect(restaurant.length).toBeGreaterThan(0)
  for (const h of restaurant) expect(h, h.id).toMatchObject({ own: true, fill: LINE })
})

// Пояснение на паузе у тёмного ролика: слой зон помечен is-dark, рамка светлая (#E9EBEE) в обеих темах страницы, зона — над своим местом в кадре
for (const theme of ['dark', 'light'] as const) {
  test(`пояснение на паузе тёмного ролика: светлая рамка, ${theme === 'light' ? 'светлая' : 'тёмная'} тема страницы`, async ({ page }) => {
    await openDay1(page, theme)
    const zone = chAbcScript.hotspots.find((h) => h.title === 'Ответ 400')!
    const figure = videoFigure(page, ABC)
    await figure.getByRole('button', { name: /^Смотреть ролик «/ }).click()
    await figure.getByRole('button', PAUSE).click()
    await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(zone.from + 15))

    const layer = figure.locator('.hotspot-layer')
    await expect(layer).toHaveClass(/is-dark/)
    const spot = figure.getByRole('button', { name: zone.title, exact: true })
    await expect(spot).toBeVisible()
    await expect(spot).toHaveCSS('border-top-color', INK)
    await expect(spot).toHaveCSS('border-top-width', '3px')

    // зона стоит над своим местом: доли кадра 1920 × 1080 (а не 1280 × 720)
    const stage = (await figure.locator('.video-stage').boundingBox())!
    const box = (await spot.boundingBox())!
    expect(Math.abs((box.x - stage.x) / stage.width - zone.x / 1920)).toBeLessThan(0.01)
    expect(Math.abs((box.y - stage.y) / stage.height - zone.y / 1080)).toBeLessThan(0.01)
    expect(Math.abs(box.width / stage.width - zone.w / 1920)).toBeLessThan(0.01)

    await spot.click()
    await expect(figure.getByRole('status')).toContainText(zone.text)
  })
}
