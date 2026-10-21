import { describe, expect, it } from 'vitest'
import { cueStarting, pickRussianVoice } from './narration'

const cues = [
  { from: 30, to: 90, text: 'Первая' },
  { from: 100, to: 160, text: 'Вторая' },
]

describe('cueStarting', () => {
  it('при обычном воспроизведении находит реплику, чьё начало пересекли', () => {
    expect(cueStarting(28, 31, cues)?.text).toBe('Первая')
    expect(cueStarting(99, 100, cues)?.text).toBe('Вторая')
    expect(cueStarting(40, 41, cues)).toBeNull()
  })
  it('при перемотке назад молчит', () => {
    expect(cueStarting(120, 30, cues)).toBeNull()
  })
  it('при скачке вперёд больше чем на 15 кадров молчит', () => {
    expect(cueStarting(0, 100, cues)).toBeNull()
  })
})

describe('pickRussianVoice', () => {
  const voice = (lang: string, name = lang) => ({ lang, name }) as SpeechSynthesisVoice
  it('без русского голоса — null', () => {
    expect(pickRussianVoice([voice('en-US'), voice('de-DE')])).toBeNull()
    expect(pickRussianVoice([])).toBeNull()
  })
  it('берёт первый русский', () => {
    expect(pickRussianVoice([voice('en-US'), voice('ru-RU', 'Milena'), voice('ru-RU', 'Yuri')])?.name).toBe('Milena')
  })
})
