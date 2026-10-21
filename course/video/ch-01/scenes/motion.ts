import { Easing, interpolate } from 'remotion'

// Чистые функции движения от номера кадра (не хуки: их можно звать в циклах и условиях).

/** Значение interpolate не выходит за края диапазона. */
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Появление 0 → 1 с кадра at за length кадров. */
export function appear(frame: number, at: number, length = 12): number {
  return interpolate(frame, [at, at + length], [0, 1], clamp)
}

/** Позиция по ключам [кадр, x, y] с плавным разгоном и торможением — как useTrack, но для любого кадра. */
export function trackAt(frame: number, keys: [number, number, number][]): { x: number; y: number } {
  const opts = { ...clamp, easing: Easing.inOut(Easing.cubic) }
  const f = keys.map((k) => k[0])
  return { x: interpolate(frame, f, keys.map((k) => k[1]), opts), y: interpolate(frame, f, keys.map((k) => k[2]), opts) }
}
