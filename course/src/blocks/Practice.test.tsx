import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useCourseProgress } from '../progress/courseProgress'
import { ProgressProvider } from '../progress/ProgressContext'
import { CopyButton } from '../components/CopyButton'
import { Practice } from './Practice'

const steps = [
  { id: 'p1', title: 'Создать репозиторий', prompt: 'Создай репозиторий gym-coach', done: 'Репозиторий виден на GitHub' },
  { id: 'p2', title: 'Запустить /init', done: 'Есть CLAUDE.md' },
]

function StepsProbe() {
  const { progress } = useCourseProgress()
  return <output data-testid="probe">{JSON.stringify(progress.days['day-01']?.steps ?? {})}</output>
}

describe('Practice', () => {
  it('отметка шага сохраняется в прогрессе', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <Practice dayId="day-01" steps={steps} />
        <StepsProbe />
      </ProgressProvider>,
    )
    expect(screen.getByText('Репозиторий виден на GitHub', { exact: false }).textContent).toBe('Готово, когда: Репозиторий виден на GitHub')
    await user.click(screen.getByRole('checkbox', { name: 'Шаг 1. Создать репозиторий' }))
    expect(screen.getByRole('checkbox', { name: 'Шаг 1. Создать репозиторий' })).toBeChecked()
    expect(screen.getByTestId('probe')).toHaveTextContent('{"p1":true}')
  })
})

describe('CopyButton', () => {
  it('если буфер обмена недоступен, выделяет текст и просит скопировать вручную', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('нет доступа')) } })
    render(<CopyButton text="/mentor 1" />)
    await user.click(screen.getByRole('button', { name: 'Скопировать' }))
    expect(await screen.findByText('Скопируйте вручную')).toBeInTheDocument()
    const field = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(field.value).toBe('/mentor 1')
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, '/mentor 1'.length])
  })
})
