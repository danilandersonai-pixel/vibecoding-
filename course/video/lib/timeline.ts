import type { VideoScript } from '../types'

export function totalFrames(s: VideoScript): number {
  return s.scenes.reduce((sum, sc) => sum + sc.durationInFrames, 0)
}

export function sceneStart(s: VideoScript, sceneId: string): number {
  const i = s.scenes.findIndex((sc) => sc.id === sceneId)
  if (i < 0) throw new Error(`Нет сцены «${sceneId}»`)
  return s.scenes.slice(0, i).reduce((sum, sc) => sum + sc.durationInFrames, 0)
}

// Проверка сценария: пустой массив — ошибок нет; каждая ошибка — одна понятная строка.
export function validateScript(s: VideoScript): string[] {
  const end = totalFrames(s)
  const errors: string[] = []
  const cues = [...s.cues].sort((a, b) => a.from - b.from)
  cues.forEach((c, i) => {
    if (c.to <= c.from) errors.push(`Реплика «${c.text}»: конец (${c.to}) не позже начала (${c.from})`)
    else if (c.to > end) errors.push(`Реплика «${c.text}» выходит за конец ролика (${c.to} > ${end})`)
    const next = cues[i + 1]
    if (next && next.from < c.to) errors.push(`Реплики «${c.text}» и «${next.text}» пересекаются`)
  })
  for (const h of s.hotspots) {
    if (h.to <= h.from) errors.push(`Зона «${h.title}»: конец (${h.to}) не позже начала (${h.from})`)
    else if (h.to > end) errors.push(`Зона «${h.title}» выходит за конец ролика (${h.to} > ${end})`)
  }
  return errors
}
