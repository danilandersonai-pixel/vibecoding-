import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('неизвестный адрес открывает главную', () => {
    window.location.hash = '#/day/99'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expectShell()
  })
})
