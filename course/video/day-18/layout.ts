// Общие координаты холста 1280×720 ролика дня 18 «Тренировка без интернета»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Здесь же данные подходов и расчёты — числа на экране берутся
// отсюда и проверяются тестом. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

// ---- Данные примера и расчёты ----

export type PlanSet = { reps: number; kg: number }
export type WorkSet = PlanSet & { id: string }

/** Число по-русски: запятая вместо точки. */
export const ru = (v: number) => String(v).replace('.', ',')
export const kgText = (v: number) => `${ru(v)} кг`
export const setText = (s: PlanSet) => `${s.reps} × ${ru(s.kg)} кг`

// Три подхода Анны, присед. Номер подхода телефон создаёт сам при записи; в кадре он укорочен
// до четырёх знаков (настоящий — длинная случайная строка).
export const SETS: WorkSet[] = [
  { id: 'a3f9', reps: 5, kg: 50 },
  { id: '7c21', reps: 5, kg: 50 },
  { id: 'e05b', reps: 5, kg: 55 },
]

/** Объём — сумма по подходам: повторы × вес. */
export function volumeOf(sets: PlanSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.kg, 0)
}

/** Сервер без защиты: записывает всё, что пришло, — повтор становится второй строкой. */
export function storeBlind(stored: WorkSet[], set: WorkSet): WorkSet[] {
  return [...stored, set]
}

/** Сервер с защитой от дублей: подход с уже записанным номером второй раз не записывается (ответ — всё равно «принято»). */
export function storeOnce(stored: WorkSet[], set: WorkSet): WorkSet[] {
  return stored.some((s) => s.id === set.id) ? stored : [...stored, set]
}

/** Правка подхода по его номеру: меняется только этот подход. */
export function editSet(sets: WorkSet[], id: string, patch: Partial<PlanSet>): WorkSet[] {
  return sets.map((s) => (s.id === id ? { ...s, ...patch } : s))
}

/** Сделанное расходится с планом — это показывают, а не решают молча. */
export function differs(plan: PlanSet, done: PlanSet): boolean {
  return plan.reps !== done.reps || plan.kg !== done.kg
}

// План Марины на сегодня и после её правки: в третьем подходе 52,5 кг вместо 55.
export const PLAN: PlanSet[] = [
  { reps: 5, kg: 50 },
  { reps: 5, kg: 50 },
  { reps: 5, kg: 55 },
]
export const PLAN_NEW: PlanSet[] = PLAN.map((p, i) => (i === 2 ? { ...p, kg: 52.5 } : p))
// Без связи Анна поправила третий подход: 4 повтора, а не 5.
export const EDITED: WorkSet[] = editSet(SETS, 'e05b', { reps: 4 })

export const VOLUME = volumeOf(SETS) // 775
export const VOLUME_DOUBLE = volumeOf(storeBlind(SETS, SETS[2])) // 1050
export const VOLUME_EDITED = volumeOf(EDITED) // 720

// ---- Крупный телефон: рамка и экран в координатах холста ----

// Телефон рисуется прямо в координатах холста (без масштаба): текст на экране не мельче 18 px.
export const HAND = { w: 300, h: 420, side: 10, top: 30, bottom: 16 }

/** Экран телефона с левым верхним углом рамки (x, y). */
export function screenOf(p: { x: number; y: number }): Rect {
  return { x: p.x + HAND.side, y: p.y + HAND.top, w: HAND.w - 2 * HAND.side, h: HAND.h - HAND.top - HAND.bottom }
}

// Раскладка экрана (от верха экрана): строка состояния, шапка, три строки подходов, ввод подхода
export const SCREEN = { status: 22, title: 62, line: 76, rowTop: 88, rowH: 62, rowStep: 70, form: 306, formH: 46 }
export const rowTop = (s: Rect, i: number) => s.y + SCREEN.rowTop + i * SCREEN.rowStep
// Строка подхода: значок 46 px слева, значение 22 px; номер подхода — моноширинный 18 px справа
const ROW_W = HAND.w - 2 * HAND.side - 24

/** Значение подхода (и номер справа) помещается в строку экрана телефона. */
export function fitsRow(text: string, withId = true): boolean {
  return 46 + text.length * 22 * 0.56 + (withId ? 12 + 4 * 18 * 0.62 + 10 : 10) <= ROW_W
}

/** Пометка под значением (18 px, после значка) помещается в строку. */
export function fitsNote(text: string): boolean {
  return 66 + text.length * 18 * 0.56 <= ROW_W - 6
}

// Пометки строк подхода на телефоне
export const NOTES = { queued: 'не отправлено', sent: 'отправлено', plan: `новый план: ${ru(PLAN_NEW[2].kg)}` }

// ---- Сцена 1 (вступление): подвальный зал, связь мигает; доска 2 — последние 30% и план дня ----

