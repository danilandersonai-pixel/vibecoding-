// Общие координаты холста 1280×720 ролика дня 19 «Бета-тест: запуск»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

// Бета-тестеры примера: новые тренеры со стороны, приложение ещё не видели (не Марина и Дима);
// за первой, Полиной, смотрим вживую в сцене 3
export const BETA = ['Полина', 'Кирилл', 'Тимур', 'Ксения']

// ---- Сцена 1 (вступление): Марина и Дима привыкли, новый тренер видит впервые; сначала немногие ----

export const S1 = {
  marina: { x: 150, y: 330 },
  dima: { x: 330, y: 330 },
  fresh: { x: 600, y: 330 },
  launch: { x: 1010, y: 116 },
  grid: { x: 800, y: 262, cols: 5, rows: 4, dx: 88, dy: 64 },
}
// Место под «двадцать условных пользователей» (как на рис. 8.12 книги)
export const GRID_SLOT: Rect = { x: 748, y: 196, w: 440, h: 300 }
// Номера первых пользователей: четыре бета-тестера (решение примера — 3–5 тренеров)
export const FIRST_FEW = [6, 7, 11, 12]

// ---- Сцена 2: план бета-теста (слева) и список замечаний (справа) ----

export const PLAN = { x: 40, y: 92, w: 500 }
// Строки плана от верха карточки: заголовок, «кто», плашки, тренеры, «срок», «задачи»
export const PLAN_Y = { title: 40, rule: 58, who: 94, pills: 130, people: 196, term: 296, tasks: 344, step: 36 }
export const PLAN_H = 436
export const PLAN_VALUE_X = 112
export const PEOPLE_X = [140, 225, 310, 395]
export const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEK_CELL = { x: 236, size: 30, gap: 6 }
// Задачи бета-теста — настоящие дела тренера (из дней 12, 5 и 10)
export const TASKS = ['пригласить подопечного', 'назначить тренировку', 'найти рекорды']
// План целиком — рамка горячей точки «План бета-теста» (запас 10 px вокруг карточки)
export const PLAN_BOX: Rect = { x: PLAN.x - 10, y: PLAN.y - 10, w: PLAN.w + 20, h: PLAN_H + 20 }

// Список замечаний: одна общая таблица (сцены 2–4)
export const LIST = { x: 570, y: 92, w: 670, pad: 16, head: 52, colHead: 38, row: 48, rows: 4 }
export const COLS = [
  { title: 'кто', w: 84 },
  { title: 'задача', w: 122 },
  { title: 'где застрял', w: 200 },
  { title: 'что ожидал', w: 232 },
]
/** Левый край колонки i списка на холсте (текст ячейки — на 10 px правее). */
export function colX(i: number): number {
  return LIST.x + LIST.pad + COLS.slice(0, i).reduce((s, c) => s + c.w, 0)
}
/** Верх строки i списка на холсте. */
export function rowY(i: number): number {
  return LIST.y + LIST.head + LIST.colHead + i * LIST.row
}
export const LIST_H = LIST.head + LIST.colHead + LIST.rows * LIST.row + 8

export type Remark = { who: string; task: string; stuck: string; expect: string }
// Замечания примера: где тренер застрял и что ожидал увидеть — его словами
export const REMARKS: Remark[] = [
  { who: 'Полина', task: 'назначить', stuck: 'искала дату минуту', expect: 'день — при назначении' },
  { who: 'Кирилл', task: 'пригласить', stuck: 'искал ввод номера', expect: 'по номеру телефона' },
  { who: 'Тимур', task: 'рекорды', stuck: 'открыл «Отчёты»', expect: 'у подопечного' },
  { who: 'Ксения', task: 'назначить', stuck: 'ошибка сохранения', expect: '—' },
]
// Список целиком — рамка горячей точки «Список замечаний»
export const LIST_BOX: Rect = { x: LIST.x - 10, y: LIST.y - 10, w: LIST.w + 20, h: LIST_H + 20 }

