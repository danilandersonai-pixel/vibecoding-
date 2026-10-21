import type { VideoScript } from '../types'
import { sceneStart, totalFrames, validateScript } from '../lib/timeline'

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
