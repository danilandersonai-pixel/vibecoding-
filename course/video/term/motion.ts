import { FPS, MOTION } from './theme'

// Движение кадров «Репозиторий»: чистые функции от номера кадра, не хуки — их можно звать в циклах и условиях.

/** Кубическая кривая Безье как в CSS cubic-bezier(x1, y1, x2, y2): время 0…1 → прогресс 0…1. Без пакетов: x(s) решается методом Ньютона, а при плоском месте — делением пополам. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (s: number) => ((ax * s + bx) * s + cx) * s
  const y = (s: number) => ((ay * s + by) * s + cy) * s
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx

  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 8; i++) {
      const err = x(s) - t
      if (Math.abs(err) < 1e-7) return y(s)
      const slope = dx(s)
      if (Math.abs(slope) < 1e-6) break
      s = Math.min(1, Math.max(0, s - err / slope))
    }
    let lo = 0
    let hi = 1
    s = t
    for (let i = 0; i < 40 && Math.abs(x(s) - t) >= 1e-7; i++) {
      if (x(s) < t) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return y(s)
  }
}

/** Появление: cubic-bezier(.16, 1, .3, 1) — быстро в начале, мягко в конце. */
export const easeOut = cubicBezier(0.16, 1, 0.3, 1)
/** Уход: cubic-bezier(.5, 0, .75, 0) — медленно в начале, быстро в конце. */
export const easeIn = cubicBezier(0.5, 0, 0.75, 0)

/** Появление с кадра at за len кадров (по умолчанию MOTION.appear): 0 → 1, уже с ease-out. */
export function appear(frame: number, at: number, len: number = MOTION.appear): number {
  return easeOut((frame - at) / len)
}

/** Сколько знаков text набрано к кадру frame, если набор начался на кадре at: MOTION.typeCps знаков в секунду. Знаки — Unicode, а не кодовые единицы. */
export function typedCount(text: string, frame: number, at: number): number {
  const n = Math.floor(((frame - at) * MOTION.typeCps) / FPS)
  return Math.min([...text].length, Math.max(0, n))
}

/** За сколько кадров набирается text: к кадру at + typedFrames(text) набрано всё. */
export function typedFrames(text: string): number {
  return Math.ceil(([...text].length * FPS) / MOTION.typeCps)
}
