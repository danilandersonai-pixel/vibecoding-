// Общие координаты холста 1280×720 ролика дня 20 «Бета-тест: исправления»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

import { theme } from '../theme'

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

// ---- Пример: бета-тестеры и их замечания (продолжение списка дня 19) ----

// Бета-тестеры из дня 19: новые тренеры со стороны (не Марина и Дима)
export const BETA = ['Полина', 'Кирилл', 'Тимур', 'Ксения'] as const

// Четыре строки списка дня 19 — в том же порядке (кто и о чём)
export const DAY19 = [
  { who: 'Полина', id: 'date' },
  { who: 'Кирилл', id: 'phone' },
  { who: 'Тимур', id: 'records' },
  { who: 'Ксения', id: 'save' },
] as const

export type Level = 1 | 2 | 3 | 4

/** Цвет и заливка ступени тяжести: 1 — красный, 2 — жёлтый, 3 — синий, 4 — серый. */
export function levelColor(n: Level): { color: string; fill: string } {
  if (n === 1) return { color: theme.risk, fill: theme.riskTint }
  if (n === 2) return { color: theme.alt, fill: theme.altTint }
  if (n === 3) return { color: theme.accent, fill: theme.accentTint }
  return { color: theme.soft, fill: theme.zone }
}

// Ступени тяжести — решение нашего примера, а не правило книги
export const LEVELS: { n: Level; title: string; sub: string }[] = [
  { n: 1, title: 'данные пропадают', sub: 'или видны чужим' },
  { n: 2, title: 'не даёт работать', sub: 'дело встало' },
  { n: 3, title: 'раздражает', sub: 'но обойти можно' },
  { n: 4, title: 'было бы хорошо', sub: 'новое, подождёт' },
]

export type Remark = { id: string; who: string; text: string; level: Level; fix: string; late?: boolean }

// Замечания в порядке поступления: четыре из списка дня 19 и ещё два, пришедшие за неделю (late)
export const REMARKS: Remark[] = [
  { id: 'date', who: 'Полина', text: 'дата — в «Ещё»', level: 3, fix: 'выбор даты' },
  { id: 'phone', who: 'Кирилл', text: 'пригласить по номеру', level: 4, fix: 'приглашение по номеру' },
  { id: 'records', who: 'Тимур', text: 'рекорды в «Отчётах»', level: 3, fix: 'рекорды у подопечного' },
  { id: 'save', who: 'Ксения', text: 'ошибка сохранения', level: 1, fix: 'сохранение тренировки' },
  { id: 'report', who: 'Кирилл', text: 'отчёт не открывается', level: 2, fix: 'отчёт за неделю', late: true },
  { id: 'export', who: 'Полина', text: 'выгрузка в таблицу', level: 4, fix: 'выгрузка в таблицу', late: true },
]

/** Очередь исправлений: по ступеням сверху вниз, внутри ступени — в порядке поступления. */
export function queue(list: Remark[]): Remark[] {
  return [...list].sort((a, b) => a.level - b.level)
}

// ---- Круг одного исправления (сцена 2, доска 2) ----

// Шаги из отчёта об ошибке (отслеживание ошибок — день 14): так у Ксении пропала тренировка
export const REPRO = {
  steps: ['открыть «Назначить»', 'упражнение не из библиотеки', 'нажать «Сохранить»'],
  expect: 'ждём: тренировка сохранена',
}

/** Модель беды примера: до исправления тренировка с упражнением не из библиотеки не сохраняется. */
export function saves(workout: { newExercise: boolean }, fixed: boolean): boolean {
  return fixed || !workout.newExercise
}

export type TermLine = { text: string; kind: 'cmd' | 'out' | 'ok' | 'err' }
const TEST_NAME = 'тренировка с новым упражнением'
// Тест до исправления — красный, после — зелёный; сам тест тот же
export const TERM_RED: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: `FAIL  ${TEST_NAME}`, kind: 'err' },
  { text: '      ошибка сохранения', kind: 'err' },
]
export const TERM_GREEN: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: `PASS  ${TEST_NAME}`, kind: 'ok' },
  { text: '      1 passed, 0 failed', kind: 'ok' },
]
// Маленький коммит: правка и новый тест (тест остаётся в проекте)
export const FIX_COMMIT = { files: ['правка сохранения', 'новый тест'] }
// Подтверждение Ксении
export const KSENIA_OK = 'Сохранилась, всё на месте'
// Шаги круга — по порядку реплик
export const PIPELINE = ['тест повторяет', 'правим код', 'один коммит', 'выкладка', 'тренер: ✓']

