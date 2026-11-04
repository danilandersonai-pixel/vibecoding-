import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FigureDefs } from './FigureDefs'

// Chromium не рисует маркеры из display:none: если обёртка скрыта атрибутом hidden, у стрелок схем пропадают наконечники.
it('маркеры стрелок лежат в невидимой, но не скрытой обёртке', () => {
  const { container } = render(<FigureDefs />)
  const box = container.firstElementChild as HTMLElement
  expect(box.hidden).toBe(false)
  expect(box.style.display).not.toBe('none')
  expect(box.getAttribute('aria-hidden')).toBe('true')
  expect(box.style.position).toBe('absolute')
  expect(box.style.width).toBe('0px')
  expect(box.style.height).toBe('0px')
  expect(box.querySelector('marker#bk-arrow')).not.toBeNull()
})
