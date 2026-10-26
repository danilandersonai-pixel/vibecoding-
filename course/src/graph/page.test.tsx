/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import data from '../../content/graph.json'
import App from '../App'
import type { GraphCanvasProps } from './GraphCanvas'
import GraphPage from './GraphPage'
import { indexGraph, type GraphData, type NodeType } from './model'

// Рисунок подменён: запоминает свойства, с которыми его нарисовал экран; «щелчок» по рисунку и «нет WebGL» — через них.
// Настоящий GraphCanvas проверяется ниже, с подменённым Sigma (в jsdom нет WebGL)
const canvas = vi.hoisted(() => ({ props: null as GraphCanvasProps | null }))
vi.mock('./GraphCanvas', () => ({
  GraphCanvas: (props: GraphCanvasProps) => {
    canvas.props = props
    return <div data-testid="graph-canvas" />
  },
}))

// Данные графа — настоящие, состояние загрузки задаёт тест
const graph = vi.hoisted(() => ({ state: null as unknown }))
vi.mock('./load', () => ({ useGraph: () => graph.state }))

// Окно поиска не ждёт индекс книги: в этих проверках нужны только термины
vi.mock('../../content/book-index.json', () => ({ default: [] }))

// Подменённый Sigma: запоминает граф, настройки и обработчики; камера — шпионы
type FakeSigma = {
  graph: { getNodeAttributes: (id: string) => Record<string, unknown>; edges: () => string[]; extremities: (e: string) => [string, string]; getEdgeAttributes: (e: string) => Record<string, unknown> }
  container: HTMLElement
  settings: Record<string, unknown> & {
    nodeReducer: (id: string, attrs: Record<string, unknown>) => Record<string, unknown>
    edgeReducer: (id: string, attrs: Record<string, unknown>) => Record<string, unknown>
  }
  handlers: Record<string, (payload: unknown) => void>
  camera: { animate: ReturnType<typeof vi.fn>; setState: ReturnType<typeof vi.fn> }
  refresh: ReturnType<typeof vi.fn>
  kill: ReturnType<typeof vi.fn>
}
const sigma = vi.hoisted(() => ({ instances: [] as FakeSigma[], fail: false }))
vi.mock('sigma', () => ({
  default: class {
    graph: unknown
    container: HTMLElement
    settings: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void> = {}
    camera = { animate: vi.fn(), setState: vi.fn() }
    refresh = vi.fn()
    kill = vi.fn()
    constructor(graph: unknown, container: HTMLElement, settings: Record<string, unknown>) {
      // как настоящий Sigma без WebGL: холст уже в контейнере, контекста нет — ошибка
      container.append(document.createElement('canvas'))
      if (sigma.fail) throw new TypeError("Cannot read properties of null (reading 'blendFunc')")
      this.graph = graph
      this.container = container
      this.settings = { ...settings }
      sigma.instances.push(this as unknown as FakeSigma)
    }
    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
      return this
    }
    setSetting(key: string, value: unknown) {
      this.settings[key] = value
      return this
    }
    getCamera() {
      return this.camera
    }
    getNodeDisplayData(id: string) {
      return id === 'term:1' ? { x: 0.25, y: 0.75 } : { x: 0.5, y: 0.5 }
    }
  },
}))

const INDEX = indexGraph(data as GraphData)

const card = () => within(screen.getByRole('complementary', { name: 'Узел графа' }))
const cardTitle = () => card().getByRole('heading', { level: 2 })
const group = (title: string) => within(card().getByRole('region', { name: new RegExp(`^${title}`) }))
const field = () => screen.getByRole('combobox', { name: 'Найти на графе' })
const HINT = 'Выберите узел на графе или найдите его поиском'

beforeEach(() => {
  graph.state = { status: 'ready', index: INDEX }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.location.hash = ''
  canvas.props = null
  sigma.instances.length = 0
  sigma.fail = false
})

