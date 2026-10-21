import type { ComponentType } from 'react'
import { chAbcScript } from './ch-abc/script'
import { pilotRlsScript } from './pilot-rls/script'
import type { VideoScript } from './types'

export type CatalogEntry = {
  title: string
  kind: 'chapter' | 'day'
  script: VideoScript
  load: () => Promise<{ default: ComponentType }>
}

// Единый список роликов: ключ = id ролика = id сценария = id композиции Remotion.
// Код сцен грузится лениво (load), сценарий лёгкий и лежит в основном файле сайта.
export const catalog: Record<string, CatalogEntry> = {
  'pilot-rls': {
    title: 'Почему тренер не увидит чужих подопечных',
    kind: 'chapter',
    script: pilotRlsScript,
    load: () => import('./pilot-rls/PilotRls'),
  },
  'ch-abc': {
    title: 'Как устроено приложение',
    kind: 'chapter',
    script: chAbcScript,
    load: () => import('./ch-abc/Video'),
  },
}
