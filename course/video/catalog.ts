import type { ComponentType } from 'react'
import { day10Script } from './day-10/script'
import { day11Script } from './day-11/script'
import { day12Script } from './day-12/script'
import { day13Script } from './day-13/script'
import { day14Script } from './day-14/script'
import { day15Script } from './day-15/script'
import { day16Script } from './day-16/script'
import { day17Script } from './day-17/script'
import { day18Script } from './day-18/script'
import { day19Script } from './day-19/script'
import { day20Script } from './day-20/script'
import { day21Script } from './day-21/script'
import { ch01Script } from './lessons/ch-01/script'
import { ch02Script } from './lessons/ch-02/script'
import { ch03Script } from './lessons/ch-03/script'
import { ch04Script } from './lessons/ch-04/script'
import { ch05Script } from './lessons/ch-05/script'
import { ch06Script } from './lessons/ch-06/script'
import { ch08Script } from './lessons/ch-08/script'
import { ch09Script } from './lessons/ch-09/script'
import { ch10Script } from './lessons/ch-10/script'
import { ch11Script } from './lessons/ch-11/script'
import { ch12Script } from './lessons/ch-12/script'
import { chAbcScript } from './lessons/ch-abc/script'
import { day08Script } from './lessons/day-08/script'
import { day09Script } from './lessons/day-09/script'
import { pilotRlsScript } from './lessons/pilot-rls/script'
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
    load: () => import('./lessons/pilot-rls/Video'),
  },
  'ch-abc': {
    title: 'Как устроено приложение',
    kind: 'chapter',
    script: chAbcScript,
    load: () => import('./lessons/ch-abc/Video'),
  },
  'ch-01': {
    title: 'Вайб-кодинг: шкала, а не выключатель',
    kind: 'chapter',
    script: ch01Script,
    load: () => import('./lessons/ch-01/Video'),
  },
  'ch-02': {
    title: 'Как говорить с ИИ, чтобы он понял',
    kind: 'chapter',
    script: ch02Script,
    load: () => import('./lessons/ch-02/Video'),
  },
  'ch-12': {
    title: 'Своё приложение по образцу',
    kind: 'chapter',
    script: ch12Script,
    load: () => import('./lessons/ch-12/Video'),
  },
  'ch-03': {
    title: 'Проблема 70%',
    kind: 'chapter',
    script: ch03Script,
    load: () => import('./lessons/ch-03/Video'),
  },
  'ch-06': {
    title: 'Прототип за вечер',
    kind: 'chapter',
    script: ch06Script,
    load: () => import('./lessons/ch-06/Video'),
  },
  'ch-05': {
    title: 'Читать код, который написал ИИ',
    kind: 'chapter',
    script: ch05Script,
    load: () => import('./lessons/ch-05/Video'),
  },
  'ch-04': {
    title: 'Что остаётся человеку',
    kind: 'chapter',
    script: ch04Script,
    load: () => import('./lessons/ch-04/Video'),
  },
  'ch-08': {
    title: 'Безопасность и надёжность',
    kind: 'chapter',
    script: ch08Script,
    load: () => import('./lessons/ch-08/Video'),
  },
  'ch-09': {
    title: 'Этика вайб-кодинга',
    kind: 'chapter',
    script: ch09Script,
    load: () => import('./lessons/ch-09/Video'),
  },
  'ch-10': {
    title: 'Фоновые агенты',
    kind: 'chapter',
    script: ch10Script,
    load: () => import('./lessons/ch-10/Video'),
  },
  'ch-11': {
    title: 'Что дальше',
    kind: 'chapter',
    script: ch11Script,
    load: () => import('./lessons/ch-11/Video'),
  },
  'day-08': {
    title: 'Отзывы и фоновые агенты',
    kind: 'day',
    script: day08Script,
    load: () => import('./lessons/day-08/Video'),
  },
  'day-09': {
    title: 'Программы тренировок',
    kind: 'day',
    script: day09Script,
    load: () => import('./lessons/day-09/Video'),
  },
  'day-10': {
    title: 'Рекорды и отчёты',
    kind: 'day',
    script: day10Script,
    load: () => import('./day-10/Video'),
  },
  'day-11': {
    title: 'Комментарии и уведомления',
    kind: 'day',
    script: day11Script,
    load: () => import('./day-11/Video'),
  },
  'day-12': {
    title: 'Приглашение по ссылке',
    kind: 'day',
    script: day12Script,
    load: () => import('./day-12/Video'),
  },
  'day-13': {
    title: 'Своё отличие',
    kind: 'day',
    script: day13Script,
    load: () => import('./day-13/Video'),
  },
  'day-14': {
    title: 'Надёжность',
    kind: 'day',
    script: day14Script,
    load: () => import('./day-14/Video'),
  },
  'day-15': {
    title: 'Первое знакомство и полировка',
    kind: 'day',
    script: day15Script,
    load: () => import('./day-15/Video'),
  },
  'day-16': {
    title: 'Питание',
    kind: 'day',
    script: day16Script,
    load: () => import('./day-16/Video'),
  },
  'day-17': {
    title: 'Замеры и фото прогресса',
    kind: 'day',
    script: day17Script,
    load: () => import('./day-17/Video'),
  },
  'day-18': {
    title: 'Тренировка без интернета',
    kind: 'day',
    script: day18Script,
    load: () => import('./day-18/Video'),
  },
  'day-19': {
    title: 'Бета-тест: запуск',
    kind: 'day',
    script: day19Script,
    load: () => import('./day-19/Video'),
  },
  'day-20': {
    title: 'Бета-тест: исправления',
    kind: 'day',
    script: day20Script,
    load: () => import('./day-20/Video'),
  },
  'day-21': {
    title: 'Запуск',
    kind: 'day',
    script: day21Script,
    load: () => import('./day-21/Video'),
  },
}
