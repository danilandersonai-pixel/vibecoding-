// Общие координаты холста 1280×720 ролика дня 21 «Запуск»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

/** Рамка горячей точки: прямоугольник с запасом pad со всех сторон. */
const around = (r: Rect, pad = 10): Rect => ({ x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad })

// Адреса примера: с дня 7 — служебный адрес хостинга, сегодня — свой домен
export const OLD_URL = 'trener.vercel.app'
export const DOMAIN = 'trener.app'

// ---- Сцена 1 (что строим): доска 1 — свой домен, доска 2 — страница о продукте и политика ----

// Регистратор доменов, проект на Vercel и окно браузера — слева направо
export const REG: Rect = { x: 40, y: 116, w: 380, h: 250 }
export const VER: Rect = { x: 470, y: 116, w: 380, h: 250 }
export const BR1: Rect = { x: 880, y: 116, w: 360, h: 250 }
// Строки внутри карточек (от верха карточки): заголовок, линия, строка домена, линия, две строки ниже
export const CARD_Y = { title: 42, rule: 58, row1: 96, rule2: 132, row2: 172, row3: 216 }
// DNS-записи у регистратора (решение хостинга, s81): запись A — основной адрес, CNAME — www
export const DNS = [
  { type: 'A', name: DOMAIN },
  { type: 'CNAME', name: 'www' },
]
// Путь записей: от проекта на Vercel вниз, влево и вверх к регистратору; подписи — на нём и под ним
export const DNS_LANE = 412
export const DNS_PILL = { x: 445, y: DNS_LANE }
export const WAIT_PILL = { x: 445, y: 466 }
// Бета-тест позади: четыре тренера дня 19 — слева от окна браузера, пока камера крупно (до появления проекта)
export const BETA = ['Полина', 'Кирилл', 'Тимур', 'Ксения']
export const BETA_COL = { x: 760, head: 122, y: 160, step: 48 }
// Вы — под окном браузера (появляетесь, когда камера отъехала)
export const YOU1 = { x: 1060, y: 470 }
// Свой домен целиком: регистратор, проект, путь записей и срок — рамка горячей точки «Свой домен»
export const DOMAIN_BOX: Rect = { x: REG.x - 10, y: REG.y - 10, w: VER.x + VER.w - REG.x + 20, h: WAIT_PILL.y + 18 - REG.y + 20 }

// Страница о продукте: три ответа строками (от верха окна)
export const BR2: Rect = { x: BOARD2 + 40, y: 100, w: 720, h: 420 }
export const PAGE = { title: 84, rowTop: 114, rowH: 64, rowGap: 14, valueX: 210, footerRule: 352, footer: 390 }
export const PAGE_ROWS = [
  { q: 'Для кого', a: 'тренеры и их подопечные' },
  { q: 'Что умеет', a: 'тренировки, прогресс, питание, замеры' },
  { q: 'Как начать', a: '' },
]
/** Верх строки i страницы о продукте (в координатах окна). */
export function pageRowY(i: number): number {
  return PAGE.rowTop + i * (PAGE.rowH + PAGE.rowGap)
}
// Политика конфиденциальности: пока только вопросы, ответы — в сцене 2
export const POL1: Rect = { x: BOARD2 + 800, y: 100, w: 440, h: 420 }

// ---- Сцена 2 (подводный камень): доска 1 — общий шаблон и что хранит приложение, доска 2 — политика ----

export const TPL: Rect = { x: 40, y: 110, w: 440, h: 330 }
export const TPL_ROWS = ['собираем имя и почту', 'для улучшения сервиса', 'храним бережно']
// Что приложение хранит на деле: три плитки столбиком, справа — Анна
export const TILES = { x: 580, y: 150, w: 340, h: 100, gap: 18 }
export const TILE_ITEMS = [
  { title: 'Вес и замеры', day: 'день 17', icon: 'scale' },
  { title: 'Фото тела', day: 'день 17', icon: 'photo' },
  { title: 'Дневник питания', day: 'день 16', icon: 'plate' },
] as const
/** Верх плитки i. */
export function tileY(i: number): number {
  return TILES.y + i * (TILES.h + TILES.gap)
}
export const ANNA2 = { x: 1110, y: 360 }

// Политика по своим данным: пять вопросов (решение примера; что именно требует закон — смотрите
// закон своей страны). Комментарии здесь забыты нарочно — их находит проверка в сцене 3.
export const POL2 = { x: BOARD2 + 40, y: 100, w: 760 }
export const POL_ROW = { head: 64, h: 66, labelW: 190, valueX: 236 }
export const POLICY = [
  { q: 'Что собираем', a: 'тренировки, вес и замеры, фото, питание' },
  { q: 'Зачем', a: 'чтобы тренер вёл подопечного' },
  { q: 'Кто видит', a: 'сам подопечный и его тренер' },
  { q: 'Где хранится', a: 'база и хранилище файлов Supabase' },
  { q: 'Как удалить', a: 'кнопка «Удалить аккаунт»: строки и фото' },
]
export const POL2_H = POL_ROW.head + POLICY.length * POL_ROW.h + 12
// Политика целиком — рамка горячей точки «Политика по своим данным»
export const POLICY_BOX: Rect = around({ ...POL2, h: POL2_H })
// Кто видит данные Анны: Анна и Марина; Диме закрыто
export const SEE = { anna: { x: BOARD2 + 920, y: 236 }, marina: { x: BOARD2 + 1150, y: 236 }, dima: { x: BOARD2 + 1035, y: 436 }, lock: { x: BOARD2 + 1035, y: 196 } }
export const LAW_PILL = { x: POL2.x + POL2.w / 2, y: 544 }

