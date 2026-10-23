import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('показывает заголовок курса', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Вайб-кодинг: курс на 21 день' })).toBeInTheDocument()
  })
})
