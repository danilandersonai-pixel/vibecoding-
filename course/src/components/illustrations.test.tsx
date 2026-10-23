import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Agent, Coach, Student } from './illustrations'
import {
  IconArrow,
  IconBook,
  IconCheck,
  IconExpand,
  IconPause,
  IconPlay,
  IconSteps,
  IconVideo,
} from './icons'

const heroes = { Coach, Student, Agent }
const icons = { IconArrow, IconPlay, IconPause, IconBook, IconCheck, IconExpand, IconVideo, IconSteps }

describe('иллюстрации героев', () => {
  it('иллюстрации скрыты от чтения с экрана и масштабируются', () => {
    for (const [name, Hero] of Object.entries(heroes)) {
      const { container, unmount } = render(<Hero size={80} className="hero" />)
      const svg = container.querySelector('svg')
      expect(svg, name).not.toBeNull()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('height', '80')
      expect(svg).toHaveClass('hero')
      unmount()
    }
  })

  it('по умолчанию высота 112, ширина идёт из пропорции рисунка', () => {
    const sizes = { Coach: 90, Student: 90, Agent: 88 }
    for (const [name, Hero] of Object.entries(heroes)) {
      const { container, unmount } = render(<Hero />)
      const svg = container.querySelector('svg')
      expect(svg, name).toHaveAttribute('height', '112')
      expect(svg, name).toHaveAttribute('width', String(sizes[name as keyof typeof sizes]))
      unmount()
    }
  })

  it('цвета берут из переменных темы, без литералов', () => {
    for (const Hero of Object.values(heroes)) {
      const { container, unmount } = render(<Hero />)
      expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(container.innerHTML).toContain('var(--cover-ink)')
      unmount()
    }
  })
})

describe('значки', () => {
  it('значки берут цвет текста', () => {
    for (const [name, Icon] of Object.entries(icons)) {
      const { container, unmount } = render(<Icon />)
      const svg = container.querySelector('svg')
      expect(svg, name).not.toBeNull()
      expect(svg, name).toHaveAttribute('aria-hidden', 'true')
      const colored = svg!.getAttribute('stroke') === 'currentColor' || svg!.getAttribute('fill') === 'currentColor'
      expect(colored, name).toBe(true)
      unmount()
    }
  })

  it('размер значка по умолчанию 18 и меняется через size', () => {
    const { container } = render(<IconArrow size={16} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '16')
    const def = render(<IconCheck />)
    expect(def.container.querySelector('svg')).toHaveAttribute('width', '18')
    expect(def.container.querySelector('svg')).toHaveAttribute('height', '18')
  })
})
