import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» компоненты шапки и субтитров, задаёт тест.
const clock = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => clock.frame }))

import { SubtitlesShown } from '../../lib/subtitlesShown'
import { balanceText, fitText } from '../text'
import { MIN_TEXT, SUBS, T } from '../theme'
import { Header, HeaderBook } from './Header'
import { bookRoom, CELL, cellsFor, fadeOpacity, HEADER_BOOK, HEADER_COLS, RIGHT, titleRoom, VIEW, verdictWidth } from './layout'
import { TermSubtitles } from './Subtitles'
import { Verdict } from './Verdict'
import { CameraFade, CameraFadeDefs } from './CameraFade'

const CUES = [
  { from: 10, to: 40, text: 'Первая реплика' },
  { from: 40, to: 90, text: 'Вторая реплика, подлиннее первой' },
]
const CHAPTER = { n: 2, total: 7, title: 'Git: история проекта' }
const VERDICTS: { at: number; kind: 'wrong' | 'right' }[] = [
  { at: 20, kind: 'wrong' },
  { at: 60, kind: 'right' },
]

const header = () => renderToStaticMarkup(<svg><Header lessonId="ch-abc" chapter={CHAPTER} book="книга · Азбука · Где живёт код" at={100} /></svg>)
const verdict = (mistake = true) => renderToStaticMarkup(<svg><Verdict mistake={mistake} verdict={VERDICTS} /></svg>)
const subtitles = (shown = true) =>
  renderToStaticMarkup(
    <SubtitlesShown.Provider value={shown}>
      <TermSubtitles cues={CUES} />
    </SubtitlesShown.Provider>,
  )

// Все размеры шрифта в разметке: атрибут font-size, свойство font-size и сокращение font.
function fontSizes(html: string) {
  const sizes = [
    ...[...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font:\s*(?:\d+\s+)?([\d.]+)px/g)].map((m) => Number(m[1])),
  ]
  expect(sizes.length).toBeGreaterThan(0)
  return sizes
}

afterEach(() => {
  clock.frame = 0
})

describe('TermSubtitles', () => {
  it('по умолчанию показывает реплику текущего кадра', () => {
    clock.frame = 20
    expect(subtitles()).toContain('Первая реплика')
    expect(subtitles()).not.toContain('Вторая реплика')
    clock.frame = 40
    expect(subtitles()).toContain('Вторая реплика, подлиннее первой')
  })

  it('выключенные субтитры не рисуются', () => {
    clock.frame = 20
    expect(subtitles(false)).toBe('')
  })

  it('между репликами и вне их — ничего', () => {
    for (const frame of [0, 9, 90, 500]) {
      clock.frame = frame
      expect(subtitles()).toBe('')
    }
  })

  it('длинная реплика переносится на две строки — каждая отдельным блоком', () => {
    clock.frame = 5
    const long = 'Телефон Анны — зал, его зовут фронтендом: всё, что видно и нажимается. Заказ несёт официант — это API, правила.'
    const html = renderToStaticMarkup(<TermSubtitles cues={[{ from: 0, to: 30, text: long }]} />)
    const lines = [...html.matchAll(/data-line="\d+"[^>]*>([^<]*)</g)].map((m) => m[1])
    expect(lines).toHaveLength(2)
    expect(lines.join(' ')).toBe(long)
  })

  it('две строки выровнены по длине — тем же переносом, что проверяет урок (balanceText)', () => {
    clock.frame = 5
    const text = 'Сервер запущен, страница открывается на localhost, и вывод идёт в терминал.'
    const html = renderToStaticMarkup(<TermSubtitles cues={[{ from: 0, to: 30, text }]} />)
    const lines = [...html.matchAll(/data-line="\d+"[^>]*>([^<]*)</g)].map((m) => m[1])
    expect(lines).toEqual(balanceText(text, SUBS.size, SUBS.maxWidth))
    expect(lines[1]).not.toBe('терминал.')
  })

  it('плашка term-bg с прозрачностью 88 %, Golos Text 500 40 px', () => {
    clock.frame = 20
    const html = subtitles()
    expect(html).toContain('rgba(15,17,19,0.88)')
    expect(html).toContain('font-size:40px')
    expect(html).toContain('font-weight:500')
    expect(html).toContain('Golos Text')
    expect(html).toContain('border-radius:6px')
  })
})

