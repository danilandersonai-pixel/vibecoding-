// Общие координаты холста 1280×720 ролика дня 10 «Рекорды и отчёты»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Здесь же данные подходов и расчёты — числа на экране берутся
// отсюда и проверяются тестом. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

// ---- Данные и расчёты ----

export type WorkSet = { reps: number; kg: number }
export type Day = { day: string; sets: WorkSet[] }

/** Объём — сумма по подходам: повторы × вес. */
export function volumeOf(sets: WorkSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.kg, 0)
}

/** Личный рекорд — самый большой вес, с которым сделан хоть один подход. */
export function recordOf(sets: WorkSet[]): number {
  return Math.max(...sets.map((s) => s.kg))
}

/** Фунт — 0,45359237 кг. */
export const LB = 0.45359237
export function toKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * LB : value
}

/** Число по-русски: запятая вместо точки, без лишних нулей. */
export function ru(v: number): string {
  return String(Math.round(v * 10) / 10).replace('.', ',')
}

// Неделя Анны, присед: понедельник, среда, пятница.
export const ANNA_FRIDAY: WorkSet[] = [
  { reps: 5, kg: 52.5 },
  { reps: 5, kg: 52.5 },
  { reps: 3, kg: 55 },
]
export const ANNA_WEEK: Day[] = [
  { day: 'Пн', sets: [{ reps: 5, kg: 50 }, { reps: 5, kg: 50 }, { reps: 5, kg: 50 }] },
  { day: 'Ср', sets: [{ reps: 5, kg: 50 }, { reps: 5, kg: 50 }, { reps: 5, kg: 52.5 }] },
  { day: 'Пт', sets: ANNA_FRIDAY },
]
// Неделя с пропуском: в среду Анны не было.
export const MISSED_WEEK: Day[] = [ANNA_WEEK[0], { day: 'Ср', sets: [] }, ANNA_WEEK[2]]

// Олег: вписал 135 в зале, где блины в фунтах; прежний рекорд в жиме — 62,5 кг.
export const OLEG_LB = 135
export const OLEG_RECORD = 62.5

// ---- Сцена 1: понедельник у Марины — журнал подходов и три вещи дня ----

export const S1 = {
  marina: { x: 190, y: 380 },
  journal: { x: 360, y: 96, w: 470, h: 374, head: 54, row: 44, shown: 7 },
  cards: { x: 880, y: [100, 222, 344], w: 340, h: 104 },
  live: { y: 530, x: [470, 640, 830] },
}
// Журнал подходов недели: день, кто, что
export const JOURNAL: [string, string][] = [
  ['Пн', 'Анна · присед 5 × 50'],
  ['Пн', 'Анна · присед 5 × 50'],
  ['Пн', 'Олег · жим 5 × 60'],
  ['Пн', 'Анна · присед 5 × 50'],
  ['Пн', 'Олег · жим 5 × 60'],
  ['Ср', 'Анна · присед 5 × 50'],
  ['Ср', 'Олег · подтягивания 8'],
  ['Ср', 'Анна · присед 5 × 50'],
  ['Ср', 'Олег · подтягивания 8'],
  ['Ср', 'Анна · присед 5 × 52,5'],
  ['Пт', 'Олег · жим 5 × 60'],
  ['Пт', 'Анна · присед 5 × 52,5'],
  ['Пт', 'Анна · присед 5 × 52,5'],
  ['Пт', 'Олег · жим 5 × 60'],
  ['Пт', 'Анна · присед 3 × 55'],
]

// ---- Сцена 2: определения, пятница Анны (доска 1) и отчёт за неделю (доска 2) ----

