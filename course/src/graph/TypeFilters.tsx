import type { CSSProperties, FocusEvent } from 'react'
import { TYPE_COLOR_VAR, TYPE_FILTER_LABEL, TYPE_ORDER, type NodeType } from './model'

// Таблетка в фокусе с клавиатуры — целиком в полосе: на телефоне фильтры прокручиваются вбок (graph.css), а Chrome
// к частично видной таблетке сам не докручивает, и рамка фокуса уходит за край. Только с клавиатуры (:focus-visible):
// у нажатия мышью полоса под указателем не сдвигается. Без :focus-visible (старые браузеры) — как раньше
function reveal(e: FocusEvent<HTMLButtonElement>) {
  const pill = e.currentTarget
  let byKeyboard = false
  try {
    byKeyboard = pill.matches(':focus-visible')
  } catch {
    // селектор неизвестен браузеру
  }
  if (byKeyboard) pill.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

// Фильтры-«таблетки» типов с числом узлов. Нажата — тип показан на графе; скрытый тип — пустая точка, не только цвет
export function TypeFilters({ counts, hidden, onToggle }: { counts: Record<NodeType, number>; hidden: ReadonlySet<NodeType>; onToggle: (type: NodeType) => void }) {
  return (
    <div className="graph-filters" role="group" aria-label="Типы узлов">
      {TYPE_ORDER.map((type) => (
        <button key={type} type="button" className="btn graph-filter" aria-pressed={!hidden.has(type)} onClick={() => onToggle(type)} onFocus={reveal}>
          <span className="graph-dot" style={{ '--dot': `var(${TYPE_COLOR_VAR[type]})` } as CSSProperties} aria-hidden="true" />
          {TYPE_FILTER_LABEL[type]} <span className="graph-filter-count">{counts[type]}</span>
        </button>
      ))}
    </div>
  )
}
