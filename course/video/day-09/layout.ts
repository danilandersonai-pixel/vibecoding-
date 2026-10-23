import type { TermLine } from '../kit/screens/layout'

// Общие координаты холста 1280×720 ролика дня 9 «Программы тренировок»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560): к ней переезжает камера.

export const BOARD2 = 1280

// Телефон крупнее натуральной величины: текст экрана 12 px × 1,5 = 18 px в кадре (размеры общие для набора).
export { PHONE_FONT, PHONE_SCALE } from '../kit/screens/layout'

type Rect = { x: number; y: number; w: number; h: number }

// ---- Данные примера: одни и те же в сценах, тесте и пояснениях ----

/** Библиотека упражнений: каждое заведено один раз. */
export const LIBRARY = ['Присед', 'Жим лёжа', 'Тяга в наклоне', 'Подтягивания']

/** Шаблон «Сила», первая неделя: упражнение из библиотеки (номер строки) и план «подходы×повторы». */
export const TEMPLATE = [
  { lib: 0, name: 'Присед', plan: '3×10' },
  { lib: 1, name: 'Жим лёжа', plan: '3×10' },
  { lib: 2, name: 'Тяга в наклоне', plan: '3×10' },
]

/** Цикл по неделям: подходов поровну, повторов от недели к неделе меньше (вес подопечный берёт больше). */
export const CYCLE = [
  { week: 'Н1', sets: 3, reps: 10 },
  { week: 'Н2', sets: 3, reps: 8 },
  { week: 'Н3', sets: 3, reps: 6 },
  { week: 'Н4', sets: 3, reps: 5 },
]

/** Тест: тестовой подопечной назначают шаблон «Жим лёжа 3×10», меняют шаблон и читают прошлую тренировку. */
export const TEST_CODE = [
  '// правка шаблона не меняет историю',
  "it('история та же', async () => {",
  '  const w = await assign(tpl, client)',
  '  await logSets(w, [10, 10, 10], 40)',
  "  await edit(tpl, 'Жим гантелей 3×12')",
  '  const old = await getWorkout(w.id)',
  "  expect(old.plan).toBe('Жим лёжа 3×10')",
  '})',
]

/** Прогон после поломки нарочно: тренировка снова читает план из шаблона — тест красный. */
export const TERM_RED: TermLine[] = [
  { text: 'npx vitest run history', kind: 'cmd' },
  { text: 'FAIL  история та же', kind: 'err' },
  { text: "Expected: 'Жим лёжа 3×10'", kind: 'err' },
  { text: "Received: 'Жим гантелей 3×12'", kind: 'err' },
]

/** Прогон после возврата копии — тест зелёный. */
export const TERM_GREEN: TermLine[] = [
  { text: 'npx vitest run history', kind: 'cmd' },
  { text: 'PASS  история та же', kind: 'ok' },
  { text: '1 passed, 0 failed', kind: 'ok' },
]

// ---- Сцена 1: Марина пишет вручную → библиотека, шаблон, цикл, назначение (доска 1); модель данных (доска 2) ----

export const S1 = {
  marina: { x: 110, y: 420 },
  // листки, которые Марина пишет вручную (до библиотеки)
  manual: [
    { x: 216, y: 112, r: -4, who: 'Анна · Пн, неделя 1' },
    { x: 506, y: 128, r: 3, who: 'Анна · Чт, неделя 1' },
    { x: 280, y: 226, r: 2, who: 'Анна · Пн, неделя 2' },
    { x: 566, y: 242, r: -3, who: 'Анна · Чт, неделя 2' },
    { x: 230, y: 338, r: -2, who: 'Анна · Пн, неделя 3' },
    { x: 520, y: 352, r: 4, who: 'Анна · Чт, неделя 3' },
  ],
  manualW: 264,
  manualH: 76,
  library: { x: 190, y: 96, w: 320, row: 50 },
  template: { x: 540, y: 96, w: 320, row: 50, head: 92 },
  weeks: { x: 540, y: 384, w: 74, h: 90, gap: 8 },
  anna: { x: 1070, y: 450 },
  // календарь Анны над ней: два дня (Пн, Чт) × четыре недели
  cal: { y: 100, labelW: 40, cellW: 64, cellH: 38, gap: 8, head: 34, pad: 12 },
  // доска 2: модель данных — четыре таблицы
  tables: {
    exercises: { x: BOARD2 + 190, y: 120 },
    templates: { x: BOARD2 + 520, y: 120 },
    workouts: { x: BOARD2 + 520, y: 340 },
    sets: { x: BOARD2 + 870, y: 340 },
  },
  tableW: 300,
  // ИИ предлагает схему, решаете вы — слева от таблиц
  agent: { x: BOARD2 + 100, y: 210 },
  you: { x: BOARD2 + 100, y: 440 },
}
export const S1_LIB_H = 64 + LIBRARY.length * S1.library.row + 14
export const S1_TPL_H = S1.template.head + TEMPLATE.length * S1.template.row + 14
export const S1_TABLE_H = 60 + 2 * 36 + 12
/** Ширина и высота календаря подопечного. */
export const S1_CAL_W = S1.cal.labelW + 2 * S1.cal.cellW + S1.cal.gap + 2 * S1.cal.pad
export const S1_CAL_H = S1.cal.head + 4 * (S1.cal.cellH + S1.cal.gap) + S1.cal.pad
// Библиотека, шаблон, цикл и календарь Анны — рамка горячей точки «Программа тренировок»
export const PROGRAM_BOX: Rect = { x: 178, y: 86, w: 1010, h: 460 }
// Четыре таблицы и связи между ними — рамка горячей точки «Модель данных»
export const MODEL_BOX: Rect = { x: BOARD2 + 178, y: 108, w: 1004, h: 388 }

