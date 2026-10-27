import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDay, getDays } from '../content/load'
import { MapPage } from '../pages/MapPage'
import { CourseProgressContext } from '../progress/courseProgress'
import { emptyProgress, type Progress } from '../progress/model'
import { SearchOpenContext } from '../search/useSearchShortcut'
import { finishDay } from '../test/progress'
import { scrollToId } from './scroll'
import { SiteBar } from './SiteBar'

const allDone = () => getDays().reduce(finishDay, emptyProgress())

function withProgress(ui: React.ReactNode, progress: Progress, openSearch: () => void = () => {}) {
  return (
    <CourseProgressContext.Provider value={{ progress, update: () => {}, storeKind: 'memory' }}>
      <SearchOpenContext.Provider value={openSearch}>{ui}</SearchOpenContext.Provider>
    </CourseProgressContext.Provider>
  )
}

// Главная целиком, как её собирает MapPage: боковая панель, строка пути, вводный блок, карточка HEAD и карта
function renderHome(progress: Progress = emptyProgress()) {
  render(withProgress(<MapPage />, progress))
  return within(screen.getByRole('region', { name: 'Продолжить обучение' }))
}

// Заголовок курса: неразрывные пробелы держат вместе «с ИИ» и «21 день» — имя области и заголовка с ними же
const TITLE = 'Своё приложение с\u00a0ИИ за\u00a021\u00a0день'
const intro = () => within(screen.getByRole('region', { name: TITLE }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('верх главной', () => {
  it('новичок: кнопка «Начать день 1» и карточка HEAD «С чего начать»', () => {
    const card = renderHome()
    const day = getDay(1)!
    const cta = intro().getByRole('link', { name: 'Начать день 1' })
    expect(cta).toHaveAttribute('href', '#/day/1')
    expect(cta).toHaveClass('btn', 'btn-primary')
    // без стрелки: значков в главной кнопке нет
    expect(cta.querySelector('svg')).toBeNull()

    expect(card.getByText('HEAD')).toHaveClass('head-chip')
    expect(card.getByText('С чего начать')).toBeInTheDocument()
    expect(card.getByText('день 01, неделя 1')).toBeInTheDocument()
    expect(card.getByRole('heading', { level: 2, name: 'Азбука и знакомство с моделями' })).toBeInTheDocument()
    expect(card.getByText(day.goal)).toBeInTheDocument()
    expect(card.getByText('2 видеоурока (8:42), тест, 6 шагов практики')).toBeInTheDocument()
    const start = card.getByRole('link', { name: 'Начать' })
    expect(start).toHaveAttribute('href', '#/day/1')
    expect(start.querySelector('svg')).toBeNull()
    // кольца с процентом и серии в карточке больше нет: счёт и серия — в боковой панели
    expect(card.queryByRole('img')).toBeNull()
    expect(card.queryByText(/%/)).toBeNull()
    expect(card.queryByText(/подряд/)).toBeNull()
  })

  it('вернувшийся: «Продолжить день 2», «Вы остановились здесь»; пройдено 1 из 21 и серия — в боковой панели', () => {
    const progress = { ...finishDay(emptyProgress(), getDay(1)!), streak: { lastDate: '2026-10-22', count: 3 } }
    const card = renderHome(progress)
    const day = getDay(2)!
    expect(intro().getByRole('link', { name: 'Продолжить день 2' })).toHaveAttribute('href', '#/day/2')
    expect(card.getByText('Вы остановились здесь')).toBeInTheDocument()
    expect(card.getByText('день 02, неделя 1')).toBeInTheDocument()
    expect(card.getByRole('heading', { level: 2, name: day.title })).toBeInTheDocument()
    expect(card.getByText(day.goal)).toBeInTheDocument()
    expect(card.getByRole('link', { name: 'Продолжить' })).toHaveAttribute('href', '#/day/2')
    expect(card.queryByText(/Пройдено/)).toBeNull()
    expect(card.queryByText(/подряд/)).toBeNull()

    const sidebar = within(screen.getByRole('banner'))
    const stats = within(sidebar.getByRole('region', { name: 'Прогресс' }))
    expect(stats.getByText('Пройдено', { exact: false })).toHaveTextContent(/^Пройдено 1 из 21$/)
    expect(stats.getByText('Серия: 3 дня подряд')).toBeInTheDocument()
  })

  it('всё пройдено: «Курс пройден», «К карте» прокручивает к карте', async () => {
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    const card = renderHome(allDone())
    expect(card.getByText('HEAD')).toHaveClass('head-chip')
    expect(card.getByText('Пройдено 21 из 21')).toBeInTheDocument()
    expect(card.getByRole('heading', { level: 2, name: 'Курс пройден' })).toBeInTheDocument()
    expect(card.getByText('Любой день можно пройти заново — выберите его на карте.')).toBeInTheDocument()
    // нет ни «день NN», ни состава дня, ни ссылки в день
    expect(card.queryByText(/^день \d\d/)).toBeNull()
    expect(card.queryByText(/видеоурок/)).toBeNull()
    expect(card.queryByRole('link')).toBeNull()
    await user.click(card.getByRole('button', { name: 'К карте' }))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('map'))
  })

  it('всё пройдено: главная кнопка — «К карте», прокручивает к карте, адрес не меняется', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderHome(allDone())
    // в пройденный день 21 вводный блок не зовёт
    expect(intro().queryByRole('link', { name: /^Продолжить день/ })).toBeNull()
    const cta = intro().getByRole('button', { name: 'К карте' })
    expect(cta).toHaveClass('btn-primary')
    await user.click(cta)
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('map'))
    expect(window.location.hash).toBe('#/')
  })

  it('вводный блок: заголовок, лид и две кнопки; обложки, героев, дифа и фактов нет', () => {
    renderHome()
    const block = screen.getByRole('region', { name: TITLE })
    expect(block.tagName).toBe('SECTION')
    expect(block).toHaveClass('intro')
    const h1 = intro().getByRole('heading', { level: 1, name: TITLE })
    expect(h1).toHaveTextContent('Своё приложение с ИИ за 21 день')
    expect(block).toHaveAttribute('aria-labelledby', h1.id)
    expect(
      intro().getByText('Каждый день — короткая теория, видеоурок и практика в Claude Code. К концу курса у вас работает приложение для тренера и его подопечных.'),
    ).toBeInTheDocument()
    // главная кнопка и «Как устроен курс» — обычная кнопка с рамкой
    expect(intro().getByRole('button', { name: 'Как устроен курс' })).toHaveClass('btn')
    expect(intro().getByRole('button', { name: 'Как устроен курс' })).not.toHaveClass('btn-primary')
    expect(screen.queryByText(/Практический курс/)).toBeNull()
    expect(document.querySelector('pre')).toBeNull()
    expect(document.querySelector('.cover, .cover-facts, .cover-heroes')).toBeNull()
    expect(screen.queryByText(/видеоуроков$/)).toBeNull()
  })

  it('порядок главной: строка пути, затем в main — вводный блок, карточка HEAD, карта', () => {
    renderHome()
    const crumbs = document.querySelector('.topbar .crumbs')!
    expect(crumbs).toHaveTextContent(/^вайб-курс \/ карта курса$/)
    expect(within(crumbs as HTMLElement).getByText('карта курса')).toHaveClass('crumbs-here')
    const main = screen.getByRole('main')
    expect(main).toHaveClass('page', 'home-main')
    expect(crumbs.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(Array.from(main.children, (el) => el.getAttribute('aria-label') ?? el.id)).toEqual(['', 'Продолжить обучение', 'map'])
    expect(main.children[0]).toHaveClass('intro')
    // «Как проходит день» — внутри вводного блока
    expect(main.children[0].contains(document.getElementById('how'))).toBe(true)
  })

  it('«Как устроен курс» прокручивает к шагам, адрес не меняется', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderHome()
    await user.click(screen.getByRole('button', { name: 'Как устроен курс' }))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('how'))
    expect(window.location.hash).toBe('#/')
  })

  it('«Как проходит день»: блок-терминал, четыре шага по порядку, без значков', () => {
    renderHome()
    const section = screen.getByRole('region', { name: 'Как проходит день' })
    expect(section).toHaveAttribute('id', 'how')
    expect(section).toHaveClass('how')
    const how = within(section)
    expect(how.getByRole('heading', { level: 2, name: 'Как проходит день' })).toBeInTheDocument()
    expect(how.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Видеоурок',
      'Теория и тест',
      'Практика в Claude Code',
      'Наставник проверяет',
    ])
    expect(how.getByText('короткий ролик с пояснениями по нажатию')).toBeInTheDocument()
    expect(how.getByText('мысли из книги, схемы, тренажёры и проверка понимания')).toBeInTheDocument()
    expect(how.getByText('готовые запросы: копируете и делаете шаг за шагом')).toBeInTheDocument()
    expect(how.getByText('команда /mentor сверяет сделанное в вашем проекте')).toBeInTheDocument()
    expect(section.querySelectorAll('svg')).toHaveLength(0)
  })
})

