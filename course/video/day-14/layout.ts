// Общие координаты холста 1280×720 ролика дня 14 «Надёжность»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — правее кадра (с x = BOARD2):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1480

type Rect = { x: number; y: number; w: number; h: number }

// ---- Пример: числа и даты (все — пример ролика, а не данные книги) ----

// Список подопечных Марины: 20 человек. N+1 — один запрос за списком и по одному за каждым.
export const CLIENTS = 20
export const REQUESTS = { before: 1 + CLIENTS, after: 2 }
// Замер, секунд: до правки и после
export const SPEED = { before: 3.8, after: 0.4 }
export const secText = (s: number) => `${String(s).replace('.', ',')} с`

// Даты примера: «сегодня» 24.10; вчерашняя тренировка Анны; копии — от свежей к старой
export const TODAY = '24.10'
export const ANNA_LAST = '23.10'
export const COPIES = ['15.10', '14.10', '13.10']
export const FRESH_COPY = '24.10'
// Сколько длилось пробное восстановление в примере, минут
export const RESTORE_MIN = 25

/** Дней от даты a до даты b («дд.мм», один год). */
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => {
    const [d, m] = s.split('.').map(Number)
    return Date.UTC(2026, m - 1, d)
  }
  return Math.round((t(b) - t(a)) / 86_400_000)
}

// Отчёт отслеживания ошибок: метка и значение строки; mono — код
export const REPORT: { tag: string; text: string; mono?: boolean }[] = [
  { tag: 'ошибка', text: 'TypeError: exercise is undefined', mono: true },
  { tag: 'где', text: 'at saveSet (sets.ts:41)', mono: true },
  { tag: 'экран', text: 'Запись подхода' },
  { tag: 'шаги', text: 'выпады → «Сохранить»' },
  { tag: 'кто', text: 'подопечная №17 · 24.10, 19:05' },
  { tag: 'версия', text: 'от 23.10' },
]

// Пирамида тестов сверху вниз (s34, рис. 5.7)
export const PYRAMID = [
  { name: 'сквозные', text: 'сквозные · Playwright' },
  { name: 'интеграционные', text: 'интеграционные · права доступа' },
  { name: 'модульные', text: 'модульные · расчёты · Vitest' },
]

// ---- Сцена 1: приложение — крыша, надёжность — колонны под ней ----

export const S1 = {
  roof: { x: 330, y: 118, w: 620, h: 64, apex: 72 },
  week: { x: 650, y: 134, cell: 34, h: 32, gap: 5 },
  cols: { x: 350, gap: 28, w: 124, top: 196, bottom: 440 },
  base: { x: 330, y: 440, w: 620, h: 34 },
  marina: { x: 200, y: 330 },
  anna: { x: 1080, y: 330 },
}
export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const COLUMNS = ['Тесты', 'Скорость', 'Ошибки', 'Копии']
export const colX = (i: number) => S1.cols.x + i * (S1.cols.w + S1.cols.gap)

// ---- Сцена 2: тесты и скорость (доска 1), ошибки и копии (доска 2) ----

