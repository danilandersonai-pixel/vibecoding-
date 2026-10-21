// Постепенное появление: чистые функции от номера кадра, без React.

const FPS = 30

/** Набранная к кадру часть строки; cps — знаков в секунду (кадров в секунду 30). */
export function typed(text: string, frame: number, start: number, cps = 30): string {
  const chars = Math.floor(((frame - start) * cps) / FPS)
  return text.slice(0, Math.max(0, chars))
}

/** Сколько элементов уже показано (0…total): первый — на кадре start, дальше по одному каждые every кадров. */
export function revealCount(frame: number, start: number, every: number, total: number): number {
  if (frame < start || total <= 0) return 0
  if (every <= 0) return total
  return Math.min(total, Math.floor((frame - start) / every) + 1)
}

/** Рост 0…1 с плавным стартом и финишем (smoothstep) на кадрах start…start + length. */
export function grow(frame: number, start: number, length: number): number {
  if (length <= 0) return frame >= start ? 1 : 0
  const t = Math.min(1, Math.max(0, (frame - start) / length))
  return t * t * (3 - 2 * t)
}
