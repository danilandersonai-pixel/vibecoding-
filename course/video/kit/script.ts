import type { Cue, VideoHotspot, VideoScript } from '../types'

// Сценарий ролика в темпе «живее»: тайминги считаются из длины реплик,
// а анимации сцен привязаны к началу реплик (beat), поэтому правка текста
// не рассинхронизирует картинку и субтитры.

const FPS = 30

export const PACE = {
  cps: 14, // знаков в секунду — темп чтения субтитров и синтеза речи
  lead: 0.3, // пауза перед первой репликой сцены, с
  gap: 0.25, // пауза между репликами, с
  tail: 1, // пауза после последней реплики сцены, с
  minCue: 2.2, // самая короткая реплика, с
}

export type SceneDef = { id: string; lines: string[] }

export type Timing = {
  /** Кадр (от начала сцены), на котором начинается реплика i сцены. */
  beat(sceneId: string, i: number): number
  /** Кадр сцены → кадр всего ролика. */
  abs(sceneId: string, frame: number): number
  /** Кадр ролика, на котором сцена заканчивается. */
  sceneEnd(sceneId: string): number
}

export type Built = Timing & { script: VideoScript; sceneIds: string[] }

function lineSeconds(text: string): number {
  return Math.max(PACE.minCue, text.length / PACE.cps + 0.4)
}

export function buildScript(id: string, defs: SceneDef[], hotspots: (t: Timing) => VideoHotspot[]): Built {
  const scenes: VideoScript['scenes'] = []
  const cues: Cue[] = []
  const info = new Map<string, { start: number; duration: number; beats: number[] }>()
  let start = 0
  for (const def of defs) {
    let t = PACE.lead
    const beats: number[] = []
    for (const text of def.lines) {
      const dur = lineSeconds(text)
      const from = start + Math.round(t * FPS)
      beats.push(from - start)
      cues.push({ from, to: start + Math.round((t + dur) * FPS), text })
      t += dur + PACE.gap
    }
    const durationInFrames = Math.round((t - PACE.gap + PACE.tail) * FPS)
    scenes.push({ id: def.id, durationInFrames })
    info.set(def.id, { start, duration: durationInFrames, beats })
    start += durationInFrames
  }

  const scene = (sceneId: string) => {
    const s = info.get(sceneId)
    if (!s) throw new Error(`Нет сцены «${sceneId}»`)
    return s
  }
  const timing: Timing = {
    beat(sceneId, i) {
      const b = scene(sceneId).beats[i]
      if (b === undefined) throw new Error(`Нет реплики ${i} в сцене «${sceneId}»`)
      return b
    },
    abs: (sceneId, frame) => scene(sceneId).start + frame,
    sceneEnd: (sceneId) => scene(sceneId).start + scene(sceneId).duration,
  }

  const script: VideoScript = { id, fps: FPS, width: 1280, height: 720, scenes, cues, hotspots: hotspots(timing) }
  return { ...timing, script, sceneIds: defs.map((d) => d.id) }
}
