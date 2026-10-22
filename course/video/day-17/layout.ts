// Общие координаты холста 1280×720 ролика дня 17 «Замеры и фото прогресса» и модель примера:
// замеры Анны, фото, ссылки и правило доступа. По ним рисуют сцены, ставится камера
// и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560): к ней переезжает камера.
// Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

// ---- Пример: замеры и фото Анны (числа — пример ролика, не данные книги) ----

/** Номер Анны в базе — он же папка её фото в хранилище. */
export const ANNA = 17
/** Дни замеров: раз в неделю, пять недель — месяц от первого до последнего. */
export const MEASURED = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']
export const WEIGHT = [64.2, 64.0, 64.1, 63.9, 63.8]
export const WAIST = [78, 77.5, 76.5, 76, 75.5]
export const HIPS = [98, 97.5, 97, 96.5, 96]
/** Фото — раз в две недели, в дни замеров. */
export const PHOTOS = ['2026-09-07', '2026-09-21', '2026-10-05']
export const photoPath = (date: string) => `${ANNA}/${date}.jpg`
/** Подпись даты на снимке: 2026-10-05 → 5.10. */
export const shortDate = (date: string) => `${Number(date.slice(8, 10))}.${date.slice(5, 7)}`
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

const fmt = (v: number) => String(v).replace('.', ',')
/** Форма замеров на телефоне Анны — значения последней недели. */
export const FORM = [
  { label: 'Вес', value: `${fmt(WEIGHT[4])} кг` },
  { label: 'Талия', value: `${fmt(WAIST[4])} см` },
  { label: 'Бёдра', value: `${fmt(HIPS[4])} см` },
]
/** Шкалы двух графиков: вес почти стоит, талия идёт вниз. */
export const TREND = {
  weight: { min: 62, max: 66 },
  waist: { min: 74, max: 80 },
}

// ---- Ссылки и правило доступа (решение примера, как в Supabase Storage) ----

const LAST = photoPath(PHOTOS[PHOTOS.length - 1])
/** Постоянная ссылка публичного хранилища. */
export const LINK_PUBLIC = `…/public/photos/${LAST}`
/** Подписанная ссылка приватного хранилища: путь и токен с сроком. */
export const LINK_SIGNED = `…/sign/photos/${LAST}`
export const TOKEN = '?token=eyJhbGciOi…'
/** Срок подписанной ссылки в примере, минут. */
export const SIGNED_MIN = 5

export type Viewer = 'Анна' | 'Марина' | 'Дима' | 'Олег' | 'тест 2'
// Чья папка у подопечного и кто его тренер
const FOLDER: Partial<Record<Viewer, number>> = { Анна: 17, Олег: 18 }
const COACH_OF: Partial<Record<Viewer, number[]>> = { Марина: [17], Дима: [18] }

/** Правило примера: файлы папки читают её владелец и его тренер. */
export function mayRead(viewer: Viewer, folder: number): boolean {
  return FOLDER[viewer] === folder || (COACH_OF[viewer] ?? []).includes(folder)
}

export type Link = { kind: 'public' } | { kind: 'signed'; ageMin: number }

/** Откроется ли фото по ссылке: публичная — только в публичном хранилище; подписанная — у любого, пока не истекла. */
export function opens(storage: 'public' | 'private', link: Link, fileExists = true): boolean {
  if (!fileExists) return false
  if (link.kind === 'public') return storage === 'public'
  return link.ageMin < SIGNED_MIN
}

/** Строки правила на экране сцены 3. */
export const RULE: { viewer: Viewer; who: string; ok: boolean }[] = (
  [
    ['Анна', 'Анна'],
    ['Марина', 'Марина, тренер'],
    ['Дима', 'Дима'],
    ['Олег', 'Олег'],
  ] as [Viewer, string][]
).map(([viewer, who]) => ({ viewer, who, ok: mayRead(viewer, ANNA) }))

/** Чек-лист сцены 4 — по порядку реплик. */
export const CHECKS = ['в панели: хранилище приватное', 'инкогнито: свежая ссылка — фото', `через ${SIGNED_MIN} минут — ошибка`, 'второй пользователь — отказ', 'фото удалено — файла нет']

