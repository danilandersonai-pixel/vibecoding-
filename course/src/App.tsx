import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
import { BookStatus } from './book/BookStatus'
import { FigureDefs } from './components/FigureDefs'
import { GraphStatus } from './graph/GraphStatus'
import { DayPage } from './pages/DayPage'
import { MapPage } from './pages/MapPage'
import { ProgressProvider } from './progress/ProgressContext'
import { useRoute } from './router'
import { SearchDialog } from './search/SearchDialog'
import { SearchOpenContext, useSearchShortcut } from './search/useSearchShortcut'

// Экран графа — отдельный кусок сборки: с ним грузятся sigma и graphology, главная и дни от них не тяжелеют
const GraphPage = lazy(() => import('./graph/GraphPage'))
// Экран книги — тоже отдельный кусок: книга в рамке нужна не всем
const BookPage = lazy(() => import('./book/BookPage'))

// Кусок экрана не загрузился (нет сети, сборка обновилась) — failed («Граф сейчас недоступен», «Книга сейчас недоступна»)
// вместо пустой страницы. У каждого экрана своя защита (key): сбой графа не переходит на книгу
class ChunkGuard extends Component<{ failed: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.failed : this.props.children
  }
}

// Главная и страница дня — без общей обёртки: у обеих синяя шапка во всю ширину и свой <main> внутри.
// Экран графа не пересоздаётся при смене узла в адресе: выбор узла живёт в нём самом. Экран книги при смене раздела
// тоже остаётся, заново раскладывается только рамка с читалкой.
// Окно поиска одно на приложение: его открывают кнопки «Поиск» в шапках и горячие клавиши
export default function App() {
  const route = useRoute()
  const [searching, setSearching] = useState(false)
  const openSearch = useCallback(() => setSearching(true), [])
  const closeSearch = useCallback(() => setSearching(false), [])
  useSearchShortcut(openSearch)
  return (
    <ProgressProvider>
      <SearchOpenContext.Provider value={openSearch}>
        <FigureDefs />
        {route.name === 'day' ? (
          <DayPage key={route.n} n={route.n} />
        ) : route.name === 'graph' ? (
          <ChunkGuard key="graph" failed={<GraphStatus failed />}>
            <Suspense fallback={<GraphStatus />}>
              <GraphPage node={route.node} />
            </Suspense>
          </ChunkGuard>
        ) : route.name === 'book' ? (
          <ChunkGuard key="book" failed={<BookStatus failed />}>
            <Suspense fallback={<BookStatus />}>
              <BookPage section={route.section} />
            </Suspense>
          </ChunkGuard>
        ) : (
          <MapPage />
        )}
        <SearchDialog open={searching} onClose={closeSearch} />
      </SearchOpenContext.Provider>
    </ProgressProvider>
  )
}