export const S2 = {
  defs: { x: 60, y: [96, 172], w: 610, h: 62, tagW: 130 },
  table: { x: 60, y: 260, w: 610, head: 52, row: 50, total: 58 },
  anna: { x: 890, y: 400 },
  cup: { x: 1080, y: 176 },
  record: { x: 1080, y: 286 },
  report: { x: BOARD2 + 70, y: 92, w: 780, h: 440 },
  bars: { x: BOARD2 + 100, y: 262, w: 420, h: 236 },
  marina: { x: BOARD2 + 1030, y: 410 },
}
export const TABLE_H = S2.table.head + ANNA_FRIDAY.length * S2.table.row + S2.table.total
// Определения и расчёт пятницы — рамка горячей точки «Рекорд и объём»
export const CALC_BOX = { x: S2.defs.x - 10, y: S2.defs.y[0] - 10, w: S2.defs.w + 20, h: S2.table.y + TABLE_H + 10 - (S2.defs.y[0] - 10) }

// ---- Сцена 3: что вписали в зале и сломанный отчёт (доска 1); правила, тесты и заплатка (доска 2) ----

export const S3 = {
  log: { x: 60, y: 96, w: 600, head: 54, row: 88 },
  report: { x: 720, y: 96, w: 500, head: 62, rows: [96, 116] },
  marina: { x: 1000, y: 486 },
  rules: { x: BOARD2 + 60, y: 96, w: 640, head: 62, row: 58 },
  term: { x: BOARD2 + 740, y: 96, w: 480 },
  agent: { x: BOARD2 + 990, y: 448 },
  patch: { x: BOARD2 + 80, y: 388, w: 600, h: 128 },
}
export const LOG_H = S3.log.head + 3 * S3.log.row + 8
export const REPORT3_H = S3.report.head + S3.report.rows[0] + S3.report.rows[1] + 8
// Записи недели и сломанный отчёт — рамка горячей точки «Пустое поле и фунты»
export const BROKEN_BOX = { x: S3.log.x - 10, y: S3.log.y - 10, w: S3.report.x + S3.report.w + 10 - (S3.log.x - 10), h: Math.max(LOG_H, REPORT3_H) + 20 }
// Три правила расчёта: их решает человек
export const RULES = ['пустой вес — не сохранять, просить вписать', 'у веса есть единица: кг или фунты', 'свой вес — тип упражнения: только повторы']

// ---- Сцена 4: тесты на расчёт (слева) и отчёт за неделю с пропуском (справа) ----

export const TESTS = ['обычный: 690 кг, рекорд 55', 'пустой вес — не сохраняется', 'подтягивания — без кг', `${OLEG_LB} фунтов ≈ ${ru(toKg(OLEG_LB, 'lb'))} кг`, '«52,5» → 52,5 кг', 'сломали нарочно — тесты красные']
export const S4 = {
  tests: { x: 60, y: 96, w: 560, head: 62, row: 50 },
  agent: { x: 790, y: 330 },
  report: { x: 680, y: 96, w: 560, h: 334 },
  bars: { x: 700, y: 226, w: 330, h: 176 },
  empty: { x: 680, y: 452, w: 470, h: 64 },
  marina: { x: 1204, y: 488 },
}
export const TESTS_H = S4.tests.head + TESTS.length * S4.tests.row + 12
// Список тестов — рамка горячей точки «Тесты на расчёт»
export const TESTS_BOX = { x: S4.tests.x - 10, y: S4.tests.y - 10, w: S4.tests.w + 20, h: TESTS_H + 20 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: Марина и журнал подходов крупнее, пока трёх карточек нет
  s1close: { x: 480, y: 322, zoom: 1.15 },
  // сцена 2: определения крупнее, пока таблица пятницы пустая
  s2defs: { x: 440, y: 250, zoom: 1.15 },
  // сцена 3: записи из зала и отчёт чуть крупнее, пока Марины ещё нет
  s3wide: { x: 640, y: 320, zoom: 1.08 },
  // сцена 4: список тестов крупнее, пока отчёта с пропуском нет
  s4tests: { x: 380, y: 300, zoom: 1.12 },
} as const
