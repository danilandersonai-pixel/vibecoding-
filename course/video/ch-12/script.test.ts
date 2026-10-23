import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { ch12Script, STAGING } from './script'

describe('сценарий ролика «Своё приложение по образцу»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch12Script, 'chapter')).toEqual([])
  })

  it('семь сцен: повар, граница, сбор и разбор, описание, сборка и сверка, ловушки, три прохода', () => {
    expect(ch12Script.scenes.map((s) => s.id)).toEqual(['s1-taste', 's2-line', 's3-collect', 's4-describe', 's5-build', 's6-traps', 's7-passes'])
  })

  it('горячих точек четыре — функциональный аналог, стена, своё отличие, таблица паритета, у каждой есть пояснение', () => {
    expect(ch12Script.hotspots.map((h) => h.title)).toEqual(['Функциональный аналог', 'Стена чистой комнаты', 'Своё отличие', 'Таблица паритета'])
    for (const h of ch12Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch12Script, STAGING)).toEqual([])
  })
})
