import type { ComponentType } from 'react'
import { catalog } from '../../video/catalog'
import type { VideoScript } from '../../video/types'

export type VideoEntry = { script: VideoScript; load: () => Promise<{ default: ComponentType }>; mp4Url?: string }

// Адреса MP4 в хранилище страницы: появляются после загрузки файла (asset: true).
const MP4: Record<string, string> = {
  'day-19': '/_blob/40bc4a3ad063d0f8e2517ba5da0cc4c1',
  'day-20': '/_blob/57c626b91ebf74cf4ee2f9b774be8456',
  'day-21': '/_blob/f9ec61423c0a918e7117913e1f4baf49',
}

// Ролики курса по videoId из блока дня: список берётся из каталога, адреса MP4 — из словаря выше.
export const videos: Record<string, VideoEntry> = Object.fromEntries(
  Object.entries(catalog).map(([id, v]) => [id, { script: v.script, load: v.load, mp4Url: MP4[id] }]),
)
