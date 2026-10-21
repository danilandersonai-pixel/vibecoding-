import type { ComponentType } from 'react'
import { PilotRls } from '../../video/pilot-rls/PilotRls'
import { pilotRlsScript } from '../../video/pilot-rls/script'
import type { VideoScript } from '../../video/types'

export type VideoEntry = { component: ComponentType; script: VideoScript; mp4Url?: string }

// Ролики курса по videoId из блока дня. mp4Url появляется после загрузки файла в хранилище страницы.
export const videos: Record<string, VideoEntry> = {
  'pilot-rls': { component: PilotRls, script: pilotRlsScript, mp4Url: '/_blob/08c8f08ad24664e9822024a19eda61ef' },
}
