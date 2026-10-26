import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
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

// Кусок экрана графа не загрузился (нет сети, сборка обновилась) — «Граф сейчас недоступен» вместо пустой страницы
class GraphGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <GraphStatus failed /> : this.props.children
  }
}

// Главная и страница дня — без общей обёртки: у обеих синяя шапка во всю ширину и свой <main> внутри.
// Экран графа не пересоздаётся при смене узла в адресе: выбор узла живёт в нём самом.
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
          <GraphGuard>
            <Suspense fallback={<GraphStatus />}>
              <GraphPage node={route.node} />
            </Suspense>
          </GraphGuard>
        ) : (
          <MapPage />
        )}
        <SearchDialog open={searching} onClose={closeSearch} />
      </SearchOpenContext.Provider>
    </ProgressProvider>
  )
}
