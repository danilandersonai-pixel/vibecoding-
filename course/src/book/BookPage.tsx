import { useMemo, useSyncExternalStore } from 'react'
import { currentTheme } from '../theme'
import { bookSrcdoc } from './bookFrame'
import { BookBar, BookNote } from './BookStatus'

// Текст книги (book.html, опубликован рядом с курсом) — один раз за сессию: кэш в модуле, экран открыли снова —
// книга не грузится заново. Не загрузилась — ошибка тоже запоминается, пока не нажмут «Повторить»
type BookText = { status: 'loading' } | { status: 'ready'; html: string } | { status: 'failed' }

let text: BookText = { status: 'loading' }
let started = false
const listeners = new Set<() => void>()

function set(next: BookText) {
  text = next
  for (const l of listeners) l()
}

async function load() {
  if (started) return
  started = true
  let next: BookText
  try {
    const res = await fetch('book.html')
    if (!res.ok) throw new Error(`book.html: ${res.status}`)
    next = { status: 'ready', html: await res.text() }
  } catch {
    next = { status: 'failed' }
  }
  set(next)
}

function retry() {
  started = false
  set({ status: 'loading' })
  void load()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  void load()
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () => text

// Экран книги: узкая шапка («← К курсу», название) и рамка с читалкой на всю оставшуюся высоту.
// Книга — документ srcdoc, а не отдельный адрес: просмотрщик Claude открывает чужие адреса в новой вкладке.
// section — раздел из адреса; смена раздела — новая рамка (key), читалка раскладывается заново с нужного места.
// Шапка одна и та же, пока книга грузится и после: фокус на «К курсу» не теряется. Ленивый кусок сборки, как экран графа
export default function BookPage({ section }: { section?: string }) {
  const book = useSyncExternalStore(subscribe, snapshot)
  const doc = useMemo(() => (book.status === 'ready' ? bookSrcdoc(book.html, section, currentTheme()) : ''), [book, section])
  return (
    <div className="book-page">
      <BookBar />
      {book.status === 'ready' ? (
        <main className="book-main">
          <iframe key={section ?? ''} className="book-frame" title="Книга «Вайб-кодинг на практике»" srcDoc={doc} />
        </main>
      ) : (
        <BookNote failed={book.status === 'failed'} onRetry={retry} />
      )}
    </div>
  )
}
