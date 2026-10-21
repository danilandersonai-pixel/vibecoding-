import { describe, expect, it } from 'vitest'
import { cameraAt, TRANSITION_FRAMES } from '../kit/camera'
import { scriptProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { chAbcScript, STAGING } from './script'

// Плашка субтитров в две строки начинается около y = 575: всё содержимое кадра — выше 565.
const CONTENT_BOTTOM = 565

describe('сценарий ролика «Как устроено приложение»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(chAbcScript, 'chapter')).toEqual([])
  })

  it('шесть сцен — по разделам Азбуки sa1–sa6', () => {
    expect(chAbcScript.scenes.map((s) => s.id)).toEqual(['s1-restaurant', 's2-parts', 's3-git', 's4-site', 's5-works', 's6-ai'])
  })

  it('горячих точек три — API, коммит, ошибка в консоли, — все в кадре и выше субтитров', () => {
    expect(chAbcScript.hotspots.map((h) => h.title)).toEqual(['API — официант', 'Коммит', 'Ошибка в Console'])
    for (const h of chAbcScript.hotspots) {
      expect(h.x, h.title).toBeGreaterThanOrEqual(0)
      expect(h.y, h.title).toBeGreaterThanOrEqual(0)
      expect(h.x + h.w, h.title).toBeLessThanOrEqual(1280)
      expect(h.y + h.h, h.title).toBeLessThanOrEqual(CONTENT_BOTTOM)
      expect(h.text.length, h.title).toBeGreaterThan(20)
    }
  })

  it('у каждой сцены есть переход и камера, которая хоть раз двигается', () => {
    for (const s of chAbcScript.scenes) {
      const { transition, camera } = STAGING[s.id]
      expect(['fade', 'slide', 'zoom'], s.id).toContain(transition)
      const spots = new Set(camera.map((k) => `${k.x} ${k.y} ${k.zoom}`))
      expect(spots.size, s.id).toBeGreaterThan(1)
    }
  })

  it('ключи камеры идут по порядку и не выходят за сцену', () => {
    for (const s of chAbcScript.scenes) {
      const keys = STAGING[s.id].camera
      keys.forEach((k, i) => {
        if (i > 0) expect(k.at, `${s.id}, ключ ${i}`).toBeGreaterThanOrEqual(keys[i - 1].at)
        expect(k.at, `${s.id}, ключ ${i}`).toBeLessThanOrEqual(s.durationInFrames)
      })
    }
  })

  it('окна горячих точек — на неподвижных кадрах: камера стоит, переход сцены не идёт', () => {
    for (const h of chAbcScript.hotspots) {
      const scene = chAbcScript.scenes.find((s) => {
        const start = sceneStart(chAbcScript, s.id)
        return h.from >= start && h.to <= start + s.durationInFrames
      })
      expect(scene, h.title).toBeDefined()
      const start = sceneStart(chAbcScript, scene!.id)
      const keys = STAGING[scene!.id].camera
      const still = cameraAt(h.from - start, keys)
      for (let f = h.from; f < h.to; f++) expect(cameraAt(f - start, keys), `${h.title}, кадр ${f}`).toEqual(still)
      expect(h.from - start, h.title).toBeGreaterThanOrEqual(TRANSITION_FRAMES)
      expect(start + scene!.durationInFrames - h.to, h.title).toBeGreaterThanOrEqual(TRANSITION_FRAMES)
      // точку успевают заметить и нажать
      expect(h.to - h.from, h.title).toBeGreaterThanOrEqual(90)
    }
  })
})
