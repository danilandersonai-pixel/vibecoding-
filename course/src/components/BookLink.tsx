import type { BookRef } from '../content/schema'
import { IconBook } from './icons'

// Переход в книгу — кнопка-ссылка со значком книги, открывается в новой вкладке
export function BookLink({ bookRef }: { bookRef: BookRef }) {
  return (
    <a className="book-link" href={`book.html#${bookRef.section}`} target="_blank" rel="noopener">
      <IconBook size={16} />
      В книге: {bookRef.label}
    </a>
  )
}
