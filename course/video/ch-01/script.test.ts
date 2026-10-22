import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { ch01Script, STAGING } from './script'

describe('сценарий ролика «Вайб-кодинг: шкала, а не выключатель»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch01Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: автопилот, цена ошибки, намерение, модель, бенчмарки, оплата', () => {
    expect(ch01Script.scenes.map((s) => s.id)).toEqual(['s1-autopilot', 's2-cost', 's3-intent', 's4-model', 's5-bench', 's6-pay'])
  })

  it('горячих точек четыре — зона риска, карточка модели, мини-набор, лимиты, у каждой есть пояснение', () => {
    expect(ch01Script.hotspots.map((h) => h.title)).toEqual(['Зона риска', 'Карточка модели', 'Мини-набор', 'Лимиты Claude'])
    for (const h of ch01Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch01Script, STAGING)).toEqual([])
  })
})
