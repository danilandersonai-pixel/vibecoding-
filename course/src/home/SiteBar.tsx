import { scrollToId } from './scroll'

// Верхняя строка обложки: знак курса, «Карта» (прокрутка) и «Книга» в новой вкладке
export function SiteBar() {
  return (
    <div className="sitebar">
      <span className="sitebar-brand">
        <span className="sitebar-mark" aria-hidden="true">
          В
        </span>
        Вайб-курс
      </span>
      <nav className="sitebar-links" aria-label="Разделы">
        <button type="button" className="sitebar-link" onClick={() => scrollToId('map')}>
          Карта
        </button>
        <a className="sitebar-link sitebar-book" href="book.html" target="_blank" rel="noopener">
          Книга
        </a>
      </nav>
    </div>
  )
}
