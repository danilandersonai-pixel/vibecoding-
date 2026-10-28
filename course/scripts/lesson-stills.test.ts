import { describe, expect, it } from 'vitest'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { stillShots } from './lesson-stills.mjs'
import script from '../video/term/fixture-lesson.gen.json'

describe('stillShots', () => {
  const SCRIPT = {
    scenes: [
      { id: 'agenda', durationInFrames: 101 },
      { id: 'site-dev', durationInFrames: 200 },
      { id: 'site-local', durationInFrames: 100 },
    ],
    cues: [
      { from: 9, to: 90, text: 'а' },
      { from: 110, to: 200, text: 'б' },
      { from: 210, to: 290, text: 'в' },
      { from: 349, to: 360, text: 'г' },
    ],
    hotspots: [{ from: 120, to: 289, x: 0, y: 0, w: 10, h: 10, title: 'npm run dev', text: '…' }],
  }

  it('кадр середины каждой сцены и кадр середины каждого пояснения — с рамками пояснений', () => {
    expect(stillShots(SCRIPT)).toEqual([
      { file: 'scene-01-agenda.png', frame: 50, debugSpots: false },
      // середина сцены (201) между репликами — следующая реплика, когда её элементы уже появились (9 кадров и запас 3)
      { file: 'scene-02-site-dev.png', frame: 222, debugSpots: false },
      // середина (351) в двух кадрах от начала реплики — тоже ждём появления, но не дальше конца реплики
      { file: 'scene-03-site-local.png', frame: 359, debugSpots: false },
      { file: 'spot-01-site-dev.png', frame: 204, debugSpots: true },
    ])
  })

  it('на сценарии фикстуры урока: по снимку на сцену и на пояснение, кадры внутри ролика', () => {
    const shots = stillShots(script)
    const end = script.scenes.reduce((sum, s) => sum + s.durationInFrames, 0)
    expect(shots).toHaveLength(script.scenes.length + script.hotspots.length)
    for (const s of shots) expect(s.frame).toBeLessThan(end)
    expect(new Set(shots.map((s: { file: string }) => s.file)).size).toBe(shots.length)
  })
})
