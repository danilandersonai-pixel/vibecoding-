import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import { commitHash } from '../course/commitHash'
import { readinessLine } from '../course/summary'
import { emptyProgress, type Progress } from '../progress/model'
import { finishDay } from '../test/progress'
import { RouteMap } from './RouteMap'

const days = getDays()
const finished = (...numbers: number[]) => numbers.reduce((p, n) => finishDay(p, days[n - 1]), emptyProgress())
const row = (n: number) => screen.getAllByTestId('day-card')[n - 1]
// Отметка справа в строке дня: «✓ пройден», «сейчас» или пусто (впереди)
const mark = (n: number) => row(n).querySelector('.route-mark')!.textContent
// Слева в строке: короткий хеш у пройденного, HEAD у текущего, пусто впереди
const hash = (n: number) => row(n).querySelector('.route-hash')!.textContent
// Состояние строки (класс пункта списка): по нему рисуются точка на линии ветки и инверсия «сейчас»
const state = (n: number) => row(n).closest('li')!.className

describe('RouteMap', () => {
  it('21 день по трём неделям, без «готовится»', () => {
    render(<RouteMap progress={emptyProgress()} />)
    const cards = screen.getAllByTestId('day-card')
    expect(cards).toHaveLength(21)
    expect(cards.map((c) => c.getAttribute('href'))).toEqual(days.map((d) => `#/day/${d.number}`))

    const weeks = screen.getAllByRole('heading', { level: 3 })
    expect(weeks.map((h) => h.textContent)).toEqual([
      'Вся книга и первая работающая версия',
      'Функциональность до уровня конкурентов',
      'Доводка до продукта',
    ])
    // Неделя — область с именем-заголовком: свои семь дней по порядку, подпись «неделя N» и итог
    weeks.forEach((h, i) => {
      const section = screen.getByRole('region', { name: h.textContent! })
      expect(section).toBe(h.closest('section'))
      const week = within(section)
      expect(week.getAllByTestId('day-card').map((c) => c.getAttribute('href'))).toEqual(
        Array.from({ length: 7 }, (_, k) => `#/day/${i * 7 + k + 1}`),
      )
      expect(week.getByText(`неделя ${i + 1}`)).toBeInTheDocument()
    })
    expect(screen.getByText('Приложение на телефоне у первого тренера.')).toBeInTheDocument()

    expect(within(row(1)).getByText('день 01')).toBeInTheDocument()
    expect(within(row(1)).getByText('Азбука и знакомство с моделями')).toBeInTheDocument()
    expect(within(row(10)).getByText('день 10')).toBeInTheDocument()
    expect(within(row(10)).getByText(days[9].title)).toBeInTheDocument()
    expect(screen.queryByText(/готовится/)).toBeNull()
  })

  it('заголовок, легенда и id="map" для прокрутки', () => {
    render(<RouteMap progress={emptyProgress()} />)
    const map = screen.getByRole('region', { name: 'Путь от идеи до запуска' })
    expect(map).toHaveAttribute('id', 'map')
    expect(within(map).getByRole('heading', { level: 2, name: 'Путь от идеи до запуска' })).toBeInTheDocument()
    // Знаки легенды (✓, HEAD, ○) рисует CSS с пустым текстом для чтения с экрана — в тексте только слова
    const legend = within(screen.getByRole('list', { name: 'Обозначения' })).getAllByRole('listitem')
    expect(legend.map((li) => li.textContent)).toEqual(['пройден', 'сейчас', 'впереди'])
    expect(legend.map((li) => li.className)).toEqual(['route-legend-done', 'route-legend-now', 'route-legend-ahead'])
  })

  it('отметки пути: пройден, сейчас, впереди', () => {
    const { rerender } = render(<RouteMap progress={emptyProgress()} />)
    // Новичок: день 1 — «сейчас» и HEAD, остальные впереди — без отметки и без хеша
    expect([state(1), mark(1), hash(1)]).toEqual(['route-day is-now', 'сейчас', 'HEAD'])
    expect(days.slice(1).map((d) => [state(d.number), mark(d.number), hash(d.number)])).toEqual(Array(20).fill(['route-day is-ahead', '', '']))

    rerender(<RouteMap progress={finished(1)} />)
    expect([state(1), mark(1)]).toEqual(['route-day is-done', '✓ пройден'])
    expect([state(2), mark(2), hash(2)]).toEqual(['route-day is-now', 'сейчас', 'HEAD'])
    expect(days.slice(2).map((d) => mark(d.number))).toEqual(Array(19).fill(''))

    // Всё пройдено: «сейчас» и HEAD нет ни у одного дня
    rerender(<RouteMap progress={days.reduce(finishDay, emptyProgress())} />)
    expect(days.map((d) => mark(d.number))).toEqual(Array(21).fill('✓ пройден'))
    expect(days.map((d) => state(d.number))).toEqual(Array(21).fill('route-day is-done'))
    expect(screen.queryByText('HEAD')).toBeNull()
  })

  it('«✓» у пройденного — только для глаз: для чтения с экрана отметка — «пройден»', () => {
    render(<RouteMap progress={finished(1)} />)
    const check = within(row(1)).getByText('✓', { exact: false })
    expect(check).toHaveAttribute('aria-hidden', 'true')
    expect(check.parentElement).toHaveClass('route-mark', 'is-done')
    // хеш и HEAD — тоже только для глаз
    expect(row(1).querySelector('.route-hash')).toHaveAttribute('aria-hidden', 'true')
    expect(row(2).querySelector('.route-hash')).toHaveAttribute('aria-hidden', 'true')
  })

  it('у пройденного дня — короткий хеш из дня и времени зачёта', () => {
    const day1 = days[0].id
    const { rerender } = render(<RouteMap progress={finished(1, 2)} />)
    expect(hash(1)).toMatch(/^[0-9a-f]{7}$/)
    expect(hash(1)).toBe(commitHash(day1, undefined))
    // у каждого дня свой хеш
    expect(hash(2)).toBe(commitHash(days[1].id, undefined))
    expect(hash(2)).not.toBe(hash(1))

    // Время зачёта из прогресса меняет хеш дня
    const base = finished(1, 2)
    const withTime: Progress = { ...base, days: { ...base.days, [day1]: { ...base.days[day1], completedAt: '2026-10-20T09:15:00.000Z' } } }
    rerender(<RouteMap progress={withTime} />)
    expect(hash(1)).toBe(commitHash(day1, '2026-10-20T09:15:00.000Z'))
    expect(hash(1)).not.toBe(commitHash(day1, undefined))
    expect(hash(2)).toBe(commitHash(days[1].id, undefined))
  })

  it('дни не по порядку', () => {
    render(<RouteMap progress={finished(1, 3)} />)
    expect(mark(1)).toBe('✓ пройден')
    expect([mark(2), hash(2)]).toEqual(['сейчас', 'HEAD'])
    expect(mark(3)).toBe('✓ пройден')
    expect(hash(3)).toMatch(/^[0-9a-f]{7}$/)
    expect([state(4), mark(4), hash(4)]).toEqual(['route-day is-ahead', '', ''])
  })

  it('строка готовности над картой', () => {
    render(<RouteMap progress={emptyProgress()} />)
    const line = screen.getByText(readinessLine(days))
    expect(line.tagName).toBe('P')
    expect(line.compareDocumentPosition(row(1)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('у дня число роликов', () => {
    render(<RouteMap progress={emptyProgress()} />)
    expect(within(row(1)).getByText('2 ролика')).toBeInTheDocument()
    expect(within(row(4)).getByText('1 ролик')).toBeInTheDocument()
  })
})
