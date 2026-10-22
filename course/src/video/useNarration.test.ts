import { renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useNarration } from './useNarration'

afterEach(() => {
  vi.unstubAllGlobals()
})

it('голос читает реплику по таблице произношений, а не как написано', () => {
  const spoken: string[] = []
  vi.stubGlobal('speechSynthesis', { speak: (u: { text: string }) => spoken.push(u.text), cancel: () => {} })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string
      constructor(text: string) {
        this.text = text
      }
    },
  )
  const listeners: Record<string, (e: { detail: { frame: number } }) => void> = {}
  const player = {
    getCurrentFrame: () => 0,
    addEventListener: (type: string, fn: (e: { detail: { frame: number } }) => void) => (listeners[type] = fn),
    removeEventListener: () => {},
  }
  const cues = [{ from: 10, to: 60, text: 'Коротко — ЦКОКФ.' }]
  const voice = { lang: 'ru-RU', name: 'Milena' } as SpeechSynthesisVoice
  renderHook(() => useNarration({ current: player } as never, cues, voice, true))
  listeners.frameupdate({ detail: { frame: 11 } })
  expect(spoken).toEqual(['Коротко — цэ-ка-о-ка-эф.'])
})
