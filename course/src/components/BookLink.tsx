import type { BookRef } from '../content/schema'

export function BookLink({ bookRef }: { bookRef: BookRef }) {
  return (
    <a className="book-link" href={`book.html#${bookRef.section}`} target="_blank" rel="noopener">
      В книге: {bookRef.label}
    </a>
  )
}
