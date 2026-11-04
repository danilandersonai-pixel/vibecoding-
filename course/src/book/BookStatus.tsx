import { useState } from 'react'
import { RouteLink } from '../components/RouteLink'
import { cameFrom } from '../router'

// Шапка экрана книги: «← К курсу» и название. Пришли ссылкой курса — назад по истории (history.back()),
// туда, откуда пришли; якорь не менялся (просмотрщик Claude) — переходом на тот экран; книгу открыли по адресу — на главную.
// Откуда пришли, берётся при появлении шапки: смена раздела внутри книги этого не меняет
export function BookBar() {
  const [from] = useState(cameFrom)
  return (
    <header className="book-bar">
      <RouteLink to={from?.hash ?? '#/'} className="book-back" onFollow={from?.back ? () => history.back() : undefined}>
        <span aria-hidden="true">←</span>К курсу
      </RouteLink>
      <h1 className="book-title">Вайб-кодинг на практике</h1>
    </header>
  )
}

// Вместо книги: пока грузится — «Открываем книгу…», не загрузилась — «Книга сейчас недоступна» и «Повторить» (если есть onRetry)
export function BookNote({ failed = false, onRetry }: { failed?: boolean; onRetry?: () => void }) {
  return (
    <main className="book-status">
      <p className="book-note">{failed ? 'Книга сейчас недоступна' : 'Открываем книгу…'}</p>
      {failed && onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Повторить
        </button>
      )}
    </main>
  )
}

// Экран книги без самой книги. Лежит в основной сборке: им App закрывает загрузку и сбой куска экрана книги
export function BookStatus({ failed = false }: { failed?: boolean }) {
  return (
    <div className="book-page">
      <BookBar />
      <BookNote failed={failed} />
    </div>
  )
}
