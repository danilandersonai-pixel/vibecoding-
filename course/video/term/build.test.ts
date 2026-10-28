import { describe, expect, it } from 'vitest'
import { buildScript } from '../kit/script'
import { find } from '../sessions'
import { totalFrames, validateScript } from '../lib/timeline'
import { buildLesson, cameraKeys, headerRight, lessonCtx, sceneAt, sceneBook, sceneFade, spotWindow } from './build'
import { WHOLE, cameraAt, focusShot, toScreen } from './camera'
import { fixtureLesson } from './fixture-lesson'
import { frameDef } from './frames'
import type { Lesson } from './lesson'
import { MOTION } from './theme'

const built = buildLesson(fixtureLesson)
const { script, scenes } = built
const all = fixtureLesson.chapters.flatMap((c) => c.scenes)
const scene = (id: string) => scenes.find((s) => s.id === id)!
const parts = (id: string) => frameDef(scene(id).scene.frame).layout(scene(id).scene.frame, lessonCtx(fixtureLesson))
// Прямоугольник пояснения в сценарии округлён до сотых пикселя
function expectRect(spot: { x: number; y: number; w: number; h: number }, want: { x: number; y: number; w: number; h: number }) {
  for (const k of ['x', 'y', 'w', 'h'] as const) expect(spot[k], k).toBeCloseTo(want[k], 2)
}

