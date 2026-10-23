import { FigureDefs } from './components/FigureDefs'
import { DayPage } from './pages/DayPage'
import { MapPage } from './pages/MapPage'
import { ProgressProvider } from './progress/ProgressContext'
import { useRoute } from './router'

// Главная — без обёртки .shell: обложка во всю ширину, свой <main> внутри; страница дня — в узкой колонке, как раньше
export default function App() {
  const route = useRoute()
  return (
    <ProgressProvider>
      <FigureDefs />
      {route.name === 'day' ? (
        <main className="shell">
          <DayPage key={route.n} n={route.n} />
        </main>
      ) : (
        <MapPage />
      )}
    </ProgressProvider>
  )
}
