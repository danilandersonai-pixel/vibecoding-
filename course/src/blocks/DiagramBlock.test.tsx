import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DiagramBlock } from './DiagramBlock'

const block = {
  type: 'diagram' as const,
  id: 'd1',
  figure: 'abc_restaurant',
  caption: 'Приложение как ресторан',
  hotspots: [{ id: 'kitchen', x: 0.5, y: 0.2, w: 0.2, h: 0.3, title: 'Кухня — это сервер', text: 'Здесь готовят ответы.' }],
  steps: ['Гость делает заказ', 'Кухня готовит'],
}

describe('DiagramBlock', () => {
  it('клик по зоне показывает пояснение, второй клик скрывает', async () => {
    const user = userEvent.setup()
    render(<DiagramBlock block={block} />)
    expect(screen.queryByText('Кухня — это сервер')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Кухня — это сервер' }))
    expect(screen.getByText('Кухня — это сервер')).toBeInTheDocument()
    expect(screen.getByText('Здесь готовят ответы.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Кухня — это сервер' }))
    expect(screen.queryByText('Кухня — это сервер')).toBeNull()
  })

  it('шаги листаются кнопками «назад» и «дальше»', async () => {
    const user = userEvent.setup()
    render(<DiagramBlock block={block} />)
    expect(screen.getByText(/Гость делает заказ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Дальше/ }))
    expect(screen.getByText(/Кухня готовит/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Дальше/ })).toBeDisabled()
  })
})
