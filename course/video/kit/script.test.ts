import { describe, expect, it } from 'vitest'
import { sceneStart, totalFrames, validateScript } from '../lib/timeline'
import { PACE, buildScript } from './script'

const SHORT = 'Коротко.'
const LONG = 'Это довольно длинная реплика, которой нужно больше времени на чтение.'

const two = () =>
  buildScript(
    'demo',
    [
      { id: 'a', lines: [SHORT, LONG] },
      { id: 'b', lines: [SHORT, SHORT] },
    ],
    () => [],
  )

describe('темп «живее»', () => {
  it('константы темпа', () => {
    expect(PACE).toEqual({ cps: 14, lead: 0.3, gap: 0.25, tail: 1, minCue: 2.2 })
  })
})

describe('buildScript', () => {
  it('собирает сценарий с нужными полями и сценами по порядку', () => {
    const b = two()
    expect(b.sceneIds).toEqual(['a', 'b'])
    expect(b.script.id).toBe('demo')
    expect(b.script.fps).toBe(30)
    expect(b.script.width).toBe(1280)
    expect(b.script.height).toBe(720)
    expect(b.script.scenes.map((s) => s.id)).toEqual(['a', 'b'])
    expect(b.script.cues).toHaveLength(4)
    expect(validateScript(b.script)).toEqual([])
  })

  it('первая реплика начинается через lead, следующая — через длительность первой и gap', () => {
    const [first, second] = two().script.cues
    expect(first.from).toBe(Math.round(0.3 * 30))
    expect(second.from).toBe(first.to + Math.round(0.25 * 30))
  })

  it('короткая реплика длится не меньше 66 кадров', () => {
    const [first] = two().script.cues
    expect(first.to - first.from).toBeGreaterThanOrEqual(66)
  })

  it('длинная реплика длится text.length / cps + 0.4 секунды (с точностью до кадра округления)', () => {
    const [, long] = two().script.cues
    const expected = (LONG.length / 14 + 0.4) * 30
    expect(expected).toBeGreaterThan(66)
    // начало и конец округляются каждый отдельно, как в пилоте
    expect(Math.abs(long.to - long.from - expected)).toBeLessThanOrEqual(1)
    expect(long.to).toBe(Math.round((0.3 + 2.2 + 0.25 + LONG.length / 14 + 0.4) * 30))
  })

  it('сцена заканчивается через 30 кадров после последней реплики', () => {
    const b = two()
    for (const scene of b.script.scenes) {
      const start = sceneStart(b.script, scene.id)
      const inScene = b.script.cues.filter((c) => c.from >= start && c.to <= start + scene.durationInFrames)
      const lastEnd = Math.max(...inScene.map((c) => c.to))
      expect(start + scene.durationInFrames, scene.id).toBe(lastEnd + 30)
    }
    expect(totalFrames(b.script)).toBe(b.script.scenes[0].durationInFrames + b.script.scenes[1].durationInFrames)
  })

  it('реплики второй сцены сдвинуты на длину первой', () => {
    const b = two()
    const start = b.script.scenes[0].durationInFrames
    expect(b.script.cues[2].from).toBe(start + Math.round(0.3 * 30))
  })

  it('beat — кадр от начала сцены', () => {
    const b = two()
    expect(b.beat('a', 0)).toBe(9)
    expect(b.beat('a', 1)).toBe(b.script.cues[1].from)
    expect(b.beat('b', 0)).toBe(9)
    expect(b.abs('b', b.beat('b', 1))).toBe(b.script.cues[3].from)
  })

  it('abs и sceneEnd считают от начала сцены', () => {
    const b = two()
    expect(b.abs('a', 5)).toBe(5)
    expect(b.abs('b', 5)).toBe(b.script.scenes[0].durationInFrames + 5)
    expect(b.sceneEnd('a')).toBe(b.script.scenes[0].durationInFrames)
    expect(b.sceneEnd('b')).toBe(totalFrames(b.script))
  })

  it('на неизвестной сцене или реплике бросает ошибку', () => {
    const b = two()
    expect(() => b.beat('нет', 0)).toThrow(/нет/)
    expect(() => b.beat('a', 2)).toThrow()
    expect(() => b.beat('a', -1)).toThrow()
    expect(() => b.abs('нет', 0)).toThrow(/нет/)
    expect(() => b.sceneEnd('нет')).toThrow(/нет/)
  })

  it('горячие точки получают кадры через abs и sceneEnd', () => {
    const b = buildScript(
      'demo',
      [
        { id: 'a', lines: [SHORT, LONG] },
        { id: 'b', lines: [SHORT, SHORT] },
      ],
      (t) => [
        { from: t.abs('b', t.beat('b', 1)), to: t.sceneEnd('b'), x: 10, y: 20, w: 100, h: 50, title: 'Точка', text: 'Пояснение' },
      ],
    )
    expect(b.script.hotspots).toEqual([
      { from: b.script.cues[3].from, to: totalFrames(b.script), x: 10, y: 20, w: 100, h: 50, title: 'Точка', text: 'Пояснение' },
    ])
    expect(validateScript(b.script)).toEqual([])
  })
})
