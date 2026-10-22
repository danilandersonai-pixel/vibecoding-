import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { day08Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day08Script, id)
  const scene = day08Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day08Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 8 «Отзывы и фоновые агенты»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day08Script, 'day')).toEqual([])
  })

  it('четыре сцены: неделя с тренерами, отзывы и приоритеты, подводный камень, проверьте у себя', () => {
    expect(day08Script.scenes.map((s) => s.id)).toEqual(['s1-week', 's2-sort', 's3-vague', 's4-check'])
  })

  it('вступление: первые тренеры, план дня и фоновый агент с пул-реквестом', () => {
    const text = sceneText('s1-week')
    for (const word of ['марина', 'дима', 'отзыв', 'фоновому агенту', 'пул-реквест']) expect(text, word).toContain(word)
  })

  it('что строим: отзывы дословно, три стопки и что отдать агенту в фон', () => {
    const text = sceneText('s2-sort')
    for (const word of ['дословно', '52,5', 'три стопки', 'портит данные', 'в фон', '«готово»', 'тестом', 'уточните']) expect(text, word).toContain(word)
  })

  it('подводный камень: задача без критерия «готово» и расползшийся пул-реквест, затем задача в четыре части', () => {
    const text = sceneText('s3-vague')
    for (const word of ['без критерия «готово»', 'сделай получше', 'по-своему', 'тест ослаблен', 'заявку', 'контекст', 'нельзя', '20–30 минут']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: облачная сессия и приёмка — описание, файлы, тесты, проверки, руками', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'четыре части', 'облачной сессии', 'описание', 'лишних файлов', 'тесты', 'проверки', 'руками']) expect(text, word).toContain(word)
  })

  it('горячих точек три — стопки, задача, приёмка; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day08Script.hotspots.map((h) => h.title)).toEqual(['Три стопки отзывов', 'Задача в четыре части', 'Приёмка пул-реквеста'])
    for (const h of day08Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day08Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day08Script, STAGING)).toEqual([])
  })
})
