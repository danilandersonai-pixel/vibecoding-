import { describe, expect, it } from 'vitest'
import { sceneStart, totalFrames, validateScript } from '../lib/timeline'
import { pilotRlsScript } from './script'

describe('сценарий пилотного ролика про RLS', () => {
  it('проходит проверку таймлайна', () => {
    expect(validateScript(pilotRlsScript)).toEqual([])
  })

  it('длится от 3 до 5 минут', () => {
    expect(totalFrames(pilotRlsScript)).toBeGreaterThanOrEqual(5400)
    expect(totalFrames(pilotRlsScript)).toBeLessThanOrEqual(9000)
  })

  it('в каждой сцене есть реплики, и все они внутри своей сцены', () => {
    expect(pilotRlsScript.scenes).toHaveLength(5)
    for (const scene of pilotRlsScript.scenes) {
      const start = sceneStart(pilotRlsScript, scene.id)
      const end = start + scene.durationInFrames
      const inside = pilotRlsScript.cues.filter((c) => c.from >= start && c.to <= end)
      expect(inside.length, scene.id).toBeGreaterThan(0)
    }
    const inSomeScene = (from: number, to: number) =>
      pilotRlsScript.scenes.some((s) => {
        const start = sceneStart(pilotRlsScript, s.id)
        return from >= start && to <= start + s.durationInFrames
      })
    expect(pilotRlsScript.cues.every((c) => inSomeScene(c.from, c.to))).toBe(true)
  })

  it('реплику успевают прочитать и произнести (не быстрее 15 знаков в секунду)', () => {
    for (const c of pilotRlsScript.cues) expect(c.text.length / ((c.to - c.from) / 30), c.text).toBeLessThanOrEqual(15)
  })

  it('горячих точек ровно три, все в кадре', () => {
    expect(pilotRlsScript.hotspots).toHaveLength(3)
    for (const h of pilotRlsScript.hotspots) {
      expect(h.x).toBeGreaterThanOrEqual(0)
      expect(h.y).toBeGreaterThanOrEqual(0)
      expect(h.x + h.w).toBeLessThanOrEqual(1280)
      expect(h.y + h.h).toBeLessThanOrEqual(720)
    }
  })
})
