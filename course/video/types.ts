export type Cue = { from: number; to: number; text: string }
export type VideoHotspot = { from: number; to: number; x: number; y: number; w: number; h: number; title: string; text: string }
/** Глава ролика: с какого кадра начинается и как называется (полоса перемотки и список глав в плеере). */
export type VideoChapter = { from: number; title: string }
export type VideoScript = {
  id: string
  fps: 30
  /** Старые ролики — 1280 × 720, ролики набора «Репозиторий» — 1920 × 1080. */
  width: 1280 | 1920
  height: 720 | 1080
  scenes: { id: string; durationInFrames: number }[]
  cues: Cue[]
  hotspots: VideoHotspot[]
  /** Главы по возрастанию from, первая — с кадра 0; у старых роликов глав нет. */
  chapters?: VideoChapter[]
  /** Кадр обложки; без него обложка — начало первой горячей точки. */
  poster?: number
}
