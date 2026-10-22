// Общие координаты холста 1280×720 ролика дня 16 «Питание»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Здесь же данные дневника и расчёты — числа на экране берутся
// отсюда и проверяются тестом. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

// ---- Данные и расчёты (арифметика примера, не правила книги) ----

/** Значения на 100 г продукта: ккал, белки, жиры, углеводы (г). */
export type Per100 = { kcal: number; protein: number; fat: number; carbs: number }
export type Food = { name: string; grams: number; per100: Per100 }
type Key = 'kcal' | 'protein'

/** Ккал в грамме: белки и углеводы — 4, жиры — 9. */
export const PROTEIN_KCAL = 4
export const FAT_KCAL = 9
export const CARBS_KCAL = 4
/** Калории из белков, жиров и углеводов. */
export function kcalOf(v: { protein: number; fat: number; carbs: number }): number {
  return PROTEIN_KCAL * v.protein + FAT_KCAL * v.fat + CARBS_KCAL * v.carbs
}

/** Порция: значение на 100 г × граммы / 100. */
export function portion(per100: number, grams: number): number {
  return (per100 * grams) / 100
}

/** Итог дня по точным числам (округлять — только при показе). */
export function dayTotal(foods: Food[], key: Key): number {
  return foods.reduce((sum, f) => sum + portion(f.per100[key], f.grams), 0)
}

/** Итог, если округлить каждую строку и сложить округлённое (так делает экран Анны в подводном камне). */
export function rowsRounded(foods: Food[], key: Key): number {
  return foods.reduce((sum, f) => sum + Math.round(portion(f.per100[key], f.grams)), 0)
}

/** 1 ккал = 4,184 кДж. */
export const KJ_PER_KCAL = 4.184
/** Больше 900 ккал на 100 г не бывает: столько у чистого жира (9 ккал в грамме). */
export const MAX_KCAL_PER_100 = FAT_KCAL * 100
/** Число «ккал на 100 г» больше возможного — скорее всего, это кДж: переспросить. */
export function looksLikeKj(kcalPer100: number): boolean {
  return kcalPer100 > MAX_KCAL_PER_100
}

/** Граммы из поля ввода: «52,5» с запятой — это 52,5. */
export function parseGrams(text: string): number {
  return Number(text.trim().replace(',', '.'))
}

/** Число по-русски: запятая вместо точки, один знак после запятой, без лишних нулей. */
export function ru(v: number): string {
  return String(Math.round(v * 10) / 10).replace('.', ',')
}

// Цели Марины для Анны на день: 4 × 110 + 9 × 60 + 4 × 130 = 1500 ккал
export const TARGETS = { kcal: 1500, protein: 110, fat: 60, carbs: 130 }

// Этикетка овсянки: на 100 г
export const OATS: Per100 = { kcal: 350, protein: 12, fat: 6, carbs: 62 }
export const OATS_G = 60
/** На той же этикетке — кДж: 350 × 4,184 ≈ 1464. */
export const OATS_KJ = Math.round(OATS.kcal * KJ_PER_KCAL)

// Вторник Анны: продукт, граммы порции и значения на 100 г с этикетки
export const TUESDAY: Food[] = [
  { name: 'Овсянка', grams: OATS_G, per100: OATS },
  { name: 'Яйца', grams: 120, per100: { kcal: 155, protein: 13, fat: 11, carbs: 1 } },
  { name: 'Гречка', grams: 240, per100: { kcal: 105, protein: 4, fat: 1, carbs: 20 } },
  { name: 'Лосось', grams: 170, per100: { kcal: 197, protein: 20, fat: 13, carbs: 0 } },
  { name: 'Творог 5%', grams: 200, per100: { kcal: 121, protein: 17, fat: 5, carbs: 2 } },
  { name: 'Хлеб', grams: 100, per100: { kcal: 231, protein: 9, fat: 3, carbs: 42 } },
]
// Ошибка 1: число с этикетки взято как вся порция — будто съедено ровно по 100 г
export const TUESDAY_PER100: Food[] = TUESDAY.map((f) => ({ ...f, grams: 100 }))
// Ошибка 2: в поле «ккал на 100 г» овсянки вписаны кДж
export const TUESDAY_KJ: Food[] = TUESDAY.map((f, i) => (i === 0 ? { ...f, per100: { ...f.per100, kcal: OATS_KJ } } : f))

