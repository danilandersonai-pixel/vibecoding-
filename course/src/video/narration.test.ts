import { describe, expect, it } from 'vitest'
import { catalog } from '../../video/catalog'
import { cueStarting, pickRussianVoice, spokenText } from './narration'

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

describe('spokenText', () => {
  it('аббревиатуры и названия читает по-русски', () => {
    expect(spokenText('Коротко — ЦКОКФ.')).toBe('Коротко — цэ-ка-о-ка-эф.')
    expect(spokenText('Агенты вроде Claude Code работают в терминале.')).toBe('Агенты вроде Клод Код работают в терминале.')
    expect(spokenText('Запишите в файл правил — CLAUDE.md.')).toBe('Запишите в файл правил — клод эм-дэ.')
    expect(spokenText('В Supabase это RLS.')).toBe('В супабейс это эр-эл-эс.')
  })
  it('команды, адреса, версии и знаки', () => {
    expect(spokenText('/clear очищает, /compact сжимает')).toBe('клир очищает, компакт сжимает')
    expect(spokenText('Повторим атаку: client/18.')).toBe('Повторим атаку: клиент 18.')
    expect(spokenText('У Haiku, Sonnet и Opus 5.5')).toBe('У хайку, сонет и опус 5 5')
    expect(spokenText('3 × 10 → 30')).toBe('3 на 10, 30')
  })
  it('русский текст без латиницы не меняет, внутри слов не заменяет', () => {
    expect(spokenText('Анна сохранила подход.')).toBe('Анна сохранила подход.')
    expect(spokenText('Planner и APIs')).toBe('Planner и APIs')
  })
  it('в репликах всех роликов каталога не остаётся латиницы — у каждого слова есть произношение', () => {
    const left = Object.entries(catalog).flatMap(([id, e]) =>
      e.script.cues.flatMap((c) => (spokenText(c.text).match(/[A-Za-z]+/g) ?? []).map((w) => `${id}: ${w}`)),
    )
    expect(left).toEqual([])
  })
})