// ---- Подводный камень: всё одним коммитом (сцена 3) ----

export const BIG = { files: 23, adds: 1140, dels: 380, newTests: 0, fixes: REMARKS.map((r) => r.fix) }
// Неделя Полины: дни тренировок (0 — понедельник) до и после большого коммита
export const POLINA_WEEK = { before: [0, 2, 4], after: [1, 3, 5] }
export const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// ---- Сцена 4: что сделать у себя ----

export const TODAY = ['замечания — по ступеням', 'верхнее: шаги до беды', 'тест по шагам — красный', 'агенту: до зелёного теста', 'один коммит и выкладка', 'тренер повторил — дальше']

// ======== Координаты ========

// Сцена 1: неделя бета-теста, четыре тренера, список замечаний
export const S1 = {
  week: { x: 80, y: 118, cell: 46, h: 34, gap: 6 },
  coachY: 330,
  coachX: [120, 240, 360, 480],
  list: { x: 600, y: 92, w: 640, head: 56, row: 50 },
  launch: { x: 1100, y: 512 },
  loopY: 512,
  loopSlot: { x: 70, y: 488, w: 660, h: 48 },
}
export const S1_LIST_H = S1.list.head + REMARKS.length * S1.list.row + 14

// Сцена 2, доска 1: неразобранный список (слева) и четыре ступени (справа)
export const S2 = {
  list: { x: 40, y: 92, w: 430, head: 52, row: 52 },
  lane: { x: 500, w: 740, y: 92, h: 96, step: 110, head: 252 },
  card: { w: 232, h: 72, gap: 10 },
  arrow: { x: 255, y1: 150, y2: 470 },
}
export const S2_LIST_H = S2.list.head + REMARKS.length * S2.list.row + 12
/** Верх ступени i (0 — верхняя). */
export const laneY = (i: number) => S2.lane.y + i * S2.lane.step
/** Левый верхний угол места k (0 или 1) на ступени i. */
export function cardAt(i: number, k: number): { x: number; y: number } {
  return { x: S2.lane.x + S2.lane.head + S2.card.gap + k * (S2.card.w + S2.card.gap), y: laneY(i) + (S2.lane.h - S2.card.h) / 2 }
}
/** Место замечания на лестнице: ступень и номер внутри неё (в порядке поступления). */
export function slotOf(id: string): { lane: number; k: number } {
  const r = REMARKS.find((x) => x.id === id)
  if (!r) throw new Error(`Нет замечания «${id}»`)
  const same = REMARKS.filter((x) => x.level === r.level)
  return { lane: r.level - 1, k: same.indexOf(r) }
}
// Лестница целиком — рамка горячей точки «Очередь по тяжести» (запас 10 px)
export const LADDER_BOX: Rect = { x: S2.lane.x - 10, y: S2.lane.y - 10, w: S2.lane.w + 20, h: 3 * S2.lane.step + S2.lane.h + 20 }