// ---- Сцена 2: правка шаблона переписывает историю (доска 1); копия и версии (доска 2) ----

export const S2 = {
  anna: { x: 110, y: 300 },
  // две прошлые тренировки Анны: понедельник и четверг первой недели
  monCard: { x: 200, y: 96, w: 400 },
  thuCard: { x: 200, y: 316, w: 400 },
  row: 56,
  // Марина ниже линий-ссылок от четверга к шаблону
  marina: { x: 690, y: 460 },
  template: { x: 810, y: 96, w: 400 },
  // доска 2: способ 1 (копия) слева, способ 2 (версии) справа; внизу — вопрос о будущих неделях
  panel1: { x: BOARD2 + 24, y: 96, w: 600, h: 314 },
  panel2: { x: BOARD2 + 644, y: 96, w: 600, h: 314 },
  // карточки панели: слева шаблон (или версии), справа тренировки; стрелка между ними
  card: { w: 250, h: 110, top: 150, bottom: 282, left: 16, right: 334 },
  question: { y: 452 },
  options: { y: 512, dx: 200 },
  you: { x: BOARD2 + 110, y: 488 },
  agent: { x: BOARD2 + 1170, y: 488 },
}
export const S2_CARD_H = 64 + 2 * S2.row + 12
export const S2_TPL_H = 64 + TEMPLATE.length * S2.row + 12
// Две тренировки Анны, ссылки, шаблон и Марина с подписью (рамка идёт под подписью, не по ней) — горячая точка «Ссылка вместо копии»
export const LINK_BOX: Rect = { x: 190, y: 86, w: 1030, h: 468 }
// Обе панели — копия и версии — рамка горячей точки «Копия или версия»
export const WAYS_BOX: Rect = { x: S2.panel1.x - 8, y: S2.panel1.y - 8, w: S2.panel2.x + S2.panel2.w - S2.panel1.x + 16, h: S2.panel1.h + 16 }

// ---- Сцена 3: проверка руками (доска 1); тест, поломка нарочно и прогоны (доска 2) ----

export const S3 = {
  list: { x: 60, y: 96, w: 660, row: 70 },
  phone: { x: 860, y: 300 },
  // отметки справа от телефона: «план тот же», «подходы на месте»
  notes: { x: 1110, y1: 196, y2: 276 },
  changes: { x: 390, y1: 430, y2: 494 },
  editor: { x: BOARD2 + 30, y: 90, w: 600 },
  agent: { x: BOARD2 + 120, y: 480 },
  db: { x: BOARD2 + 330, y: 480 },
  live: { x: BOARD2 + 530, y: 480 },
  diff: { x: BOARD2 + 670, y: 124, w: 580 },
  term: { x: BOARD2 + 670, y: 272, w: 580 },
  verdict: { x: BOARD2 + 960, y: 516 },
}
export const S3_LIST_H = 64 + 3 * S3.list.row + 14
// Окно редактора с тестом — рамка горячей точки «Тест на историю»
export const TEST_BOX: Rect = { x: S3.editor.x - 6, y: S3.editor.y - 6, w: S3.editor.w + 12, h: 40 + 24 + TEST_CODE.length * 32 + 12 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: Марина и листки, написанные вручную, крупнее
  s1manual: { x: 400, y: 345, zoom: 1.2 },
  // сцена 2: Анна, её прошлая неделя и Марина крупнее (шаблона ещё нет)
  s2anna: { x: 420, y: 365, zoom: 1.15 },
  // сцена 3: чек-лист и телефон тестовой подопечной крупнее
  s3list: { x: 520, y: 340, zoom: 1.15 },
} as const
