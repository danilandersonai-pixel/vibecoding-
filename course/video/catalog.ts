import type { ComponentType } from 'react'
import { ch01Script } from './ch-01/script'
import { ch02Script } from './ch-02/script'
import { ch03Script } from './ch-03/script'
import { ch04Script } from './ch-04/script'
import { ch05Script } from './ch-05/script'
import { ch06Script } from './ch-06/script'
import { ch08Script } from './ch-08/script'
import { ch09Script } from './ch-09/script'
import { ch10Script } from './ch-10/script'
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
  'ch-03': {
    title: 'Проблема 70%',
    kind: 'chapter',
    script: ch03Script,
    load: () => import('./ch-03/Video'),
  },
  'ch-06': {
    title: 'Прототип за вечер',
    kind: 'chapter',
    script: ch06Script,
    load: () => import('./ch-06/Video'),
  },
  'ch-05': {
    title: 'Читать код, который написал ИИ',
    kind: 'chapter',
    script: ch05Script,
    load: () => import('./ch-05/Video'),
  },
  'ch-04': {
    title: 'Что остаётся человеку',
    kind: 'chapter',
    script: ch04Script,
    load: () => import('./ch-04/Video'),
  },
  'ch-08': {
    title: 'Безопасность и надёжность',
    kind: 'chapter',
    script: ch08Script,
    load: () => import('./ch-08/Video'),
  },
  'ch-09': {
    title: 'Этика вайб-кодинга',
    kind: 'chapter',
    script: ch09Script,
    load: () => import('./ch-09/Video'),
  },
  'ch-10': {
    title: 'Фоновые агенты',
    kind: 'chapter',
    script: ch10Script,
    load: () => import('./ch-10/Video'),
  },
}
