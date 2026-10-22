import type { ComponentType } from 'react'
import { ch01Script } from './ch-01/script'
import { ch02Script } from './ch-02/script'
import { ch12Script } from './ch-12/script'
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
  'ch-01': {
    title: 'Вайб-кодинг: шкала, а не выключатель',
    kind: 'chapter',
    script: ch01Script,
    load: () => import('./ch-01/Video'),
  },
  'ch-02': {
    title: 'Как говорить с ИИ, чтобы он понял',
    kind: 'chapter',
    script: ch02Script,
    load: () => import('./ch-02/Video'),
  },
  'ch-12': {
    title: 'Своё приложение по образцу',
    kind: 'chapter',
    script: ch12Script,
    load: () => import('./ch-12/Video'),
  },
}
