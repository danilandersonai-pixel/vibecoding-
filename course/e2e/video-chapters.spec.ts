import { expect, test, type Locator, type Page } from '@playwright/test'
import { inflateSync } from 'node:zlib'
import { chapterIndexAt, clock } from '../src/video/chapters'
import type { VideoScript } from '../video/types'
import { day08Script } from '../video/day-08/script'
import ch01Data from '../video/lessons/ch-01/script.gen.json' with { type: 'json' }
import ch02Data from '../video/lessons/ch-02/script.gen.json' with { type: 'json' }
import ch03Data from '../video/lessons/ch-03/script.gen.json' with { type: 'json' }
import ch04Data from '../video/lessons/ch-04/script.gen.json' with { type: 'json' }
import ch05Data from '../video/lessons/ch-05/script.gen.json' with { type: 'json' }
import ch06Data from '../video/lessons/ch-06/script.gen.json' with { type: 'json' }
import ch08Data from '../video/lessons/ch-08/script.gen.json' with { type: 'json' }
import ch09Data from '../video/lessons/ch-09/script.gen.json' with { type: 'json' }
import ch10Data from '../video/lessons/ch-10/script.gen.json' with { type: 'json' }
import ch11Data from '../video/lessons/ch-11/script.gen.json' with { type: 'json' }
import ch12Data from '../video/lessons/ch-12/script.gen.json' with { type: 'json' }
import chAbcData from '../video/lessons/ch-abc/script.gen.json' with { type: 'json' }
import pilotRlsData from '../video/lessons/pilot-rls/script.gen.json' with { type: 'json' }
import day02 from '../content/days/day-02.json' with { type: 'json' }
import day03 from '../content/days/day-03.json' with { type: 'json' }
import day04 from '../content/days/day-04.json' with { type: 'json' }
import day05 from '../content/days/day-05.json' with { type: 'json' }
import day06 from '../content/days/day-06.json' with { type: 'json' }
import day07 from '../content/days/day-07.json' with { type: 'json' }
import day08 from '../content/days/day-08.json' with { type: 'json' }

// Главы новых роликов в плеере: список «Главы ролика», подпись текущей главы, переход по кнопке, телефон (дни 1–8),
// светлая тема страницы, пояснения на паузе тёмного ролика и два новых ролика на одной странице (дни 1 и 2).

const PLAY = { name: 'Смотреть', exact: true }
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

// Сценарии роликов дней 2–8 по id ролика (как в video/catalog.ts): новые — снимки script.gen.json, старый день 8 — его script.ts
const SCRIPTS: Record<string, VideoScript> = {
  'ch-02': ch02Data as VideoScript,
  'ch-12': ch12Data as VideoScript,
  'ch-03': ch03Data as VideoScript,
  'ch-06': ch06Data as VideoScript,
  'pilot-rls': pilotRlsData as VideoScript,
  'ch-05': ch05Data as VideoScript,
  'ch-04': ch04Data as VideoScript,
  'ch-08': ch08Data as VideoScript,
  'ch-09': ch09Data as VideoScript,
  'ch-10': ch10Data as VideoScript,
  'ch-11': ch11Data as VideoScript,
  'day-08': day08Script,
}
type DayJson = { blocks: { type: string; videoId?: string; title?: string }[] }
const DAYS: Record<number, DayJson> = { 2: day02, 3: day03, 4: day04, 5: day05, 6: day06, 7: day07, 8: day08 } as unknown as Record<number, DayJson>

// Ролики дня по порядку страницы: название блока из файла дня и сценарий ролика
function dayVideos(day: number): { title: string; script: VideoScript }[] {
  return DAYS[day].blocks
    .filter((b) => b.type === 'video')
    .map((b) => {
      const script = SCRIPTS[b.videoId!]
      if (!script) throw new Error(`нет сценария ролика ${b.videoId} (день ${day})`)
      return { title: b.title!, script }
    })
}

// Блок ролика на странице по названию (заголовок — h3 внутри figure)
function videoFigure(page: Page, title: string): Locator {
  return page.locator('figure.video').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

// Страница не шире экрана: горизонтальной прокрутки нет
const fitsWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

// Прямоугольник элемента в координатах документа: прокрутка страницы (Playwright подкручивает её перед нажатием) его не меняет
const pageBox = (locator: Locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height }
  })

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

