import { describe, expect, it } from 'vitest'
import { cameraAt, TRANSITION_FRAMES } from '../kit/camera'
import { scriptProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch01Script, STAGING } from './script'

// Плашка субтитров в две строки начинается около y = 575: всё содержимое кадра — выше 565.
const CONTENT_BOTTOM = 565

describe('сценарий ролика «Вайб-кодинг: шкала, а не выключатель»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch01Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: автопилот, цена ошибки, намерение, модель, бенчмарки, оплата', () => {
    expect(ch01Script.scenes.map((s) => s.id)).toEqual(['s1-autopilot', 's2-cost', 's3-intent', 's4-model', 's5-bench', 's6-pay'])
  })

  it('горячих точек четыре — зона риска, карточка модели, мини-набор, лимиты, — все в кадре и выше субтитров', () => {
    expect(ch01Script.hotspots.map((h) => h.title)).toEqual(['Зона риска', 'Карточка модели', 'Мини-набор', 'Лимиты Claude'])
    for (const h of ch01Script.hotspots) {
      expect(h.x, h.title).toBeGreaterThanOrEqual(0)
      expect(h.y, h.title).toBeGreaterThanOrEqual(0)
      expect(h.x + h.w, h.title).toBeLessThanOrEqual(1280)
      expect(h.y + h.h, h.title).toBeLessThanOrEqual(CONTENT_BOTTOM)
      expect(h.text.length, h.title).toBeGreaterThan(20)
    }
  })

  it('у каждой сцены есть переход и камера, которая хоть раз двигается', () => {
    for (const s of ch01Script.scenes) {
      const { transition, camera } = STAGING[s.id]
      expect(['fade', 'slide', 'zoom'], s.id).toContain(transition)
      const spots = new Set(camera.map((k) => `${k.x} ${k.y} ${k.zoom}`))
      expect(spots.size, s.id).toBeGreaterThan(1)
    }
  })

  it('ключи камеры идут по порядку и не выходят за сцену', () => {
    for (const s of ch01Script.scenes) {
      const keys = STAGING[s.id].camera
      keys.forEach((k, i) => {
        if (i > 0) expect(k.at, `${s.id}, ключ ${i}`).toBeGreaterThanOrEqual(keys[i - 1].at)
        expect(k.at, `${s.id}, ключ ${i}`).toBeLessThanOrEqual(s.durationInFrames)
      })
    }
  })

  it('окна горячих точек — на неподвижных кадрах: камера стоит, переход сцены не идёт', () => {
    for (const h of ch01Script.hotspots) {
      const scene = ch01Script.scenes.find((s) => {
        const start = sceneStart(ch01Script, s.id)
        return h.from >= start && h.to <= start + s.durationInFrames
      })
      expect(scene, h.title).toBeDefined()
      const start = sceneStart(ch01Script, scene!.id)
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
