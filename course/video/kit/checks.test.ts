import { describe, expect, it } from 'vitest'
import type { VideoScript } from '../types'
import { buildScript } from './script'
import { TRANSITION_FRAMES, type CameraKey } from './camera'
import { scriptProblems, stagingProblems } from './checks'

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

// ---- stagingProblems ----

const WHOLE = { x: 640, y: 360, zoom: 1 }
const CLOSE = { x: 400, y: 300, zoom: 1.4 }
const key = (at: number, shot: { x: number; y: number; zoom: number }): CameraKey => ({ at, ...shot })

// Камера едет с кадра 20 по 50 и дальше стоит.
const MOVES_EARLY: CameraKey[] = [key(0, WHOLE), key(20, WHOLE), key(50, CLOSE)]
// Камера стоит до кадра 250 и в конце сцены едет.
const MOVES_LATE: CameraKey[] = [key(0, WHOLE), key(250, WHOLE), key(280, CLOSE)]
// Камера стоит почти всю сцену и трогается только в последние кадры.
const MOVES_AT_END: CameraKey[] = [key(0, WHOLE), key(290, WHOLE), key(299, CLOSE)]

type Staging = Record<string, { transition: 'fade' | 'slide' | 'zoom'; camera: CameraKey[] }>

// Две сцены по 300 кадров, одна точка в сцене s1: окно в кадрах сцены, рамка в кадре.
function staged(opts: { window?: [number, number]; rect?: { x: number; y: number; w: number; h: number }; camera?: CameraKey[]; hotspots?: boolean } = {}) {
  const [from, to] = opts.window ?? [100, 220]
  const script = make(2, 300, 0)
  if (opts.hotspots !== false) script.hotspots = [{ from, to, ...(opts.rect ?? { x: 100, y: 100, w: 200, h: 80 }), title: 'Точка', text: 'Пояснение' }]
  const staging: Staging = {
    s1: { transition: 'fade', camera: opts.camera ?? MOVES_EARLY },
    s2: { transition: 'slide', camera: MOVES_EARLY },
  }
  return { script, staging }
}

describe('stagingProblems', () => {
  it('правильный пример — без замечаний', () => {
    const { script, staging } = staged()
    expect(stagingProblems(script, staging)).toEqual([])
  })

  it('окно точки на движении камеры — одна строка про камеру', () => {
    const { script, staging } = staged({ window: [30, 150] })
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('Точка')
    expect(problems[0]).toContain('Камера')
  })

  it('окно точки в появлении сцены — одна строка про переход', () => {
    const { script, staging } = staged({ window: [5, 125], camera: MOVES_LATE })
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('Точка')
    expect(problems[0]).toContain('переход')
  })

  it('окно точки в уходе сцены — одна строка про переход', () => {
    const { script, staging } = staged({ window: [170, 295] })
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('переход')
  })

  it('окно ровно до границы перехода допустимо', () => {
    const { script, staging } = staged({ window: [TRANSITION_FRAMES, 300 - TRANSITION_FRAMES], camera: MOVES_AT_END })
    expect(stagingProblems(script, staging)).toEqual([])
  })

  it('окно точки через границу двух сцен — одна строка', () => {
    const { script, staging } = staged({ window: [240, 360], camera: MOVES_EARLY })
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('одной сцены')
  })

  it('окно короче 90 кадров — строка; ровно 90 допустимо', () => {
    const short = staged({ window: [100, 189] })
    const problems = stagingProblems(short.script, short.staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('90')
    const exact = staged({ window: [100, 190] })
    expect(stagingProblems(exact.script, exact.staging)).toEqual([])
  })

  it('сцена без записи staging — строка с её именем', () => {
    const { script, staging } = staged()
    delete staging.s2
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('«s2»')
  })

  it('точка в сцене без записи staging не роняет проверку', () => {
    const { script, staging } = staged()
    delete staging.s1
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('«s1»')
  })

  it('камера, которая не двигается, — строка', () => {
    const { script, staging } = staged()
    staging.s2 = { transition: 'fade', camera: [key(0, WHOLE), key(100, WHOLE)] }
    const problems = stagingProblems(script, staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('«s2»')
    expect(problems[0]).toContain('не двигается')
  })

  it('ключи камеры не по порядку или за пределами сцены — строка', () => {
    const unordered = staged()
    unordered.staging.s2 = { transition: 'fade', camera: [key(0, WHOLE), key(80, CLOSE), key(40, WHOLE)] }
    expect(stagingProblems(unordered.script, unordered.staging)).toHaveLength(1)
    const outside = staged()
    outside.staging.s2 = { transition: 'fade', camera: [key(0, WHOLE), key(400, CLOSE)] }
    expect(stagingProblems(outside.script, outside.staging)).toHaveLength(1)
  })

  it('рамка точки ниже y = 565 — строка; ровно по 565 допустимо', () => {
    const low = staged({ rect: { x: 100, y: 500, w: 200, h: 80 } })
    const problems = stagingProblems(low.script, low.staging)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('565')
    const edge = staged({ rect: { x: 100, y: 485, w: 200, h: 80 } })
    expect(stagingProblems(edge.script, edge.staging)).toEqual([])
  })

  it('рамка точки за краем кадра — строка', () => {
    for (const rect of [{ x: -5, y: 100, w: 200, h: 80 }, { x: 1200, y: 100, w: 200, h: 80 }, { x: 100, y: -1, w: 200, h: 80 }]) {
      const { script, staging } = staged({ rect })
      const problems = stagingProblems(script, staging)
      expect(problems, JSON.stringify(rect)).toHaveLength(1)
      expect(problems[0]).toContain('кадр')
    }
  })

  it('без горячих точек проверяются только сцены и камера', () => {
    const { script, staging } = staged({ hotspots: false })
    expect(stagingProblems(script, staging)).toEqual([])
  })
})
