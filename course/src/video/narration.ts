import type { Cue } from '../../video/types'

const MAX_STEP = 15

// Реплика, чьё начало пересекли при обычном воспроизведении. Перемотка и скачки — молчание.
export function cueStarting(prevFrame: number, frame: number, cues: Cue[]): Cue | null {
  if (frame <= prevFrame || frame - prevFrame > MAX_STEP) return null
  return cues.find((c) => c.from > prevFrame && c.from <= frame) ?? null
}

export function pickRussianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null
}
