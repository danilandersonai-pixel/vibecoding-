import type { CSSProperties } from 'react'
import { TYPE_COLOR_VAR, TYPE_FILTER_LABEL, TYPE_ORDER, type NodeType } from './model'

// Фильтры-«таблетки» типов с числом узлов. Нажата — тип показан на графе; скрытый тип — пустая точка, не только цвет
export function TypeFilters({ counts, hidden, onToggle }: { counts: Record<NodeType, number>; hidden: ReadonlySet<NodeType>; onToggle: (type: NodeType) => void }) {
  return (
    <div className="graph-filters" role="group" aria-label="Типы узлов">
      {TYPE_ORDER.map((type) => (
        <button key={type} type="button" className="btn graph-filter" aria-pressed={!hidden.has(type)} onClick={() => onToggle(type)}>
          <span className="graph-dot" style={{ '--dot': `var(${TYPE_COLOR_VAR[type]})` } as CSSProperties} aria-hidden="true" />
          {TYPE_FILTER_LABEL[type]} <span className="graph-filter-count">{counts[type]}</span>
        </button>
      ))}
    </div>
  )
}