export const S1 = {
  room: { x: 60, y: 110, w: 460, h: 400 },
  anna: { x: 190, y: 392 },
  signal: { x: 400, y: 214 },
  barbell: { x: 390, y: 470 },
  path: { y: 300, x1: 534, x2: 780 },
  coach: { x: 790, y: 160, w: 290, h: 220 },
  marina: { x: 1170, y: 390 },
  last: { x: BOARD2 + 60, y: 110, w: 540, head: 70, row: 50, rowH: 42 },
  plan: { x: BOARD2 + 680, y: [130, 330], w: 540, h: 140 },
}
// Последние 30% (глава 3, таблица): все семь областей, которые ИИ часто упускает
export const LAST30 = ['Обработка ошибок', 'Необычные случаи', 'Безопасность', 'Скорость', 'Связь с другими сервисами', 'Эксплуатация', 'Поддерживаемость']
export const LAST_H = S1.last.head + LAST30.length * S1.last.row + 12
export const DAY_PLAN = [
  { title: 'Записать без интернета', sub: 'в подвале, где нет сети' },
  { title: 'Отправить, когда связь есть', sub: 'и подходы у Марины' },
]

// ---- Сцена 2: подход сначала на телефоне, очередь, отправка после связи ----

export const S2 = {
  anna: { x: 95, y: 400 },
  phone: { x: 180, y: 96 },
  signal: { x: 548, y: 222 },
  server: { x: 650, y: 300 },
  coach: { x: 790, y: 96, w: 440, h: 300 },
  marina: { x: 1010, y: 462 },
}
// Экран Марины: строки подходов и объём (от верха карточки)
export const COACH = { sub: 86, rowTop: 102, rowH: 42, rowStep: 50, volume: 284 }
// Телефон с очередью — рамка горячей точки «Очередь на телефоне» (с запасом 12 px вокруг рамки и тени)
export const QUEUE_BOX: Rect = { x: S2.phone.x - 12, y: S2.phone.y - 12, w: HAND.w + 26, h: HAND.h + 30 }

// ---- Сцена 3: двойная отправка и номер подхода (доска 1), конфликт и правило (доска 2) ----

export const S3 = {
  phone: { x: 50, y: 96 },
  signal: { x: 415, y: 222 },
  db: { x: 480, y: 96, w: 330, h: 380, head: 70, row: 56, rowH: 48 },
  coach: { x: 860, y: 96, w: 370, h: 250 },
  marina: { x: 1045, y: 440 },
  phone2: { x: BOARD2 + 60, y: 96 },
  rec: { x: BOARD2 + 420, y: 96, w: 420 },
  plan: { x: BOARD2 + 890, y: 96, w: 340, h: 330 },
}
/** Верх строки i базы на холсте. */
export const dbRow = (i: number) => S3.db.y + S3.db.head + i * S3.db.row
// Телефон, путь и база — рамка горячей точки «Номер подхода»
export const ID_BOX: Rect = { x: S3.phone.x - 12, y: S3.phone.y - 12, w: S3.db.x + S3.db.w + 12 - (S3.phone.x - 12), h: HAND.h + 30 }
// Доска 2: одна запись на сервере (подводный камень) и две отдельные (правило примера)
export const REC = { oneY: 120, oneH: 196, planY: 96, planH: 150, setsY: 270, setsH: 170 }
// Телефон Анны, записи сервера и план Марины — рамка горячей точки «План и подходы — отдельно»
export const SPLIT_BOX: Rect = { x: S3.phone2.x - 12, y: S3.phone2.y - 12, w: S3.plan.x + S3.plan.w + 12 - (S3.phone2.x - 12), h: HAND.h + 30 }

// ---- Сцена 4: проверьте у себя ----

export const TODAY = ['режим полёта: три подхода', '«не отправлено», перезапуск', 'у тренера ровно три', 'тест: тот же номер дважды', 'поломка — тест красный', 'конфликт: ничего не пропало']
export const S4 = {
  phone: { x: 60, y: 96 },
  coach: { x: 400, y: 96, w: 300, h: 300 },
  ask: { x: 60, y: 96, w: 640, h: 80 },
  term: { x: 60, y: 190, w: 640 },
  term2: { x: 60, y: 380, w: 640 },
  list: { x: 740, y: 96, w: 490, head: 62, row: 58 },
}
export const LIST_H = S4.list.head + TODAY.length * S4.list.row + 12
// Список проверок — рамка горячей точки «Проверка без интернета»
export const CHECK_BOX: Rect = { x: S4.list.x - 10, y: S4.list.y - 10, w: S4.list.w + 20, h: LIST_H + 20 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое (с тенью телефона,
// низ на y 524) остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 2: Анна, телефон и сервер крупнее, пока экрана Марины нет
  s2close: { x: 330, y: 356, zoom: 1.2 },
  // сцена 3: телефон, путь и база крупнее, пока экрана Марины нет
  s3close: { x: 330, y: 356, zoom: 1.2 },
  // сцена 4: телефон и экран тренера крупнее, пока списка проверок нет
  s4close: { x: 380, y: 352, zoom: 1.15 },
} as const
