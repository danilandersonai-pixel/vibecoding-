import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch06Script, STAGING } from './script'

// Текст всех реплик сцены — для проверки, что названы нужные факты книги.
function sceneText(id: string): string {
  const scene = ch06Script.scenes.find((s) => s.id === id)
  if (!scene) throw new Error(`Нет сцены «${id}»`)
  const start = sceneStart(ch06Script, id)
  return ch06Script.cues
    .filter((c) => c.from >= start && c.to <= start + scene.durationInFrames)
    .map((c) => c.text)
    .join(' ')
}

describe('сценарий ролика «Прототип за вечер»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch06Script, 'chapter')).toEqual([])
  })

  it('семь сцен: макет дома, вопрос и правила, запрос, инструменты, витки, решение, ловушки', () => {
    expect(ch06Script.scenes.map((s) => s.id)).toEqual(['s1-model', 's2-question', 's3-prompt', 's4-tools', 's5-loop', 's6-decide', 's7-traps'])
  })

  it('в сцене правил названы все четыре правила быстрого прототипа', () => {
    const text = sceneText('s2-question')
    for (const word of ['таймбокс', 'тонкий срез', 'выдумать', 'выбросить']) expect(text, word).toContain(word)
  })

  it('в сцене инструментов названы все инструменты таблицы книги (октябрь 2026)', () => {
    const text = sceneText('s4-tools')
    for (const name of ['Lovable', 'Bolt', 'v0', 'Replit', 'Claude Design', 'Figma Make', 'Claude Code', 'Codex', 'Antigravity CLI', 'Jupyter', 'октябрь 2026']) expect(text, name).toContain(name)
  })

  it('в сцене решения названы три исхода и окружения продакшена', () => {
    const text = sceneText('s6-decide')
    for (const word of ['выбросить', 'развивать', 'переписать', 'окружени']) expect(text, word).toContain(word)
  })

  it('в сцене ловушек есть ключ API на сервере и 70% против 30%', () => {
    const text = sceneText('s7-traps')
    for (const word of ['Ключ API', 'сервер', '70%', '30%', '.env']) expect(text, word).toContain(word)
  })

  it('горячих точек пять — тонкий срез, список упрощений, Claude Design, прототип и продакшен, ключ на сервере; у каждой есть пояснение', () => {
    expect(ch06Script.hotspots.map((h) => h.title)).toEqual(['Тонкий срез', 'Список упрощений', 'Claude Design', 'Прототип и продакшен', 'Ключ на сервере'])
    for (const h of ch06Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch06Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch06Script, STAGING)).toEqual([])
  })
})
