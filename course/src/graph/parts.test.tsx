/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigate } from '../router'
import { goToResult } from '../search/goTo'
import { indexGraph, TYPE_COLOR_VAR, type EdgeKind, type GraphData, type GraphEdge, type GraphNode, type NodeType } from './model'
import { NodeCard } from './NodeCard'
import { NodeSearch } from './NodeSearch'
import { TypeFilters } from './TypeFilters'

// Переходы в курс подменены: проверяем, куда ведут действия карточки, а не сам переход
vi.mock('../router', async (importOriginal) => ({ ...(await importOriginal<typeof import('../router')>()), navigate: vi.fn() }))
vi.mock('../search/goTo', () => ({ goToResult: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Узел для проверок: координаты и размер не важны
function node(id: string, type: NodeType, label: string, extra: Partial<GraphNode> = {}): GraphNode {
  return { id, type, label, text: '', x: 0, y: 0, size: 5, ...extra }
}

const edge = (s: string, t: string, kind: EdgeKind, w?: number): GraphEdge => (w === undefined ? { s, t, kind } : { s, t, kind, w })

// Десять разделов: у термина «Агент» они в «Встречается в тексте» с весами 1…10 — больше восьми, есть «Показать все»
const SECTIONS = Array.from({ length: 10 }, (_, i) => node(`sec:s${i + 1}`, 'section', `Раздел ${i + 1}`, { book: `s${i + 1}` }))

const DATA: GraphData = {
  nodes: [
    node('part:I', 'part', 'Часть I · Основы'),
    node('ch:ch1', 'chapter', 'Глава 1 · Введение', { book: 'ch1', text: 'Введение в вайб-кодинг' }),
    ...SECTIONS,
    node('fig:f1', 'figure', 'Рис. 1.1 · ресторан', { book: 's1', figure: 'abc_restaurant' }),
    node('term:1', 'term', 'Агент', { book: 'abc', text: 'ИИ, который не только отвечает, но и сам действует.' }),
    node('term:2', 'term', 'Агент фонового программирования', { text: 'Агент, который работает в облаке.' }),
    node('week:1', 'week', 'Неделя 1 · Первая версия'),
    node('day:1', 'day', 'День 1 · Азбука', { day: 1, text: 'Понять, из чего состоит приложение' }),
    node('video:ch-01', 'video', 'Как работает агент', { day: 1, video: 'ch-01', text: 'День 1 · Азбука' }),
  ],
  edges: [
    edge('part:I', 'ch:ch1', 'part-ch'),
    edge('ch:ch1', 'sec:s1', 'ch-sec'),
    edge('sec:s1', 'fig:f1', 'sec-fig'),
    edge('term:1', 'ch:ch1', 'term-ch'),
    // взаимные упоминания: у «Агента» две группы одного вида — «Упоминает термины» и «Упоминается в терминах»
    edge('term:1', 'term:2', 'term-term'),
    edge('term:2', 'term:1', 'term-term'),
    ...SECTIONS.map((s, i) => edge('term:1', s.id, 'term-text', i + 1)),
    edge('week:1', 'day:1', 'week-day'),
    edge('day:1', 'video:ch-01', 'day-video'),
    edge('day:1', 'term:1', 'day-term'),
    edge('day:1', 'fig:f1', 'day-fig'),
    edge('video:ch-01', 'ch:ch1', 'video-ch'),
  ],
}

const index = indexGraph(DATA)

const card = () => within(screen.getByRole('complementary', { name: 'Узел графа' }))
const group = (title: string) => within(card().getByRole('region', { name: new RegExp(`^${title}`) }))

describe('карточка узла', () => {
  it('карточка термина: определение, группы, книга', () => {
    const errors = vi.spyOn(console, 'error')
    render(<NodeCard index={index} id="term:1" onSelect={() => {}} />)
    expect(card().getByText('Термин')).toHaveClass('kicker')
    expect(card().getByRole('heading', { level: 2 })).toHaveTextContent('Агент')
    expect(card().getByText('ИИ, который не только отвечает, но и сам действует.')).toBeInTheDocument()

    // группы — в порядке таблицы §3, с числом соседей
    expect(card().getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Объясняется в главе 1',
      'Упоминает термины 1',
      'Упоминается в терминах 1',
      'Встречается в тексте 10',
      'В курсе 1',
    ])
    expect(group('Объясняется в главе').getByRole('button', { name: 'Глава 1 · Введение' })).toBeInTheDocument()
    expect(group('Упоминает термины').getByRole('button', { name: 'Агент фонового программирования' })).toBeInTheDocument()
    expect(group('В курсе').getByRole('button', { name: 'День 1 · Азбука' })).toBeInTheDocument()
    // в тексте — число упоминаний, по убыванию; видны первые 8. Число подписано для чтения с экрана
    const w = (n: number) => `Раздел ${n} · упоминаний: ${n}`
    expect(
      group('Встречается в тексте')
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([10, 9, 8, 7, 6, 5, 4, 3].map(w))
    expect(group('Встречается в тексте').getByRole('button', { name: w(10) })).toBeInTheDocument()
    expect(group('Встречается в тексте').getAllByText('упоминаний:')[0]).toHaveClass('visually-hidden')

    const book = card().getByRole('link', { name: 'Открыть в книге' })
    expect(book).toHaveAttribute('href', 'book.html#abc')
    expect(book).toHaveAttribute('target', '_blank')
    expect(book).toHaveAttribute('rel', 'noopener')
    expect(card().queryByRole('link', { name: 'Открыть день' })).toBeNull()
    expect(card().queryByRole('link', { name: 'Смотреть ролик' })).toBeNull()
    // ключ группы — вид и подпись: две группы term-term не дают предупреждения React о повторе ключа
    expect(errors).not.toHaveBeenCalled()
  })

  it('«Показать все N» раскрывает группу', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<NodeCard index={index} id="term:1" onSelect={() => {}} />)
    expect(group('Встречается в тексте').getAllByRole('listitem')).toHaveLength(8)
    // в группе до 8 соседей кнопки нет
    expect(group('Объясняется в главе').queryByRole('button', { name: /^Показать все/ })).toBeNull()

    await user.click(group('Встречается в тексте').getByRole('button', { name: 'Показать все 10' }))
    const items = group('Встречается в тексте').getAllByRole('listitem')
    expect(items.map((li) => li.textContent).slice(8)).toEqual(['Раздел 2 · упоминаний: 2', 'Раздел 1 · упоминаний: 1'])
    expect(group('Встречается в тексте').queryByRole('button', { name: /^Показать все/ })).toBeNull()
    // фокус — на первом новом соседе: Tab идёт дальше от него
    expect(within(items[8]).getByRole('button')).toHaveFocus()

    // карточка другого узла и возврат — группа снова свёрнута
    rerender(<NodeCard index={index} id="day:1" onSelect={() => {}} />)
    rerender(<NodeCard index={index} id="term:1" onSelect={() => {}} />)
    expect(group('Встречается в тексте').getAllByRole('listitem')).toHaveLength(8)
  })

  it('кнопка-узел выбирает соседа', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { rerender } = render(<NodeCard index={index} id="term:1" onSelect={onSelect} />)
    await user.click(group('Объясняется в главе').getByRole('button', { name: 'Глава 1 · Введение' }))
    expect(onSelect).toHaveBeenCalledWith('ch:ch1')

    rerender(<NodeCard index={index} id="ch:ch1" onSelect={onSelect} />)
    const title = card().getByRole('heading', { level: 2 })
    expect(title).toHaveTextContent('Глава 1 · Введение')
    expect(card().getByText('Введение в вайб-кодинг')).toBeInTheDocument()
    // нажатая кнопка ушла вместе со старой карточкой — фокус на названии нового узла, а не в начале страницы
    expect(title).toHaveFocus()

    // выбор не из карточки (рисунок, поиск) фокус не трогает
    rerender(<NodeCard index={index} id="day:1" onSelect={onSelect} />)
    expect(card().getByRole('heading', { level: 2 })).not.toHaveFocus()
  })

  it('действия: день и ролик ведут в курс', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<NodeCard index={index} id="day:1" onSelect={() => {}} />)
    const day = card().getByRole('link', { name: 'Открыть день' })
    expect(day).toHaveAttribute('href', '#/day/1')
    await user.click(day)
    expect(navigate).toHaveBeenCalledWith('#/day/1')
    expect(card().queryByRole('link', { name: 'Открыть в книге' })).toBeNull()

    rerender(<NodeCard index={index} id="video:ch-01" onSelect={() => {}} />)
    expect(card().getByText('Видеоурок')).toHaveClass('kicker')
    expect(card().getByText('День 1 · Азбука', { selector: 'p' })).toBeInTheDocument()
    const video = card().getByRole('link', { name: 'Смотреть ролик' })
    expect(video).toHaveAttribute('href', '#/day/1')
    // с Ctrl — как обычная ссылка: переход не перехвачен
    expect(fireEvent.click(video, { ctrlKey: true })).toBe(true)
    expect(goToResult).not.toHaveBeenCalled()
    // обычный щелчок: переход ссылки отменён (preventDefault), ролик — тем же механизмом, что в поиске
    expect(fireEvent.click(video)).toBe(false)
    expect(goToResult).toHaveBeenCalledWith({ day: 1, anchor: 'part-theory' })
    expect(goToResult).toHaveBeenCalledTimes(1)
    // сам navigate не зовётся
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(card().queryByRole('link', { name: 'Открыть день' })).toBeNull()
  })

  it('схема: миниатюра и место в книге', () => {
    const { container } = render(<NodeCard index={index} id="fig:f1" onSelect={() => {}} />)
    expect(card().getByText('Схема')).toHaveClass('kicker')
    expect(card().getByRole('heading', { level: 2 })).toHaveTextContent('Рис. 1.1 · ресторан')
    expect(container.querySelector('.figure svg')).not.toBeNull()
    expect(card().getByRole('link', { name: 'Открыть в книге' })).toHaveAttribute('href', 'book.html#s1')
  })

  it('пустая карточка — подсказка', () => {
    const { rerender } = render(<NodeCard index={index} id={null} onSelect={() => {}} />)
    expect(card().getByText('Выберите узел на графе или найдите его поиском')).toBeInTheDocument()
    expect(card().queryByRole('heading')).toBeNull()
    // неизвестный id — тоже подсказка, а не ошибка
    rerender(<NodeCard index={index} id="term:999" onSelect={() => {}} />)
    expect(card().getByText('Выберите узел на графе или найдите его поиском')).toBeInTheDocument()
  })
})

