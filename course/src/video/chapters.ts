import type { VideoChapter } from '../../video/types'

// «м:сс» — целые секунды, прошедшие с начала: так время показывают и панель, и список глав
export function clock(frame: number, fps: number): string {
  const s = Math.floor(frame / fps)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Номер главы, в которой лежит кадр: последняя из начавшихся не позже него (кадр начала главы — уже в ней).
// Главы идут по возрастанию from; кадр раньше первой главы относим к первой. Глав нет — -1.
export function chapterIndexAt(chapters: VideoChapter[], frame: number): number {
  let at = chapters.length > 0 ? 0 : -1
  chapters.forEach((c, i) => {
    if (c.from <= frame) at = i
  })
  return at
}
