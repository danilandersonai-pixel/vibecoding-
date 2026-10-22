// Общие координаты холста 1280×720 ролика дня 13 «Своё отличие»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

// Сцена 1 (вступление): два эталона и ваше приложение умеют одно и то же; место для отличия.
export const S1 = {
  cards: { x: [60, 470, 880], y: 104, w: 340, h: 250 },
  rowY: 196, // базовая линия первой строки карточки
  row: 42,
  slot: { x: 880, y: 380, w: 340, h: 64 },
  coach: { x: 240, y: 462 },
}
export const S1_TITLES = ['Эталон А', 'Эталон Б', 'Ваше приложение']
export const S1_ROWS = ['тренировки', 'подходы и веса', 'программы', 'рекорды']

// Сцена 2: отзывы на эталоны с низкой оценкой → стопки похожих жалоб → общая боль тренеров;
// на доске 2 — маленький срез: подход Анны сразу виден на экране Марины.
export type Review = { text: string; rating: string; pile: number; short: string }
export const REVIEWS: Review[] = [
  { text: 'Тренер не видит, что я сделал', rating: '1 из 5', pile: 0, short: 'не видит, что сделал' },
  { text: 'Подписка слишком дорогая', rating: '2 из 5', pile: 1, short: 'дорого' },
  { text: 'Скидываю тренеру скриншоты', rating: '1 из 5', pile: 0, short: 'скидываю скриншоты' },
  { text: 'Нет тёмной темы', rating: '2 из 5', pile: 2, short: 'тёмная тема' },
  { text: 'Пишу тренеру в мессенджер', rating: '1 из 5', pile: 0, short: 'пишу в мессенджер' },
]
/** Сколько отзывов легло в стопку i. */
export const pileCount = (i: number) => REVIEWS.filter((r) => r.pile === i).length
/** Место отзыва k внутри его стопки (0 — нижний). */
export const pileSlot = (k: number) => REVIEWS.slice(0, k).filter((r) => r.pile === REVIEWS[k].pile).length
// стопки: заголовок, ширина, счёт под стопкой (совпадает с числом отзывов — это проверяет тест)
export const PILES = [
  { head: 'тренер не видит', x: 660, w: 250, count: '3' },
  { head: 'цена', x: 925, w: 140, count: '1' },
  { head: 'оформление', x: 1080, w: 140, count: '1' },
]
/** Самая высокая стопка. */
export function tallestPile(): number {
  let best = 0
  PILES.forEach((_, i) => {
    if (pileCount(i) > pileCount(best)) best = i
  })
  return best
}
export const S2 = {
  panel: { x: 60, y: 92, w: 560, h: 394 },
  rowTop: 160, // верх первой строки отзыва
  row: 62,
  rowH: 50,
  headY: 118, // центр плашки-заголовка стопки
  pileTop: 146,
  pileH: 290,
  mini: 50,
  miniGap: 8,
  countY: 466,
  marina: { x: 150, y: 452 },
  dima: { x: 500, y: 452 },
  // доска 2: телефон Анны, экран Марины, Марина
  phone: { x: BOARD2 + 250, y: 322 },
  feed: { x: BOARD2 + 480, y: 110, w: 460, h: 300 },
  marina2: { x: BOARD2 + 1060, y: 330 },
}
export const reviewTop = (i: number) => S2.rowTop + i * S2.row
/** Верх мини-карточки на месте k стопки (стопка растёт снизу вверх). */
export const miniTop = (k: number) => S2.pileTop + S2.pileH - 10 - (k + 1) * S2.mini - k * S2.miniGap
// Стопки целиком: заголовки, карточки и счёт — рамка горячей точки «Стопки жалоб» (с запасом 10 px)
export const PILES_BOX = { x: PILES[0].x - 10, y: S2.headY - 26, w: PILES[2].x + PILES[2].w - PILES[0].x + 20, h: S2.countY + 28 - (S2.headY - 26) }

// Экран Марины на доске 2: только её подопечная Анна (подходы Олега видит Дима — так работает доступ)
export const COACH_FEED = [
  { who: 'Анна', text: 'подход 1 · 10 × 40 кг' },
  { who: 'Анна', text: 'подход 2 · 10 × 40 кг' },
  { who: 'Анна', text: 'подход 3 · 10 × 40 кг' },
]
export const FEED_HEAD = 104 // от верха экрана до первой строки
export const FEED_ROW = 52

