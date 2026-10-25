import { useCallback, useState } from 'react'
import { FigureDefs } from './components/FigureDefs'
import { DayPage } from './pages/DayPage'
import { MapPage } from './pages/MapPage'
import { ProgressProvider } from './progress/ProgressContext'
import { useRoute } from './router'
import { SearchDialog } from './search/SearchDialog'
import { SearchOpenContext, useSearchShortcut } from './search/useSearchShortcut'

// Главная и страница дня — без общей обёртки: у обеих синяя шапка во всю ширину и свой <main> внутри.
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
        {route.name === 'day' ? <DayPage key={route.n} n={route.n} /> : <MapPage />}
        <SearchDialog open={searching} onClose={closeSearch} />
      </SearchOpenContext.Provider>
    </ProgressProvider>
  )
}