describe('поиск узла', () => {
  it('поиск узла с клавиатуры', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<NodeSearch index={index} onSelect={onSelect} />)
    const field = screen.getByRole('combobox', { name: 'Найти на графе' })
    expect(field).toHaveAttribute('type', 'search')
    expect(field).toHaveAttribute('placeholder', 'Термин, глава, день…')
    expect(screen.queryByRole('listbox')).toBeNull()

    // одна буква — ещё не ищет
    await user.type(field, 'а')
    expect(screen.queryByRole('listbox')).toBeNull()
    await user.type(field, 'гент')
    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    // подпись и тип; порядок — точное, начало, слова в названии
    expect(options.map((o) => o.textContent)).toEqual(['Агент Термин', 'Агент фонового программирования Термин', 'Как работает агент Видеоурок'])
    expect(field).toHaveAttribute('aria-expanded', 'true')
    expect(field).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
    expect(field).not.toHaveAttribute('aria-activedescendant')

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    expect(field).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(field).toHaveFocus()
    // по кругу: ↑ с первого — на последний, ↓ с последнего — на первый
    await user.keyboard('{ArrowUp}')
    expect(field).toHaveAttribute('aria-activedescendant', options[2].id)
    await user.keyboard('{ArrowDown}')
    expect(field).toHaveAttribute('aria-activedescendant', options[0].id)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('term:1')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(field).toHaveAttribute('aria-expanded', 'false')

    // не больше 8 вариантов; мышью — тоже выбор
    await user.clear(field)
    await user.type(field, 'раздел')
    expect(screen.getAllByRole('option')).toHaveLength(8)
    await user.click(screen.getByRole('option', { name: /^Раздел 2 / }))
    expect(onSelect).toHaveBeenLastCalledWith('sec:s2')
    expect(field).toHaveFocus()

    // Esc очищает поле
    await user.type(field, ' 1')
    await user.keyboard('{Escape}')
    expect(field).toHaveValue('')
    expect(screen.queryByRole('listbox')).toBeNull()

    await user.type(field, 'щщщ')
    expect(screen.getByRole('status')).toHaveTextContent('Ничего не нашлось')
    expect(screen.queryByRole('option')).toBeNull()
  })
})