// Сцена 3: список «как у них» (слева), гонка за эталоном (справа вверху), «Вы» (справа внизу);
// на доске 2 — Марина: ещё один чат ей не нужен, нужна одна вещь — видеть подходы сразу.
export type CopyRow = { text: string; from: string; decision: string; bad?: boolean }
export const COPY_LIST: CopyRow[] = [
  { text: 'чат', from: 'как у А', decision: 'не делаем' },
  { text: 'рейтинг', from: 'как у Б', decision: 'позже' },
  { text: 'соревнования', from: 'как у А', decision: 'позже' },
  { text: 'магазин', from: 'как у Б', decision: 'не делаем' },
  { text: 'лента друзей', from: 'как у А', decision: 'не делаем' },
  { text: 'награды', from: 'как у Б', decision: 'позже' },
  { text: 'видеоуроки', from: 'как у А', decision: 'позже' },
  { text: 'спрятанные подходы', from: 'как у Б', decision: 'не делаем', bad: true },
]
export const S3 = {
  list: { x: 60, y: 96, w: 440, head: 62, row: 41 },
  race: { x: 560, y: 100, w: 660, h: 196 },
  barX: 700,
  barW: 480, // эталон: сотни функций
  youW: 50, // вы: скопировали семь пунктов
  you: { x: 880, y: 452 },
  // доска 2
  marina: { x: BOARD2 + 300, y: 400 },
  chat: { x: BOARD2 + 560, y: 150, w: 340, h: 76 },
  pain: { x: BOARD2 + 560, y: 290, w: 620, h: 100 },
}
export const LIST_H = S3.list.head + COPY_LIST.length * S3.list.row + 12
export const listRowY = (i: number) => S3.list.y + S3.list.head + i * S3.list.row + 28 // базовая линия строки i
// Гонка за эталоном целиком — рамка горячей точки «Гонка за эталоном»
export const RACE_BOX = { x: S3.race.x - 8, y: S3.race.y - 8, w: S3.race.w + 16, h: S3.race.h + 16 }

// Сцена 4: что сделать у себя (слева), срез (справа вверху), тренеры (справа внизу);
// на доске 2 — спецификация и таблица паритета.
export const TODAY = ['жалобы на эталоны — дословно', 'стопки: найти самую высокую', 'та же боль у ваших тренеров?', 'один сценарий целиком', 'отличие — в спецификацию', 'показ тренерам без подсказок']
export const PARITY = [
  { what: 'тренировки и подходы', them: 'есть → есть', decision: 'готово' },
  { what: 'тренер видит подходы', them: 'не видит → сразу', decision: 'наше отличие' },
  { what: 'соревнования', them: 'есть → нет', decision: 'позже' },
  { what: 'магазин', them: 'есть → нет', decision: 'не делаем' },
]
export const SPEC = ['# Тренер и подопечный', '', '## Чем отличается', 'Тренер видит подходы', 'сразу после записи', '', '## Пока не делаем', 'соревнования, магазин']
export const S4 = {
  list: { x: 60, y: 150, row: 52 },
  slice: { x: 620, y: 96, w: 610, h: 240 },
  phone: { x: 700, y: 236 },
  screen: { x: 860, y: 140, w: 360, h: 184 },
  marina: { x: 700, y: 470 },
  dima: { x: 840, y: 470 },
  coaches: { x: 620, y: 360, w: 610, h: 186 },
  // доска 2
  spec: { x: BOARD2 + 40, y: 140, w: 440 },
  table: { x: BOARD2 + 520, y: 140, w: 720, head: 92, row: 48 },
}
export const TABLE_H = S4.table.head + PARITY.length * S4.table.row + 12
export const tableRowY = (i: number) => S4.table.y + S4.table.head + i * S4.table.row + 30 // базовая линия строки i
// Таблица паритета целиком — рамка горячей точки «Отличие в таблице паритета»
export const TABLE_BOX = { x: S4.table.x - 6, y: S4.table.y - 6, w: S4.table.w + 12, h: TABLE_H + 12 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: эталон Б и ваше приложение крупнее, пока эталона А рядом нет
  s1near: { x: 845, y: 240, zoom: 1.2 },
} as const