describe('buildLesson', () => {
  it('сценарий 1920 × 1080, 30 кадров/с, сцены всех глав по порядку', () => {
    expect(script.width).toBe(1920)
    expect(script.height).toBe(1080)
    expect(script.fps).toBe(30)
    expect(script.id).toBe('term-lesson')
    expect(script.scenes.map((s) => s.id)).toEqual(all.map((s) => s.id))
    expect(validateScript(script)).toEqual([])
  })

  it('тайминг — из buildScript: те же сцены и реплики', () => {
    const ref = buildScript(fixtureLesson.id, all.map((s) => ({ id: s.id, lines: s.lines })), () => []).script
    expect(script.scenes).toEqual(ref.scenes)
    expect(script.cues).toEqual(ref.cues)
  })

  it('главы: названия глав урока, первая с кадра 0, каждая — с начала своей первой сцены', () => {
    expect(script.chapters!.map((c) => c.title)).toEqual(fixtureLesson.chapters.map((c) => c.title))
    expect(script.chapters![0].from).toBe(0)
    fixtureLesson.chapters.forEach((c, i) => expect(script.chapters![i].from).toBe(scene(c.scenes[0].id).start))
  })

  it('обложка — середина первой сцены с ролью example', () => {
    const first = scene('parts-route')
    expect(first.scene.role).toBe('example')
    expect(script.poster).toBe(first.start + Math.floor(first.duration / 2))
  })

  it('сцены: глава, начало, длина и часы — реплики начинаются на beat', () => {
    expect(scenes.map((s) => s.chapter)).toEqual(fixtureLesson.chapters.flatMap((c, i) => c.scenes.map(() => i)))
    let start = 0
    for (const s of scenes) {
      expect(s.start).toBe(start)
      start += s.duration
      expect(s.clock.duration).toBe(s.duration)
      expect(s.clock.lines).toBe(s.scene.lines.length)
      s.scene.lines.forEach((text, i) => expect(script.cues).toContainEqual(expect.objectContaining({ from: s.start + s.clock.beat(i), text })))
    }
    expect(start).toBe(totalFrames(script))
  })

  it('ctx по умолчанию — записи сессий и урок: id, название, главы и книга', () => {
    const ctx = lessonCtx(fixtureLesson)
    expect(ctx.find).toBe(find)
    expect(ctx.lesson).toEqual({ id: 'term-lesson', title: 'Приложение тренера изнутри', chapters: fixtureLesson.chapters.map((c) => c.title), book: ['sa1', 'sa4', 'sa5'] })
  })

  it('пояснение на cmd:dev при камере WHOLE — прямоугольник самой части, кадры — абсолютные', () => {
    const dev = scene('site-dev')
    const spot = script.hotspots.find((h) => h.title === 'npm run dev')!
    const part = parts('site-dev')['cmd:dev']
    expectRect(spot, part)
    expect(spot.from).toBe(dev.start + dev.clock.beat(1))
    expect(spot.to).toBe(dev.start + dev.duration - 12)
    expect(spot.text).toBe(dev.scene.spots![0].text)
  })

  it('пояснение при наезде камеры — часть через toScreen с этим наездом', () => {
    const route = scene('parts-route')
    const part = parts('parts-route')['line:29']
    const shot = focusShot(part, parts('parts-route').frame)
    expect(shot.zoom).toBeGreaterThan(1)
    const want = toScreen(part, shot)
    const spot = script.hotspots.find((h) => h.title === 'Ответ 400')!
    expectRect(spot, want)
    expect(spot.from).toBe(route.start + route.clock.beat(2))
  })

  it('камера: с кадра 0 весь кадр, ключ на beat(at) — наезд focusShot на часть (окно кадра не отъезжает от краёв), whole — WHOLE', () => {
    const route = scene('parts-route')
    const p = parts('parts-route')
    const keys = cameraKeys(route, p)
    expect(keys[0]).toEqual({ at: 0, ...WHOLE })
    expect(keys[1]).toEqual({ at: route.clock.beat(1), ...focusShot(p['line:29'], p.frame) })
    expect(cameraAt(route.clock.beat(1) + MOTION.move, keys)).toEqual(focusShot(p['line:29'], p.frame))
    // наезд на поле у верха окна браузера: окно остаётся на весь экран, поле — внутри SAFE экрана
    const form = scene('works-console')
    const fp = parts('works-console')
    const shot = cameraKeys(form, fp)[1]
    expect(shot.zoom).toBeGreaterThan(1)
    expect(toScreen(fp.frame, shot).y).toBeLessThanOrEqual(fp.frame.y + 0.01)
    expect(toScreen(fp['field:Вес, кг'], shot).y).toBeGreaterThanOrEqual(fp.frame.y - 0.01)
    const back = { ...route, scene: { ...route.scene, camera: [...route.scene.camera!, { at: 2, target: 'whole' }] } }
    expect(cameraKeys(back, parts('parts-route'))[2]).toEqual({ at: route.clock.beat(2), ...WHOLE })
    expect(cameraKeys(scene('agenda'), parts('agenda'))).toEqual([{ at: 0, ...WHOLE }])
  })

  it('окно пояснения: beat(at) … beat(until), без until — до конца сцены минус 12 кадров (кадры сцены)', () => {
    const c = scene('works-console')
    expect(spotWindow(c, { at: 1, target: 'console:0', title: '', text: '' })).toEqual({ from: c.clock.beat(1), to: c.duration - 12 })
    expect(spotWindow(c, { at: 1, until: 2, target: 'console:0', title: '', text: '' })).toEqual({ from: c.clock.beat(1), to: c.clock.beat(2) })
  })

  it('без сцены example обложки нет; сценарий снова собирается из того же урока одинаково', () => {
    const noExample: Lesson = { ...fixtureLesson, chapters: fixtureLesson.chapters.map((c) => ({ ...c, scenes: c.scenes.filter((s) => s.role !== 'example') })) }
    expect(buildLesson(noExample).script.poster).toBeUndefined()
    expect(buildLesson(fixtureLesson).script).toEqual(script)
  })

  it('sceneAt — сцена на кадре ролика; sceneFade — растворение и сдвиг на смене сцены', () => {
    expect(sceneAt(scenes, 0).id).toBe('agenda')
    const second = scenes[1]
    expect(sceneAt(scenes, second.start).id).toBe(second.id)
    expect(sceneAt(scenes, second.start - 1).id).toBe('agenda')
    expect(sceneAt(scenes, 10 ** 6).id).toBe('recap')
    // первая сцена не растворяется, следующая проявляется за MOTION.sceneFade кадров со сдвигом снизу
    expect(sceneFade(0, 100, true)).toEqual({ opacity: 1, dy: 0 })
    expect(sceneFade(0, 100, false).opacity).toBe(0)
    expect(sceneFade(0, 100, false).dy).toBe(MOTION.sceneShift)
    expect(sceneFade(MOTION.sceneFade, 100, false)).toEqual({ opacity: 1, dy: 0 })
    // после своего конца сцена уходит за те же кадры
    expect(sceneFade(100, 100, true)).toEqual({ opacity: 1, dy: 0 })
    expect(sceneFade(104, 100, true).opacity).toBeLessThan(1)
    expect(sceneFade(104, 100, true).dy).toBeLessThan(0)
    expect(sceneFade(100 + MOTION.sceneFade, 100, true).opacity).toBe(0)
  })
})