/** Ккал строки дневника на экране (округлено). */
export const rowKcal = (foods: Food[]) => foods.map((f) => Math.round(portion(f.per100.kcal, f.grams)))
/** Белок строки: округлённый (экран Анны) и точный (сводка Марины). */
export const rowProtein = TUESDAY.map((f) => portion(f.per100.protein, f.grams))

// Неделя Анны для сводки Марины: вторник — тот же дневник; null — день без записей
export type WeekDay = { day: string; kcal: number | null; protein: number | null }
export const WEEK: WeekDay[] = [
  { day: 'Пн', kcal: 1512.4, protein: 112.3 },
  { day: 'Вт', kcal: dayTotal(TUESDAY, 'kcal'), protein: dayTotal(TUESDAY, 'protein') },
  { day: 'Ср', kcal: 1468.2, protein: 104.7 },
  { day: 'Чт', kcal: 1530.6, protein: 115.2 },
  { day: 'Пт', kcal: 1389.6, protein: 98.6 },
  { day: 'Сб', kcal: 1622.8, protein: 101.3 },
  { day: 'Вс', kcal: 1440.3, protein: 108.9 },
]
// Неделя для теста: в четверг записей нет
export const EMPTY_WEEK: WeekDay[] = WEEK.map((d) => (d.day === 'Чт' ? { ...d, kcal: null, protein: null } : d))

/** Среднее по дням с записями; без записей — null. */
export function weekAverage(days: WeekDay[], key: Key): number | null {
  const values = days.map((d) => d[key]).filter((v): v is number => v !== null)
  return values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length
}

// Кто видит дневник питания: подопечный и его тренер (данные о здоровье)
export const ACCESS = { anna: ['Анна', 'Марина'], oleg: ['Олег', 'Дима'] }

// Тесты сцены 3: что проверяют и какой это случай
export const TESTS = [
  { text: `${OATS_G} г овсянки → ${Math.round(portion(OATS.kcal, OATS_G))} ккал`, tag: 'обычный' },
  { text: `«52,5» г → ${ru(parseGrams('52,5'))} г, а не ${Number.parseFloat('52,5')}`, tag: 'странный' },
  { text: `${OATS_KJ} на 100 г → «это кДж?»`, tag: 'странный' },
  { text: 'итог Анны = итог Марины', tag: 'свойство' },
  { text: 'пустой день → «нет записей»', tag: 'пустой' },
  { text: 'Дима не видит дневник Анны', tag: 'негативный' },
]

// ---- Сцена 1: цели (слева), дневник (в центре), этикетка и расчёт (справа); сводка — на доске 2 ----

export const S1 = {
  targets: { x: 60, y: 96, w: 340, head: 56, row: 50 },
  marina: { x: 150, y: 462 },
  diary: { x: 430, y: 96, w: 440 },
  label: { x: 910, y: 96, w: 330, h: 156 },
  calc: { x: 910, y: 272, w: 330, h: 104 },
  anna: { x: 1075, y: 462 },
  // доска 2
  summary: { x: BOARD2 + 60, y: 96, w: 820, h: 360 },
  bars: { x: BOARD2 + 90, y: 200, w: 420, h: 250, top: 1800 },
  goal: { x: BOARD2 + 586 },
  stats: { x: BOARD2 + 670 },
  access: { x: BOARD2 + 60, y: 476, w: 820, h: 70 },
  marina2: { x: BOARD2 + 1010, y: 330 },
  dima: { x: BOARD2 + 1170, y: 330 },
}
export const TARGETS_H = S1.targets.head + 4 * S1.targets.row + 14
// Этикетка и расчёт порции — рамка горячей точки «Порция по этикетке»
export const PORTION_BOX = { x: S1.label.x - 10, y: S1.label.y - 10, w: S1.label.w + 20, h: S1.calc.y + S1.calc.h + 10 - (S1.label.y - 10) }

// Дневник: заголовок, подписи колонок, строки и итог (одинаков в сценах 1 и 2)
export const DIARY = { head: 56, sub: 34, row: 46, total: 62 }
export const DIARY_H = DIARY.head + DIARY.sub + TUESDAY.length * DIARY.row + DIARY.total + 8
/** Верх строки i дневника. */
export const diaryRowY = (y: number, i: number) => y + DIARY.head + DIARY.sub + i * DIARY.row
/** Верх строки итога. */
export const diaryTotalY = (y: number) => diaryRowY(y, TUESDAY.length)
/** Колонки дневника от левого края карточки шириной w: продукт, вес (правый край), ккал (правый край). */
export const diaryCols = (x: number, w: number) => ({ name: x + 24, grams: x + w - 150, kcal: x + w - 24 })