// Сцена 2, доска 2: круг одного исправления
export const B2 = {
  pipe: { x: BOARD2 + 30, y: 92, w: 180, h: 56, gap: 20 },
  test: { x: BOARD2 + 30, y: 178, w: 490, head: 84, row: 42 },
  term: { x: BOARD2 + 550, y: 178, w: 460 },
  caught: { x: BOARD2 + 780, y: 372 },
  commit: { x: BOARD2 + 550, y: 396, w: 460, h: 70 },
  agent: { x: BOARD2 + 1150, y: 250 },
  agentSay: { x: BOARD2 + 1150, y: 384 },
  ksenia: { x: BOARD2 + 80, y: 488 },
  coachSlot: { y: 462, h: 92 },
  okCallout: { x: BOARD2 + 330, y: 500 },
  release: { x: BOARD2 + 780, y: 504 },
  queue: { x: BOARD2 + 1036, y: 462, w: 230, h: 94 },
}
export const TEST_H = B2.test.head + REPRO.steps.length * B2.test.row + 56
/** Левый край шага i круга. */
export const pipeX = (i: number) => B2.pipe.x + i * (B2.pipe.w + B2.pipe.gap)
// Круг целиком: шаги, тест, терминал, коммит, выкладка и Ксения — рамка горячей точки «Круг одного исправления»
// (низ рамки — под подписью Ксении, но выше 565)
export const CYCLE_BOX: Rect = { x: B2.pipe.x - 10, y: B2.pipe.y - 10, w: B2.term.x + B2.term.w - B2.pipe.x + 20, h: 558 - (B2.pipe.y - 10) }

// Сцена 3: чат и агент (слева), большой коммит (середина), что было после выкладки (справа, x 1290–1910)
export const S3 = {
  chat: { x: 50, y: 96, w: 470 },
  agent: { x: 285, y: 430 },
  night: { x: 440, y: 400 },
  commit: { x: 660, y: 92, w: 580, head: 60, stats: 40, row: 42, foot: 52 },
  polina: { x: 1290, y: 92, w: 620, h: 126, cell: 78, gap: 8 },
  polinaCoach: { x: 1336, y: 300 },
  polinaSay: { x: 1560, y: 268 },
  notListed: { x: 1740, y: 316 },
  twoBack: { x: 1740, y: 354 },
  bisect: { x: 1316, y: 432, dx: 56 },
  ksenia: { x: 1840, y: 476 },
  kseniaSay: { x: 1620, y: 474 },
  stayed: { x: 1660, y: 528 },
  bisectSlot: { x: 1290, y: 380, w: 460, h: 76 },
  kseniaSlot: { x: 1500, y: 462, w: 410, h: 94 },
}
export const COMMIT_H = S3.commit.head + S3.commit.stats + BIG.fixes.length * S3.commit.row + S3.commit.foot + 8
/** Базовая линия строки правки i в большом коммите. */
export const commitRowY = (i: number) => S3.commit.y + S3.commit.head + S3.commit.stats + i * S3.commit.row + 28
// Большой коммит — рамка горячей точки «Один коммит на всё»
export const COMMIT_BOX: Rect = { x: S3.commit.x - 10, y: S3.commit.y - 10, w: S3.commit.w + 20, h: COMMIT_H + 20 }

// Сцена 4: что сделать у себя (слева), очередь по ступеням (справа), облако и Кирилл внизу
export const S4 = {
  check: { x: 60, y: 92, head: 52, row: 56 },
  queue: { x: 640, y: 92, w: 600, head: 56, row: 46 },
  cloud: { x: 640, y: 452, w: 340, h: 104 },
  kirill: { x: 1216, y: 494 },
  kirillSay: { x: 1072, y: 480 },
}
export const CHECK_H = S4.check.head + TODAY.length * S4.check.row + 8
export const QUEUE_H = S4.queue.head + REMARKS.length * S4.queue.row + 12
// Чек-лист целиком — рамка горячей точки «Проверьте у себя»
export const CHECK_BOX: Rect = { x: S4.check.x - 10, y: S4.check.y - 10, w: 540, h: CHECK_H + 20 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: неделя и четыре тренера крупнее, пока списка нет
  s1close: { x: 300, y: 290, zoom: 1.3 },
  // сцена 2: неразобранный список крупнее, пока ступеней нет
  s2list: { x: 255, y: 300, zoom: 1.15 },
  // сцена 3: чат и агент крупнее, пока коммита нет
  s3chat: { x: 300, y: 320, zoom: 1.2 },
  // сцена 3: большой коммит слева, что было после выкладки — справа
  s3after: { x: 1280, y: 360, zoom: 1 },
  // сцена 4: что сделать у себя крупнее, пока очереди нет
  s4check: { x: 330, y: 300, zoom: 1.15 },
} as const
