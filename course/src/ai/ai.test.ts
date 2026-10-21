import { afterEach, describe, expect, it, vi } from 'vitest'
import { aiErrorMessage, getAi } from './ai'

function fakeClaude(json: (input: unknown, opts: unknown) => Promise<unknown>) {
  const sample = Object.assign(vi.fn(async () => ({ text: 'ответ', truncated: false })), { json: vi.fn(json) })
  window.claude = { use: async (name: string) => (name === 'sample' ? sample : null) }
  return sample
}

afterEach(() => {
  delete window.claude
})

describe('getAi', () => {
  it('вне Claude возвращает null', async () => {
    await expect(getAi()).resolves.toBeNull()
  })
})

describe('reviewPrompt', () => {
  it('возвращает разобранную оценку по ЦКОКФ', async () => {
    const review = { parts: [{ key: 'goal', ok: true, advice: 'Цель понятна' }], summary: 'Почти готово' }
    const sample = fakeClaude(async () => review)
    const ai = await getAi()
    await expect(ai!.reviewPrompt('Сделай график', 'День 2')).resolves.toEqual(review)
    expect(sample.json).toHaveBeenCalledWith(expect.stringContaining('Сделай график'), expect.objectContaining({ modelTier: 'quick' }))
  })

  it('ответ без parts — ошибка с общим текстом', async () => {
    fakeClaude(async () => ({ summary: 'нет частей' }))
    const ai = await getAi()
    const err = await ai!.reviewPrompt('Сделай график', 'День 2').catch((e: { code: string }) => e)
    expect(aiErrorMessage((err as { code: string }).code)).toBe('Не получилось, попробуйте ещё раз')
  })
})

describe('aiErrorMessage', () => {
  it('говорит по-русски, что случилось', () => {
    expect(aiErrorMessage('not_granted')).toBe('Разрешите ИИ в настройках страницы')
    expect(aiErrorMessage('rate_limited')).toBe('Лимит на сейчас исчерпан, попробуйте позже')
    expect(aiErrorMessage('refused')).toBe('ИИ не стал отвечать на этот запрос')
    expect(aiErrorMessage('upstream_error')).toBe('Не получилось, попробуйте ещё раз')
  })
})
