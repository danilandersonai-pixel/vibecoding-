import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProgressProvider } from '../progress/ProgressContext'
import { Scenario } from './Scenario'

const block = {
  type: 'scenario' as const,
  id: 's1',
  title: 'Агент удалил тест',
  start: 'n1',
  nodes: {
    n1: { text: 'Проверки стали зелёными, но агент удалил тест. Что делаем?', choices: [{ label: 'Принять как есть', next: 'n2' }, { label: 'Вернуть тест', next: 'n3' }] },
    n2: { text: 'Через неделю ошибка ушла к пользователям.', choices: [], ending: 'bad' as const },
    n3: { text: 'Тест вернулся и поймал ошибку.', choices: [], ending: 'good' as const },
  },
}

describe('Scenario', () => {
  it('ведёт по выбору, на плохой концовке предлагает сыграть заново', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <Scenario block={block} dayId="day-05" />
      </ProgressProvider>,
    )
    expect(screen.getByText(/агент удалил тест/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Сыграть заново' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Принять как есть' }))
    expect(screen.getByText('Через неделю ошибка ушла к пользователям.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Сыграть заново' }))
    expect(screen.getByText(/агент удалил тест/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Вернуть тест' })).toBeInTheDocument()
  })
})
