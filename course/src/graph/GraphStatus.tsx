import type { ReactNode, Ref } from 'react'
import { RouteLink } from '../components/RouteLink'

// Верх экрана графа: «← Курс» (на главную) и заголовок; у загруженного графа за ними — поиск узла и фильтры (children).
// Заголовок берёт фокус из скрипта (heading): закрыли карточку-панель — фокус не теряется
export function GraphBar({ heading, children }: { heading?: Ref<HTMLHeadingElement>; children?: ReactNode }) {
  return (
    <header className="graph-bar">
      <RouteLink to="#/" className="graph-back">
        <span aria-hidden="true">←</span>Курс
      </RouteLink>
      <h1 ref={heading} className="graph-title" tabIndex={-1}>
        Граф знаний
      </h1>
      {children}
    </header>
  )
}

// Экран графа без самого графа: пока грузится — «Загружаю граф…», не загрузился — «Граф сейчас недоступен».
// Лежит в основной сборке: им же App закрывает загрузку и сбой отдельного куска экрана графа
export function GraphStatus({ failed = false }: { failed?: boolean }) {
  return (
    <div className="graph-page">
      <GraphBar />
      <main className="graph-status">
        <p className="graph-note">{failed ? 'Граф сейчас недоступен' : 'Загружаю граф…'}</p>
      </main>
    </div>
  )
}