describe('правая часть шапки: ссылка на книгу или метки ошибки', () => {
  it('sceneBook — первый раздел главы (или урока), обрезка «…» по месту, без «и ещё N»; в сцене mistake — пусто', () => {
    expect(sceneBook(fixtureLesson, scene('parts-route'))).toBe('книга · Азбука · Из чего состоит любое приложение')
    expect(sceneBook(fixtureLesson, scene('site-dev'))).toBe('книга · Азбука · Как код становится работающим сайтом')
    expect(sceneBook(fixtureLesson, scene('agenda'))).toBe('книга · Азбука · Из чего состоит любое приложение')
    expect(sceneBook(fixtureLesson, scene('parts-key'))).toBe('')
    const long = structuredClone(fixtureLesson)
    long.chapters[1].title = 'Четыре части: зал, официант, кухня и склад приложения'
    const ref = sceneBook(long, buildLesson(long).scenes.find((s) => s.id === 'parts-route')!)
    expect(ref).toMatch(/^книга · Азбука · Из чего.*…$/)
    expect(ref).not.toContain('ещё')
  })

  it('раздел книги сцены важнее раздела главы и урока: scene.book ?? chapter.book ?? lesson.book', () => {
    const own = structuredClone(fixtureLesson)
    own.chapters[1].scenes.find((s) => s.id === 'parts-pkg')!.book = ['sa2']
    const b = (id: string) => buildLesson(own).scenes.find((s) => s.id === id)!
    expect(sceneBook(own, b('parts-pkg'))).toBe('книга · Азбука · Код, языки и чужие детали')
    // соседняя сцена той же главы — по-прежнему раздел главы, поэтому на границе ссылка меняется
    expect(sceneBook(own, b('parts-route'))).toBe('книга · Азбука · Из чего состоит любое приложение')
    // неизвестный раздел сцены пропускается, как у главы: ссылка — просто «книга»
    own.chapters[1].scenes.find((s) => s.id === 'parts-pkg')!.book = ['nope']
    expect(sceneBook(own, b('parts-pkg'))).toBe('книга')
  })

  it('та же ссылка в соседних сценах — без смены; иначе прежняя уходит за полсмены, новая приходит за вторую половину', () => {
    const pkg = scene('parts-pkg')
    expect(headerRight(fixtureLesson, scenes, pkg.start)).toEqual([{ b: pkg, opacity: 1, label: false }])
    const key = scene('parts-key')
    const at = (t: number) => headerRight(fixtureLesson, scenes, key.start + t)
    expect(at(0)).toEqual([
      { b: pkg, opacity: 1, label: false },
      { b: key, opacity: 0, label: true },
    ])
    expect(at(2)[0].opacity).toBeGreaterThan(0)
    expect(at(2)[0].opacity).toBeLessThan(1)
    expect(at(2)[1].opacity).toBe(0)
    expect(at(MOTION.sceneFade / 2)[0].opacity).toBe(0)
    expect(at(6)[1].opacity).toBeGreaterThan(0)
    expect(at(MOTION.sceneFade)).toEqual([{ b: key, opacity: 1, label: true }])
    // первая сцена — сразу
    expect(headerRight(fixtureLesson, scenes, 0)).toEqual([{ b: scenes[0], opacity: 1, label: false }])
  })

  it('две сцены mistake подряд: «Типичная ошибка» стоит, уходит только вердикт прежней', () => {
    const l = structuredClone(fixtureLesson)
    const parts = l.chapters[1].scenes
    parts.push({ ...structuredClone(parts[parts.length - 1]), id: 'parts-key-2' })
    const built = buildLesson(l).scenes
    const first = built.find((s) => s.id === 'parts-key')!
    const second = built.find((s) => s.id === 'parts-key-2')!
    for (let t = 0; t <= MOTION.sceneFade; t++) {
      const right = headerRight(l, built, second.start + t)
      // у новой сцены метка видна всё время смены
      expect(right).toContainEqual({ b: second, opacity: 1, label: true })
      const prev = right.find((r) => r.b === first)
      if (prev) expect(prev.label).toBe(false)
    }
    expect(headerRight(l, built, second.start + 2).find((r) => r.b === first)!.opacity).toBeLessThan(1)
    expect(headerRight(l, built, second.start + MOTION.sceneFade)).toEqual([{ b: second, opacity: 1, label: true }])
  })
})

describe('сценарий фикстуры для сайта и снимков кадров', () => {
  it('совпадает со снимком fixture-lesson.gen.json (его читает scripts/lesson-stills.mjs)', async () => {
    await expect(JSON.stringify(script, null, 1) + '\n').toMatchFileSnapshot('./fixture-lesson.gen.json')
  })
})