describe('Header', () => {
  it('слева ролик и глава «02/07 · название», справа ссылка на книгу', () => {
    clock.frame = 200
    const html = header()
    expect(html).toContain('ch-abc')
    expect(html).toContain('02')
    expect(html).toContain('/07')
    expect(html).toContain('Git: история проекта')
    expect(html).toContain('книга · Азбука · Где живёт код')
  })

  it('до смены главы и после неё номер один, в 12 кадров смены видны оба: старый уходит, новый приходит', () => {
    clock.frame = 200
    expect(header()).not.toContain('>01<')
    clock.frame = 106
    const mid = header()
    expect(mid).toContain('>01<')
    expect(mid).toContain('>02<')
    clock.frame = 100 + 12
    expect(header()).not.toContain('>01<')
  })

  it('первая глава не крутит номер: предыдущего нет', () => {
    clock.frame = 101
    const html = renderToStaticMarkup(<svg><Header lessonId="ch-abc" chapter={{ n: 1, total: 7, title: 'Что узнаете' }} book="" at={100} /></svg>)
    expect(html).toContain('>01<')
    expect(html).not.toContain('>00<')
  })

  it('длинное название обрезается с «…», а не налезает на ссылку на книгу', () => {
    clock.frame = 200
    const html = renderToStaticMarkup(
      <svg><Header lessonId="ch-abc" chapter={{ n: 2, total: 7, title: 'Очень длинное название главы, которое не помещается в шапку целиком' }} book="книга · Азбука · Где живёт код: терминал, редактор" at={100} /></svg>,
    )
    expect(html).toContain('…')
    expect(html).not.toContain('помещается в шапку целиком')
  })

  it('reserve — место справа под то, что рисует не шапка (метки ошибки, ссылка на книгу сцены): название до него не доходит', () => {
    clock.frame = 200
    const title = 'Очень длинное название главы, которое никак не помещается рядом с метками ошибки'
    const reserve = verdictWidth(true)
    const html = renderToStaticMarkup(<svg><Header lessonId="ch-abc" chapter={{ n: 2, total: 7, title }} book="" reserve={reserve} at={100} /></svg>)
    const room = titleRoom('ch-abc', Math.ceil(reserve / CELL))
    expect(html).toContain(`/07 · ${fitText(title, room)}`)
    expect(fitText(title, room)).toMatch(/…$/)
  })

  it('reserve ровно в n знаков — n знаков, а не n + 1 из-за дробной ширины знака', () => {
    for (const n of [1, 26, 55, 56]) expect(cellsFor(n * CELL)).toBe(n)
    expect(cellsFor(0)).toBe(0)
    expect(cellsFor(CELL + 0.5)).toBe(2)
  })

  it('titleRoom и bookRoom: id, номер, «/07 · », название и ссылка на книгу вместе не длиннее строки шапки', () => {
    expect(HEADER_COLS).toBe(102)
    // «ch-abc  02/07 · » — 16 знаков, промежуток до правой части — 3
    expect(titleRoom('ch-abc', 0)).toBe(HEADER_COLS - 16)
    expect(titleRoom('ch-abc', 40)).toBe(HEADER_COLS - 16 - 3 - 40)
    expect(bookRoom('ch-abc', 'Git: история проекта')).toBe(HEADER_BOOK.max)
    const long = 'а'.repeat(60)
    expect(bookRoom('ch-abc', long)).toBe(HEADER_COLS - 16 - 3 - 60)
    expect(titleRoom('ch-abc', bookRoom('ch-abc', long))).toBe(60)
  })

  it('клип номера главы свой у каждого ролика: на странице дня их два, а url(#…) берёт первый id в документе', () => {
    clock.frame = 200
    const of = (lessonId: string) =>
      renderToStaticMarkup(<svg><Header lessonId={lessonId} chapter={CHAPTER} book="" at={100} /></svg>)
    const [a, b] = [of('ch-abc'), of('ch-01')]
    const idA = /<clipPath id="([^"]+)"/.exec(a)![1]
    const idB = /<clipPath id="([^"]+)"/.exec(b)![1]
    expect(idA).not.toBe(idB)
    expect(a).toContain(`clip-path="url(#${idA})"`)
    expect(b).toContain(`clip-path="url(#${idB})"`)
    // один и тот же ролик в одном кадре даёт один и тот же id: рендер детерминирован
    expect(of('ch-01')).toBe(b)
  })

  it('HeaderBook — ссылка на книгу справа в шапке, как у Header', () => {
    const html = renderToStaticMarkup(<svg><HeaderBook text="книга · Азбука · Где живёт код" /></svg>)
    expect(html).toContain('книга · Азбука · Где живёт код')
    expect(html).toContain(`x="${RIGHT}"`)
    expect(html).toContain('text-anchor="end"')
    expect(html).toContain(T.faint)
  })
})

