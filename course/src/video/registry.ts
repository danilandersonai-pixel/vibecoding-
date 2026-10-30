import type { ComponentType } from 'react'
import { catalog } from '../../video/catalog'
import type { VideoScript } from '../../video/types'

export type VideoEntry = { script: VideoScript; load: () => Promise<{ default: ComponentType }>; mp4Url?: string }

// Адреса MP4 в хранилище страницы: появляются после загрузки файла (asset: true).
const MP4: Record<string, string> = {
  'day-12': '/_blob/79ed9a0bce8c6f49f79d3270f6301a01',
  'day-13': '/_blob/219fe9551a5b6d7e48554531cd5a5f84',
  'day-14': '/_blob/43b6894c26626b7ca3fc76986244061a',
  'day-15': '/_blob/e93fd80dfbb889e0f8ab9291a9b9b851',
  'day-16': '/_blob/5e2b97c2500ec3ab1179b3282bf77f46',
  'day-17': '/_blob/34e0af245680e308af93d8d85c1765da',
  'day-18': '/_blob/bbe9ad529342576f3b236a8c33ff88ea',
  'day-19': '/_blob/40bc4a3ad063d0f8e2517ba5da0cc4c1',
  'day-20': '/_blob/57c626b91ebf74cf4ee2f9b774be8456',
  'day-21': '/_blob/f9ec61423c0a918e7117913e1f4baf49',
}

// Ролики курса по videoId из блока дня: список берётся из каталога, адреса MP4 — из словаря выше.
export const videos: Record<string, VideoEntry> = Object.fromEntries(
  Object.entries(catalog).map(([id, v]) => [id, { script: v.script, load: v.load, mp4Url: MP4[id] }]),
)