// id внутри кадров страницы и ссылки url(#…) из них; own — ссылка находит элемент своего кадра (браузер берёт первый с таким id в документе)
function frameRefs(page: Page) {
  return page.locator('.video-frame').evaluateAll((els) =>
    els.map((el) => {
      const ids = [...el.querySelectorAll('[id]')].map((e) => e.id)
      const refs = [...el.querySelectorAll('*')].flatMap((e) =>
        [...e.attributes].flatMap((a) => [...a.value.matchAll(/url\(#([^)]+)\)/g)].map((m) => ({ id: m[1], attr: a.name, own: el.contains(document.getElementById(m[1])) }))),
      )
      return { ids, refs }
    }),
  )
}

// id внутри SVG ролика уникальны для ролика: на странице дня два кадра рядом, а url(#id) в браузере находит первый элемент с таким id
// во всём документе. Общий id у двух роликов делает чужой клип/маркер/градиент своим (у «ch-01» терялась первая цифра номера главы).
test('день 1: id внутри двух роликов не пересекаются, каждая ссылка url(#…) ведёт в элемент своего ролика', async ({ page }) => {
  await page.goto('/#/day/1')
  // кадры со схемами: шапка, обрезка кадра, растушёвка и маркеры стрелок — всё на месте
  await seekFigure(videoFigure(page, ABC), sceneFrame(chAbcScript, 'parts-restaurant', 400))
  await seekFigure(videoFigure(page, CH01), sceneFrame(ch01Script, 'modes-map', 500))

  await expect(page.locator('.video-frame')).toHaveCount(2)
  const found = await frameRefs(page)
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

// Шапка кадра (data-header): номер главы, клип номера и сам клип, который применит браузер (первый элемент с этим id в документе).
// left и right — запас от края цифр до краёв клипа в px кадра: оба не меньше нуля — номер виден целиком
function headerNumber(figure: Locator) {
  return figure.locator('.video-frame [data-header]').evaluate((header) => {
    const frame = header.closest('.video-frame')!
    const root = header.firstElementChild!
    const clipped = root.querySelector('g[clip-path]')!
    const id = /url\(#([^)]+)\)/.exec(clipped.getAttribute('clip-path')!)![1]
    const clip = document.getElementById(id)!
    const rect = clip.querySelector('rect')!
    const x = Number(rect.getAttribute('x'))
    const width = Number(rect.getAttribute('width'))
    const numbers = [...clipped.querySelectorAll('text')] as SVGTextElement[]
    const box = numbers[numbers.length - 1].getBBox()
    return {
      id,
      own: frame.contains(clip),
      numbers: numbers.map((t) => t.textContent),
      left: box.x - x,
      right: x + width - (box.x + box.width),
      // id ролика слева и «/07 · Название» после номера
      texts: [...root.querySelectorAll(':scope > text')].map((t) => t.textContent),
    }
  })
}

// Review Focus 4: на дне 2 два новых ролика (ch-02 и ch-12, общая запись s03-spec). У каждого свой список глав, раскладка — как у дня 1
// (каждый во всю ширину сетки, друг под другом), запуск второго ставит первый на паузу, id кадров не пересекаются,
// а шапка второго кадра рисует свой номер главы целиком: клип номера — свой, а не соседнего ролика
test('день 2: два новых ролика, у каждого свои главы, кадры не мешают друг другу', async ({ page }) => {
  await page.goto('/#/day/2')
  const videos = dayVideos(2)
  expect(videos.map((v) => v.script.id)).toEqual(['ch-02', 'ch-12'])
  expect(videos.map((v) => v.script.width)).toEqual([1920, 1920])
  // главы у уроков разные: списки не списаны один с другого
  expect(videos[0].script.chapters!.map((c) => c.title)).not.toEqual(videos[1].script.chapters!.map((c) => c.title))
  for (const { title, script } of videos) {
    const items = videoFigure(page, title).getByRole('list', { name: 'Главы ролика' }).getByRole('listitem')
    await expect(items).toHaveCount(script.chapters!.length)
    for (const [i, c] of script.chapters!.entries()) {
      await expect(items.nth(i)).toContainText(c.title)
      await expect(items.nth(i)).toContainText(clock(c.from, script.fps))
    }
  }

  // раскладка (та же проверка, что у дня 1 в e2e/video.spec.ts): тёмные ролики — каждый во всю ширину сетки, друг под другом
  await expect(page.locator('.video-grid .video-stage.is-dark')).toHaveCount(2)
  const rows = await page.locator('.video-grid .video-stage').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))
  const grid = await page.locator('.video-grid').first().evaluate((el) => el.getBoundingClientRect().width)
  expect(rows).toHaveLength(2)
  expect(rows[1].top).toBeGreaterThan(rows[0].bottom)
  for (const r of rows) expect(Math.abs(r.width - grid)).toBeLessThan(2)

  // запуск второго ставит первый на паузу: первый снова предлагает «Смотреть», его время стоит
  const [first, second] = videos.map((v) => videoFigure(page, v.title))
  const firstTime = first.getByTestId('video-time')
  await first.getByRole('button', PLAY).click()
  await expect(firstTime).not.toHaveText(/^0:00/, { timeout: 5000 })
  await second.getByRole('button', { name: `Смотреть ролик «${videos[1].title}»` }).click()
  await expect(second.getByRole('button', PAUSE)).toBeVisible()
  await expect(first.getByRole('button', PLAY)).toBeVisible()
  await expect(first.getByRole('button', PAUSE)).toHaveCount(0)
  const firstAt = await firstTime.textContent()
  await page.waitForTimeout(1200)
  await expect(firstTime).toHaveText(firstAt ?? '')

  // оба на паузе в середине своих глав (после 12 кадров смены номера): первый — во второй главе, второй — в третьей
  await second.getByRole('button', PAUSE).click()
  const at = [videos[0].script.chapters![1].from + 30, videos[1].script.chapters![2].from + 30]
  for (const [i, figure] of [first, second].entries()) {
    await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(at[i]))
    const { script } = videos[i]
    const n = chapterIndexAt(script.chapters!, at[i])
    expect(n).toBe(i + 1)
    await expect(figure.getByTestId('video-chapter')).toHaveText(`${n + 1}/${script.chapters!.length} · ${script.chapters![n].title}`)
  }

  // шапки кадров: номер своей главы целиком, клип номера — из своего кадра
  for (const [i, figure] of [first, second].entries()) {
    const { script } = videos[i]
    const n = i + 2
    await expect.poll(async () => (await headerNumber(figure)).numbers).toEqual([String(n).padStart(2, '0')])
    const header = await headerNumber(figure)
    expect(header.id).toContain(script.id)
    expect(header.own).toBe(true)
    expect(header.left).toBeGreaterThanOrEqual(-0.5)
    expect(header.right).toBeGreaterThanOrEqual(-0.5)
    expect(header.texts[0]).toBe(script.id)
    expect(header.texts[1]).toMatch(new RegExp(`^/${String(script.chapters!.length).padStart(2, '0')} · `))
  }

  // id внутри двух кадров не пересекаются, каждая ссылка url(#…) — в свой кадр (среди них клип номера главы)
  const found = await frameRefs(page)
  expect(found).toHaveLength(2)
  for (const f of found) {
    expect(f.ids.length).toBeGreaterThan(2)
    expect(f.ids.filter((id, k) => f.ids.indexOf(id) !== k)).toEqual([])
    expect(f.refs.filter((r) => !r.own)).toEqual([])
    expect(f.refs.map((r) => r.attr)).toContain('clip-path')
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
    // рамка — снаружи зоны (outline с отступом), внутри зоны рамки нет: узкую часть кадра она не закрывает
    await expect(spot).toHaveCSS('outline-color', INK)
    await expect(spot).toHaveCSS('outline-width', '2px')
    await expect(spot).toHaveCSS('outline-offset', '2px')
    await expect(spot).toHaveCSS('border-top-width', '0px')

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

// Review Focus 5: на телефоне пояснение по нажатию не закрывает кадр — панель встаёт под ним (на компьютере она лежит поверх низа кадра)
test('телефон 390 px: открытое пояснение стоит под кадром и не закрывает его', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/day/1')
  const zone = chAbcScript.hotspots.find((h) => h.title === 'Ответ 400')!
  const figure = videoFigure(page, ABC)
  await figure.getByRole('button', { name: /^Смотреть ролик «/ }).click()
  await figure.getByRole('button', PAUSE).click()
  await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(zone.from + 15))

  const stage = figure.locator('.video-stage')
  const before = (await stage.boundingBox())!
  const spot = figure.getByRole('button', { name: zone.title, exact: true })
  await expect(spot).toBeVisible()
  await spot.click()
  const note = figure.getByRole('status')
  await expect(note).toContainText(zone.text)

  // верх панели не выше низа кадра, панель в ширине экрана; сам кадр не сдвинулся и не сжался
  const frame = (await stage.boundingBox())!
  const box = (await note.boundingBox())!
  expect(box.y).toBeGreaterThanOrEqual(frame.y + frame.height - 0.5)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(frame).toEqual(before)
  // зона по-прежнему над своим местом в кадре, и её можно нажать ещё раз — пояснение закрывается
  await expect(spot).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await spot.click()
  await expect(note).toHaveCount(0)
})

// Пункты списка глав на экране: прямоугольник кнопки, вылезает ли её содержимое, и перенос названия — сколько в нём строк
// и сколько px заняла бы та же надпись одной строкой (natural) против ширины, что у названия есть (room)
function chapterButtons(list: Locator) {
  return list.getByRole('button').evaluateAll((buttons) =>
    buttons.map((b) => {
      const r = b.getBoundingClientRect()
      const title = b.querySelector<HTMLElement>('.video-chapter-title')!
      const t = title.getBoundingClientRect()
      const probe = title.cloneNode(true) as HTMLElement
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto'
      b.append(probe)
      const natural = probe.getBoundingClientRect().width
      probe.remove()
      return {
        text: title.textContent,
        left: r.left,
        right: r.right,
        height: r.height,
        overflow: b.scrollWidth - b.clientWidth,
        titleRight: t.right,
        innerRight: r.right - parseFloat(getComputedStyle(b).paddingRight),
        lines: Math.round(t.height / parseFloat(getComputedStyle(title).lineHeight)),
        natural,
        room: t.width,
      }
    }),
  )
}

// Review Focus 5: дни 2–8 на телефоне. Страница не шире экрана, списки «Главы ролика» видны и переносятся (длинное название —
// в несколько строк внутри пункта, а не за край), а первое пояснение первого ролика дня открывается по нажатию на паузе
// и встаёт под кадром, не закрывая его (как у дня 1 выше). День 8 — старый ролик 1280 × 720: глав у него нет, списка тоже
for (const day of [2, 3, 4, 5, 6, 7, 8]) {
  test(`день ${day} на телефоне 390 px — без горизонтальной прокрутки, пояснение под кадром`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/#/day/${day}`)
    const videos = dayVideos(day)
    expect(videos.length).toBeGreaterThan(0)
    await expect(page.locator('figure.video')).toHaveCount(videos.length)
    // кадры нарисованы: ленивый код роликов загрузился (svg внутри плеера, а не только обложка)
    for (const frame of await page.locator('.video-frame').all()) await expect(frame.locator('svg').first()).toBeVisible()
    expect(await fitsWidth(page)).toBe(true)

    const withChapters = videos.filter((v) => v.script.chapters?.length)
    if (day === 8) expect(withChapters).toEqual([])
    else expect(withChapters).toHaveLength(videos.length)
    await expect(page.getByRole('list', { name: 'Главы ролика' })).toHaveCount(withChapters.length)
    for (const { title, script } of withChapters) {
      const list = videoFigure(page, title).getByRole('list', { name: 'Главы ролика' })
      await list.scrollIntoViewIfNeeded()
      await expect(list).toBeVisible()
      await expect(list.getByRole('listitem')).toHaveCount(script.chapters!.length)
      for (const b of await chapterButtons(list)) {
        // пункт целиком в ширине экрана, не ниже 44 px; ни время, ни название не вылезают за кнопку
        expect(b.left, b.text!).toBeGreaterThanOrEqual(0)
        expect(b.right, b.text!).toBeLessThanOrEqual(390)
        expect(b.height, b.text!).toBeGreaterThanOrEqual(44)
        expect(b.overflow, b.text!).toBeLessThanOrEqual(0)
        expect(b.titleRight, b.text!).toBeLessThanOrEqual(b.innerRight + 0.5)
        // не помещается одной строкой — переносится, помещается — стоит в одну
        if (b.natural > b.room + 1) expect(b.lines, b.text!).toBeGreaterThanOrEqual(2)
        else expect(b.lines, b.text!).toBe(1)
      }
    }
    expect(await fitsWidth(page)).toBe(true)

    // первое пояснение первого ролика дня: пауза, кадр from + 15, нажатие на зону
    const { title, script } = videos[0]
    const zone = [...script.hotspots].sort((a, b) => a.from - b.from)[0]
    expect(zone.from + 15).toBeLessThan(zone.to)
    const figure = videoFigure(page, title)
    await figure.getByRole('button', { name: `Смотреть ролик «${title}»` }).click()
    await figure.getByRole('button', PAUSE).click()
    await figure.getByRole('slider', { name: 'Перемотка' }).fill(String(zone.from + 15))

    const stage = figure.locator('.video-stage')
    const spot = figure.getByRole('button', { name: zone.title, exact: true })
    await expect(spot).toBeVisible()
    const before = await pageBox(stage)
    await spot.click()
    const note = figure.getByRole('status')
    await expect(note).toContainText(zone.text)

    // верх панели не выше низа кадра, панель в ширине экрана; сам кадр не сдвинулся и не сжался
    const frame = await pageBox(stage)
    const box = await pageBox(note)
    expect(box.y).toBeGreaterThanOrEqual(frame.y + frame.height - 0.5)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
    expect(frame).toEqual(before)
    await expect(spot).toBeVisible()
    expect(await fitsWidth(page)).toBe(true)
  })
}
