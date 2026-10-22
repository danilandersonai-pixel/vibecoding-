import { Easing, interpolate } from 'remotion'

// Чистые функции движения от номера кадра: не хуки, их можно звать в циклах и условиях.

/** Значение interpolate не выходит за края диапазона. */
export const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Плавное появление с кадра at за length кадров: 0 → 1. */
export function appear(frame: number, at: number, length = 12): number {
  return interpolate(frame, [at, at + length], [0, 1], CLAMP)
}

/** Позиция по ключевым кадрам [кадр, x, y] с плавным разгоном и торможением; до первого и после последнего — стоит. */
export function trackAt(frame: number, keys: [number, number, number][]): { x: number; y: number } {
  const frames = keys.map((k) => k[0])
  const opts = { ...CLAMP, easing: Easing.inOut(Easing.cubic) }
  return { x: interpolate(frame, frames, keys.map((k) => k[1]), opts), y: interpolate(frame, frames, keys.map((k) => k[2]), opts) }
}
