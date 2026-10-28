import { buildScript } from '../kit/script'
import { find } from '../sessions'
import type { VideoChapter, VideoHotspot, VideoScript } from '../types'
import { bookRef, bookSection } from './book'
import { WHOLE, cameraAt, focusShot, toScreen } from './camera'
import type { CameraKey } from './camera'
import { CELL, bookRoom, verdictWidth } from './chrome/layout'
import type { Clock, FrameCtx, Rect } from './frame'
import { frameDef } from './frames'
import type { Lesson, LessonScene } from './lesson'
import { appear, easeIn } from './motion'
import { MOTION } from './theme'

// Сборка урока: тайминг из реплик (buildScript, темп PACE), сценарий 1920 × 1080 с главами, обложкой и пояснениями.
// Здесь же — всё, что общий ролик (LessonVideo) и проверка урока (problems.ts) считают одинаково: камера сцены,
// окно пояснения, смена сцены, ссылка на книгу в шапке.

/** Сцена урока на шкале ролика: номер главы, начало и длина в кадрах, часы сцены (beat — от её начала). */
export type BuiltScene = { id: string; chapter: number; start: number; duration: number; clock: Clock; scene: LessonScene }
export type Spot = NonNullable<LessonScene['spots']>[number]

/** Пояснение не заходит в первые и последние столько кадров сцены: там смена сцены. */
export const SPOT_EDGE = 12

/** Номер реплики сцены, на который можно сослаться: целое от 0 до числа реплик − 1. */
export const isBeat = (at: number, lines: number) => Number.isInteger(at) && at >= 0 && at < lines

/** Что кадру нужно, кроме данных сцены: записи сессий и урок (id, название, названия глав, разделы книги). */
export function lessonCtx(lesson: Lesson): FrameCtx {
  return { find, lesson: { id: lesson.id, title: lesson.title, chapters: lesson.chapters.map((c) => c.title), book: lesson.book } }
}

/** Части кадра сцены на холсте — снимок конца сцены (layout кадра). */
export function sceneParts(b: BuiltScene, ctx: FrameCtx): Record<string, Rect> {
  return frameDef(b.scene.frame).layout(b.scene.frame, ctx)
}

/**
 * Ключи камеры сцены: с кадра 0 весь кадр, дальше на beat(at) наезд focusShot на часть ('whole' — весь кадр), движение — MOTION.move кадров.
 * Окно кадра (часть 'frame') при наезде не отъезжает от краёв экрана: у части у края окна не открывается пустой стол.
 * Ключи с неверной репликой пропускаются, цель, которой нет среди частей, — весь кадр: об обоих говорит lessonProblems.
 */
export function cameraKeys(b: BuiltScene, parts: Record<string, Rect>): CameraKey[] {
  const keys = (b.scene.camera ?? [])
    .filter((k) => isBeat(k.at, b.clock.lines))
    .sort((x, y) => x.at - y.at)
    .map((k): CameraKey => {
      const part = k.target === 'whole' ? undefined : parts[k.target]
      return { at: b.clock.beat(k.at), ...(part ? focusShot(part, parts.frame) : WHOLE) }
    })
  return [{ at: 0, ...WHOLE }, ...keys]
}

/** Окно пояснения в кадрах сцены: beat(at) … beat(until); без until — до конца сцены минус SPOT_EDGE, until = числу реплик — до конца сцены. */
export function spotWindow(b: BuiltScene, spot: Spot): { from: number; to: number } {
  const from = b.clock.beat(spot.at)
  if (spot.until === undefined) return { from, to: b.duration - SPOT_EDGE }
  return { from, to: spot.until === b.clock.lines ? b.duration : b.clock.beat(spot.until) }
}

/** Пояснение можно посчитать: at — реплика сцены, until (если есть) — после неё и не дальше конца сцены. */
export const spotTimed = (b: BuiltScene, spot: Spot) =>
  isBeat(spot.at, b.clock.lines) && (spot.until === undefined || (Number.isInteger(spot.until) && spot.until > spot.at && spot.until <= b.clock.lines))

/** Вердикты сцены в кадрах сцены (для Verdict); с неверной репликой — пропускаются. */
export function sceneVerdict(b: BuiltScene): { at: number; kind: 'wrong' | 'right' }[] {
  return (b.scene.verdict ?? []).filter((v) => isBeat(v.at, b.clock.lines)).map((v) => ({ at: b.clock.beat(v.at), kind: v.kind }))
}

/**
 * Ссылка на книгу в шапке сцены: первый раздел сцены (или главы, или урока: scene.book ?? chapter.book ?? lesson.book), обрезанный «…»
 * по месту рядом с названием главы — все разделы перечисляет итог (Recap); в сцене mistake — пусто, там метки ошибки.
 */
export function sceneBook(lesson: Lesson, b: BuiltScene): string {
  if (b.scene.role === 'mistake') return ''
  const chapter = lesson.chapters[b.chapter]
  const first = (b.scene.book ?? chapter.book ?? lesson.book).find((id) => bookSection(id) !== null)
  return bookRef(first ? [first] : [], Math.max(1, bookRoom(lesson.id, chapter.title)))
}

/** Сколько px справа в шапке занимает сцена: метки ошибки или ссылка на книгу (шапка не даёт названию главы дойти до них). */
export function sceneReserve(lesson: Lesson, b: BuiltScene): number {
  if (b.scene.role === 'mistake') return verdictWidth((b.scene.verdict ?? []).length > 0)
  return [...sceneBook(lesson, b)].length * CELL
}

