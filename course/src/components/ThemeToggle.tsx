import { useState } from 'react'
import { flushSync } from 'react-dom'
import { withViewTransition } from '../motion'
import { currentTheme, setTheme, type Theme } from '../theme'

// Переключатель темы в боковой панели: кнопка-переключатель «Светлая тема» (нажата — светлая).
// На телефоне подпись скрыта визуально (home.css), доступное имя остаётся. Смена темы — перетекание цветов (переход theme)
export function ThemeToggle({ className }: { className: string }) {
  const [theme, setState] = useState<Theme>(() => currentTheme())
  const light = theme === 'light'
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      aria-pressed={light}
      onClick={() => {
        const next: Theme = light ? 'dark' : 'light'
        withViewTransition('theme', () => {
          setTheme(next)
          flushSync(() => setState(next))
        })
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
      <span className="theme-toggle-label">Светлая тема</span>
    </button>
  )
}