export const S2 = {
  // тесты: телефон Анны → график у Марины, сквозной тест над ними, пирамида снизу
  runner: { x: 330, y: 92 },
  phone: { x: 112, y: 236 },
  chart: { x: 240, y: 120, w: 380, h: 226 },
  pyramid: { cx: 330, top: 384, tier: 50, gap: 7, apex: 200, base: 560 },
  // скорость: список подопечных, замер, база, агент
  list: { x: 680, y: 120, w: 300, h: 340 },
  timer: { x: 916, y: 98 },
  measure: { x: 1010, y: 120, w: 230, h: 190 },
  db: { x: 1125, y: 410 },
  agent: { x: 1010, y: 500 },
  vague: { x: 830, y: 500 },
  // ошибки (доска 2): телефон Анны, отчёт, агент
  phone2: { x: BOARD2 + 110, y: 250 },
  report: { x: BOARD2 + 220, y: 96, w: 500, h: 330 },
  agent2: { x: BOARD2 + 590, y: 496 },
  whole: { x: BOARD2 + 330, y: 500 },
  // копии (доска 2): рабочая база → каждую ночь → хранилище; агенту доступа нет
  db2: { x: BOARD2 + 850, y: 270 },
  vault: { x: BOARD2 + 1020, y: 150, w: 210, h: 230 },
  noAccess: { y: 496 },
}
export const REPORT_HEAD = 70
export const REPORT_ROW = 40
// Ярусы пирамиды: верх и низ яруса i, ширина трапеции на высоте y
export const tierTop = (i: number) => S2.pyramid.top + i * (S2.pyramid.tier + S2.pyramid.gap)
export const PYRAMID_BOTTOM = tierTop(2) + S2.pyramid.tier
export function pyramidWidth(y: number): number {
  const P = S2.pyramid
  return P.apex + ((y - P.top) / (PYRAMID_BOTTOM - P.top)) * (P.base - P.apex)
}
// Пирамида целиком — рамка точки «Три уровня тестов» (запас 10 px)
export const PYRAMID_BOX: Rect = { x: S2.pyramid.cx - S2.pyramid.base / 2 - 10, y: S2.pyramid.top - 10, w: S2.pyramid.base + 20, h: PYRAMID_BOTTOM - S2.pyramid.top + 20 }
// Телефон Анны и отчёт — рамка точки «Отчёт об ошибке»
export const REPORT_BOX: Rect = { x: BOARD2 + 34, y: 86, w: S2.report.x + S2.report.w + 10 - (BOARD2 + 34), h: S2.report.h + 20 }

// ---- Сцена 3: копии без пробы и запаска (доска 1), пробное восстановление (доска 2) ----

export const S3 = {
  night: { x: 220, y: 108 },
  vault: { x: 80, y: 140, w: 280, h: 250 },
  slot: { x: 440, y: 200, w: 260, h: 140 },
  never: { x: 570, y: 382 },
  wheel: { x: 860, y: 300, r: 80 },
  spare: { x: 1110, y: 300, r: 80 },
  // доска 2
  title: { x: BOARD2 + 640, y: 88 },
  copies: { x: BOARD2 + 40, y: 130, w: 280, head: 58, row: 52 },
  testDb: { x: BOARD2 + 600, y: 270 },
  workDb: { x: BOARD2 + 1060, y: 270 },
  check: { x: BOARD2 + 600, y: 392 },
  over: { y: 162 },
  alert: { x: BOARD2 + 60, y: 470 },
  watch: { x: BOARD2 + 600, y: 472 },
  steps: { x: BOARD2 + 860, y: 420, w: 380, h: 132 },
}
export const COPIES_H = S3.copies.head + 4 * S3.copies.row + 14
export const STEPS = ['свежая копия → тестовая база', 'тренировка Анны на месте', `время: ${RESTORE_MIN} минут`]
// Пробное восстановление целиком — рамка точки «Пробное восстановление»
export const DRILL_BOX: Rect = { x: BOARD2 + 28, y: 118, w: 1224, h: S3.steps.y + S3.steps.h + 8 - 118 }

// ---- Сцена 4: что сделать у себя (слева), четыре карточки (справа) ----

export const TODAY_LIST = ['тесты зелёные, поломку ловят', 'медленный экран: замер → правка', 'тестовая ошибка — в отслеживании', 'копия поднялась в тестовой базе']
export const S4 = {
  list: { x: 88, y: 144, row: 64 },
  you: { x: 160, y: 456 },
  card: { x: [574, 904], y: [96, 316], w: 306, h: 200 },
}
// Список «Сегодня у себя» — рамка точки «Проверьте у себя»
export const LIST_BOX: Rect = { x: S4.list.x - 12, y: S4.list.y - 56, w: 478, h: 3 * S4.list.row + 30 + 56 + 12 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: крыша-приложение, герои и места колонн крупнее; потом колонны ближе
  s1top: { x: 640, y: 300, zoom: 1.08 },
  s1cols: { x: 640, y: 330, zoom: 1.1 },
  // сцена 2: ошибка Анны и отчёт крупнее
  s2errors: { x: BOARD2 + 380, y: 350, zoom: 1.1 },
  // сцена 3: копии без пробы крупнее, пока запаски нет
  s3left: { x: 390, y: 300, zoom: 1.15 },
  // сцена 4: список и карточки чуть крупнее, в конце — весь кадр
  s4close: { x: 650, y: 345, zoom: 1.06 },
} as const
