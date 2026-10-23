import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { appear, trackAt } from './motion'

// Хуки — тонкие обёртки: кадр берут у Remotion, расчёт — в motion.ts.

/** Плавное появление с кадра at: 0 → 1. */
export function useAppear(at: number, length = 12): number {
  return appear(useCurrentFrame(), at, length)
}

/** Пружинка с кадра at. */
export function usePop(at: number): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - at, fps, config: { damping: 14 } })
}

/** Позиция по ключевым кадрам [кадр, x, y]; до первого и после последнего — стоит. */
export function useTrack(keys: [number, number, number][]): { x: number; y: number } {
  return trackAt(useCurrentFrame(), keys)
}
