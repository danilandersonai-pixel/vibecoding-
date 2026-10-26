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

// Подменённый Sigma: запоминает граф, настройки и обработчики; камера, размеры и перевод координат — шпионы.
// Рисунок 800 × 600; viewportToFramedGraph — как у Sigma: точка экрана при заданной камере (1 = весь рисунок)
type Mock = ReturnType<typeof vi.fn>
type FakeSigma = {
  graph: { getNodeAttributes: (id: string) => Record<string, unknown>; edges: () => string[]; extremities: (e: string) => [string, string]; getEdgeAttributes: (e: string) => Record<string, unknown> }
  container: HTMLElement
  settings: Record<string, unknown> & {
    nodeReducer: (id: string, attrs: Record<string, unknown>) => Record<string, unknown>
    edgeReducer: (id: string, attrs: Record<string, unknown>) => Record<string, unknown>
    defaultDrawNodeHover: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => void
    defaultDrawNodeLabel: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => void
  }
  handlers: Record<string, (payload: unknown) => void>
  camera: { animate: Mock; setState: Mock; getState: () => { x: number; y: number; ratio: number; angle: number } }
  setSetting: Mock
  refresh: Mock
  resize: Mock
  viewportToFramedGraph: Mock
  kill: Mock
}
const sigma = vi.hoisted(() => ({ instances: [] as FakeSigma[], fail: false }))
vi.mock('sigma', () => ({
  default: class {
    graph: unknown
    container: HTMLElement
    settings: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void> = {}
    camera = { animate: vi.fn(), setState: vi.fn(), getState: () => ({ x: 0.5, y: 0.5, ratio: 1, angle: 0 }) }
    setSetting = vi.fn((key: string, value: unknown) => {
      this.settings[key] = value
      return this
    })
    refresh = vi.fn()
    resize = vi.fn()
    kill = vi.fn()
    viewportToFramedGraph = vi.fn((p: { x: number; y: number }, o: { cameraState: { x: number; y: number } }) => ({
      x: o.cameraState.x + (p.x - 400) / 800,
      y: o.cameraState.y - (p.y - 300) / 600,
    }))
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
    getCamera() {
      return this.camera
    }
    getDimensions() {
      return { width: 800, height: 600 }
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

describe('экран графа: телефон', () => {
  // ≤ 960 px — карточка панелью снизу
  function phone(on: () => boolean) {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ ...fakeMediaQuery(), matches: query === '(max-width: 960px)' && on() })))
  }
  const side = () => screen.getByRole('complementary', { name: 'Узел графа' }).parentElement!

  it('Esc закрывает карточку-панель; в поле поиска с текстом — только очищает поле', async () => {
    let narrow = true
    phone(() => narrow)
    const user = userEvent.setup()
    render(<GraphPage node="term:1" />)
    expect(side()).toHaveClass('is-open')

    await user.type(field(), 'код')
    await user.keyboard('{Escape}')
    expect(field()).toHaveValue('')
    expect(side()).toHaveClass('is-open')
    // поле пустое — Esc закрывает панель, фокус на заголовке
    await user.keyboard('{Escape}')
    expect(side()).not.toHaveClass('is-open')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()

    // выбор на рисунке снова открывает панель; фокус вне поля (после нажатия на рисунок) — Esc тоже закрывает
    act(() => canvas.props!.onSelect('day:1'))
    expect(side()).toHaveClass('is-open')
    act(() => (document.activeElement as HTMLElement).blur())
    await user.keyboard('{Escape}')
    expect(side()).not.toHaveClass('is-open')

    // компьютер: карточка — колонка справа, Esc её не трогает
    narrow = false
    act(() => canvas.props!.onSelect('term:1'))
    await user.keyboard('{Escape}')
    expect(side()).toHaveClass('is-open')
  })

  it('рисунок знает, сколько его закрывает панель снизу', () => {
    render(<GraphPage node="term:1" />)
    const inset = canvas.props!.bottomInset!
    // панель — колонка справа (компьютер): рисунок не закрыт
    expect(inset()).toBe(0)
    // телефон: панель прижата к низу окна (768 px), высота 300 — закрывает рисунок от 468 до его низа (600)
    side().style.position = 'fixed'
    Object.defineProperty(side(), 'offsetHeight', { configurable: true, value: 300 })
    const stage = screen.getByTestId('graph-canvas').parentElement!
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 600, height: 500 } as DOMRect)
    expect(window.innerHeight).toBe(768)
    expect(inset()).toBe(132)
    // панель выше всего рисунка — закрыт целиком, но не больше его высоты
    Object.defineProperty(side(), 'offsetHeight', { configurable: true, value: 700 })
    expect(inset()).toBe(500)
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
    const start = window.history.length
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
    // с главной — новая запись истории: «Назад» вернёт на главную
    expect(window.history.length).toBe(start + 1)
    await screen.findByRole('complementary', { name: 'Узел графа' })
    expect(cardTitle()).toHaveTextContent('Агент')

    // граф открыт, выбор ушёл с узла из адреса; «На графе» в окне поиска снова выбирает его
    act(() => canvas.props!.onSelect('day:1'))
    expect(cardTitle()).toHaveTextContent('День 1')
    const replace = vi.spyOn(window.history, 'replaceState')
    await user.keyboard('/')
    await user.click(onGraph())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cardTitle()).toHaveTextContent('Агент')
    expect(canvas.props?.selected).toBe('term:1')
    // при открытом графе адрес заменяется, а не добавляется: «Назад» уводит с графа
    expect(replace).toHaveBeenLastCalledWith(null, '', '#/graph/term%3A1')
    expect(window.location.hash).toBe('#/graph/term%3A1')
    expect(window.history.length).toBe(start + 1)
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

      // тема сайта: цвета заново и перерисовка
      s.refresh.mockClear()
      root.setAttribute('data-theme', 'dark')
      await waitFor(() => expect(color('ch:abc')).toBe('#B2BAF0'))
      expect([color('term:1'), color('day:1'), color('video:ch-01')]).toEqual(['#8D9CFF', '#5CC49A', '#F18D6B'])
      expect(s.setSetting).toHaveBeenCalledWith('labelColor', { color: '#E8E5DD' })
      expect(s.refresh).toHaveBeenCalled()

      // тема системы: prefers-color-scheme
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      root.style.setProperty('--accent', '#123456')
      act(() => scheme.change())
      expect(color('term:1')).toBe('#123456')

      unmount()
      expect(s.kill).toHaveBeenCalled()
      // после уборки смена темы рисунок не трогает: наблюдатель отключён, слушатель снят
      s.refresh.mockClear()
      s.setSetting.mockClear()
      root.setAttribute('data-theme', 'light')
      await new Promise((r) => setTimeout(r, 0))
      act(() => scheme.change())
      expect(s.setSetting).not.toHaveBeenCalled()
      expect(s.refresh).not.toHaveBeenCalled()
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
    const agent = INDEX.byId.get('term:1')!
    expect(s.graph.getNodeAttributes('term:1')).toMatchObject({ x: agent.x, y: agent.y, size: agent.size, label: 'Агент' })
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

  it('камера: без анимации при «уменьшить движение»; узел — в середину видимой части над панелью', async () => {
    const GraphCanvas = await realCanvas()
    let reduce = true
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ ...fakeMediaQuery(), matches: reduce && query === '(prefers-reduced-motion: reduce)' })),
    )
    const props = { index: INDEX, hidden: new Set<NodeType>(), onSelect: () => {}, onUnsupported: () => {} }
    const { rerender } = render(<GraphCanvas {...props} selected={null} />)
    const s = sigma.instances[0]
    rerender(<GraphCanvas {...props} selected="term:1" />)
    expect(s.camera.setState).toHaveBeenLastCalledWith({ x: 0.25, y: 0.75 })
    expect(s.camera.animate).not.toHaveBeenCalled()

    reduce = false
    rerender(<GraphCanvas {...props} selected="ch:abc" />)
    expect(s.camera.animate).toHaveBeenCalledTimes(1)
    expect(s.camera.animate.mock.calls[0][0]).toEqual({ x: 0.5, y: 0.5 })

    // нижние 200 px рисунка 800 × 600 закрыты панелью: камера смотрит на точку на 100 px ниже узла,
    // и узел встаёт в середину видимых 400 px
    rerender(<GraphCanvas {...props} selected="term:1" bottomInset={() => 200} />)
    expect(s.viewportToFramedGraph).toHaveBeenLastCalledWith({ x: 400, y: 400 }, { cameraState: { x: 0.25, y: 0.75, ratio: 1, angle: 0 } })
    expect(s.camera.animate.mock.calls.at(-1)?.[0]).toEqual({ x: 0.25, y: 0.75 - 100 / 600 })
  })

  it('размер рисунка следует за контейнером (ResizeObserver)', async () => {
    const GraphCanvas = await realCanvas()
    const observers: { callback: () => void; observe: Mock; disconnect: Mock }[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: () => void
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        constructor(callback: () => void) {
          this.callback = callback
          observers.push(this)
        }
      },
    )
    const { unmount } = render(<GraphCanvas index={INDEX} selected={null} hidden={new Set()} onSelect={() => {}} onUnsupported={() => {}} />)
    const s = sigma.instances[0]
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledWith(s.container)
    s.refresh.mockClear()
    act(() => observers[0].callback())
    expect(s.resize).toHaveBeenCalled()
    expect(s.refresh).toHaveBeenCalled()
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('подпись под указателем — на плашке; без roundRect (старые браузеры) — прямоугольная', async () => {
    const GraphCanvas = await realCanvas()
    render(<GraphCanvas index={INDEX} selected={null} hidden={new Set()} onSelect={() => {}} onUnsupported={() => {}} />)
    const draw = sigma.instances[0].settings.defaultDrawNodeHover
    const context = () => ({
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      measureText: () => ({ width: 40 }),
      beginPath: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
    })
    const data = { x: 10, y: 20, size: 5, label: 'Агент', color: '#000000' }
    const settings = { labelSize: 13, labelWeight: '500', labelFont: 'Onest' }
    const old = context()
    draw(old as unknown as CanvasRenderingContext2D, data, settings)
    expect(old.rect).toHaveBeenCalled()
    expect(old.fillText).toHaveBeenCalledWith('Агент', 18, expect.any(Number))
    const modern = { ...context(), roundRect: vi.fn() }
    draw(modern as unknown as CanvasRenderingContext2D, data, settings)
    expect(modern.roundRect).toHaveBeenCalled()
    expect(modern.rect).not.toHaveBeenCalled()
  })

  // Подпись узла — с обводкой цвета «бумаги» темы: читается поверх узлов и связей. Ячейка сетки подписей 150 px:
  // на общем виде длинные названия реже наезжают друг на друга
  it('подпись узла — с обводкой цвета бумаги темы; сетка подписей 150 px', async () => {
    const GraphCanvas = await realCanvas()
    const root = document.documentElement
    try {
      render(<GraphCanvas index={INDEX} selected={null} hidden={new Set()} onSelect={() => {}} onUnsupported={() => {}} />)
      const s = sigma.instances[0]
      expect(s.settings.labelGridCellSize).toBe(150)
      const draw = s.settings.defaultDrawNodeLabel
      const settings = { labelSize: 13, labelWeight: '500', labelFont: 'Onest' }
      // что и каким цветом рисуется, по порядку: обводка под заливкой
      const drawn = (label: string | null) => {
        const steps: string[] = []
        const context = {
          font: '',
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          lineJoin: '',
          strokeText: vi.fn((text: string, x: number) => steps.push(`обводка ${context.strokeStyle} ${context.lineWidth} ${text} ${x}`)),
          fillText: vi.fn((text: string, x: number) => steps.push(`текст ${context.fillStyle} ${text} ${x}`)),
        }
        draw(context as unknown as CanvasRenderingContext2D, { x: 10, y: 20, size: 5, label }, settings)
        return steps
      }
      expect(drawn('Агент')).toEqual(['обводка #FBFAF6 4 Агент 18', 'текст #1C1E22 Агент 18'])
      expect(drawn(null)).toEqual([])

      root.setAttribute('data-theme', 'dark')
      await waitFor(() => expect(s.setSetting).toHaveBeenCalledWith('labelColor', { color: '#E8E5DD' }))
      expect(drawn('Агент')).toEqual(['обводка #1F2228 4 Агент 18', 'текст #E8E5DD Агент 18'])
    } finally {
      root.removeAttribute('data-theme')
    }
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
