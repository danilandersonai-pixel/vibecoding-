import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import glossary from '../../content/glossary.json'
import App from '../App'
import { getDays } from '../content/load'
import { courseEntries } from './courseIndex'

// Книга в тестах — маленький индекс вместо 900 записей. Запись-заголовок: текст совпадает с названием.
// В текстах книги бывает код с сырыми «<» и «&» — он должен выводиться как текст, а не как разметка.
const BOOK = vi.hoisted(() => [
  { a: 's77', c: 'Глава 4. Данные', s: 'Политики RLS', t: 'Политики RLS' },
  { a: 's77', c: 'Глава 4. Данные', s: 'Политики RLS', t: 'Включите RLS для каждой таблицы: <b>select</b> & insert.' },
  { a: 'ch9', c: 'Глава 9. Запуск', s: '', t: 'Перед запуском проверьте RLS.' },
])
vi.mock('../../content/book-index.json', () => ({ default: BOOK }))

const AGENT = glossary.find((g) => g.term === 'Агент')!

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

function dialog() {
  return screen.getByRole('dialog', { name: 'Поиск' })
}

function field() {
  return screen.getByRole('searchbox', { name: 'Поиск по курсу и книге' })
}

function group(name: string) {
  return within(dialog()).getByRole('region', { name: new RegExp(`^${name}`) })
}

// Открыть поиск кнопкой в шапке и ввести запрос
async function search(query: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Поиск' }))
  await user.type(field(), query)
  return user
}

// id элементов, к которым прокручивали страницу
function scrolledTo(spy: { mock: { contexts: unknown[] } }): string[] {
  return spy.mock.contexts.map((el) => (el as Element).id)
}

