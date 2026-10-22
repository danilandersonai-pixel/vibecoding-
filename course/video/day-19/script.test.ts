import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { BETA, day19Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day19Script, id)
  const scene = day19Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day19Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 19 «Бета-тест: запуск»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day19Script, 'day')).toEqual([])
  })

  it('четыре сцены: зачем, план бета-теста, подводный камень, проверьте у себя', () => {
    expect(day19Script.scenes.map((s) => s.id)).toEqual(['s1-why', 's2-plan', 's3-like', 's4-check'])
  })

  it('вступление короткое и только о том, зачем: свежий взгляд до запуска, сначала немногие — без плана и подводного камня', () => {
    const text = sceneText('s1-why')
    for (const word of ['марина и дима', 'впервые', 'до запуска', 'день 21', 'канареечный релиз', 'главы 8', 'немногие', 'бета-тест']) expect(text, word).toContain(word)
    for (const word of ['полина', 'нравится', 'список', 'срок', 'задач']) expect(text, word).not.toContain(word)
    expect(day19Script.cues.filter((c) => c.from < day19Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: план (кто, срок, задачи), замечания в одном месте, как в день 8, и наблюдение вживую', () => {
    const text = sceneText('s2-plan')
    for (const word of ['план', 'кто', 'срок', 'задачи', '3–5 тренеров', 'не друзья', 'неделя', 'в одно место', 'день 8', 'где застрял', 'что ожидал', 'вживую', 'молча']) expect(text, word).toContain(word)
    for (const name of BETA) expect(text, name).toContain(name.toLowerCase())
  })

  it('подводный камень: «нравится?» вместо наблюдения, затем задача, молчание и вопрос «что вы ожидали увидеть?»', () => {
    const text = sceneText('s3-like')
    for (const word of ['«нравится?»', 'вместо того, чтобы смотреть', '«да, удобно!»', 'что чинить', 'задача', 'на четверг', 'молчим', 'не подсказываем', 'глава 6', 'записываете', '«что вы ожидали увидеть?»']) expect(text, word).toContain(word)
    expect(text).toContain(BETA[0].toLowerCase())
  })

  it('проверьте у себя: 3–5 тренеров и план, настоящая задача, сессия молча, вопрос, отслеживание ошибок, один список', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', '3–5 тренеров', 'план', 'настоящую задачу', 'молча', 'застрял', 'ожидал увидеть', 'отслеживание ошибок', 'дня 14', 'один список', 'день 20']) expect(text, word).toContain(word)
  })

  it('герои на своих местах: Анна и Олег не становятся подопечными бета-тренеров', () => {
    const all = day19Script.cues.map((c) => c.text).join(' ')
    expect(all).not.toMatch(/Анн[аеуы]|Олег/)
    expect(BETA).toHaveLength(4)
    for (const name of BETA) expect(['Марина', 'Дима', 'Анна', 'Олег', 'Ира']).not.toContain(name)
  })

  it('горячих точек три — план, журнал наблюдения, список замечаний; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day19Script.hotspots.map((h) => h.title)).toEqual(['План бета-теста', 'Журнал наблюдения', 'Список замечаний'])
    for (const h of day19Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day19Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day19Script, STAGING)).toEqual([])
  })
})
