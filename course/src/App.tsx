import { FigureDefs } from './components/FigureDefs'
import { DayPage } from './pages/DayPage'
import { MapPage } from './pages/MapPage'
import { ProgressProvider } from './progress/ProgressContext'
import { useRoute } from './router'

export default function App() {
  const route = useRoute()
  return (
    <ProgressProvider>
      <main className="shell">
        <FigureDefs />
        {route.name === 'day' ? <DayPage key={route.n} n={route.n} /> : <MapPage />}
      </main>
    </ProgressProvider>
  )
}