describe('окно поиска: открытие и закрытие', () => {
  it('кнопка «Поиск» на главной открывает окно, фокус в поле, до 2 символов — примеры', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Поиск' }))
    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(field()).toHaveFocus()
    expect(field()).toHaveAttribute('placeholder', 'Термин, цитата или тема — например, RLS')
    expect(screen.getByText('Например:')).toBeInTheDocument()
    for (const word of ['RLS', 'Агент', 'спецификация', 'коммит']) expect(within(dialog()).getByRole('button', { name: word })).toBeInTheDocument()

    await user.click(within(dialog()).getByRole('button', { name: 'коммит' }))
    expect(field()).toHaveValue('коммит')
    expect(field()).toHaveFocus()
    expect(screen.queryByText('Например:')).toBeNull()
  })

  it('Esc закрывает окно и возвращает фокус на кнопку; прокрутка страницы под окном заблокирована, пока оно открыто', async () => {
    render(<App />)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Поиск' })
    await user.click(button)
    expect(document.documentElement.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(button).toHaveFocus()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('«Закрыть» и клик по затемнению закрывают окно', async () => {
    render(<App />)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Поиск' })
    await user.click(button)
    await user.click(within(dialog()).getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(button).toHaveFocus()

    await user.click(button)
    await user.click(dialog().parentElement!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Tab не уходит из окна', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Поиск' }))
    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(dialog()).toContainElement(document.activeElement as HTMLElement)
    }
    for (let i = 0; i < 8; i++) {
      await user.tab({ shift: true })
      expect(dialog()).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('«/» открывает окно, но не из поля заметок и не из поля поиска; Ctrl+K — откуда угодно и без символа в поле', async () => {
    window.location.hash = '#/day/1'
    render(<App />)
    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Поиск' })).toBeInTheDocument()
    const user = userEvent.setup()
    const notes = screen.getByRole('textbox', { name: /Заметки дня/ })

    await user.click(notes)
    await user.keyboard('/')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(notes).toHaveValue('/')

    // Ctrl+K из заметок: окно открывается, в заметки ничего не добавилось; Esc возвращает фокус в заметки
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeInTheDocument()
    expect(notes).toHaveValue('/')
    expect(field()).toHaveFocus()
    await user.keyboard('a/b')
    expect(field()).toHaveValue('a/b')
    await user.keyboard('{Escape}')
    expect(notes).toHaveFocus()

    // «/» вне полей ввода открывает окно, и сам символ в поле поиска не попадает
    act(() => notes.blur())
    await user.keyboard('/')
    expect(dialog()).toBeInTheDocument()
    expect(field()).toHaveFocus()
    expect(field()).toHaveValue('a/b')
  })
})

describe('окно поиска: выдача', () => {
  it('«Агент»: в «Терминах» первым — «Агент» с определением целиком, ссылки в книгу и на день', async () => {
    render(<App />)
    await search('Агент')
    const first = within(group('Термины')).getAllByRole('listitem')[0]
    expect(first).toHaveTextContent(AGENT.term)
    expect(first).toHaveTextContent(AGENT.definition)
    expect(within(first).getByRole('link', { name: 'В книге' })).toHaveAttribute('href', `book.html#${AGENT.refs[0]}`)
    expect(within(first).getByRole('link', { name: 'В книге' })).toHaveAttribute('target', '_blank')
    expect(within(first).getByRole('link', { name: 'День 1' })).toHaveAttribute('href', '#/day/1')
    expect(within(first).getByText('Агент', { selector: 'mark' })).toBeInTheDocument()
    expect(await screen.findByText(/^Найдено: \d+$/)).toHaveAttribute('aria-live', 'polite')
  })

  it('«Показать все N» раскрывает группу', async () => {
    render(<App />)
    const user = await search('Агент')
    const terms = group('Термины')
    expect(within(terms).getAllByRole('listitem')).toHaveLength(5)
    const more = within(terms).getByRole('button', { name: /^Показать все \d+$/ })
    const n = Number(more.textContent!.match(/\d+/)![0])
    expect(n).toBeGreaterThan(5)
    expect(terms).toHaveAccessibleName(`Термины ${n}`)
    await user.click(more)
    expect(within(terms).getAllByRole('listitem')).toHaveLength(n)
    expect(within(terms).queryByRole('button', { name: /^Показать все/ })).toBeNull()
  })

  it('«ресторан»: в «В курсе» — «Приложение устроено как ресторан»; нажатие закрывает окно, открывает день 1 и прокручивает к мысли', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<App />)
    const user = await search('ресторан')
    const hit = within(group('В курсе')).getByRole('button', { name: /Приложение устроено как ресторан/ })
    expect(hit.querySelector('.search-title mark')).toHaveTextContent(/^ресторан$/)
    expect(hit).toHaveTextContent('День 1 · Мысль')
    await user.click(hit)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(window.location.hash).toBe('#/day/1')
    expect(await screen.findByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeInTheDocument()
    await waitFor(() => expect(scrolledTo(scroll)).toContain('block-restaurant'))
    expect(document.getElementById('block-restaurant')).toHaveClass('idea')
  })

  it('открыт тот же день — только прокрутка к блоку, без перехода', async () => {
    window.location.hash = '#/day/1'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    const heading = () => screen.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })
    render(<App />)
    const before = heading()
    const user = await search('Подписки токены')
    await user.click(within(group('В курсе')).getByRole('button', { name: /Подписки, токены и лимиты/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scrolledTo(scroll)).toContain('block-limits')
    expect(window.location.hash).toBe('#/day/1')
    expect(heading()).toBe(before)
  })

  it('«День N» у термина ведёт к «Итогу дня»', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<App />)
    const user = await search('Агент')
    await user.click(within(group('Термины')).getAllByRole('link', { name: 'День 1' })[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(window.location.hash).toBe('#/day/1')
    await waitFor(() => expect(scrolledTo(scroll)).toContain('part-summary'))
  })

  it('запрос из пробелов или из одних знаков («c++») — как пустой: примеры', async () => {
    render(<App />)
    const user = await search('   ')
    expect(screen.getByText('Например:')).toBeInTheDocument()
    await user.clear(field())
    await user.type(field(), 'c++')
    expect(screen.getByText('Например:')).toBeInTheDocument()
    expect(within(dialog()).queryByRole('region')).toBeNull()
  })

  it('ничего не нашлось — подсказка вместо групп', async () => {
    render(<App />)
    await search('щщщщ')
    expect(await screen.findByText('Ничего не нашлось. Попробуйте другое слово или часть слова.')).toBeInTheDocument()
    expect(within(dialog()).queryByRole('region')).toBeNull()
  })
})

describe('цели переходов', () => {
  it('у каждого материала курса есть цель на странице его дня, id на странице не повторяются', async () => {
    const entries = courseEntries(getDays())
    for (const day of getDays()) {
      window.location.hash = `#/day/${day.number}`
      const { unmount } = render(<App />)
      // помощник ИИ появляется, когда узнает, есть ли ИИ
      await waitFor(() => {
        for (const e of entries.filter((x) => x.target.day === day.number)) expect(document.getElementById(e.target.anchor), e.target.anchor).not.toBeNull()
      })
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
      expect(ids.length).toBe(new Set(ids).size)
      unmount()
    }
  })
})

describe('окно поиска: книга', () => {
  it('книга загрузилась: ссылки на раздел в новой вкладке, подпись «Книга · глава → раздел», код — текстом', async () => {
    render(<App />)
    await search('RLS')
    const book = await within(dialog()).findByRole('region', { name: /^В книге/ })
    const links = within(book).getAllByRole('link')
    expect(links).toHaveLength(3)
    for (const link of links.slice(0, 2)) {
      expect(link).toHaveAttribute('href', 'book.html#s77')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener')
    }
    // запись-заголовок: только подпись и название, фрагмент не повторяет название
    expect(links[0]).toHaveTextContent(/^Книга · Глава 4\. Данные → Политики RLS\s*Политики RLS$/)
    expect(links[1]).toHaveTextContent('Включите RLS для каждой таблицы: <b>select</b> & insert.')
    expect(links[1].querySelector('b')).toBeNull()
    expect(links[2]).toHaveAttribute('href', 'book.html#ch9')
    expect(links[2]).toHaveTextContent(/^Книга · Глава 9\. Запуск\s*Глава 9\. Запуск\s*Перед запуском проверьте RLS\.$/)
    // три группы в порядке спецификации; окно после ссылки в книгу остаётся открытым
    expect(within(dialog()).getAllByRole('region').map((r) => r.querySelector('h2')!.firstChild!.textContent!.trim())).toEqual(['Термины', 'В курсе', 'В книге'])
    expect(screen.getByText(/^Найдено: \d+$/)).toBeInTheDocument()
    await userEvent.setup().click(links[0])
    expect(dialog()).toBeInTheDocument()
  })

  it('книга не загрузилась: «Поиск по книге сейчас недоступен», термины и курс на месте', async () => {
    vi.resetModules()
    vi.doMock('../../content/book-index.json', async () => {
      throw new Error('обрыв куска')
    })
    const { default: FreshApp } = await import('../App')
    render(<FreshApp />)
    await search('RLS')
    expect(await screen.findByText('Поиск по книге сейчас недоступен')).toBeInTheDocument()
    expect(within(group('Термины')).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(within(group('В курсе')).getAllByRole('button').length).toBeGreaterThan(0)
    expect(screen.queryByText('Загружаю книгу…')).toBeNull()
    vi.doUnmock('../../content/book-index.json')
  })
})
