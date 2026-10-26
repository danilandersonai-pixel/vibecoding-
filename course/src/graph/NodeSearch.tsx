import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import { IconSearch } from '../components/icons'
import { queryWords } from '../search/normalize'
import { findNodes, TYPE_LABEL, type GraphIndex, type GraphNode } from './model'

// Поиск узла на графе — поле со списком вариантов (combobox): от 2 знаков до 8 узлов, подпись и тип.
// Фокус остаётся в поле, выбранный стрелками вариант — aria-activedescendant. ↑/↓ — по кругу, Enter — выбранный
// (или первый), Esc — очистить поле. После выбора список закрыт до нового ввода, щелчка по полю или ↓
export function NodeSearch({ index, onSelect }: { index: GraphIndex; onSelect: (id: string) => void }) {
  const uid = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const results = useMemo(() => findNodes(index, query), [index, query])
  const asked = queryWords(query).length > 0
  const expanded = open && results.length > 0
  const optionId = (i: number) => `${uid}-o${i}`

  // Выбранный стрелками вариант виден в списке, даже если список прокручен
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${uid}-o${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [uid, expanded, active])

  function choose(node: GraphNode) {
    setOpen(false)
    setActive(-1)
    onSelect(node.id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const n = results.length
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (n === 0) return
      e.preventDefault()
      const down = e.key === 'ArrowDown'
      setOpen(true)
      setActive(!expanded || active < 0 ? (down ? 0 : n - 1) : (active + (down ? 1 : n - 1)) % n)
    } else if (e.key === 'Enter') {
      if (!expanded) return
      e.preventDefault()
      choose(results[Math.max(active, 0)])
    } else if (e.key === 'Escape') {
      // пустое поле Esc не трогает — он достаётся экрану (например, закрыть панель)
      if (query === '') return
      e.preventDefault()
      e.stopPropagation()
      setQuery('')
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="graph-search">
      <div className="graph-search-field">
        <label className="graph-search-icon" htmlFor={`${uid}-q`}>
          <IconSearch size={20} />
          <span className="visually-hidden">Найти на графе</span>
        </label>
        <input
          id={`${uid}-q`}
          className="graph-search-input"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${uid}-list`}
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          placeholder="Термин, глава, день…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </div>
      <ul id={`${uid}-list`} className="graph-options" role="listbox" aria-label="Найденные узлы" hidden={!expanded}>
        {expanded &&
          results.map((node, i) => (
            <li
              key={node.id}
              id={optionId(i)}
              className="graph-option"
              role="option"
              aria-selected={i === active}
              // фокус не уходит из поля: иначе blur закроет список раньше щелчка
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(node)}
            >
              <span className="graph-option-label">{node.label}</span> <span className="graph-option-type">{TYPE_LABEL[node.type]}</span>
            </li>
          ))}
      </ul>
      <p className="graph-search-status" role="status">
        {open && asked && results.length === 0 ? 'Ничего не нашлось' : ''}
      </p>
    </div>
  )
}