// ---- Сцена 2: доска 1 — дневник, форма и этикетка, сводка Марины; доска 2 — белок на двух экранах и правила ----

export const S2 = {
  diary: { x: 60, y: 96, w: 470 },
  form: { x: 580, y: 96, w: 320, h: 176 },
  pack: { x: 580, y: 296, w: 320, h: 156 },
  coach: { x: 950, y: 96, w: 290, h: 176 },
  marina: { x: 1095, y: 440 },
  pills: { y: 500, x: [660, 830] },
  // доска 2
  anna: { x: BOARD2 + 60, y: 96, w: 560, h: 150 },
  sum: { x: BOARD2 + 60, y: 266, w: 560, h: 150 },
  terms: { x0: 50, step: 92, y: 92, result: 132 }, // от левого края карточки; базовые линии от верха
  twoPill: { x: BOARD2 + 340, y: 470 },
  marina2: { x: BOARD2 + 820, y: 230 },
  anna2: { x: BOARD2 + 1100, y: 230 },
  rules: { x: BOARD2 + 660, y: 340, w: 580, head: 50, row: 44 },
}
export const RULES_H = S2.rules.head + 3 * S2.rules.row + 12
// Форма и этикетка (средняя колонка) — рамка горячей точки «Килоджоули вместо калорий»
export const KJ_BOX = { x: S2.form.x - 10, y: S2.form.y - 10, w: S2.form.w + 20, h: S2.pack.y + S2.pack.h + 10 - (S2.form.y - 10) }
// Два экрана с белком вторника — рамка горячей точки «Один день — два итога»
export const TWO_BOX = { x: S2.anna.x - 10, y: S2.anna.y - 10, w: S2.anna.w + 20, h: S2.sum.y + S2.sum.h + 10 - (S2.anna.y - 10) }
// Правила расчёта: их решает человек
export const RULES = [`единица у числа: на 100 г, ккал или кДж`, `больше ${MAX_KCAL_PER_100} ккал на 100 г — переспросить`, 'округлять один раз, одной функцией']

// ---- Сцена 3: тесты на расчёт (слева), неделя с пустым днём и чужой тренер (справа) ----

export const S3 = {
  tests: { x: 60, y: 96, w: 610, head: 62, row: 52 },
  code: { x: 700, y: 96, w: 540 },
  agent: { x: 860, y: 400 },
  say: { x: 1060, y: 330 },
  week: { x: 710, y: 96, w: 520, h: 320 },
  bars: { x: 730, y: 150, w: 480, h: 174, top: 1800 },
  lock: { x: 710, y: 436, w: 380, h: 90 },
  dima: { x: 1170, y: 478 },
}
export const TESTS_H = S3.tests.head + TESTS.length * S3.tests.row + 12
// Код первых четырёх тестов: агент пишет их по правилам до кода (строки не длиннее 40 знаков)
export const CODE: string[][] = [
  [`it('${OATS_G} г овсянки', () => {`, `  expect(portion(${OATS.kcal}, ${OATS_G})).toBe(${portion(OATS.kcal, OATS_G)})`, '})'],
  ["it('«52,5» с запятой', () => {", `  expect(grams('52,5')).toBe(${parseGrams('52,5')})`, '})'],
  [`it('${OATS_KJ} — похоже на кДж', () => {`, `  expect(looksLikeKj(${OATS_KJ})).toBe(${looksLikeKj(OATS_KJ)})`, '})'],
  ["it('итоги совпадают', () => {", '  expect(anna(day)).toBe(marina(day))', '})'],
]
// Список тестов — рамка горячей точки «Тесты на расчёт»
export const TESTS_BOX = { x: S3.tests.x - 10, y: S3.tests.y - 10, w: S3.tests.w + 20, h: TESTS_H + 20 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: места целей, дневника и расчёта чуть крупнее, пока героев нет
  s1near: { x: 640, y: 340, zoom: 1.04 },
  // сцена 3: места тестов, кода и агент чуть крупнее, пока тестов нет
  s3near: { x: 640, y: 340, zoom: 1.04 },
} as const
