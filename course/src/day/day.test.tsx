import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDay } from '../content/load'
import { daySummaryLine } from '../course/summary'
import { DayPage } from '../pages/DayPage'
import { CourseProgressContext } from '../progress/courseProgress'
import { emptyProgress, type Progress } from '../progress/model'
import { finishDay } from '../test/progress'
import { DraftNotice } from './DraftNotice'

function renderDay(n: number, progress: Progress = emptyProgress()) {
  return render(
    <CourseProgressContext.Provider value={{ progress, update: () => {}, storeKind: 'memory' }}>
      <DayPage n={n} />
    </CourseProgressContext.Provider>,
  )
}

const plan = () => within(screen.getByRole('navigation', { name: 'План дня' }))
const partIds = () => Array.from(document.querySelectorAll('section[id^="part-"]'), (s) => s.id)

// Подменённый IntersectionObserver: запоминает обработчик и наблюдаемые секции; отключение — шпион.
// cross(id, да/нет) — секция входит в полосу текущей части или выходит из неё.
type FakeObserver = { callback: IntersectionObserverCallback; targets: Element[]; disconnect: () => void }
function stubObserver() {
  const observers: FakeObserver[] = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      targets: Element[] = []
      disconnect = vi.fn()
      callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        observers.push(this)
      }
      observe(el: Element) {
        this.targets.push(el)
      }
      unobserve() {}
    },
  )
  const entry = (id: string, isIntersecting: boolean) =>
    ({ target: document.getElementById(id)!, isIntersecting }) as unknown as IntersectionObserverEntry
  const cross = (...changes: [string, boolean][]) =>
    act(() => observers[0].callback(changes.map(([id, on]) => entry(id, on)), {} as IntersectionObserver))
  return { observers, cross }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('страница дня', () => {
  it('шапка дня 1 («Зачем сегодня»): день и неделя, тема, цель, состав и результат', () => {
    renderDay(1)
    const day = getDay(1)!
    const section = screen.getByRole('region', { name: 'Зачем сегодня' })
    expect(section).toHaveAttribute('id', 'part-why')
    expect(section).toHaveClass('day-hero')
    expect(screen.getByRole('main').contains(section)).toBe(true)
    const hero = within(section)
    expect(hero.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeInTheDocument()
    expect(Array.from(section.querySelector('.day-kicker')!.children, (el) => el.textContent)).toEqual([
      'день 01',
      'неделя 1',
      'Вся книга и первая работающая версия',
    ])
    expect(hero.getByText(day.goal)).toBeInTheDocument()
    // Состав дня — пары «подпись — значение» (dl), только то, что в дне есть
    expect(hero.getAllByRole('term').map((dt) => dt.textContent)).toEqual(['видеоуроки', 'теория', 'практика', 'тест'])
    expect(hero.getAllByRole('definition').map((dd) => dd.textContent)).toEqual(['2 (8:56)', '≈ 40 мин', '≈ 80 мин', '6 вопросов'])
    for (const dt of hero.getAllByRole('term')) expect(dt.nextElementSibling?.tagName).toBe('DD')
    // «Результат дня» — строка диффа: «+ » только для глаз
    expect(hero.getByText('Результат дня')).toBeInTheDocument()
    const result = hero.getByText(day.result)
    expect(result).toHaveTextContent(`+ ${day.result}`)
    expect(within(result).getByText('+', { exact: false })).toHaveAttribute('aria-hidden', 'true')
    // ни героев, ни значков в шапке дня
    expect(section.querySelectorAll('svg')).toHaveLength(0)
  })

  it('строка «Дни курса»: путь, стрелки и счёт «День 1 из 21»; «Карта курса» — одна, в боковой панели', () => {
    renderDay(1)
    const bar = screen.getByRole('navigation', { name: 'Дни курса' })
    expect(bar).toHaveClass('topbar', 'day-bar')
    const crumbs = bar.querySelector('.crumbs')!
    expect(crumbs).toHaveTextContent(/^вайб-курс \/ неделя 1 \/ день 01$/)
    expect(within(bar).getByText('день 01')).toHaveClass('crumbs-here')
    // счёт: для чтения с экрана — «День 1 из 21», для глаз — «01 / 21»
    expect(within(bar).getByText('День 1 из 21')).toHaveClass('visually-hidden')
    expect(within(bar).getByText('01 / 21')).toHaveAttribute('aria-hidden', 'true')
    expect(within(bar).getByRole('link', { name: 'Следующий день' })).toHaveAttribute('href', '#/day/2')
    expect(within(bar).queryByRole('link', { name: /Карта/ })).toBeNull()

    const banner = within(screen.getByRole('banner'))
    const home = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '#/')
    expect(home).toHaveLength(1)
    expect(home[0]).toHaveTextContent(/^Карта курса$/)
    expect(banner.getAllByRole('link')).toContain(home[0])
    expect(home[0]).not.toHaveAttribute('aria-current')
    // поиск и граф — в боковой панели
    expect(banner.getByRole('button', { name: 'Поиск' })).toBeInTheDocument()
    expect(banner.getByRole('button', { name: 'Граф' })).toBeInTheDocument()
    cleanup()

    renderDay(12)
    const bar12 = screen.getByRole('navigation', { name: 'Дни курса' })
    expect(bar12.querySelector('.crumbs')).toHaveTextContent(/^вайб-курс \/ неделя 2 \/ день 12$/)
    expect(within(bar12).getByText('День 12 из 21')).toBeInTheDocument()
    expect(within(bar12).getByText('12 / 21')).toBeInTheDocument()
  })

  it('у дня 1 нет «Предыдущего дня», у дня 21 нет «Следующего»', () => {
    renderDay(1)
    const prev = screen.getByRole('link', { name: 'Предыдущий день' })
    expect(prev).toHaveAttribute('aria-disabled', 'true')
    expect(prev).not.toHaveAttribute('href')
    expect(screen.getByRole('link', { name: 'Следующий день' })).toHaveAttribute('href', '#/day/2')
    cleanup()

    renderDay(21)
    expect(screen.getByRole('link', { name: 'Предыдущий день' })).toHaveAttribute('href', '#/day/20')
    const next = screen.getByRole('link', { name: 'Следующий день' })
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(next).not.toHaveAttribute('href')
  })

  it('план дня: шесть пунктов, «Сделано 0 из 5 частей»', () => {
    renderDay(1)
    expect(plan().getByText('План дня')).toBeInTheDocument()
    expect(plan().getAllByRole('button')).toHaveLength(6)
    for (const title of ['Зачем сегодня', 'Теория', 'Проверка понимания', 'Практика', 'Наставник', 'Итог дня']) {
      expect(plan().getByRole('button', { name: title })).toBeEnabled()
    }
    expect(plan().getByText('Сделано 0 из 5 частей')).toBeInTheDocument()
    // номера 01–06 только для глаз, название — своим куском; план — колонка без «бумаги»
    const items = plan().getAllByRole('button')
    expect(items.map((b) => b.querySelector('.toc-num')!.textContent)).toEqual(['01', '02', '03', '04', '05', '06'])
    for (const b of items) expect(b.querySelector('.toc-num')).toHaveAttribute('aria-hidden', 'true')
    expect(items.map((b) => b.querySelector('.toc-title')!.textContent)).toEqual(['Зачем сегодня', 'Теория', 'Проверка понимания', 'Практика', 'Наставник', 'Итог дня'])
    expect(screen.getByRole('navigation', { name: 'План дня' })).not.toHaveClass('paper')
    expect(partIds()).toEqual(['part-why', 'part-theory', 'part-quiz', 'part-practice', 'part-mentor', 'part-summary'])
    // У полностью готового дня нет карточки «Остальное готовится»
    expect(screen.queryByText(/Остальное готовится/)).toBeNull()
    expect(screen.getAllByRole('heading', { level: 2 }).slice(0, 5).map((h) => h.textContent)).toEqual([
      'Теория',
      'Проверка понимания',
      'Практика',
      'Наставник',
      'Итог дня',
    ])
  })

  it('ролики теории подряд — в одной сетке, у каждого номер среди роликов дня', () => {
    renderDay(1)
    const grids = document.querySelectorAll<HTMLElement>('#part-theory .video-grid')
    expect(grids).toHaveLength(1)
    const videos = within(grids[0]).getAllByRole('figure')
    expect(videos).toHaveLength(2)
    expect(videos[0]).toHaveAccessibleName('Как устроено приложение')
    expect(videos[1]).toHaveAccessibleName('Вайб-кодинг: шкала, а не выключатель')
    expect(within(videos[0]).getByText('Видеоурок 1')).toBeInTheDocument()
    expect(within(videos[1]).getByText('Видеоурок 2')).toBeInTheDocument()
    // остальная теория идёт после сетки, не внутри неё
    expect(grids[0].nextElementSibling).toHaveClass('idea')
  })

  it('пройденные части отмечены в плане и в заголовках частей', () => {
    renderDay(1, finishDay(emptyProgress(), getDay(1)!))
    expect(plan().getByText('Сделано 3 из 5 частей')).toBeInTheDocument()
    expect(plan().getByRole('button', { name: 'Практика, сделано' })).toBeEnabled()
    expect(plan().getByRole('button', { name: 'Теория' })).toBeEnabled()
    expect(within(document.getElementById('part-practice')!).getByText('✓')).toHaveClass('part-num', 'is-done')
    expect(within(document.getElementById('part-theory')!).queryByText('✓')).toBeNull()
    // непройденная часть — номер 01–06, как в плане
    expect(within(document.getElementById('part-theory')!).getByText('02')).toHaveClass('part-num')
    expect(within(document.getElementById('part-theory')!).getByText('02')).not.toHaveClass('is-done')
    expect(plan().getAllByRole('button').map((b) => b.querySelector('.toc-num')!.textContent)).toEqual(['01', '02', '✓', '✓', '✓', '06'])
  })

  it('черновой день 10: одна карточка «Остальное готовится», без «Скоро»', () => {
    renderDay(10)
    expect(screen.getAllByText(/Остальное готовится/)).toHaveLength(1)
    expect(screen.getByText('Остальное готовится: проверка понимания, практика и наставник появятся позже.')).toBeInTheDocument()
    expect(screen.queryByText('Скоро')).toBeNull()
    for (const title of ['Проверка понимания', 'Практика', 'Наставник']) {
      const item = plan().getByRole('button', { name: new RegExp(`^${title}`) })
      expect(item).toBeDisabled()
      expect(item).toHaveTextContent('скоро')
    }
    for (const title of ['Зачем сегодня', 'Теория', 'Итог дня']) expect(plan().getByRole('button', { name: title })).toBeEnabled()
    expect(partIds()).toEqual(['part-why', 'part-theory', 'part-summary'])
    expect(screen.queryByText('Результат дня')).toBeNull()
    const hero = within(screen.getByRole('region', { name: 'Зачем сегодня' }))
    expect(hero.getAllByRole('term').map((dt) => dt.textContent)).toEqual(['видеоуроки'])
    expect(hero.getAllByRole('definition').map((dd) => dd.textContent)).toEqual(['1 (2:44)'])
    // строка в пунктирной рамке, без «бумаги» и без героя
    const notice = screen.getByText(/Остальное готовится/).closest('.draft-notice')!
    expect(notice).not.toBeNull()
    expect(notice).not.toHaveClass('paper')
    expect(notice.querySelectorAll('svg')).toHaveLength(0)
  })

  it('у чернового дня в плане нет счёта «Сделано» и полосы — день ещё нельзя засчитать', () => {
    renderDay(10)
    expect(plan().queryByText(/^Сделано/)).toBeNull()
    expect(document.querySelector('.toc-bar')).toBeNull()
    expect(plan().getByRole('button', { name: 'Итог дня' })).toBeEnabled()
  })

  it('пункт плана прокручивает к части, адрес не меняется', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/day/1'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderDay(1)
    await user.click(plan().getByRole('button', { name: 'Практика' }))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('part-practice'))
    expect(window.location.hash).toBe('#/day/1')
  })

  it('пункты плана доступны с клавиатуры', async () => {
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderDay(1)
    for (const item of plan().getAllByRole('button')) {
      expect(item.tagName).toBe('BUTTON')
      expect(item).not.toHaveAttribute('tabindex', '-1')
    }
    // До плана: шесть остановок боковой панели и «Следующий день» в строке дней («Предыдущего» у дня 1 нет — не в фокусе)
    const stops: string[] = []
    for (let i = 0; i < 7; i++) {
      await user.tab()
      const el = document.activeElement!
      stops.push(el.getAttribute('aria-label') ?? el.textContent!)
    }
    expect(stops).toEqual(['Карта курса', 'Сегодня день 01', 'Поиск', 'Граф', 'Книга', 'Светлая тема', 'Следующий день'])
    await user.tab()
    expect(document.activeElement).toBe(plan().getByRole('button', { name: 'Зачем сегодня' }))
    await user.tab()
    expect(document.activeElement).toBe(plan().getByRole('button', { name: 'Теория' }))
    await user.keyboard('{Enter}')
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('part-theory'))
  })

  it('текущая часть — по прокрутке; без IntersectionObserver подсветки нет', () => {
    const { unmount } = renderDay(1)
    expect(plan().getAllByRole('button').filter((b) => b.hasAttribute('aria-current'))).toEqual([])
    unmount()

    const { observers, cross } = stubObserver()
    const view = renderDay(1)
    const [observer] = observers
    expect(observer.targets.map((t) => t.id)).toEqual(partIds())
    cross(['part-quiz', true])
    expect(plan().getByRole('button', { name: 'Проверка понимания' })).toHaveAttribute('aria-current', 'true')
    cross(['part-quiz', false], ['part-practice', true])
    expect(plan().getByRole('button', { name: 'Практика' })).toHaveAttribute('aria-current', 'true')
    expect(plan().getByRole('button', { name: 'Проверка понимания' })).not.toHaveAttribute('aria-current')
    // Полоса между частями — подсветка остаётся на прежней
    cross(['part-practice', false])
    expect(plan().getByRole('button', { name: 'Практика' })).toHaveAttribute('aria-current', 'true')
    view.unmount()
    expect(observer.disconnect).toHaveBeenCalled()
  })

  it('полоса плана (≤ 960 px) сама прокручивается вбок к текущей части, страница — нет', () => {
    const { cross } = stubObserver()
    renderDay(1)
    // Полоса 300 px с прокруткой вбок, уже сдвинута на 40 px; «Практика» шириной 100 px стоит в 500 px от её левого края
    const list = plan().getByRole('list')
    const scrollTo = vi.fn()
    Object.defineProperties(list, {
      scrollWidth: { value: 900 },
      clientWidth: { value: 300 },
      scrollLeft: { value: 40 },
      scrollTo: { value: scrollTo },
    })
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue({ left: 16, width: 300 } as DOMRect)
    for (const [name, left] of [['Практика', 516], ['Наставник', 636]] as const) {
      const item = plan().getByRole('button', { name })
      vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ left, width: 100 } as DOMRect)
    }
    const page = vi.spyOn(Element.prototype, 'scrollIntoView')

    // Текущий пункт встаёт к середине полосы: 40 + 500 − (300 − 100) / 2 = 440
    cross(['part-practice', true])
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 440, behavior: 'smooth' })
    // При «уменьшить движение» — без анимации
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))
    cross(['part-practice', false], ['part-mentor', true])
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 560, behavior: 'auto' })
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(page).not.toHaveBeenCalled()
  })

  it('план колонкой (> 960 px) не прокручивается вбок', () => {
    const { cross } = stubObserver()
    renderDay(1)
    const list = plan().getByRole('list')
    const scrollTo = vi.fn()
    Object.defineProperties(list, { scrollWidth: { value: 240 }, clientWidth: { value: 240 }, scrollTo: { value: scrollTo } })
    cross(['part-practice', true])
    expect(plan().getByRole('button', { name: 'Практика' })).toHaveAttribute('aria-current', 'true')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('следующий день и конец курса', () => {
    renderDay(1)
    const next = within(screen.getByText('Следующий день').closest('section')!)
    expect(next.getByRole('heading', { level: 2, name: 'День 2. Эталоны и спецификация' })).toBeInTheDocument()
    expect(next.getByText(daySummaryLine(getDay(2)!))).toHaveClass('next-day-meta')
    const go = next.getByRole('link', { name: 'Перейти' })
    expect(go).toHaveAttribute('href', '#/day/2')
    expect(go).toHaveClass('btn', 'btn-primary')
    expect(go.querySelector('svg')).toBeNull()
    cleanup()

    renderDay(21)
    expect(screen.getByText('Курс завершён')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К карте' })).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('link', { name: 'Перейти' })).toBeNull()
  })

  it('несуществующий день — «День не найден» и «К карте»', () => {
    renderDay(99)
    // в той же оболочке: боковая панель и один main
    expect(screen.getByRole('banner')).toHaveClass('sitebar')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: 'День не найден' })).toBeInTheDocument()
    expect(main.getByRole('link', { name: 'К карте' })).toHaveAttribute('href', '#/')
    expect(main.getByRole('link', { name: 'К карте' })).toHaveClass('btn-primary')
  })
})

describe('DraftNotice', () => {
  it('называет только недостающее; одна часть — «появится»', () => {
    render(<DraftNotice missing={['practice']} />)
    expect(screen.getByText('Остальное готовится: практика появится позже.')).toBeInTheDocument()
    cleanup()
    render(<DraftNotice missing={['quiz', 'mentor']} />)
    expect(screen.getByText('Остальное готовится: проверка понимания и наставник появятся позже.')).toBeInTheDocument()
  })
})
