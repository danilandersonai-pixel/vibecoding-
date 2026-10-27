// «Хеш коммита» пройденного дня на карте: 7 знаков, как короткий хеш git. Считается из дня и времени,
// когда день засчитан, — у каждого ученика свой и не меняется, пока день не пройден заново (FNV-1a, 32 бита).
export function commitHash(dayId: string, completedAt: string | undefined): string {
  const text = `${dayId}@${completedAt ?? ''}`
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0').slice(0, 7)
}
