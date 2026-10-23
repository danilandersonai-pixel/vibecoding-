import { FigureDefs } from './components/FigureDefs'
import { DayPage } from './pages/DayPage'
import { MapPage } from './pages/MapPage'
import { ProgressProvider } from './progress/ProgressContext'
import { useRoute } from './router'

// Главная и страница дня — без общей обёртки: у обеих синяя шапка во всю ширину и свой <main> внутри
export default function App() {
  const route = useRoute()
  return (
    <ProgressProvider>
      <FigureDefs />
      {route.name === 'day' ? <DayPage key={route.n} n={route.n} /> : <MapPage />}
    </ProgressProvider>
  )
}
