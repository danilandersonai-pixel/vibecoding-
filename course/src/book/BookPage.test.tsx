import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOOK_HASH_READ } from './bookFrame'

const TITLE = 'Книга «Вайб-кодинг на практике»'
// Книга в тестах — крошечный документ с тем же чтением якоря, что у читалки
const HTML = `<!doctype html><title>Книга</title><script>${BOOK_HASH_READ}</script>`

const answer = (ok: boolean) => ({ ok, status: ok ? 200 : 404, text: () => Promise.resolve(ok ? HTML : 'нет') })

// Текст книги экран держит в модуле (грузится один раз за сессию) — каждому тесту свежие модули
async function fresh() {
  vi.resetModules()
  const { default: BookPage } = await import('./BookPage')
  const router = await import('../router')
  return { BookPage, router }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('экран книги', () => {
  it('пока грузится — «Открываем книгу…»; затем рамка с книгой на разделе из адреса', async () => {
    const load = vi.fn(() => Promise.resolve(answer(true)))
    vi.stubGlobal('fetch', load)
    const { BookPage } = await fresh()
    render(<BookPage section="s77" />)
    expect(screen.getByText('Открываем книгу…')).toBeInTheDocument()
    const frame = await screen.findByTitle(TITLE)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame.getAttribute('srcdoc')).toContain('"s77"')
    expect(frame.getAttribute('srcdoc')).not.toContain(BOOK_HASH_READ)
    expect(load).toHaveBeenCalledWith('book.html')
    expect(screen.getByRole('heading', { level: 1, name: 'Вайб-кодинг на практике' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toContainElement(frame)
  })

  it('смена раздела — новая рамка с нужного места; книга грузится один раз за сессию', async () => {
    const load = vi.fn(() => Promise.resolve(answer(true)))
    vi.stubGlobal('fetch', load)
    const { BookPage } = await fresh()
    const { rerender, unmount } = render(<BookPage section="s77" />)
    const first = await screen.findByTitle(TITLE)
    rerender(<BookPage section="ch9" />)
    const second = screen.getByTitle(TITLE)
    expect(second).not.toBe(first)
    expect(second.getAttribute('srcdoc')).toContain('"ch9"')
    // без раздела — книга как есть: читалка откроется там, где читатель остановился
    rerender(<BookPage />)
    expect(screen.getByTitle(TITLE).getAttribute('srcdoc')).toBe(HTML)
    unmount()
    render(<BookPage section="s1" />)
    expect(screen.getByTitle(TITLE).getAttribute('srcdoc')).toContain('"s1"')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('ошибка — «Книга сейчас недоступна», «Повторить» грузит снова и показывает книгу', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('нет сети'))
      .mockResolvedValueOnce(answer(false))
      .mockResolvedValue(answer(true))
    vi.stubGlobal('fetch', load)
    const { BookPage } = await fresh()
    const user = userEvent.setup()
    render(<BookPage section="s77" />)
    expect(await screen.findByText('Книга сейчас недоступна')).toBeInTheDocument()
    expect(screen.queryByTitle(TITLE)).toBeNull()
    // ответ 404 — тоже ошибка
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Книга сейчас недоступна')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect((await screen.findByTitle(TITLE)).getAttribute('srcdoc')).toContain('"s77"')
    expect(screen.queryByText('Книга сейчас недоступна')).toBeNull()
    expect(load).toHaveBeenCalledTimes(3)
  })

  it('книгу открыли по адресу — «К курсу» ведёт на главную, #/', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(answer(true))))
    const { BookPage } = await fresh()
    const user = userEvent.setup()
    render(<BookPage />)
    const back = screen.getByRole('link', { name: 'К курсу' })
    expect(back).toHaveAttribute('href', '#/')
    expect(back).not.toHaveAttribute('target')
    await screen.findByTitle(TITLE)
    await user.click(screen.getByRole('link', { name: 'К курсу' }))
    expect(window.location.hash).toBe('#/')
  })

  it('пришли из дня ссылкой курса — «К курсу» возвращает назад по истории', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(answer(true))))
    const { BookPage, router } = await fresh()
    window.location.hash = '#/day/1'
    const route = renderHook(() => router.useRoute())
    act(() => router.navigate('#/book/s77'))
    await waitFor(() => expect(route.result.current).toEqual({ name: 'book', section: 's77' }))
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<BookPage section="s77" />)
    const link = screen.getByRole('link', { name: 'К курсу' })
    expect(link).toHaveAttribute('href', '#/day/1')
    // шапка та же, пока книга грузится и после
    await screen.findByTitle(TITLE)
    expect(link).toBeInTheDocument()
    await user.click(link)
    expect(back).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('#/book/s77')
  })
})
