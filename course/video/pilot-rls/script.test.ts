import { describe, expect, it } from 'vitest'
import { cameraAt, TRANSITION_FRAMES } from '../kit/camera'
import { scriptProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
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

  it('у каждой сцены есть переход и камера, которая хоть раз двигается', () => {
    for (const s of pilotRlsScript.scenes) {
      const { camera } = STAGING[s.id]
      const spots = new Set(camera.map((k) => `${k.x} ${k.y} ${k.zoom}`))
      expect(spots.size, s.id).toBeGreaterThan(1)
    }
  })

  it('окна горячих точек — на неподвижных кадрах: камера стоит, переход сцены не идёт', () => {
    for (const h of pilotRlsScript.hotspots) {
      const scene = pilotRlsScript.scenes.find((s) => {
        const start = sceneStart(pilotRlsScript, s.id)
        return h.from >= start && h.to <= start + s.durationInFrames
      })
      expect(scene, h.title).toBeDefined()
      const start = sceneStart(pilotRlsScript, scene!.id)
      const keys = STAGING[scene!.id].camera
      const still = cameraAt(h.from - start, keys)
      for (let f = h.from; f < h.to; f++) expect(cameraAt(f - start, keys), `${h.title}, кадр ${f}`).toEqual(still)
      expect(h.from - start, h.title).toBeGreaterThanOrEqual(TRANSITION_FRAMES)
      expect(start + scene!.durationInFrames - h.to, h.title).toBeGreaterThanOrEqual(TRANSITION_FRAMES)
    }
  })
})
