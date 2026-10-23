import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiHelper } from './AiHelper'

const block = { type: 'ai-helper' as const, id: 'a1', mode: 'ask' as const, title: 'Спросите ИИ', placeholder: 'Ваш вопрос', context: 'RLS — правила доступа к строкам' }

function fakeClaude(sample: (...a: unknown[]) => Promise<unknown>) {
  const fn = Object.assign(vi.fn(sample), { json: vi.fn() })
  window.claude = { use: async (name: string) => (name === 'sample' ? fn : null) }
  return fn
}

afterEach(() => {
  delete window.claude
})

describe('AiHelper', () => {
  it('вне Claude показывает подсказку', async () => {
    render(<AiHelper block={block} />)
    expect(await screen.findByText('ИИ доступен, когда курс открыт в Claude')).toBeInTheDocument()
  })

  it('два быстрых клика отправляют один запрос', async () => {
    const user = userEvent.setup()
    const sample = fakeClaude(() => new Promise(() => {}))
    render(<AiHelper block={block} />)
    await user.type(await screen.findByPlaceholderText('Ваш вопрос'), 'Зачем RLS?')
    const button = screen.getByRole('button', { name: 'Спросить ИИ' })
    await user.dblClick(button)
    expect(sample).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
  })

  it('лимит — понятное сообщение, кнопка снова доступна', async () => {
    const user = userEvent.setup()
    fakeClaude(() => Promise.reject({ code: 'rate_limited', message: 'limit' }))
    render(<AiHelper block={block} />)
    await user.type(await screen.findByPlaceholderText('Ваш вопрос'), 'Зачем RLS?')
    await user.click(screen.getByRole('button', { name: 'Спросить ИИ' }))
    expect(await screen.findByText('Лимит на сейчас исчерпан, попробуйте позже')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Спросить ИИ' })).toBeEnabled())
  })
})
