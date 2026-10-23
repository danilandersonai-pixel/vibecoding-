import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { ch02Script, STAGING } from './script'

describe('сценарий ролика «Как говорить с ИИ, чтобы он понял»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch02Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: торт, ЦКОКФ, конкретность, цикл уточнений, вопросы и план, спецификация', () => {
    expect(ch02Script.scenes.map((s) => s.id)).toEqual(['s1-cake', 's2-ckokf', 's3-specific', 's4-loop', 's5-ask', 's6-spec'])
  })

  it('в сцене ЦКОКФ названы все пять элементов запроса, как в книге', () => {
    const start = ch02Script.scenes[0].durationInFrames
    const end = start + ch02Script.scenes[1].durationInFrames
    const text = ch02Script.cues
      .filter((c) => c.from >= start && c.to <= end)
      .map((c) => c.text)
      .join(' ')
    for (const word of ['ЦКОКФ', 'Цель', 'Контекст', 'Ограничения', 'Критерий готовности', 'Формат ответа']) expect(text, word).toContain(word)
  })

  it('горячих точек пять — ЦКОКФ, правила конкретности, чистый контекст, режим Plan, спецификация; у каждой есть пояснение', () => {
    expect(ch02Script.hotspots.map((h) => h.title)).toEqual(['ЦКОКФ', 'Пять правил конкретности', 'Чистый контекст', 'Режим Plan', 'Разработка от спецификации'])
    for (const h of ch02Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch02Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch02Script, STAGING)).toEqual([])
  })
})