describe('экран графа', () => {
  it('холодный вход по #/graph/term:N — выбран узел, карточка открыта', async () => {
    window.location.hash = '#/graph/term%3A1'
    render(<App />)
    await screen.findByRole('complementary', { name: 'Узел графа' })
    expect(cardTitle()).toHaveTextContent('Агент')
    expect(card().getByText('Термин')).toHaveClass('kicker')
    expect(canvas.props?.selected).toBe('term:1')
    expect(canvas.props?.hidden.size).toBe(0)

    // разметка §5: «← Курс», заголовок, поиск, фильтры, рисунок, карточка
    expect(screen.getByRole('link', { name: 'Курс' })).toHaveAttribute('href', '#/')
    expect(screen.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeInTheDocument()
    expect(field()).toHaveAttribute('placeholder', 'Термин, глава, день…')
    expect(within(screen.getByRole('group', { name: 'Типы узлов' })).getByRole('button', { name: 'Термины 280' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument()
    // карточка-панель телефона закрывается: выбор остаётся, панель скрыта
    const side = screen.getByRole('complementary', { name: 'Узел графа' }).parentElement!
    expect(side).toHaveClass('is-open')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(side).not.toHaveClass('is-open')
    expect(canvas.props?.selected).toBe('term:1')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('неизвестный id — общий вид', async () => {
    const errors = vi.spyOn(console, 'error')
    for (const hash of ['#/graph/term%3A9999', '#/graph/%E0%A4%A', '#/graph']) {
      window.location.hash = hash
      const { unmount } = render(<App />)
      expect(await screen.findByText(HINT)).toBeInTheDocument()
      expect(canvas.props?.selected).toBeNull()
      expect(screen.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeInTheDocument()
      unmount()
    }
    expect(errors).not.toHaveBeenCalled()
  })

  it('нет WebGL — сообщение, поиск и карточки работают', async () => {
    const user = userEvent.setup()
    render(<GraphPage />)
    act(() => canvas.props!.onUnsupported())
    expect(screen.getByText('Рисунок графа не поддерживается этим браузером — пользуйтесь поиском и карточками')).toBeInTheDocument()
    expect(screen.queryByTestId('graph-canvas')).toBeNull()

    await user.type(field(), 'Агент')
    await user.keyboard('{Enter}')
    expect(cardTitle()).toHaveTextContent('Агент')
    expect(window.location.hash).toBe('#/graph/term%3A1')
    // связь в карточке — новый узел, фокус на его названии
    await user.click(group('Объясняется в главе').getByRole('button', { name: 'Азбука' }))
    expect(cardTitle()).toHaveTextContent('Азбука')
    expect(cardTitle()).toHaveFocus()
    expect(window.location.hash).toBe('#/graph/ch%3Aabc')
  })

  it('данные не загрузились — «Граф сейчас недоступен»', () => {
    graph.state = { status: 'failed' }
    const { rerender } = render(<GraphPage node="term:1" />)
    expect(screen.getByText('Граф сейчас недоступен')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Курс' })).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByTestId('graph-canvas')).toBeNull()

    // пока данные грузятся — «Загружаю граф…»
    graph.state = { status: 'loading' }
    rerender(<GraphPage node="term:1" />)
    expect(screen.getByText('Загружаю граф…')).toBeInTheDocument()
    expect(screen.queryByText('Граф сейчас недоступен')).toBeNull()
  })

  it('выбор узла меняет адрес без новой записи истории', async () => {
    window.location.hash = '#/graph'
    const user = userEvent.setup()
    const replace = vi.spyOn(window.history, 'replaceState')
    const push = vi.spyOn(window.history, 'pushState')
    const length = window.history.length
    render(<App />)
    await screen.findByText(HINT)
    const heading = screen.getByRole('heading', { level: 1 })

    // поиск
    await user.type(field(), 'агент фон')
    await user.keyboard('{Enter}')
    expect(cardTitle()).toHaveTextContent('Агент фонового программирования')
    expect(window.location.hash).toBe('#/graph/term%3A2')
    expect(canvas.props?.selected).toBe('term:2')
    // рисунок: узел и пустое место
    act(() => canvas.props!.onSelect('day:1'))
    expect(cardTitle()).toHaveTextContent('День 1 · Азбука и знакомство с моделями')
    expect(window.location.hash).toBe('#/graph/day%3A1')
    act(() => canvas.props!.onSelect(null))
    expect(card().getByText(HINT)).toBeInTheDocument()
    expect(window.location.hash).toBe('#/graph')

    expect(replace.mock.calls).toEqual([
      [null, '', '#/graph/term%3A2'],
      [null, '', '#/graph/day%3A1'],
      [null, '', '#/graph'],
    ])
    expect(push).not.toHaveBeenCalled()
    expect(window.history.length).toBe(length)
    // экран тот же, не пересоздан
    expect(screen.getByRole('heading', { level: 1 })).toBe(heading)

    // history недоступна (страница в чужой рамке) — выбор всё равно работает
    replace.mockImplementation(() => {
      throw new DOMException('Нет доступа', 'SecurityError')
    })
    act(() => canvas.props!.onSelect('term:1'))
    expect(cardTitle()).toHaveTextContent('Агент')
  })

  it('фильтры скрывают тип на рисунке', async () => {
    const user = userEvent.setup()
    render(<GraphPage />)
    const filters = within(screen.getByRole('group', { name: 'Типы узлов' }))
    await user.click(filters.getByRole('button', { name: 'Разделы 99' }))
    expect(filters.getByRole('button', { name: 'Разделы 99' })).toHaveAttribute('aria-pressed', 'false')
    expect([...canvas.props!.hidden]).toEqual<NodeType[]>(['section'])
    await user.click(filters.getByRole('button', { name: 'Разделы 99' }))
    expect(canvas.props!.hidden.size).toBe(0)
  })
})

describe('входы на граф', () => {
  it('кнопка «Граф» в верхней строке главной и в шапке дня', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(within(screen.getByRole('navigation', { name: 'Разделы' })).getByRole('button', { name: 'Граф' }))
    expect(window.location.hash).toBe('#/graph')
    expect(await screen.findByText(HINT)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Граф знаний' })).toBeInTheDocument()
    unmount()

    window.location.hash = '#/day/1'
    render(<App />)
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Граф' }))
    expect(window.location.hash).toBe('#/graph')
    expect(await screen.findByText(HINT)).toBeInTheDocument()
  })

  it('«На графе» у термина в поиске', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Поиск' }))
    await user.type(screen.getByRole('searchbox', { name: 'Поиск по курсу и книге' }), 'Агент')
    const onGraph = () => {
      const terms = within(screen.getByRole('dialog', { name: 'Поиск' })).getByRole('region', { name: /^Термины/ })
      return within(within(terms).getAllByRole('listitem')[0]).getByRole('link', { name: 'На графе' })
    }
    expect(onGraph()).toHaveAttribute('href', '#/graph/term%3A1')
    await user.click(onGraph())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    expect(window.location.hash).toBe('#/graph/term%3A1')
    await screen.findByRole('complementary', { name: 'Узел графа' })
    expect(cardTitle()).toHaveTextContent('Агент')

    // граф открыт, выбор ушёл с узла из адреса; «На графе» в окне поиска снова выбирает его
    act(() => canvas.props!.onSelect('day:1'))
    expect(cardTitle()).toHaveTextContent('День 1')
    await user.keyboard('/')
    await user.click(onGraph())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cardTitle()).toHaveTextContent('Агент')
    expect(canvas.props?.selected).toBe('term:1')
  })
})

// Настоящий рисунок с подменённым Sigma
async function realCanvas() {
  return (await vi.importActual<typeof import('./GraphCanvas')>('./GraphCanvas')).GraphCanvas
}

function fakeMediaQuery() {
  const listeners = new Set<() => void>()
  return {
    matches: false,
    addEventListener: vi.fn((_: string, l: () => void) => listeners.add(l)),
    removeEventListener: vi.fn((_: string, l: () => void) => listeners.delete(l)),
    change: () => listeners.forEach((l) => l()),
  }
}

describe('рисунок графа', () => {
  // Переменные темы — из настоящего tokens.css; тёмная тема сайта — атрибут data-theme у <html>
  const tokens = document.createElement('style')
  tokens.textContent = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../styles/tokens.css'), 'utf8')
  beforeEach(() => {
    document.head.append(tokens)
  })
  afterEach(() => {
    tokens.remove()
  })

  it('цвета перечитываются при смене темы', async () => {
    const GraphCanvas = await realCanvas()
    const scheme = fakeMediaQuery()
    vi.stubGlobal('matchMedia', vi.fn(() => scheme))
    const root = document.documentElement
    try {
      const { unmount } = render(<GraphCanvas index={INDEX} selected={null} hidden={new Set()} onSelect={() => {}} onUnsupported={() => {}} />)
      const s = sigma.instances[0]
      const color = (id: string) => s.settings.nodeReducer(id, s.graph.getNodeAttributes(id)).color
      expect([color('ch:abc'), color('part:I'), color('sec:s1'), color('fig:abc_restaurant'), color('term:1'), color('day:1'), color('video:ch-01')]).toEqual([
        '#1D2B8F',
        '#1D2B8F',
        '#5B606A',
        '#A3A196',
        '#2B3FBF',
        '#2E7D5B',
        '#AE3F1C',
      ])
      expect(s.settings.labelColor).toEqual({ color: '#1C1E22' })

      // тема сайта
      root.setAttribute('data-theme', 'dark')
      await waitFor(() => expect(color('ch:abc')).toBe('#B2BAF0'))
      expect([color('term:1'), color('day:1'), color('video:ch-01')]).toEqual(['#8D9CFF', '#5CC49A', '#F18D6B'])
      expect(s.settings.labelColor).toEqual({ color: '#E8E5DD' })
      expect(s.refresh).toHaveBeenCalled()

      // тема системы: prefers-color-scheme
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      root.style.setProperty('--accent', '#123456')
      act(() => scheme.change())
      expect(color('term:1')).toBe('#123456')

      unmount()
      expect(s.kill).toHaveBeenCalled()
      expect(scheme.removeEventListener).toHaveBeenCalled()
    } finally {
      root.removeAttribute('data-theme')
      root.style.removeProperty('--accent')
    }
  })

  it('щелчки, соседи выбранного, скрытые типы, камера', async () => {
    const GraphCanvas = await realCanvas()
    const onSelect = vi.fn()
    const props = { index: INDEX, onSelect, onUnsupported: () => {} }
    const { container, rerender } = render(<GraphCanvas {...props} selected={null} hidden={new Set()} />)
    const s = sigma.instances[0]
    expect(s.container).toHaveAttribute('aria-hidden', 'true')
    expect(container.contains(s.container)).toBe(true)
    // координаты и размер — из данных; подписи мелких узлов — по мере приближения
    expect(s.graph.getNodeAttributes('term:1')).toMatchObject({ x: 13.2, y: 122.1, size: 13.2, label: 'Агент' })
    expect(s.settings.labelRenderedSizeThreshold).toBeGreaterThan(0)

    s.handlers.clickNode({ node: 'term:1' })
    expect(onSelect).toHaveBeenLastCalledWith('term:1')
    s.handlers.clickStage({})
    expect(onSelect).toHaveBeenLastCalledWith(null)

    const view = (id: string) => s.settings.nodeReducer(id, s.graph.getNodeAttributes(id))
    expect(view('day:21').color).toBe('#2E7D5B')
    expect(view('term:1').highlighted).toBeFalsy()

    rerender(<GraphCanvas {...props} selected="term:1" hidden={new Set<NodeType>(['section'])} />)
    // Sigma тот же: выбор и фильтры меняют только вид
    expect(sigma.instances).toHaveLength(1)
    expect(s.refresh).toHaveBeenCalled()
    expect(view('term:1')).toMatchObject({ highlighted: true, forceLabel: true })
    // сосед — в своём цвете, остальное бледнеет и без подписи
    expect(view('ch:abc').color).toBe('#1D2B8F')
    expect(view('day:21').color).not.toBe('#2E7D5B')
    expect(view('day:21').label).toBeNull()
    expect(view('ch:abc').label).toBe('Азбука')
    // скрытый тип
    expect(view('sec:s1').hidden).toBe(true)
    expect(view('ch:abc').hidden).toBeFalsy()
    // связи выбранного подсвечены, связи со скрытыми узлами скрыты
    const edges = s.graph.edges()
    const edge = (test: (a: string, b: string) => boolean) => edges.find((e) => test(...s.graph.extremities(e)))!
    const edgeView = (e: string) => s.settings.edgeReducer(e, s.graph.getEdgeAttributes(e))
    const own = edgeView(edge((a, b) => a === 'term:1' && b === 'ch:abc'))
    const other = edgeView(edge((a, b) => a === 'week:3' && b === 'day:21'))
    expect(own.color).not.toBe(other.color)
    expect(own.hidden).toBeFalsy()
    expect(edgeView(edge((a, b) => a === 'ch:ch1' && b.startsWith('sec:'))).hidden).toBe(true)
    // камера подводит выбранный узел к центру
    expect([...s.camera.animate.mock.calls, ...s.camera.setState.mock.calls].at(-1)?.[0]).toMatchObject({ x: 0.25, y: 0.75 })
  })

  it('Sigma не создался (нет WebGL) — onUnsupported, контейнер пуст', async () => {
    const GraphCanvas = await realCanvas()
    sigma.fail = true
    const onUnsupported = vi.fn()
    const { container } = render(<GraphCanvas index={INDEX} selected={null} hidden={new Set()} onSelect={() => {}} onUnsupported={onUnsupported} />)
    expect(onUnsupported).toHaveBeenCalledTimes(1)
    expect(container.querySelector('canvas')).toBeNull()
  })
})
