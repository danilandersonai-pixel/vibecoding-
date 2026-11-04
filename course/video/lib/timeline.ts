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
  // Главы: первая с кадра 0, дальше по возрастанию, каждая начинается до конца ролика
  const chapters = s.chapters ?? []
  chapters.forEach((c, i) => {
    const prev = chapters[i - 1]
    if (i === 0 && c.from !== 0) errors.push(`Первая глава «${c.title}» начинается с кадра ${c.from}, а должна — с кадра 0`)
    if (prev && c.from <= prev.from) errors.push(`Глава «${c.title}» (кадр ${c.from}) начинается не позже предыдущей «${prev.title}» (кадр ${prev.from})`)
    if (c.from >= end) errors.push(`Глава «${c.title}» начинается за концом ролика (${c.from} ≥ ${end})`)
  })
  if (s.poster !== undefined && !(Number.isInteger(s.poster) && s.poster >= 0 && s.poster < end)) {
    errors.push(`Обложка — кадр ${s.poster}, а в ролике кадры 0…${end - 1}`)
  }
  return errors
}
