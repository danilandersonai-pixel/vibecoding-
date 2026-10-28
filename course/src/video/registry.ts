import type { ComponentType } from 'react'
import { catalog } from '../../video/catalog'
import type { VideoScript } from '../../video/types'

export type VideoEntry = { script: VideoScript; load: () => Promise<{ default: ComponentType }>; mp4Url?: string }

// Адреса MP4 в хранилище страницы: появляются после загрузки файла (asset: true).
const MP4: Record<string, string> = {
  'pilot-rls': '/_blob/5ea3340db6b998e3a330073140689533',
  'ch-01': '/_blob/50aa85e94a07323d26e4cb1af4350181',
  'ch-02': '/_blob/76fc78494ddccb7c3d5034abaa0600fe',
  'ch-12': '/_blob/8a8c48b028e1e5b878ec70475f43c521',
  'ch-03': '/_blob/4df1b5b2a3e8c7e1fd90cbf52dce110f',
  'ch-06': '/_blob/77fc4f3a878597c7e8dcf806a7f56621',
  'ch-05': '/_blob/2a8cfe0e6be5b6f66410906a95a85626',
  'ch-04': '/_blob/3138337cbf79080352cc6e404418a26f',
  'ch-08': '/_blob/eb2f47ec1257ae3c92efe9a9f2820ed4',
  'ch-09': '/_blob/a45819b90338307a84fd9516673451b3',
  'ch-10': '/_blob/7a3c37358cef7e5763b3ced4eb1f0429',
  'ch-11': '/_blob/70f7e50fd5dc41b419d9b05e2558ca2e',
  'day-08': '/_blob/611549ea3352c6a88b20bc46bb436cab',
  'day-09': '/_blob/ba704cf9fde447213a81f3ea3ddcca86',
  'day-10': '/_blob/1314ebce47ccbd8c73a8fcb3aa3de254',
  'day-11': '/_blob/9f99f5d2ad63f49cc81e4c73a96eb1cd',
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