describe('фильтры типов', () => {
  it('фильтры: aria-pressed и переключение', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TypeFilters counts={index.counts} hidden={new Set<NodeType>(['figure'])} onToggle={onToggle} />)
    const filters = within(screen.getByRole('group', { name: 'Типы узлов' }))
    expect(filters.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Части 1',
      'Главы 1',
      'Разделы 10',
      'Схемы 1',
      'Термины 2',
      'Недели 1',
      'Дни 1',
      'Видеоуроки 1',
    ])
    // нажата — тип показан
    expect(filters.getByRole('button', { name: 'Термины 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(filters.getByRole('button', { name: 'Схемы 1' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(filters.getByRole('button', { name: 'Схемы 1' }))
    expect(onToggle).toHaveBeenLastCalledWith('figure')
    await user.click(filters.getByRole('button', { name: 'Термины 2' }))
    expect(onToggle).toHaveBeenLastCalledWith('term')

    // точка — цвет типа из переменной темы (§5); эту же таблицу берёт рисунок графа
    expect(TYPE_COLOR_VAR).toEqual({
      part: '--graph-book',
      chapter: '--graph-book',
      section: '--ink-soft',
      figure: '--fig-line',
      term: '--accent',
      week: '--fig-ok',
      day: '--fig-ok',
      video: '--warn',
    })
    const dot = (name: string) => filters.getByRole('button', { name }).querySelector<HTMLElement>('.graph-dot')!
    expect(dot('Термины 2').style.getPropertyValue('--dot')).toBe('var(--accent)')
    expect(dot('Главы 1').style.getPropertyValue('--dot')).toBe('var(--graph-book)')
    const tokens = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../styles/tokens.css'), 'utf8')
    for (const name of Object.values(TYPE_COLOR_VAR)) expect(tokens).toContain(`${name}:`)
  })
})
