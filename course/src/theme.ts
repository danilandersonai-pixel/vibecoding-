// Тема курса: тёмная по умолчанию, светлая — по выбору ученика. Выбор хранится в браузере
// и ставится до первой отрисовки (скрипт в index.html), здесь — чтение и переключение.
export type Theme = 'dark' | 'light'

export const THEME_KEY = 'vibe-course-theme'

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  if (theme === 'light') document.documentElement.dataset.theme = 'light'
  else delete document.documentElement.dataset.theme
  try {
    if (theme === 'light') localStorage.setItem(THEME_KEY, 'light')
    else localStorage.removeItem(THEME_KEY)
  } catch {
    // Хранилище недоступно (приватный режим) — тема действует до перезагрузки
  }
}
