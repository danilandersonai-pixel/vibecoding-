import Graph from 'graphology'
import { useEffect, useRef } from 'react'
import Sigma from 'sigma'
import type { NodeHoverDrawingFunction } from 'sigma/rendering'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'
import { scrollBehavior } from '../home/scroll'
import { TYPE_COLOR_VAR, TYPE_ORDER, type GraphIndex, type NodeType } from './model'

// bottomInset — сколько пикселей рисунка снизу сейчас закрыто (карточка-панель на телефоне): выбранный узел камера
// ставит в середину видимой части над ней
export type GraphCanvasProps = {
  index: GraphIndex
  selected: string | null
  hidden: ReadonlySet<NodeType>
  onSelect: (id: string | null) => void
  onUnsupported: () => void
  bottomInset?: () => number
}

// kind — тип узла графа знаний: атрибут type у Sigma занят (программа отрисовки узла)
type NodeAttrs = { x: number; y: number; size: number; label: string; kind: NodeType }

// Подписи — у узлов, которые на экране не меньше 9 px (при общем виде — у крупных, примерно каждого десятого);
// размер на экране растёт с приближением, и подписи появляются у всё более мелких узлов
const LABEL_SIZE_THRESHOLD = 9
// Камера подводит выбранный узел к центру за это время; при «уменьшить движение» — сразу
const CAMERA_MS = 500

// Цвета рисунка — значения переменных темы: WebGL не понимает var(). Узлы — по типу (TYPE_COLOR_VAR), бледные
// (не выбран и не сосед) — --rule; связи — --fig-grid, у выбранного — --accent, остальные при выборе — --paper-edge
type Palette = { type: Record<NodeType, string>; faded: string; edge: string; edgeOn: string; edgeOff: string; ink: string; paper: string; font: string }

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    type: Object.fromEntries(TYPE_ORDER.map((t) => [t, v(TYPE_COLOR_VAR[t])])) as Record<NodeType, string>,
    faded: v('--rule'),
    edge: v('--fig-grid'),
    edgeOn: v('--accent'),
    edgeOff: v('--paper-edge'),
    ink: v('--ink'),
    paper: v('--paper'),
    font: v('--font-ui'),
  }
}

type View = { selected: string | null; neighbors: Set<string>; hidden: ReadonlySet<NodeType> }

