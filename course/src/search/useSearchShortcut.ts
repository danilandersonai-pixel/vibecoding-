import { createContext, useEffect } from 'react'

// Как открывается поиск: кнопкой «Поиск» (через этот контекст, окно одно — в App) и с клавиатуры.
// Без App вокруг кнопка ничего не делает: так шапки рендерятся в тестах сами по себе.
export const SearchOpenContext = createContext<() => void>(() => {})

// «/» в поле ввода — просто символ: в заметках, в поле поиска, в помощнике ИИ
function inField(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null
}

// «/» — если фокус не в поле ввода; Ctrl+K / ⌘K — откуда угодно (KeyK — и в русской раскладке, где это «л»).
// Нажатие гасится: «/» не попадает в открывшееся поле, Ctrl+K не уходит браузеру.
export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.altKey) return
      const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !inField(e.target)
      const k = (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')
      if (!slash && !k) return
      e.preventDefault()
      open()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
}
