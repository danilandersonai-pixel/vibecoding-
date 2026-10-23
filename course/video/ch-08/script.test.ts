import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch08Script, STAGING } from './script'

// Текст всех реплик сцены — для проверки, что названы нужные факты книги.
function sceneText(id: string): string {
  const scene = ch08Script.scenes.find((s) => s.id === id)
  if (!scene) throw new Error(`Нет сцены «${id}»`)
  const start = sceneStart(ch08Script, id)
  return ch08Script.cues
    .filter((c) => c.from >= start && c.to <= start + scene.durationInFrames)
    .map((c) => c.text)
    .join(' ')
}

describe('сценарий ролика «Безопасность и надёжность»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch08Script, 'chapter')).toEqual([])
  })

  it('семь сцен: пекарня, инъекция, лимиты и пакеты, аудит, N+1, проверки в CI, выпуск по шагам', () => {
    expect(ch08Script.scenes.map((s) => s.id)).toEqual(['s1-bakery', 's2-injection', 's3-limits', 's4-audit', 's5-n1', 's6-ci', 's7-rollout'])
  })

  it('в сцене-метафоре есть замок, сигнализация и пробная партия', () => {
    const text = sceneText('s1-bakery')
    for (const word of ['замок', 'сигнализаци', 'пробуют несколько']) expect(text, word).toContain(word)
  })

  it('во второй сцене — цифры Veracode, инъекция и ссылка на IDOR', () => {
    const text = sceneText('s2-injection')
    for (const word of ['Veracode 2026', '56%', '55%', 'инъекция', 'параметр', 'IDOR']) expect(text, word).toContain(word)
  })

  it('в третьей сцене — лимит попыток и выдуманные пакеты с цифрами книги', () => {
    const text = sceneText('s3-limits')
    for (const word of ['лимит', 'пять неудач', '15 минут', '2025', '16 моделей', 'slopsquatting', 'кто автор']) expect(text, word).toContain(word)
  })

  it('в сцене аудита — два слоя, сканер секретов и .env', () => {
    const text = sceneText('s4-audit')
    for (const word of ['два слоя', 'CI', 'gitleaks', '.env', 'пентестер']) expect(text, word).toContain(word)
  })

  it('в сцене производительности — N+1, десять и одиннадцать, замер', () => {
    const text = sceneText('s5-n1')
    for (const word of ['N+1', 'десять', 'одиннадцать', 'EXPLAIN ANALYZE', 'профилировщик']) expect(text, word).toContain(word)
  })

  it('в сцене CI — проверки пул-реквеста и негативный тест', () => {
    const text = sceneText('s6-ci')
    for (const word of ['пул-реквест', 'стиль, типы, тесты, безопасность, сборка', 'негативный', 'баг', 'в тест']) expect(text, word).toContain(word)
  })

  it('в сцене выпуска — фича-флаг, канарейка 5% → 25% → все и откат за минуты', () => {
    const text = sceneText('s7-rollout')
    for (const word of ['фича-флаг', 'Канарейка', 'один тренер из двадцати', '5%', '25%', 'откат за минуты', 'минимум прав']) expect(text, word).toContain(word)
  })

  it('горячих точек восемь, у каждой пояснение не длиннее 350 знаков', () => {
    expect(ch08Script.hotspots.map((h) => h.title)).toEqual(['Инъекция', 'Проверка пакета', 'Сканер секретов', 'Шесть вопросов к правке', 'Проблема N+1', 'Кто что проверяет', 'Канареечный релиз', 'Реальные провалы'])
    for (const h of ch08Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch08Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch08Script, STAGING)).toEqual([])
  })
})
