export type Cue = { from: number; to: number; text: string }
export type VideoHotspot = { from: number; to: number; x: number; y: number; w: number; h: number; title: string; text: string }
export type VideoScript = {
  id: string
  fps: 30
  width: 1280
  height: 720
  scenes: { id: string; durationInFrames: number }[]
  cues: Cue[]
  hotspots: VideoHotspot[]
}
