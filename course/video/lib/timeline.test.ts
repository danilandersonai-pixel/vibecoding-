import { describe, expect, it } from 'vitest'
import type { VideoScript } from '../types'
import { sceneStart, totalFrames, validateScript } from './timeline'

const script = (patch: Partial<VideoScript> = {}): VideoScript => ({
  id: 'test',
  fps: 30,
  width: 1280,
  height: 720,
  scenes: [
    { id: 'a', durationInFrames: 90 },
    { id: 'b', durationInFrames: 60 },
  ],
  cues: [
    { from: 0, to: 60, text: 'Первая реплика' },
    { from: 60, to: 150, text: 'Вторая реплика' },
  ],
  hotspots: [{ from: 10, to: 80, x: 100, y: 100, w: 200, h: 200, title: 'Тренер', text: 'Видит только своих' }],
  ...patch,
})

describe('timeline', () => {
  it('длина ролика — сумма сцен, начало сцены — сумма предыдущих', () => {
    expect(totalFrames(script())).toBe(150)
    expect(sceneStart(script(), 'b')).toBe(90)
  })

  it('корректный сценарий без ошибок', () => {
    expect(validateScript(script())).toEqual([])
  })

  it('пересекающиеся реплики — одна ошибка', () => {
    const errors = validateScript(script({ cues: [{ from: 0, to: 70, text: 'Раз' }, { from: 60, to: 100, text: 'Два' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/пересека/)
  })

  it('реплика за концом ролика — одна ошибка', () => {
    const errors = validateScript(script({ cues: [{ from: 100, to: 200, text: 'Длинная' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/за конец/)
  })

  it('зона за концом ролика — одна ошибка', () => {
    const errors = validateScript(script({ hotspots: [{ from: 100, to: 151, x: 0, y: 0, w: 10, h: 10, title: 'Зона', text: 'т' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/Зона/)
  })

  it('реплика с концом не позже начала — ошибка', () => {
    expect(validateScript(script({ cues: [{ from: 50, to: 50, text: 'Пустая' }] }))).toHaveLength(1)
  })

  it('сценарий 1920 × 1080 с главами и обложкой в пределах ролика — без ошибок', () => {
    const big = script({ width: 1920, height: 1080, chapters: [{ from: 0, title: 'Что узнаете' }, { from: 90, title: 'Итог' }], poster: 149 })
    expect(validateScript(big)).toEqual([])
  })

  it('главы не по возрастанию — ошибка', () => {
    const errors = validateScript(script({ chapters: [{ from: 0, title: 'А' }, { from: 100, title: 'Б' }, { from: 100, title: 'В' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/«В».*не позже/)
  })

  it('первая глава не с кадра 0 — ошибка', () => {
    const errors = validateScript(script({ chapters: [{ from: 10, title: 'А' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/Первая глава «А».*с кадра 0/)
  })

  it('глава за концом ролика — ошибка', () => {
    const errors = validateScript(script({ chapters: [{ from: 0, title: 'А' }, { from: 150, title: 'Б' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/Глава «Б».*за конц/)
  })

  it('обложка за концом ролика или до начала — ошибка', () => {
    expect(validateScript(script({ poster: 150 }))[0]).toMatch(/Обложка.*150/)
    expect(validateScript(script({ poster: -1 }))).toHaveLength(1)
    expect(validateScript(script({ poster: 12.5 }))).toHaveLength(1)
  })
})
