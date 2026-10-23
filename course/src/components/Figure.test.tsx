import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Figure } from './Figure'

describe('Figure', () => {
  it('для неизвестной схемы пишет «Схема не найдена», а не падает', () => {
    render(<Figure id="нет-такой-схемы" />)
    expect(screen.getByText('Схема не найдена')).toBeInTheDocument()
  })

  it('вставляет SVG схемы книги', () => {
    const { container } = render(<Figure id="abc_restaurant" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
