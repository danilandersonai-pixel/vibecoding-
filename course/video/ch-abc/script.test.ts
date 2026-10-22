import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { chAbcScript, STAGING } from './script'

describe('сценарий ролика «Как устроено приложение»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(chAbcScript, 'chapter')).toEqual([])
  })

  it('шесть сцен — по разделам Азбуки sa1–sa6', () => {
    expect(chAbcScript.scenes.map((s) => s.id)).toEqual(['s1-restaurant', 's2-parts', 's3-git', 's4-site', 's5-works', 's6-ai'])
  })

  it('горячих точек три — API, коммит, ошибка в консоли, у каждой есть пояснение', () => {
    expect(chAbcScript.hotspots.map((h) => h.title)).toEqual(['API — официант', 'Коммит', 'Ошибка в Console'])
    for (const h of chAbcScript.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(chAbcScript, STAGING)).toEqual([])
  })
})
