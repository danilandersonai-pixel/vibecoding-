import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BlockView } from '../components/BlockView'
import { getDay } from '../content/load'
import type { Block } from '../content/schema'
import { DayPage } from '../pages/DayPage'
import { CourseProgressContext } from '../progress/courseProgress'
import { emptyProgress } from '../progress/model'

function withProgress(ui: ReactNode) {
  return render(<CourseProgressContext.Provider value={{ progress: emptyProgress(), update: () => {}, storeKind: 'memory' }}>{ui}</CourseProgressContext.Provider>)
}

// Карточка блока — по его заголовку h3, как ищут блоки сквозные тесты дня 1
const cardOf = (heading: HTMLElement) => heading.closest('.block') as HTMLElement
const cardByTitle = (title: string) => cardOf(screen.getByRole('heading', { level: 3, name: title }))

const blocks = getDay(1)!.blocks
const ideas = blocks.filter((b) => b.type === 'idea')
const titleOf = (type: Block['type']) => (blocks.find((b) => b.type === type) as { title: string }).title

describe('блоки теории', () => {
  it('мысль: кикер «Мысль 1 из 6» и ссылка в книгу со значком', () => {
    withProgress(<DayPage n={1} />)
    const first = ideas[0]
    const card = cardByTitle(first.title)
    expect(within(card).getByText('Мысль 1 из 6')).toBeInTheDocument()
    expect(card).toHaveClass('paper')
    const link = within(card).getByRole('link', { name: `В книге: ${first.bookRef!.label}` })
    expect(link).toHaveAttribute('href', `book.html#${first.bookRef!.section}`)
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    // Считаются только мысли: между ними схема, тренажёр и ситуация, а последняя мысль — шестая
    expect(within(cardByTitle(ideas[5].title)).getByText('Мысль 6 из 6')).toBeInTheDocument()
  })

  it('тренажёр, ситуация и помощник ИИ подписаны кикером', async () => {
    const { unmount } = withProgress(<DayPage n={1} />)
    const sort = cardByTitle(titleOf('trainer'))
    expect(within(sort).getByText('Тренажёр')).toBeInTheDocument()
    expect(sort).toHaveClass('paper')
    expect(within(cardByTitle(titleOf('scenario'))).getByText('Ситуация')).toBeInTheDocument()
    const ai = cardOf(await screen.findByRole('heading', { level: 3, name: titleOf('ai-helper') }))
    expect(within(ai).getByText('Спросите ИИ')).toBeInTheDocument()
    expect(ai).toHaveClass('paper')
    unmount()

    // Тренажёры, которых нет в дне 1
    const bug: Block = { type: 'trainer', kind: 'find-the-bug', id: 'b1', title: 'ключ в коде', lines: ['const key = "sk-123"', 'fetch(url)'], bugLines: [0], explanation: 'Ключ в коде утечёт.' }
    const prompt: Block = {
      type: 'trainer',
      kind: 'prompt-builder',
      id: 'p1',
      task: 'Добавить вход',
      parts: [{ key: 'goal', label: 'Цель', good: ['Вход по почте'], bad: ['Сделай вход'] }],
    }
    withProgress(
      <>
        <BlockView block={bug} dayId="day-01" />
        <BlockView block={prompt} dayId="day-01" />
      </>,
    )
    expect(within(cardByTitle('Найди ошибку: ключ в коде')).getByText('Тренажёр')).toBeInTheDocument()
    expect(within(cardByTitle('Собери запрос')).getByText('Тренажёр')).toBeInTheDocument()
  })

  it('у схемы прежние зоны-кнопки', async () => {
    const user = userEvent.setup()
    withProgress(<DayPage n={1} />)
    const diagram = blocks.find((b) => b.type === 'diagram')!
    const zones = diagram.hotspots
    expect(zones.length).toBeGreaterThan(0)
    const card = cardOf(screen.getByRole('button', { name: zones[0].title }))
    for (const zone of zones) expect(within(card).getByRole('button', { name: zone.title })).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: zones[2].title }))
    expect(within(card).getByText(zones[2].text)).toBeInTheDocument()
    // Карточка «бумаги» с кикером и подписью
    expect(within(card).getByText('Схема')).toBeInTheDocument()
    expect(within(card).getByText(diagram.caption, { exact: false })).toBeInTheDocument()
    expect(card).toHaveClass('paper')
  })
})