/**
 * Правая часть шапки на кадре ролика: чья (ссылка на книгу сцены или её метки ошибки), насколько видна и рисуется ли у неё метка
 * «Типичная ошибка» (label). Если у соседних сцен она та же (одна ссылка на книгу), смены нет; иначе в первые полсмены сцены прежняя
 * уходит, во вторые — приходит новая: они не накладываются. Две сцены mistake подряд: метка стоит, уходит только вердикт прежней
 * (вердикт новой появляется на её реплике, позже смены).
 */
export function headerRight(lesson: Lesson, scenes: BuiltScene[], frame: number): { b: BuiltScene; opacity: number; label: boolean }[] {
  const b = sceneAt(scenes, frame)
  const prev = scenes[scenes.indexOf(b) - 1]
  const t = frame - b.start
  const mistake = (s: BuiltScene) => s.scene.role === 'mistake'
  const same = prev && !mistake(b) && !mistake(prev) && sceneBook(lesson, prev) === sceneBook(lesson, b)
  const now = { b, opacity: 1, label: mistake(b) }
  if (!prev || same || t >= MOTION.sceneFade) return [now]
  const half = MOTION.sceneFade / 2
  const out = 1 - easeIn(Math.min(1, t / half))
  if (mistake(prev) && mistake(b)) return [{ b: prev, opacity: out, label: false }, now]
  return [
    { b: prev, opacity: out, label: mistake(prev) },
    { b, opacity: appear(t - half, 0, half), label: mistake(b) },
  ]
}

/** Сцена на кадре ролика: последняя из начавшихся (до начала первой — первая). */
export function sceneAt(scenes: BuiltScene[], frame: number): BuiltScene {
  let found = scenes[0]
  for (const s of scenes) if (s.start <= frame) found = s
  return found
}

/**
 * Смена сцены на кадре сцены frame: сцена проявляется за MOTION.sceneFade кадров, поднимаясь на MOTION.sceneShift px (первая — сразу),
 * а после своего конца столько же кадров уходит вверх и растворяется — поверх неё уже проявляется следующая.
 */
export function sceneFade(frame: number, duration: number, first: boolean): { opacity: number; dy: number } {
  if (frame >= duration) {
    const q = easeIn(Math.min(1, (frame - duration) / MOTION.sceneFade))
    return { opacity: 1 - q, dy: q > 0 ? -MOTION.sceneShift * q : 0 }
  }
  if (first) return { opacity: 1, dy: 0 }
  const p = appear(frame, 0, MOTION.sceneFade)
  return { opacity: p, dy: MOTION.sceneShift * (1 - p) }
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Урок → сценарий ролика и сцены на его шкале. Тайминг — buildScript по сценам всех глав подряд (реплики, PACE), размер 1920 × 1080;
 * главы — с начала своей первой сцены; обложка — середина первой сцены example; пояснения — абсолютные кадры окна и прямоугольник
 * части кадра на экране (toScreen при камере на начале окна).
 */
export function buildLesson(lesson: Lesson, ctx: FrameCtx = lessonCtx(lesson)): { script: VideoScript; scenes: BuiltScene[] } {
  const flat = lesson.chapters.flatMap((c, chapter) => c.scenes.map((scene) => ({ chapter, scene })))
  const built = buildScript(
    lesson.id,
    flat.map(({ scene }) => ({ id: scene.id, lines: scene.lines })),
    () => [],
  )

  // Часы сцены — по её репликам в общем списке (по порядку, а не по id: так повтор id не путает время)
  let start = 0
  let cue = 0
  const scenes = flat.map(({ chapter, scene }, i): BuiltScene => {
    const at = start
    const duration = built.script.scenes[i].durationInFrames
    const cues = built.script.cues.slice(cue, cue + scene.lines.length)
    const clock: Clock = {
      beat(k) {
        const c = Number.isInteger(k) ? cues[k] : undefined
        if (!c) throw new Error(`Нет реплики ${k} в сцене «${scene.id}»`)
        return c.from - at
      },
      duration,
      lines: scene.lines.length,
    }
    start += duration
    cue += scene.lines.length
    return { id: scene.id, chapter, start: at, duration, clock, scene }
  })

  const hotspots: VideoHotspot[] = scenes.flatMap((b) => {
    const spots = (b.scene.spots ?? []).filter((s) => spotTimed(b, s))
    if (spots.length === 0) return []
    const parts = sceneParts(b, ctx)
    const keys = cameraKeys(b, parts)
    return spots.map((spot) => {
      const w = spotWindow(b, spot)
      const r = toScreen(parts[spot.target] ?? { x: 0, y: 0, w: 0, h: 0 }, cameraAt(w.from, keys))
      return { from: b.start + w.from, to: b.start + w.to, x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h), title: spot.title, text: spot.text }
    })
  })

  const chapters: VideoChapter[] = lesson.chapters.flatMap((c, i) => {
    const first = scenes.find((s) => s.chapter === i)
    return first ? [{ from: first.start, title: c.title }] : []
  })
  const example = scenes.find((s) => s.scene.role === 'example')
  const script: VideoScript = {
    id: lesson.id,
    fps: built.script.fps,
    width: 1920,
    height: 1080,
    scenes: built.script.scenes,
    cues: built.script.cues,
    hotspots,
    chapters,
    ...(example ? { poster: example.start + Math.floor(example.duration / 2) } : {}),
  }
  return { script, scenes }
}
