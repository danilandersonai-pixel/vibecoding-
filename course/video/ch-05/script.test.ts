import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch05Script, STAGING } from './script'

// Текст реплик одной сцены (в нижнем регистре) — для проверки, что нужные слова книги прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(ch05Script, id)
  const scene = ch05Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return ch05Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика «Читать код, который написал ИИ»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch05Script, 'chapter')).toEqual([])
  })

  it('семь сцен: приёмка ремонта, четыре прохода, решение большинства, стектрейс, бисекция, рефакторинг, тесты', () => {
    expect(ch05Script.scenes.map((s) => s.id)).toEqual(['s1-repair', 's2-passes', 's3-majority', 's4-trace', 's5-bisect', 's6-refactor', 's7-tests'])
  })

  it('в сцене проходов названы все четыре прохода, как в книге', () => {
    const text = sceneText('s2-passes')
    for (const word of ['обзор', 'интерфейс', 'трассировка', 'края']) expect(text, word).toContain(word)
  })

  it('в сцене тестов названы все три вида тестов', () => {
    const text = sceneText('s7-tests')
    for (const word of ['модульные', 'интеграционные', 'сквозные']) expect(text, word).toContain(word)
  })

  it('отладка: стектрейс в четвёртой сцене, git bisect в пятой', () => {
    expect(sceneText('s4-trace')).toContain('стектрейс')
    expect(sceneText('s5-bisect')).toContain('git bisect')
  })

  it('горячих точек шесть — четыре прохода, решение большинства, стектрейс, деление пополам, безопасный рефакторинг, пирамида тестов; у каждой есть пояснение', () => {
    expect(ch05Script.hotspots.map((h) => h.title)).toEqual(['Четыре прохода', 'Решение большинства', 'Стектрейс', 'Деление пополам', 'Безопасный рефакторинг', 'Пирамида тестов'])
    for (const h of ch05Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch05Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch05Script, STAGING)).toEqual([])
  })
})
