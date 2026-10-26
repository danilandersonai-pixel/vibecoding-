import { IconGraph } from '../components/icons'
import { navigate } from '../router'

// Кнопка «Граф» со значком — в верхней строке главной и в шапке дня, рядом с «Поиском»; вид задаёт место (className).
// На телефоне подпись скрыта визуально (graph.css), доступное имя «Граф» остаётся
export function GraphButton({ className }: { className: string }) {
  return (
    <button type="button" className={`graph-open ${className}`} onClick={() => navigate('#/graph')}>
      <IconGraph size={18} />
      <span className="graph-open-label">Граф</span>
    </button>
  )
}
