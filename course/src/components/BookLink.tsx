import type { BookRef } from '../content/schema'
import { IconBook } from './icons'
import { RouteLink } from './RouteLink'

// Переход в книгу — кнопка-ссылка со значком книги: экран книги внутри курса, на разделе
export function BookLink({ bookRef }: { bookRef: BookRef }) {
  return (
    <RouteLink to={`#/book/${bookRef.section}`} className="book-link">
      <IconBook size={16} />
      В книге: {bookRef.label}
    </RouteLink>
  )
}
