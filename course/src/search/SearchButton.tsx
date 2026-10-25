import { useContext } from 'react'
import { IconSearch } from '../components/icons'
import { SearchOpenContext } from './useSearchShortcut'

// Кнопка «Поиск» со значком лупы — в верхней строке главной и шапки дня; вид задаёт место (className).
// На телефоне подпись скрыта визуально (search.css), доступное имя «Поиск» остаётся.
// Фокус ставится на кнопку явно: Safari не фокусирует кнопки по щелчку, а окно вернёт фокус туда, где он был.
export function SearchButton({ className }: { className: string }) {
  const open = useContext(SearchOpenContext)
  return (
    <button
      type="button"
      className={`search-open ${className}`}
      aria-keyshortcuts="/ Control+K Meta+K"
      onClick={(e) => {
        e.currentTarget.focus()
        open()
      }}
    >
      <IconSearch size={18} />
      <span className="search-open-label">Поиск</span>
    </button>
  )
}
