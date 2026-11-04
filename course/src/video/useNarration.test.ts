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

// Перемотка к началу главы во время воспроизведения: речь предыдущей реплики обрывается, а первая реплика главы
// произносится, когда ролик дошёл до её начала, и не раньше (Review Focus 4)
it('перемотка на начало главы обрывает речь, а следующая реплика главы читается, когда дошли до её начала', () => {
  const log: string[] = []
  vi.stubGlobal('speechSynthesis', { speak: (u: { text: string }) => log.push(`говорит: ${u.text}`), cancel: () => log.push('отмена') })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string
      constructor(text: string) {
        this.text = text
      }
    },
  )
  type Handler = (e: { detail: { frame: number } }) => void
  const listeners: Record<string, Handler> = {}
  const player = {
    getCurrentFrame: () => 1780,
    addEventListener: (type: string, fn: Handler) => (listeners[type] = fn),
    removeEventListener: () => {},
  }
  // глава начинается с кадра 1800, её первая реплика — через вступление в 9 кадров
  const cues = [
    { from: 1781, to: 1795, text: 'Конец прошлой главы.' },
    { from: 1809, to: 1900, text: 'Первая реплика новой главы.' },
    { from: 1950, to: 2000, text: 'Вторая реплика новой главы.' },
  ]
  const voice = { lang: 'ru-RU', name: 'Milena' } as SpeechSynthesisVoice
  renderHook(() => useNarration({ current: player } as never, cues, voice, true))

  // ролик идёт, звучит реплика прошлой главы
  listeners.frameupdate({ detail: { frame: 1781 } })
  expect(log).toEqual(['отмена', 'говорит: Конец прошлой главы.'])

  // нажали на главу: seeked на её начало обрывает речь и ничего не произносит
  log.length = 0
  listeners.seeked({ detail: { frame: 1800 } })
  expect(log).toEqual(['отмена'])

  // кадры до начала реплики — тишина, на кадре начала — именно первая реплика главы, не вторая и не прошлая
  log.length = 0
  listeners.frameupdate({ detail: { frame: 1801 } })
  listeners.frameupdate({ detail: { frame: 1808 } })
  expect(log).toEqual([])
  listeners.frameupdate({ detail: { frame: 1809 } })
  expect(log).toEqual(['отмена', 'говорит: Первая реплика новой главы.'])
})
