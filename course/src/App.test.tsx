import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// Заголовок курса: неразрывные пробелы держат вместе «с ИИ» и «21 день»
const TITLE = 'Своё приложение с ИИ за 21 день'

afterEach(() => {
  window.location.hash = ''
})

// Оболочка курса: .shell → боковая панель (banner) и рабочая область .shell-body; main — внутри рабочей области
function expectShell() {
  const shell = document.querySelector('.shell')!
  expect(shell).not.toBeNull()
  const [bar, body] = Array.from(shell.children)
  expect(bar).toBe(screen.getByRole('banner'))
  expect(bar).toHaveClass('sitebar')
  expect(body).toHaveClass('shell-body')
  expect(shell.children).toHaveLength(2)
  expect(screen.getAllByRole('main')).toHaveLength(1)
  expect(body.contains(screen.getByRole('main'))).toBe(true)
  expect(screen.getByRole('banner').closest('main')).toBeNull()
  return within(screen.getByRole('banner'))
}

describe('App', () => {
  it('показывает заголовок курса', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toHaveTextContent('Своё приложение с ИИ за 21 день')
  })

  it('главная: оболочка с боковой панелью, вводный блок, «Продолжить», шаги дня и карта; место для прокрутки «Карта» — одно', () => {
    render(<App />)
    const bar = expectShell()
    expect(bar.getByRole('navigation', { name: 'Разделы' })).toBeInTheDocument()
    expect(bar.getByRole('region', { name: 'Прогресс' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Продолжить обучение' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Как проходит день' })).toBeInTheDocument()
    expect(screen.getAllByTestId('day-card')).toHaveLength(21)
    expect(document.querySelectorAll('#map')).toHaveLength(1)
    // «Карта курса» в панели — текущая страница
    expect(bar.getByRole('link', { current: 'page' })).toHaveAttribute('href', '#/')
  })

  it('страница дня: та же оболочка, строка «Дни курса», план дня сбоку и ровно один main', () => {
    window.location.hash = '#/day/1'
    render(<App />)
    const bar = expectShell()
    expect(screen.getByRole('heading', { level: 1, name: 'Азбука и знакомство с моделями' })).toBeInTheDocument()
    // в шапке сайта — поиск и граф; «Карта курса» не текущая
    expect(bar.getByRole('button', { name: 'Поиск' })).toBeInTheDocument()
    expect(bar.getByRole('button', { name: 'Граф' })).toBeInTheDocument()
    expect(bar.queryByRole('link', { current: 'page' })).toBeNull()
    // строка дней и план — вне main, шапка дня — внутри
    const main = screen.getByRole('main')
    expect(main.contains(screen.getByRole('navigation', { name: 'Дни курса' }))).toBe(false)
    expect(screen.getByRole('navigation', { name: 'План дня' }).closest('aside')).toHaveClass('day-aside')
    expect(main.contains(screen.getByRole('region', { name: 'Зачем сегодня' }))).toBe(true)
    // ссылка «Карта курса» на странице одна — в боковой панели
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '#/')).toHaveLength(1)
  })

  it('экран графа — без оболочки: ему нужна вся ширина', async () => {
    window.location.hash = '#/graph'
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Граф знаний' })).toBeInTheDocument()
    expect(document.querySelector('.shell')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Разделы' })).toBeNull()
  })

  it('экран книги — без оболочки: пока грузится кусок и текст — «Открываем книгу…», затем книга на разделе', async () => {
    const book = '<!doctype html><title>Книга</title><script>const h = (location.hash || "").slice(1);</script>'
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(book) })))
    window.location.hash = '#/book/s77'
    render(<App />)
    expect(screen.getByText('Открываем книгу…')).toBeInTheDocument()
    const frame = await screen.findByTitle('Книга «Вайб-кодинг на практике»')
    expect(frame.getAttribute('srcdoc')).toContain('"s77"')
    expect(document.querySelector('.shell')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Разделы' })).toBeNull()
    // книгу открыли по адресу — «К курсу» на главную
    await userEvent.setup().click(screen.getByRole('link', { name: 'К курсу' }))
    expect(await screen.findByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('кусок экрана книги не загрузился — «Книга сейчас недоступна» и «К курсу», а не пустая страница', async () => {
    vi.resetModules()
    vi.doMock('./book/BookPage', async () => {
      throw new Error('обрыв куска')
    })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { default: FreshApp } = await import('./App')
      window.location.hash = '#/book'
      render(<FreshApp />)
      expect(await screen.findByText('Книга сейчас недоступна')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'К курсу' })).toHaveAttribute('href', '#/')
      expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull()
    } finally {
      vi.doUnmock('./book/BookPage')
      errors.mockRestore()
    }
  })

  it('неизвестный адрес открывает главную', () => {
    window.location.hash = '#/day/99'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expectShell()
  })
})
