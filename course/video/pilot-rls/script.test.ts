import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { pilotRlsScript, STAGING } from './script'

describe('сценарий пилотного ролика про RLS', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(pilotRlsScript, 'chapter')).toEqual([])
  })

  it('горячих точек ровно три — запрос, подменённый номер, политика RLS, — все в кадре', () => {
    expect(pilotRlsScript.hotspots.map((h) => h.title)).toEqual(['Запрос', 'client/18', 'Политика RLS'])
    for (const h of pilotRlsScript.hotspots) {
      expect(h.x, h.title).toBeGreaterThanOrEqual(0)
      expect(h.y, h.title).toBeGreaterThanOrEqual(0)
      expect(h.x + h.w, h.title).toBeLessThanOrEqual(1280)
      expect(h.y + h.h, h.title).toBeLessThanOrEqual(720)
    }
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(pilotRlsScript, STAGING)).toEqual([])
  })
})