// Сцена 2: разрозненные сообщения (уходят в список) и наблюдение вживую — под списком
export const SCATTER = [
  { text: 'чат', x: 700, y: 470 },
  { text: 'голосовое', x: 850, y: 510 },
  { text: 'письмо', x: 1010, y: 462 },
  { text: 'звонок', x: 1160, y: 506 },
]
export const S2 = {
  you: { x: 720, y: 470 },
  polina: { x: 1150, y: 470 },
  watch: { x: 935, y: 452 },
}
// Место под наблюдение вживую (пунктир до появления героев)
export const WATCH_SLOT: Rect = { x: 650, y: 410, w: 590, h: 140 }

// ---- Сцена 3: «нравится?» (доска 1), задача и наблюдение (доска 2) ----

export const S3 = {
  you: { x: 150, y: 330 },
  polina: { x: 405, y: 330 },
  phone: { x: 505, y: 300 },
  fixY: 424,
  task: { x: BOARD2 + 60, y: 80, w: 700, h: 60 },
  silent: { x: BOARD2 + 860, y: 110 },
  hint: { x: BOARD2 + 1090, y: 110 },
  polina2: { x: BOARD2 + 150, y: 390 },
  hand: { x: BOARD2 + 330, y: 160, w: 270, h: 390 },
  journal: { x: BOARD2 + 650, y: 160, w: 580, head: 56, row: 44 },
}
// Пометки наблюдателя: время от начала задачи и что видно со стороны
export const JOURNAL = [
  { at: '0:05', text: 'ищет поле даты' },
  { at: '0:20', text: 'ушла в «Программы»' },
  { at: '0:35', text: 'вернулась назад' },
  { at: '0:55', text: 'дата — в меню «Ещё»' },
]
export const QUESTION = '«Что вы ожидали увидеть?»'
export const ANSWER = '«Выбрать день прямо при назначении»'
// Строки «вопрос» и «ответ» под пометками (базовые линии от верха журнала)
export const QA_Y = { rule: 244, q: 280, a: 320 }
export const JOURNAL_H = 340
// Журнал целиком — рамка горячей точки «Журнал наблюдения»
export const JOURNAL_BOX: Rect = { x: S3.journal.x - 10, y: S3.journal.y - 10, w: S3.journal.w + 20, h: JOURNAL_H + 20 }

// Крупный телефон в координатах холста: рамка и экран
export const HAND = { side: 10, top: 30, bottom: 16 }
/** Экран крупного телефона с рамкой r: прямоугольник внутри рамки. */
export function screenOf(r: Rect): Rect {
  return { x: r.x + HAND.side, y: r.y + HAND.top, w: r.w - 2 * HAND.side, h: r.h - HAND.top - HAND.bottom }
}
// Нижняя полоса разделов на экране (высота)
export const TABS_H = 44

// ---- Сцена 4: что сделать у себя (слева), список замечаний и отслеживание ошибок (справа) ----

export const TODAY = ['3–5 тренеров и план', 'каждому — настоящая задача', 'одна сессия — молча', '«Что вы ожидали увидеть?»', 'сбои — в отслеживании ошибок', 'всё — в один список']
export const CHECK = { x: 40, y: 92, w: 500, head: 60, row: 56 }
export const CHECK_H = CHECK.head + TODAY.length * CHECK.row + 12
export const ERRORS = { x: 570, y: 414, w: 380, h: 112 }
export const DAY20 = { x: 1120, y: 470 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: Марина и Дима крупнее, пока нового тренера и «немногих» нет
  s1close: { x: 250, y: 290, zoom: 1.3 },
  // сцена 2: план крупнее, пока списка нет
  s2plan: { x: 290, y: 350, zoom: 1.12 },
  // сцена 4: что сделать у себя крупнее, пока списка нет
  s4check: { x: 290, y: 330, zoom: 1.15 },
} as const
