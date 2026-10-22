import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch03Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(ch03Script, id)
  const scene = ch03Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return ch03Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
}

describe('сценарий ролика «Проблема 70%»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch03Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: ремонт, журнал тренировок, три приметы, как работают с ИИ, безопасный шаг, откат и проверка', () => {
    expect(ch03Script.scenes.map((s) => s.id)).toEqual(['s1-renovation', 's2-log', 's3-symptoms', 's4-practice', 's5-step', 's6-rollback'])
  })

  it('в метафоре ремонта звучат 70% и 30%', () => {
    const text = sceneText('s1-renovation')
    for (const word of ['70%', '30%', 'проводка', 'трубы']) expect(text.toLowerCase(), word).toContain(word.toLowerCase())
  })

  it('в сценах правил названы маленький шаг, коммит, дифф, откат и тест', () => {
    const text = `${sceneText('s5-step')} ${sceneText('s6-rollback')}`.toLowerCase()
    for (const word of ['маленький шаг', 'коммит', 'дифф', 'откат', 'тест']) expect(text, word).toContain(word)
  })

  it('горячих точек шесть — последние 30%, парадокс знаний, две схемы, десять правил, дифф, контрольные точки; у каждой есть пояснение', () => {
    expect(ch03Script.hotspots.map((h) => h.title)).toEqual(['Последние 30%', 'Парадокс знаний', 'Две схемы работы', 'Десять золотых правил', 'Как читать дифф', 'Контрольные точки'])
    for (const h of ch03Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch03Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch03Script, STAGING)).toEqual([])
  })
})
