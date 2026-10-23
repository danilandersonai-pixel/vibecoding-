import type { VideoScript } from '../types'
import { sceneStart, totalFrames, validateScript } from '../lib/timeline'
import { cameraAt, TRANSITION_FRAMES, type CameraKey, type Transition } from './camera'

// Нормы ролика: длина в кадрах, число сцен, горячих точек не меньше.
const NORMS = {
  chapter: { frames: [5400, 8100], scenes: [5, 7], hotspots: 2 },
  day: { frames: [1800, 5400], scenes: [3, 4], hotspots: 1 },
} as const

const MAX_CPS = 15 // знаков в секунду — быстрее реплику не прочитать и не озвучить

// Проверка сценария ролика: пустой массив — всё в порядке; каждая проблема — одна понятная строка.
export function scriptProblems(script: VideoScript, kind: 'chapter' | 'day'): string[] {
  const norm = NORMS[kind]
  const problems = validateScript(script)

  const frames = totalFrames(script)
  if (frames < norm.frames[0] || frames > norm.frames[1]) {
    problems.push(`Ролик длится ${frames} кадров, нужно ${norm.frames[0]}–${norm.frames[1]}`)
  }
  if (script.scenes.length < norm.scenes[0] || script.scenes.length > norm.scenes[1]) {
    problems.push(`Сцен ${script.scenes.length}, нужно ${norm.scenes[0]}–${norm.scenes[1]}`)
  }

  const bounds = script.scenes.map((s) => {
    const from = sceneStart(script, s.id)
    return { id: s.id, from, to: from + s.durationInFrames }
  })
  const inside = (b: { from: number; to: number }, c: { from: number; to: number }) => c.from >= b.from && c.to <= b.to
  for (const b of bounds) {
    if (!script.cues.some((c) => inside(b, c))) problems.push(`В сцене «${b.id}» нет реплик`)
  }
  for (const c of script.cues) {
    if (!bounds.some((b) => inside(b, c))) problems.push(`Реплика «${c.text}» выходит за границы своей сцены`)
    if (c.to > c.from) {
      const cps = c.text.length / ((c.to - c.from) / script.fps)
      if (cps > MAX_CPS) problems.push(`Реплика «${c.text}» идёт быстрее ${MAX_CPS} знаков в секунду (${Math.round(cps)})`)
    }
  }

  if (script.hotspots.length < norm.hotspots) {
    problems.push(`Горячих точек ${script.hotspots.length}, нужно не меньше ${norm.hotspots}`)
  }
  for (const h of script.hotspots) {
    if (h.x < 0 || h.y < 0 || h.x + h.w > script.width || h.y + h.h > script.height) {
      problems.push(`Зона «${h.title}» выходит за кадр`)
    }
  }
  return problems
}

/** Плашка субтитров в две строки начинается около y = 575: всё содержимое кадра — выше 565. */
const CONTENT_BOTTOM = 565

const MIN_WINDOW = 90 // кадров: горячую точку успевают заметить и нажать

type Staging = Record<string, { transition: Transition; camera: CameraKey[] }>

const spot = (c: { x: number; y: number; zoom: number }) => `${c.x} ${c.y} ${c.zoom}`

// Проверка переходов, камеры и окон горячих точек (STAGING ролика): пустой массив — всё в порядке.
// Рамка точки в script.hotspots уже в координатах кадра: её считают через toScreen от камеры в начале окна.
export function stagingProblems(script: VideoScript, staging: Staging): string[] {
  const problems: string[] = []

  for (const s of script.scenes) {
    const entry = staging[s.id]
    if (!entry) {
      problems.push(`У сцены «${s.id}» нет записи staging: переход и камера не заданы`)
      continue
    }
    if (!['fade', 'slide', 'zoom'].includes(entry.transition)) problems.push(`У сцены «${s.id}» неизвестный переход «${entry.transition}»`)
    if (new Set(entry.camera.map(spot)).size < 2) problems.push(`Камера в сцене «${s.id}» не двигается`)
    entry.camera.forEach((k, i) => {
      if (i > 0 && k.at < entry.camera[i - 1].at) problems.push(`Ключи камеры в сцене «${s.id}» идут не по порядку (ключ ${i})`)
      if (k.at > s.durationInFrames) problems.push(`Ключ камеры ${i} в сцене «${s.id}» лежит за её концом`)
    })
  }

  for (const h of script.hotspots) {
    const scene = script.scenes.find((s) => {
      const start = sceneStart(script, s.id)
      return h.from >= start && h.to <= start + s.durationInFrames
    })
    if (!scene) {
      problems.push(`Окно точки «${h.title}» не лежит целиком внутри одной сцены`)
    } else {
      const start = sceneStart(script, scene.id)
      const end = start + scene.durationInFrames
      if (h.from - start < TRANSITION_FRAMES) problems.push(`Окно точки «${h.title}» попадает в переход сцены «${scene.id}»: начинается на ${h.from - start}-м кадре сцены, а появление идёт первые ${TRANSITION_FRAMES}`)
      if (end - h.to < TRANSITION_FRAMES) problems.push(`Окно точки «${h.title}» попадает в переход сцены «${scene.id}»: кончается за ${end - h.to} кадров до конца сцены, а уход идёт последние ${TRANSITION_FRAMES}`)
      const keys = staging[scene.id]?.camera
      if (keys) {
        const still = cameraAt(h.from - start, keys)
        for (let f = h.from; f < h.to; f++) {
          const cam = cameraAt(f - start, keys)
          if (cam.x !== still.x || cam.y !== still.y || cam.zoom !== still.zoom) {
            problems.push(`Камера в сцене «${scene.id}» двигается в окне точки «${h.title}» (кадр ${f})`)
            break
          }
        }
      }
    }
    if (h.to - h.from < MIN_WINDOW) problems.push(`Окно точки «${h.title}» короче ${MIN_WINDOW} кадров (${h.to - h.from})`)
    if (h.x < 0 || h.y < 0 || h.x + h.w > script.width || h.y + h.h > script.height) problems.push(`Рамка точки «${h.title}» выходит за кадр`)
    else if (h.y + h.h > CONTENT_BOTTOM) problems.push(`Рамка точки «${h.title}» ниже y = ${CONTENT_BOTTOM}: там субтитры`)
  }
  return problems
}