// ---- Сцена 1 (вступление): план дня вверху, весы и Анна внизу ----
export const S1 = {
  cards: { x: 90, y: 96, w: 340, h: 150, gap: 40 },
  scale: { x: 230, y: 330, w: 270, h: 120 },
  anna: { x: 640, y: 388 },
  body: { x: 860, y: 380 },
}
export const s1CardX = (i: number) => S1.cards.x + i * (S1.cards.w + S1.cards.gap)

// ---- Сцена 2: доска 1 — замеры (телефон, база, графики); доска 2 — фото (телефон, хранилище, таблица, страница) ----
export const S2 = {
  phone: { x: 190, y: 330 },
  db: { x: 560, y: 330 },
  browser: { x: 760, y: 110, w: 480, h: 330 },
  marina: { x: 700, y: 486 },
  phone2: { x: BOARD2 + 170, y: 330 },
  storage: { x: BOARD2 + 340, y: 104, w: 400, h: 262 },
  table: { x: BOARD2 + 340, y: 392, w: 400, h: 136 },
  browser2: { x: BOARD2 + 800, y: 110, w: 440, h: 330 },
  agent: { x: BOARD2 + 795, y: 488 },
  marina2: { x: BOARD2 + 930, y: 486 },
}
/** Миниатюры в хранилище: (x, y) левого верхнего угла i-й. */
export const THUMB = { w: 104, h: 118, gap: 18 }
export const storageThumbX = (left: number, i: number) => left + 24 + i * (THUMB.w + THUMB.gap)
// Хранилище и таблица фото — рамка горячей точки «Фото: файл и путь»
export const DATA_BOX = { x: S2.storage.x - 10, y: S2.storage.y - 10, w: S2.storage.w + 20, h: S2.table.y + S2.table.h - S2.storage.y + 20 }

// ---- Сцена 3: доска 1 — публичная ссылка уходит в чат; доска 2 — приватное хранилище ----
export const S3 = {
  thumb: { x: 120, y: 92 },
  link: { x: 640, y: 128 },
  tagY: 186,
  stranger: { x: 1040, y: 160 },
  anna: { x: 130, y: 420 },
  friend: { x: 330, y: 420 },
  chat: { x: 450, y: 296, w: 400, h: 184 },
  crowd: [940, 1040, 1140],
  crowdY: 380,
  tea: { x: 880, y: 456, w: 350, h: 92 },
  // доска 2
  storage: { x: BOARD2 + 60, y: 96, w: 420, h: 276 },
  table: { x: BOARD2 + 60, y: 392, w: 420, h: 120 },
  rule: { x: BOARD2 + 520, y: 96, w: 330, h: 276 },
  signed: { x: BOARD2 + 890, y: 96, w: 350, h: 276 },
  chat2: { x: BOARD2 + 890, y: 392, w: 350, h: 116 },
  anna2: { x: BOARD2 + 600, y: 476 },
  marina2: { x: BOARD2 + 770, y: 476 },
}
// Хранилище, правило и подписанная ссылка — рамка горячей точки «Приватное хранилище»
export const PRIVATE_BOX = { x: S3.storage.x - 10, y: S3.storage.y - 10, w: S3.signed.x + S3.signed.w - S3.storage.x + 20, h: S3.storage.h + 18 }

// ---- Сцена 4: чек-лист слева, окно проверки справа ----
export const S4 = {
  list: { x: 60, y: 96, w: 560, head: 64, row: 52 },
  win: { x: 680, y: 96, w: 540, h: 320 },
  you: { x: 130, y: 492 },
  test2: { x: 300, y: 492 },
  agent: { x: 760, y: 492 },
}
export const LIST_H = S4.list.head + CHECKS.length * S4.list.row + 16
// Чек-лист целиком — рамка горячей точки «Проверьте у себя»
export const CHECKS_BOX = { x: S4.list.x - 10, y: S4.list.y - 10, w: S4.list.w + 20, h: LIST_H + 20 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: весы и Анна крупнее, пока плана дня вверху нет
  s1close: { x: 600, y: 450, zoom: 1.4 },
  // сцена 2: страница Марины и адрес фото крупно (остальное к этому времени погасло)
  s2link: { x: BOARD2 + 1020, y: 280, zoom: 1.25 },
  // сцена 4: окно проверки крупнее, пока чек-листа нет
  s4win: { x: 950, y: 266, zoom: 1.28 },
} as const