// ---- Сцена 3 (проверьте у себя): доска 1 — данные против политики, удаление, телефон; доска 2 — чек-листы ----

export const TODO = { x: 40, y: 100, w: 470, head: 58, row: 58 }
export const TODO_ITEMS = ['все данные — в политике', 'удаление стирает всё', 'новый адрес — на телефоне', 'чек-лист главы 7', 'истории провалов · глава 8']
export const TODO_H = TODO.head + TODO_ITEMS.length * TODO.row + 10
// Что хранит приложение (список агента) и есть ли это в политике
export const DATA = { x: 540, y: 100, w: 700, head: 56, row: 44 }
export const DATA_ROWS = ['тренировки и подходы · база', 'вес и замеры · база', 'фото тела · хранилище', 'дневник питания · база', 'комментарии · база']
export const DATA_H = DATA.head + DATA_ROWS.length * DATA.row + 12
export const AGENT3 = { x: 600, y: 470 }
export const DEL: Rect = { x: 680, y: 410, w: 270, h: 146 }
export const PHONE3: Rect = { x: 970, y: 410, w: 270, h: 146 }

// Чек-лист главы 7 «перед первым релизом» (s45) своими словами; статус от агента: сделано, не знаю, не сделано
export const CH7 = { x: BOARD2 + 40, y: 100, w: 640, head: 60, row: 52 }
export type Status = 'done' | 'unsure' | 'todo' | 'fixed'
export const RELEASE_CHECK: { text: string; first: Status }[] = [
  { text: 'ввод проверяет сервер', first: 'unsure' },
  { text: 'запрос проверяет владельца', first: 'done' },
  { text: 'секреты — вне кода', first: 'done' },
  { text: 'ошибка — человеку и в журнал', first: 'done' },
  { text: 'сквозные тесты главных путей', first: 'done' },
  { text: 'копии и проверенный откат', first: 'todo' },
]
// Какие «сделано» проверяем руками (номера пунктов с 0)
export const BY_HAND = [1, 4]
export const CH7_H = CH7.head + RELEASE_CHECK.length * CH7.row + 12
// Чек-лист главы 7 целиком — рамка горячей точки «Чек-лист перед первым релизом»
export const CHECK_BOX: Rect = around({ x: CH7.x, y: CH7.y, w: CH7.w, h: CH7_H })
// Истории провалов главы 8 (s82) и урок каждой — своими словами
export const CH8 = { x: BOARD2 + 700, y: 100, w: 540, head: 60, row: 52, lessonX: 180 }
export const FAILS = [
  { name: 'Replit', lesson: 'боевые данные — не агенту' },
  { name: 'Tea', lesson: 'хранилище закрыто' },
  { name: 'Lovable', lesson: 'RLS включён' },
  { name: 's1ngularity', lesson: 'секреты не в файлах' },
  { name: 'Cline', lesson: 'ботам — минимум прав' },
  { name: 'PocketOS', lesson: 'копии — вне доступа агента' },
]
export const CH8_H = CH8.head + FAILS.length * CH8.row + 12
export const UNDER_Y = 528

// ---- Сцена 4 (итог курса): путь 21 дня, что построено, герои, план на месяц ----

export const PATH = { y: 150, label: 196, sub: 222, week: 136 }
// Значки над вехами пути: идея в двух абзацах (день 1), телефон (день 7), щит (день 14), свой адрес (день 21)
export const IDEA: Rect = { x: 122, y: 70, w: 96, h: 56 }
export const SITE: Rect = { x: 988, y: 72, w: 164, h: 52 }
export const WEEKS = ['неделя 1', 'неделя 2', 'неделя 3']
export const MILESTONES = [
  { x: 170, day: 'День 1', sub: 'идея в двух абзацах' },
  { x: 470, day: 'День 7', sub: 'первая версия' },
  { x: 770, day: 'День 14', sub: 'надёжность' },
  { x: 1070, day: 'День 21', sub: `запуск · ${DOMAIN}` },
]
export const BUILT = ['вход для двух ролей', 'тренировки', 'питание', 'замеры и фото', 'без интернета', 'тесты и копии', 'бета-тест']
export const BUILT_Y = 262
export const HEROES_Y = 470
export const TEST_CARD: Rect = { x: 120, y: 326, w: 440, h: 64 }
// План развития на месяц (пример): отложенное из отзывов, забота по расписанию, одна область — агенту (s76)
export const PLAN_CARD = { x: 700, y: 312, w: 540, head: 54, row: 34 }
export const PLAN = ['тёмная тема — просил Олег, день 8', 'приглашение по номеру — Кирилл', 'раз в неделю — разбор ошибок', 'раз в месяц — восстановить копию', 'агенту — обновление библиотек']
export const PLAN_H = PLAN_CARD.head + PLAN.length * PLAN_CARD.row + 10
// План целиком — рамка горячей точки «План на месяц»
export const PLAN_BOX: Rect = around({ x: PLAN_CARD.x, y: PLAN_CARD.y, w: PLAN_CARD.w, h: PLAN_H })

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: окно браузера со старым адресом крупно, пока регистратора и проекта нет
  s1browser: { x: 970, y: 238, zoom: 1.55 },
  // сцена 2: общий шаблон и места под данные крупнее, пока Анны нет
  s2template: { x: 480, y: 320, zoom: 1.15 },
  // сцена 3: что сделать у себя крупнее, пока списка агента нет
  s3todo: { x: 330, y: 300, zoom: 1.2 },
  // сцена 4: путь 21 дня целиком и крупнее, пока героев, теста и плана нет
  s4path: { x: 637, y: 190, zoom: 1.1 },
} as const
