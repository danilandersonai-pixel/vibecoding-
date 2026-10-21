import { describe, expect, it } from 'vitest'
import type { VideoScript } from '../types'
import { buildScript } from './script'
import { scriptProblems } from './checks'

// Сценарий вручную: sceneCount сцен по sceneFrames кадров, в каждой одна спокойная реплика.
function make(sceneCount: number, sceneFrames: number, hotspotCount: number): VideoScript {
  const scenes = Array.from({ length: sceneCount }, (_, i) => ({ id: `s${i + 1}`, durationInFrames: sceneFrames }))
  const cues = scenes.map((_, i) => ({ from: i * sceneFrames + 30, to: i * sceneFrames + 180, text: `Реплика номер ${i + 1}` }))
  const hotspots = Array.from({ length: hotspotCount }, (_, i) => ({
    from: 0,
    to: 300,
    x: 100,
    y: 100 + i * 120,
    w: 200,
    h: 80,
    title: `Точка ${i + 1}`,
    text: 'Пояснение',
  }))
  return { id: 'demo', fps: 30, width: 1280, height: 720, scenes, cues, hotspots }
}

describe('scriptProblems', () => {
  it('правильный ролик дня — без замечаний', () => {
    expect(scriptProblems(make(3, 800, 1), 'day')).toEqual([])
  })

  it('правильный ролик главы — без замечаний', () => {
    expect(scriptProblems(make(6, 1100, 2), 'chapter')).toEqual([])
  })

  it('ролик, собранный buildScript, проходит проверки', () => {
    const line = 'Эта реплика достаточно длинная, чтобы заполнить время сцены спокойным темпом.'
    const b = buildScript(
      'day-demo',
      ['a', 'b', 'c'].map((id) => ({ id, lines: Array.from({ length: 6 }, () => line) })),
      (t) => [{ from: t.abs('a', t.beat('a', 1)), to: t.sceneEnd('a'), x: 100, y: 100, w: 200, h: 80, title: 'Точка', text: 'Пояснение' }],
    )
    expect(scriptProblems(b.script, 'day')).toEqual([])
  })

  it('передаёт ошибки validateScript', () => {
    const s = make(3, 800, 1)
    s.cues[0] = { from: 180, to: 30, text: 'Перевёрнутая' }
    const problems = scriptProblems(s, 'day')
    expect(problems.some((p) => p.includes('Перевёрнутая'))).toBe(true)
  })

  it('ролик главы на 5000 кадров — замечание про длину', () => {
    const problems = scriptProblems(make(5, 1000, 2), 'chapter')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toBe('Ролик длится 5000 кадров, нужно 5400–8100')
  })

  it('слишком длинный ролик главы и слишком короткий и длинный ролик дня', () => {
    expect(scriptProblems(make(6, 1400, 2), 'chapter')[0]).toBe('Ролик длится 8400 кадров, нужно 5400–8100')
    expect(scriptProblems(make(3, 500, 1), 'day')[0]).toBe('Ролик длится 1500 кадров, нужно 1800–5400')
    expect(scriptProblems(make(4, 1500, 1), 'day')[0]).toBe('Ролик длится 6000 кадров, нужно 1800–5400')
  })

  it('8 сцен у главы — замечание про число сцен', () => {
    const problems = scriptProblems(make(8, 900, 2), 'chapter')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toBe('Сцен 8, нужно 5–7')
  })

  it('число сцен дня — от 3 до 4', () => {
    expect(scriptProblems(make(2, 1200, 1), 'day')).toEqual(['Сцен 2, нужно 3–4'])
    expect(scriptProblems(make(5, 700, 1), 'day')).toEqual(['Сцен 5, нужно 3–4'])
    expect(scriptProblems(make(4, 700, 1), 'day')).toEqual([])
  })

  it('сцена без реплик', () => {
    const s = make(6, 1100, 2)
    s.cues = s.cues.filter((_, i) => i !== 1)
    const problems = scriptProblems(s, 'chapter')
    expect(problems).toEqual(['В сцене «s2» нет реплик'])
  })

  it('реплика вне своей сцены', () => {
    const s = make(6, 1100, 2)
    s.cues.push({ from: 1070, to: 1120, text: 'Через границу' })
    const problems = scriptProblems(s, 'chapter')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('Через границу')
    expect(problems[0]).toContain('сцен')
  })

  it('реплика быстрее 15 знаков в секунду', () => {
    const s = make(6, 1100, 2)
    s.cues[0] = { from: 30, to: 90, text: 'а'.repeat(40) }
    const problems = scriptProblems(s, 'chapter')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('быстрее')
    expect(problems[0]).toContain('20')
  })

  it('реплика ровно на 15 знаков в секунду допустима', () => {
    const s = make(6, 1100, 2)
    s.cues[0] = { from: 30, to: 90, text: 'а'.repeat(30) }
    expect(scriptProblems(s, 'chapter')).toEqual([])
  })

  it('горячих точек меньше нормы', () => {
    const chapter = scriptProblems(make(6, 1100, 1), 'chapter')
    expect(chapter).toHaveLength(1)
    expect(chapter[0]).toBe('Горячих точек 1, нужно не меньше 2')
    expect(scriptProblems(make(3, 800, 0), 'day')).toEqual(['Горячих точек 0, нужно не меньше 1'])
  })

  it('горячая точка за границей кадра', () => {
    for (const bad of [{ x: 1200, w: 100 }, { x: -5 }, { y: 700, h: 40 }, { y: -1 }]) {
      const s = make(3, 800, 1)
      s.hotspots[0] = { ...s.hotspots[0], ...bad }
      const problems = scriptProblems(s, 'day')
      expect(problems, JSON.stringify(bad)).toHaveLength(1)
      expect(problems[0]).toContain('Точка 1')
      expect(problems[0]).toContain('кадр')
    }
  })

  it('горячая точка вплотную к краю кадра допустима', () => {
    const s = make(3, 800, 1)
    s.hotspots[0] = { ...s.hotspots[0], x: 1180, y: 640, w: 100, h: 80 }
    expect(scriptProblems(s, 'day')).toEqual([])
  })
})
