import { useCallback, useEffect, useRef, useState } from 'react'
import { IconClose } from '../components/icons'
import { onNavigation, parseRoute } from '../router'
import { GraphCanvas } from './GraphCanvas'
import { GraphBar, GraphStatus } from './GraphStatus'
import { useGraph } from './load'
import type { NodeType } from './model'
import { NodeCard } from './NodeCard'
import { NodeSearch } from './NodeSearch'
import { TypeFilters } from './TypeFilters'

// Выбранный узел — в адресе, без новой записи истории: «Назад» уводит с экрана графа, а не по узлам.
// replaceState не шлёт hashchange — маршрут экран не перерисует. В чужой рамке (просмотрщик Claude) history
// может быть недоступна — тогда адрес просто не меняется
function showInAddress(id: string | null) {
  try {
    history.replaceState(null, '', id === null ? '#/graph' : `#/graph/${encodeURIComponent(id)}`)
  } catch {
    // выбор работает и без адреса
  }
}

// Телефон (≤ 960 px): карточка — панель снизу поверх рисунка (graph.css)
const PHONE = '(max-width: 960px)'

// Экран «Граф знаний» (спецификация §5): сверху «← Курс», заголовок, поиск узла и фильтры типов; ниже рисунок
// и карточка узла (на телефоне — панель снизу с «Закрыть», её закрывает и Esc). node — узел из адреса при открытии
// экрана; дальше выбор живёт здесь. Неизвестный id — общий вид. Ленивый кусок сборки: с ним грузятся sigma и graphology
export default function GraphPage({ node }: { node?: string }) {
  const graph = useGraph()
  const [selected, setSelected] = useState<string | null>(node ?? null)
  // Карточка-панель телефона открыта; выбор узла открывает её снова
  const [panel, setPanel] = useState(true)
  const [hidden, setHidden] = useState<ReadonlySet<NodeType>>(() => new Set())
  const [unsupported, setUnsupported] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const side = useRef<HTMLDivElement>(null)

  // Переход извне при открытом графе (адрес, «На графе» в окне поиска) выбирает узел из адреса. Слушаем сами переходы,
  // а не node: выбор на экране маршрут не меняет, и переход к узлу, который был в адресе раньше, маршрут бы не заметил
  useEffect(
    () =>
      onNavigation((hash) => {
        const route = parseRoute(hash)
        if (route.name !== 'graph') return
        setSelected(route.node ?? null)
        setPanel(true)
      }),
    [],
  )

  // Выбор — с рисунка, из поиска, из карточки; null — нажатие на пустое место рисунка
  const select = useCallback((id: string | null) => {
    setSelected(id)
    setPanel(true)
    showInAddress(id)
  }, [])
  const toggle = useCallback(
    (type: NodeType) =>
      setHidden((cur) => {
        const next = new Set(cur)
        if (!next.delete(type)) next.add(type)
        return next
      }),
    [],
  )
  const onUnsupported = useCallback(() => setUnsupported(true), [])
  // Сколько пикселей рисунка снизу закрывает карточка-панель: она прижата к низу окна (position: fixed) только
  // на телефоне. Высота — offsetHeight, без сдвига анимации появления
  const bottomInset = useCallback(() => {
    const panel = side.current
    const box = stage.current?.getBoundingClientRect()
    if (!panel || !box || getComputedStyle(panel).position !== 'fixed') return 0
    return Math.min(Math.max(box.bottom - (window.innerHeight - panel.offsetHeight), 0), box.height)
  }, [])

  const index = graph.status === 'ready' ? graph.index : undefined
  const current = selected !== null && index?.byId.has(selected) ? selected : null
  const open = panel && current !== null

  // «Закрыть» и Esc скрывают панель, выбор остаётся; фокус — на заголовке экрана, а не в начале страницы
  const close = useCallback(() => {
    setPanel(false)
    heading.current?.focus()
  }, [])

  // Esc закрывает панель на телефоне. Esc в поле поиска с текстом сюда не доходит (поле очищается), из окна поиска —
  // тоже (окно закрывается само); на компьютере карточка — колонка, закрывать нечего
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !window.matchMedia?.(PHONE).matches) return
      e.preventDefault()
      close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!index) return <GraphStatus failed={graph.status === 'failed'} />

  return (
    <div className="graph-page">
      <GraphBar heading={heading}>
        <NodeSearch index={index} onSelect={select} />
        <TypeFilters counts={index.counts} hidden={hidden} onToggle={toggle} />
      </GraphBar>
      <main className="graph-main">
        <div ref={stage} className={unsupported ? 'graph-stage is-note' : 'graph-stage'}>
          {unsupported ? (
            <p className="graph-note">Рисунок графа не поддерживается этим браузером — пользуйтесь поиском и карточками</p>
          ) : (
            <GraphCanvas index={index} selected={current} hidden={hidden} onSelect={select} onUnsupported={onUnsupported} bottomInset={bottomInset} />
          )}
        </div>
        <div ref={side} className={open ? 'graph-side is-open' : 'graph-side'}>
          <div className="graph-side-head">
            <button type="button" className="btn graph-close" onClick={close}>
              <IconClose size={18} />
              Закрыть
            </button>
          </div>
          <NodeCard index={index} id={current} onSelect={select} />
        </div>
      </main>
    </div>
  )
}