// Рисунок графа: Sigma (WebGL) поверх graphology. Координаты и размеры — из данных, цвета — из переменных темы
// (перечитываются при смене темы системы и атрибута data-theme). Выбранный узел и соседи подсвечены, остальное бледнеет;
// скрытые фильтрами типы не рисуются. Нажатие на узел — onSelect(id), на пустое место — onSelect(null).
// Sigma не создался (нет WebGL) — onUnsupported(). Для чтения с экрана рисунок скрыт: всё есть в поиске и карточке
export function GraphCanvas({ index, selected, hidden, onSelect, onUnsupported, bottomInset }: GraphCanvasProps) {
  const box = useRef<HTMLDivElement>(null)
  const sigma = useRef<{ renderer: Sigma<NodeAttrs>; graph: Graph<NodeAttrs> } | null>(null)
  // Что подсвечено и скрыто — читают функции вида Sigma (nodeReducer, edgeReducer) при каждой перерисовке
  const view = useRef<View>({ selected: null, neighbors: new Set(), hidden: new Set() })
  // Узел, к которому камера подводила в последний раз; undefined — ещё ни разу (первый узел — без анимации)
  const cameraAt = useRef<string | null | undefined>(undefined)
  // Обработчики — последние: Sigma создаётся один раз на данные и не пересоздаётся из-за новых функций
  const handlers = useRef({ onSelect, onUnsupported, bottomInset })
  useEffect(() => {
    handlers.current = { onSelect, onUnsupported, bottomInset }
  })

  useEffect(() => {
    const container = box.current!
    // Направленный граф с повторами: у пары узлов бывает несколько связей (встречные термины, term-ch и term-text)
    const graph = new Graph<NodeAttrs>({ type: 'directed', multi: true })
    for (const n of index.nodes) graph.addNode(n.id, { x: n.x, y: n.y, size: n.size, label: n.label, kind: n.type })
    for (const e of index.edges) if (graph.hasNode(e.s) && graph.hasNode(e.t)) graph.mergeEdgeWithKey(`${e.s}>${e.t}>${e.kind}`, e.s, e.t)

    let palette = readPalette()
    // Узел скрыт фильтром, если его тип скрыт; выбранный виден всегда — к нему подводит камера
    const isHidden = (node: string) => node !== view.current.selected && view.current.hidden.has(graph.getNodeAttribute(node, 'kind'))

    // Подпись под указателем и у выбранного — на «бумаге» темы: у Sigma по умолчанию белая плашка, а светлая подпись
    // тёмной темы на ней не видна
    const drawHover: NodeHoverDrawingFunction<NodeAttrs> = (context, data, settings) => {
      if (!data.label) return
      const size = settings.labelSize
      context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`
      const x = data.x + data.size + 3
      const width = context.measureText(data.label).width
      context.beginPath()
      // roundRect нет в старых браузерах (Firefox до 112) — там плашка прямоугольная
      if (typeof context.roundRect === 'function') context.roundRect(x - 5, data.y - size / 2 - 5, width + 10, size + 10, 6)
      else context.rect(x - 5, data.y - size / 2 - 5, width + 10, size + 10)
      context.fillStyle = palette.paper
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = palette.faded
      context.stroke()
      context.fillStyle = palette.ink
      context.fillText(data.label, x, data.y + size / 3)
    }

    let renderer: Sigma<NodeAttrs>
    try {
      renderer = new Sigma(graph, container, {
        // контейнер без размера (страница ещё раскладывается) — не ошибка: Sigma подстроится при изменении окна
        allowInvalidContainer: true,
        zIndex: true,
        labelFont: palette.font,
        labelSize: 13,
        labelWeight: '500',
        labelColor: { color: palette.ink },
        labelRenderedSizeThreshold: LABEL_SIZE_THRESHOLD,
        defaultDrawNodeHover: drawHover,
        nodeReducer: (node, data) => {
          const { selected: chosen, neighbors } = view.current
          const shown: Partial<NodeDisplayData> = { ...data, color: palette.type[data.kind] }
          if (node === chosen) return { ...shown, highlighted: true, forceLabel: true, zIndex: 2 }
          if (isHidden(node)) shown.hidden = true
          if (chosen !== null) {
            if (neighbors.has(node)) shown.zIndex = 1
            else Object.assign(shown, { color: palette.faded, label: null, zIndex: 0 })
          }
          return shown
        },
        edgeReducer: (edge, data) => {
          const chosen = view.current.selected
          const [s, t] = graph.extremities(edge)
          const shown: Partial<EdgeDisplayData> = { ...data, color: palette.edge }
          if (isHidden(s) || isHidden(t)) shown.hidden = true
          if (chosen !== null) Object.assign(shown, s === chosen || t === chosen ? { color: palette.edgeOn, zIndex: 1 } : { color: palette.edgeOff, zIndex: 0 })
          return shown
        },
      })
    } catch {
      // Нет WebGL: Sigma падает при создании, успев положить холсты в контейнер
      container.replaceChildren()
      handlers.current.onUnsupported()
      return
    }

    renderer.on('clickNode', ({ node }) => handlers.current.onSelect(node))
    renderer.on('clickStage', () => handlers.current.onSelect(null))
    renderer.on('enterNode', () => {
      container.style.cursor = 'pointer'
    })
    renderer.on('leaveNode', () => {
      container.style.cursor = ''
    })

    // Смена темы: тема системы (prefers-color-scheme) или сайта (data-theme у <html>) — цвета заново из переменных
    const onTheme = () => {
      palette = readPalette()
      renderer.setSetting('labelColor', { color: palette.ink })
      renderer.refresh()
    }
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
    scheme?.addEventListener('change', onTheme)
    const observer = new MutationObserver(onTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    // Размер холстов — за контейнером, а не только за окном: раскладка экрана меняется и без изменения окна
    const sizer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      renderer.resize()
      renderer.refresh()
    })
    sizer?.observe(container)

    sigma.current = { renderer, graph }
    cameraAt.current = undefined
    return () => {
      scheme?.removeEventListener('change', onTheme)
      observer.disconnect()
      sizer?.disconnect()
      renderer.kill()
      sigma.current = null
    }
  }, [index])

  // Выбор и фильтры меняют только вид; новый выбранный узел камера подводит к центру
  useEffect(() => {
    const current = sigma.current
    if (!current) return
    const { renderer, graph } = current
    const known = selected !== null && graph.hasNode(selected)
    view.current = { selected: known ? selected : null, neighbors: new Set(known ? graph.neighbors(selected) : []), hidden }
    renderer.refresh()

    if (selected === cameraAt.current) return
    const first = cameraAt.current === undefined
    cameraAt.current = selected
    const at = known ? renderer.getNodeDisplayData(selected) : undefined
    if (!at) return
    const camera = renderer.getCamera()
    // Низ рисунка закрыт панелью — камера смотрит на точку на половину закрытой части ниже узла (в координатах Sigma:
    // та точка экрана при камере на узле), и узел встаёт в середину видимой части
    const { width, height } = renderer.getDimensions()
    const inset = Math.min(Math.max(handlers.current.bottomInset?.() ?? 0, 0), height)
    const target =
      inset > 0
        ? renderer.viewportToFramedGraph({ x: width / 2, y: height / 2 + inset / 2 }, { cameraState: { ...camera.getState(), x: at.x, y: at.y } })
        : { x: at.x, y: at.y }
    if (first || scrollBehavior() !== 'smooth') camera.setState(target)
    else void camera.animate(target, { duration: CAMERA_MS })
  }, [index, selected, hidden])

  return <div ref={box} className="graph-canvas" aria-hidden="true" />
}