describe('Verdict', () => {
  it('без ошибки и без вердиктов — ничего', () => {
    clock.frame = 200
    expect(renderToStaticMarkup(<svg><Verdict mistake={false} verdict={[]} /></svg>)).toBe('<svg></svg>')
    clock.frame = 5
    expect(renderToStaticMarkup(<svg><Verdict mistake={false} verdict={VERDICTS} /></svg>)).toBe('<svg></svg>')
  })

  it('в сцене-ошибке — метка «Типичная ошибка» цвета err с первого кадра', () => {
    clock.frame = 0
    const html = verdict()
    expect(html).toContain('Типичная ошибка')
    expect(html).toContain(T.err)
    expect(html).not.toContain('Неверно')
  })

  it('«Неверно» (err) с кадра вердикта, затем «Верно» (ok) вместо него', () => {
    clock.frame = 25
    let html = verdict()
    expect(html).toContain('Неверно')
    expect(html).not.toContain('>Верно<')
    clock.frame = 70
    html = verdict()
    expect(html).toContain('>Верно<')
    expect(html).not.toContain('Неверно')
    expect(html).toContain(T.ok)
  })

  it('verdictWidth — сколько места справа занимают метки: левый край «Типичная ошибка»', () => {
    clock.frame = 0
    const x = Number(/<rect x="([\d.]+)"/.exec(verdict())![1])
    expect(x).toBeCloseTo(RIGHT - verdictWidth(true) + 1)
    const alone = renderToStaticMarkup(<svg><Verdict mistake verdict={[]} /></svg>)
    expect(Number(/<rect x="([\d.]+)"/.exec(alone)![1])).toBeCloseTo(RIGHT - verdictWidth(false) + 1)
  })

  it('вердикт показывается и вне сцены-ошибки, но без метки «Типичная ошибка»', () => {
    clock.frame = 70
    const html = verdict(false)
    expect(html).toContain('>Верно<')
    expect(html).not.toContain('Типичная ошибка')
  })
})

describe('CameraFade', () => {
  const fade = (zoom: number, lessonId = 'ch-abc') => renderToStaticMarkup(<svg><CameraFade zoom={zoom} lessonId={lessonId} /></svg>)
  const defs = (lessonId = 'ch-abc') => renderToStaticMarkup(<svg><CameraFadeDefs lessonId={lessonId} /></svg>)
  const idsOf = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const refsOf = (html: string) => [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])

  it('при zoom 1 растушёвки нет, при наезде — по краям видимой части кадра (ниже шапки, выше субтитров)', () => {
    expect(fade(1)).toBe('<svg></svg>')
    const html = fade(1.6)
    expect(refsOf(html)).toHaveLength(4)
    expect(refsOf(html)).toEqual(idsOf(defs()))
    expect(html).toContain('opacity="1"')
    // полоса 48 px: сверху от шапки, снизу до полосы субтитров
    expect(html).toContain(`y="${VIEW.top}"`)
    expect(html).toContain(`y="${VIEW.bottom - 48}"`)
    expect(html).toContain('width="48"')
  })

  it('непрозрачность растёт с наездом: 0 при zoom 1, половина при 1,15, полная с 1,3', () => {
    expect(fadeOpacity(1)).toBe(0)
    expect(fadeOpacity(1.15)).toBeCloseTo(0.5)
    expect(fadeOpacity(1.3)).toBe(1)
    expect(fadeOpacity(1.6)).toBe(1)
    expect(fade(1.15)).toContain('opacity="0.5"')
  })

  it('градиенты — из desk в прозрачный', () => {
    const html = defs()
    expect(idsOf(html)).toHaveLength(4)
    expect(html).toContain(T.desk)
    expect(html).toContain('stop-opacity="0"')
  })

  it('id градиентов свои у каждого ролика: растушёвка второго не берёт градиенты первого', () => {
    const [a, b] = [defs('ch-abc'), defs('ch-01')]
    expect(idsOf(a).filter((id) => idsOf(b).includes(id))).toEqual([])
    expect(refsOf(fade(1.6, 'ch-01'))).toEqual(idsOf(b))
    expect(refsOf(fade(1.6, 'ch-abc'))).toEqual(idsOf(a))
  })
})

describe('шапка, субтитры и вердикт', () => {
  it('текст не мельче 24 px на любом кадре', () => {
    for (const frame of [0, 5, 20, 25, 70, 101, 106, 200]) {
      clock.frame = frame
      // Пустая разметка (нет реплики, нет метки) текста не содержит.
      for (const html of [header(), verdict(), verdict(false), subtitles()].filter((h) => h.includes('font-'))) {
        for (const size of fontSizes(html)) expect(size).toBeGreaterThanOrEqual(MIN_TEXT)
      }
    }
  })

  it('цвета — только из темы кадра', () => {
    const colors = new Set(Object.values(T).filter((v) => v.startsWith('#')).map((v) => v.toUpperCase()))
    for (const frame of [0, 25, 70, 106, 200]) {
      clock.frame = frame
      for (const html of [header(), verdict(), subtitles()]) {
        for (const m of html.matchAll(/#[0-9A-Fa-f]{6}\b/g)) expect(colors.has(m[0].toUpperCase())).toBe(true)
      }
    }
  })
})
