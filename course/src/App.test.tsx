import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  window.location.hash = ''
})

describe('App', () => {
  it('показывает заголовок курса', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeInTheDocument()
  })

  it('главная: обложка, «Продолжить», шаги дня и карта; место для прокрутки «Карта» — одно', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Продолжить обучение' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Как проходит день' })).toBeInTheDocument()
    expect(screen.getAllByTestId('day-card')).toHaveLength(21)
    expect(document.querySelectorAll('#map')).toHaveLength(1)
    expect(document.querySelector('.shell')).toBeNull()
  })

  it('неизвестный адрес открывает главную', () => {
    window.location.hash = '#/day/99'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeInTheDocument()
  })
})
