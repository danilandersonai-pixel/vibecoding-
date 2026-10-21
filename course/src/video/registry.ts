import type { ComponentType } from 'react'
import { catalog } from '../../video/catalog'
import type { VideoScript } from '../../video/types'

export type VideoEntry = { script: VideoScript; load: () => Promise<{ default: ComponentType }>; mp4Url?: string }

// Адреса MP4 в хранилище страницы: появляются после загрузки файла (asset: true).
const MP4: Record<string, string> = {
  'pilot-rls': '/_blob/08c8f08ad24664e9822024a19eda61ef',
}

// Ролики курса по videoId из блока дня: список берётся из каталога, адреса MP4 — из словаря выше.
export const videos: Record<string, VideoEntry> = Object.fromEntries(
  Object.entries(catalog).map(([id, v]) => [id, { script: v.script, load: v.load, mp4Url: MP4[id] }]),
)