describe('боковая панель', () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Разделы' }))

  it('шапка сайта: название, ветка и разделы по порядку', () => {
    render(withProgress(<SiteBar current="map" />, emptyProgress()))
    const banner = screen.getByRole('banner')
    expect(banner).toHaveClass('sitebar')
    expect(within(banner).getByText('Вайб-курс')).toHaveClass('sitebar-name')
    // «ветка main» — подпись для глаз
    expect(within(banner).getByText('ветка main')).toHaveAttribute('aria-hidden', 'true')
    const items = Array.from(screen.getByRole('navigation', { name: 'Разделы' }).children)
    expect(items.map((el) => [el.tagName, el.textContent])).toEqual([
      ['A', 'Карта курса'],
      ['A', 'Сегодня день 01'],
      ['BUTTON', 'Поиск'],
      ['BUTTON', 'Граф'],
      ['A', 'Книга'],
      ['BUTTON', 'Светлая тема'],
    ])
  })

  it('«Карта курса» — одна ссылка на главную; на главной — текущая страница, в дне — нет', () => {
    const { unmount } = render(withProgress(<SiteBar current="map" />, emptyProgress()))
    const current = nav().getAllByRole('link', { current: 'page' })
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#/')
    // видимое «Карта», «курса» — отдельным куском: на узком экране он скрыт визуально, имя остаётся полным
    expect(current[0]).toHaveTextContent(/^Карта курса$/)
    expect(within(current[0]).getByText('курса', { exact: false })).toHaveClass('sitebar-map-tail')
    unmount()

    render(withProgress(<SiteBar current="day" />, emptyProgress()))
    expect(nav().queryAllByRole('link', { current: 'page' })).toHaveLength(0)
    expect(nav().getAllByRole('link').filter((a) => a.getAttribute('href') === '#/')).toHaveLength(1)
  })

  it('«Сегодня день NN» ведёт в текущий день; когда всё пройдено — ссылки нет', () => {
    const { unmount } = render(withProgress(<SiteBar current="map" />, emptyProgress()))
    expect(nav().getByRole('link', { name: 'Сегодня день 01' })).toHaveAttribute('href', '#/day/1')
    unmount()

    const second = render(withProgress(<SiteBar current="map" />, finishDay(emptyProgress(), getDay(1)!)))
    expect(nav().getByRole('link', { name: 'Сегодня день 02' })).toHaveAttribute('href', '#/day/2')
    second.unmount()

    render(withProgress(<SiteBar current="map" />, allDone()))
    expect(nav().queryByRole('link', { name: /^Сегодня/ })).toBeNull()
    expect(nav().getAllByRole('link')).toHaveLength(2)
  })

  it('«Поиск» открывает окно поиска, «Граф» — экран графа', async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    render(withProgress(<SiteBar current="map" />, emptyProgress(), open))
    const search = nav().getByRole('button', { name: 'Поиск' })
    expect(search).toHaveAttribute('aria-keyshortcuts', '/ Control+K Meta+K')
    await user.click(search)
    expect(open).toHaveBeenCalledTimes(1)
    expect(search).toHaveFocus()
    await user.click(nav().getByRole('button', { name: 'Граф' }))
    expect(window.location.hash).toBe('#/graph')
  })

  it('книга открывается в новой вкладке', () => {
    render(withProgress(<SiteBar current="map" />, emptyProgress()))
    const book = nav().getByRole('link', { name: 'Книга' })
    expect(book).toHaveAttribute('href', 'book.html')
    expect(book).toHaveAttribute('target', '_blank')
    expect(book).toHaveAttribute('rel', 'noopener')
  })

  it('прогресс: «Пройдено N из 21», 21 клетка (пройденные залиты, текущая в рамке), серия', () => {
    const cells = () => Array.from(screen.getByRole('region', { name: 'Прогресс' }).querySelectorAll('ol > li'), (li) => li.className)
    const stats = () => within(screen.getByRole('region', { name: 'Прогресс' }))

    // Новичок: ничего не пройдено, текущий — день 1, серии нет
    const first = render(withProgress(<SiteBar current="map" />, emptyProgress()))
    expect(stats().getByText('Пройдено', { exact: false })).toHaveTextContent(/^Пройдено 0 из 21$/)
    expect(screen.getByRole('region', { name: 'Прогресс' }).querySelector('ol')).toHaveAttribute('aria-hidden', 'true')
    expect(cells()).toEqual(['is-now', ...Array(20).fill('')])
    expect(stats().queryByText(/^Серия/)).toBeNull()
    first.unmount()

    // Дни 1 и 3 пройдены: текущий — первый непройденный, день 2; серия 1 — «день», 5 — «дней»
    const p13 = [1, 3].reduce((p, n) => finishDay(p, getDay(n)!), emptyProgress())
    const second = render(withProgress(<SiteBar current="map" />, { ...p13, streak: { lastDate: '2026-10-22', count: 1 } }))
    expect(stats().getByText('Пройдено', { exact: false })).toHaveTextContent(/^Пройдено 2 из 21$/)
    expect(cells().slice(0, 4)).toEqual(['is-done', 'is-now', 'is-done', ''])
    expect(cells().filter((c) => c === 'is-now')).toHaveLength(1)
    expect(stats().getByText('Серия: 1 день подряд')).toBeInTheDocument()
    second.unmount()

    // Всё пройдено: все клетки залиты, текущей нет
    render(withProgress(<SiteBar current="map" />, { ...allDone(), streak: { lastDate: '2026-10-22', count: 5 } }))
    expect(stats().getByText('Пройдено', { exact: false })).toHaveTextContent(/^Пройдено 21 из 21$/)
    expect(cells()).toEqual(Array(21).fill('is-done'))
    expect(stats().getByText('Серия: 5 дней подряд')).toBeInTheDocument()
  })
})

describe('scrollToId', () => {
  it('прокручивает плавно, а при «уменьшить движение» — без анимации', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<div id="target" />)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    scrollToId('target')
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))
    scrollToId('target')
    expect(scroll.mock.calls).toEqual([[{ behavior: 'smooth', block: 'start' }], [{ behavior: 'auto', block: 'start' }]])
  })

  it('нет элемента — ничего не делает', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    expect(() => scrollToId('nowhere')).not.toThrow()
    expect(scroll).not.toHaveBeenCalled()
  })
})
