import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import type { Day } from '../content/schema'
import { readinessLine } from '../course/summary'
import { emptyProgress, markStep, recordQuiz, setMentorAccepted, type Progress } from '../progress/model'
import { RouteMap } from './RouteMap'

// Отмечает день пройденным: все шаги практики, тест без ошибок, наставник принял
function finish(p: Progress, day: Day): Progress {
  const withSteps = day.practice.reduce((acc, s) => markStep(acc, day.id, s.id, true), p)
  const withQuiz = recordQuiz(withSteps, day.id, {}, day.quiz.length, day.quiz.length)
  return setMentorAccepted(withQuiz, day.id, true)
}

const days = getDays()
const finished = (...numbers: number[]) => numbers.reduce((p, n) => finish(p, days[n - 1]), emptyProgress())
const row = (n: number) => screen.getAllByTestId('day-card')[n - 1]
const mark = (n: number) => within(row(n)).queryByText(/^(пройден|сейчас)$/)?.textContent ?? null

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
    // В каждой неделе — свои семь дней по порядку, номер «01», «Неделя N» и итог
    weeks.forEach((h, i) => {
      const week = within(h.closest('section')!)
      expect(week.getAllByTestId('day-card').map((c) => c.getAttribute('href'))).toEqual(
        Array.from({ length: 7 }, (_, k) => `#/day/${i * 7 + k + 1}`),
      )
      expect(week.getByText(`0${i + 1}`)).toBeInTheDocument()
      expect(week.getByText(`Неделя ${i + 1}`)).toBeInTheDocument()
    })
    expect(screen.getByText('Приложение на телефоне у первого тренера.')).toBeInTheDocument()

    expect(within(row(1)).getByText('День 1')).toBeInTheDocument()
    expect(within(row(1)).getByText('Азбука и знакомство с моделями')).toBeInTheDocument()
    expect(screen.queryByText(/готовится/)).toBeNull()
  })

  it('заголовок, легенда и id="map" для прокрутки', () => {
    render(<RouteMap progress={emptyProgress()} />)
    const map = screen.getByRole('region', { name: 'Путь от идеи до запуска' })
    expect(map).toHaveAttribute('id', 'map')
    expect(within(map).getByText('Карта курса')).toBeInTheDocument()
    expect(within(map).getByRole('heading', { level: 2, name: 'Путь от идеи до запуска' })).toBeInTheDocument()
    const legend = within(screen.getByRole('list', { name: 'Обозначения' }))
    expect(legend.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['пройден', 'сейчас', 'впереди'])
  })

  it('отметки пути: пройден, сейчас, впереди', () => {
    const { rerender } = render(<RouteMap progress={emptyProgress()} />)
    // Новичок: день 1 — «сейчас», остальные впереди
    expect(mark(1)).toBe('сейчас')
    expect(days.slice(1).map((d) => mark(d.number))).toEqual(Array(20).fill(null))

    rerender(<RouteMap progress={finished(1)} />)
    expect(mark(1)).toBe('пройден')
    expect(mark(2)).toBe('сейчас')
    expect(days.slice(2).map((d) => mark(d.number))).toEqual(Array(19).fill(null))

    // Всё пройдено: «сейчас» нет ни у одного дня
    rerender(<RouteMap progress={days.reduce(finish, emptyProgress())} />)
    expect(days.map((d) => mark(d.number))).toEqual(Array(21).fill('пройден'))
  })

  it('дни не по порядку', () => {
    render(<RouteMap progress={finished(1, 3)} />)
    expect(mark(1)).toBe('пройден')
    expect(mark(2)).toBe('сейчас')
    expect(mark(3)).toBe('пройден')
    expect(mark(4)).toBeNull()
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
