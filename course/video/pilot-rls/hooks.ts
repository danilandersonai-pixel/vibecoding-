import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

/** Плавное появление с кадра at: 0 → 1. */
export function useAppear(at: number, length = 12): number {
  const frame = useCurrentFrame()
  return interpolate(frame, [at, at + length], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

/** Пружинка с кадра at. */
export function usePop(at: number): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - at, fps, config: { damping: 14 } })
}

/** Позиция по ключевым кадрам [кадр, x, y]; до первого и после последнего — стоит. */
export function useTrack(keys: [number, number, number][]): { x: number; y: number } {
  const frame = useCurrentFrame()
  const frames = keys.map((k) => k[0])
  const opts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) } as const
  return { x: interpolate(frame, frames, keys.map((k) => k[1]), opts), y: interpolate(frame, frames, keys.map((k) => k[2]), opts) }
}
