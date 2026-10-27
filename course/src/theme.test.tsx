/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './components/ThemeToggle'
import { currentTheme, setTheme, THEME_KEY } from './theme'

const root = document.documentElement

// Ранняя установка темы — инлайн-скрипт в <head> index.html (без src): его и выполняем, как браузер до первой отрисовки
const html = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../index.html'), 'utf8')
const early = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
const runEarly = () => new Function(early)()

afterEach(() => {
  vi.restoreAllMocks()
  delete root.dataset.theme
  localStorage.clear()
})

describe('theme', () => {
  it('по умолчанию тёмная; светлая — только при data-theme="light"', () => {
    expect(THEME_KEY).toBe('vibe-course-theme')
    expect(currentTheme()).toBe('dark')
    root.dataset.theme = 'light'
    expect(currentTheme()).toBe('light')
    root.dataset.theme = 'dark'
    expect(currentTheme()).toBe('dark')
  })

  it('setTheme: светлая — атрибут и запись в браузере, тёмная — атрибут снят и запись стёрта', () => {
    setTheme('light')
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    setTheme('dark')
    expect(root).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('хранилище недоступно — тема всё равно меняется, без ошибки', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('приватный режим')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('приватный режим')
    })
    // подмена действует на localStorage страницы
    expect(() => localStorage.setItem(THEME_KEY, 'light')).toThrow()
    expect(() => setTheme('light')).not.toThrow()
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(() => setTheme('dark')).not.toThrow()
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('скрипт в index.html до отрисовки ставит выбранную светлую тему по тому же ключу', () => {
    expect(early).toContain(`'${THEME_KEY}'`)
    runEarly()
    expect(root).not.toHaveAttribute('data-theme')

    localStorage.setItem(THEME_KEY, 'light')
    runEarly()
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(currentTheme()).toBe('light')

    // хранилище недоступно — страница открывается в тёмной теме, без ошибки
    delete root.dataset.theme
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('приватный режим')
    })
    expect(() => localStorage.getItem(THEME_KEY)).toThrow()
    expect(runEarly).not.toThrow()
    expect(root).not.toHaveAttribute('data-theme')
  })
})

describe('ThemeToggle', () => {
  it('кнопка-переключатель «Светлая тема»: нажата — светлая; выбор запоминается в браузере', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle className="sitebar-link" />)
    const toggle = screen.getByRole('button', { name: 'Светлая тема' })
    expect(toggle).toHaveClass('theme-toggle', 'sitebar-link')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Светлая тема')).toHaveClass('theme-toggle-label')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(root).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('светлая уже выбрана (поставил скрипт index.html) — кнопка сразу нажата', async () => {
    const user = userEvent.setup()
    localStorage.setItem(THEME_KEY, 'light')
    runEarly()
    render(<ThemeToggle className="sitebar-link" />)
    const toggle = screen.getByRole('button', { name: 'Светлая тема' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(currentTheme()).toBe('dark')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})
