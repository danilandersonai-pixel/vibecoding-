import type { TermLine } from '../kit/screens/layout'

// Общие координаты холста 1280×720 ролика дня 11 «Комментарии и уведомления»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560): к ней переезжает камера.
// Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

// ---- Данные примера: одни и те же в сценах, тесте и пояснениях ----

/** Тренировки и их участники: подопечный и его тренер (как в пилоте: Анна — у Марины, Олег — у Димы). */
export const WORKOUTS = {
  anna: { client: 'Анна', coach: 'Марина' },
  oleg: { client: 'Олег', coach: 'Дима' },
} as const
export type WorkoutId = keyof typeof WORKOUTS

/** Строка таблицы comments: к какой тренировке, кто написал, текст. */
export type Comment = { workout: WorkoutId; author: string; text: string }

/** Комментарии в базе: два под тренировкой Анны, один под тренировкой Олега. */
export const COMMENTS: Comment[] = [
  { workout: 'anna', author: 'Анна', text: 'ноет колено' },
  { workout: 'anna', author: 'Марина', text: 'присед полегче' },
  { workout: 'oleg', author: 'Дима', text: 'Олег, молодец!' },
]
export const commentText = (c: Comment) => `${c.author}: ${c.text}`

/** Правило доступа словами (то же, что политика POLICY): комментарий читают подопечный этой тренировки и его тренер. */
export function canRead(viewer: string, c: Comment): boolean {
  const w = WORKOUTS[c.workout]
  return viewer === w.client || viewer === w.coach
}

/** Сцена 1: комментарии под тренировкой Анны (понедельник, присед 3 подхода по 5 раз с 50 кг). */
export const ANNA_SAYS = 'Последний подход тяжело, ноет колено'
export const MARINA_SAYS = 'Тогда в четверг присед полегче'
export const SETS = ['5 × 50 кг', '5 × 50 кг', '5 × 50 кг']

/** Таблица, которую агент создал SQL-запросом: RLS у неё не включён. */
export const SQL_CREATE = ['create table comments (', '  id uuid primary key,', '  workout_id uuid', '    references workouts,', '  author_id uuid,', '  body text,', '  created_at timestamptz', ');']

/** RLS включается явно, затем политика на чтение: строку видит тот, кто вошёл, если он подопечный или тренер этой тренировки. */
export const POLICY = ['alter table comments', '  enable row level security;', 'create policy "свои"', 'on comments for select', 'using (workout_id in (', '  select id from workouts', '  where auth.uid() in', '    (client_id, coach_id)))']

/** Спам: пять упражнений по три подхода — уведомление на каждый подход. */
export const EXERCISES = 5
export const SETS_EACH = 3
export const SPAM = Array.from({ length: EXERCISES * SETS_EACH }, (_, i) => `Анна: подход ${i + 1}`)
export const OLEG_NIGHT = ['Олег: подход 1', 'Олег: подход 2', 'Олег: подход 3']

/** Тихие часы: с 22:00 до 08:00 уведомление ждёт утра. */
export const QUIET = { from: '22:00', to: '08:00' }
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
/** Когда получатель увидит уведомление, отправленное в hhmm: в тихие часы — в 08:00, иначе сразу. */
export function deliverAt(hhmm: string): string {
  const t = minutes(hhmm)
  return t >= minutes(QUIET.from) || t < minutes(QUIET.to) ? QUIET.to : hhmm
}

/** Правила уведомлений, которые выбрали вы (ИИ предложил варианты). */
export const RULES = [
  { title: 'Одно на тренировку', sub: '«Анна: 15 подходов»' },
  { title: `Тихие часы ${QUIET.from}–${QUIET.to}`, sub: 'ночью ждёт до утра' },
  { title: 'Настройки', sub: 'каждый выбирает сам' },
  { title: 'Комментарий — сразу', sub: 'отдельно от подходов' },
]

/** Сцена 3: проверка у себя — пункты по репликам. */
export const CHECKS = ['вход: подопечный другого тренера', 'лента и адрес чужой тренировки — пусто', 'тест: чужому — нет, своим — да', '15 подходов → одно уведомление', `23:40 → тренер узнает в ${deliverAt('23:40')}`, 'о комментарии Анны знает Марина']

/** Прогон тестов в сцене 3: доступ к комментариям и правила уведомлений. */
export const TERM: TermLine[] = [
  { text: 'npx vitest run comments notify', kind: 'cmd' },
  { text: 'PASS  Олег не видит комментарий Анны', kind: 'ok' },
  { text: 'PASS  Марина видит комментарий Анны', kind: 'ok' },
  { text: 'PASS  15 подходов: одно уведомление', kind: 'ok' },
  { text: `PASS  23:40: уведомление в ${deliverAt('23:40')}`, kind: 'ok' },
  { text: 'PASS  о комментарии Анны — Марине', kind: 'ok' },
]

// ---- Сцена 1: тренировка Анны с комментариями и уведомления (доска 1); функция целиком и решения до кода (доска 2) ----

export const S1 = {
  card: { x: 290, y: 100, w: 620 },
  anna: { x: 150, y: 450 },
  marina: { x: 1110, y: 450 },
  // уведомления над героями: центр и ширина
  annaNote: { x: 150, y: 306, w: 260 },
  marinaNote: { x: 1110, y: 306, w: 260 },
  // доска 2: три слоя функции снизу вверх и карточка «Решите до кода»
  layers: { x: BOARD2 + 60, y: 110, w: 560, h: 96, gap: 16 },
  ask: { x: BOARD2 + 680, y: 110, w: 560, head: 70, row: 70 },
  you: { x: BOARD2 + 960, y: 480 },
}
// Внутри карточки тренировки (от её верха): шапка, подходы, комментарии, поле ввода
export const CARD = { sets: 64, setsH: 40, line: 124, label: 158, c1: 174, c2: 268, cH: 80, input: 364, inputH: 48 }
export const S1_CARD_H = CARD.input + CARD.inputH + 18
export const layerY = (i: number) => S1.layers.y + i * (S1.layers.h + S1.layers.gap)
export const S1_ASK_H = S1.ask.head + 3 * S1.ask.row + 10
// Три слоя функции — рамка горячей точки «Комментарии целиком»
export const LAYERS_BOX: Rect = { x: S1.layers.x - 14, y: S1.layers.y - 14, w: S1.layers.w + 28, h: 3 * S1.layers.h + 2 * S1.layers.gap + 28 }

// ---- Сцена 2: лента Олега, таблица без RLS и политика (доска 1); уведомления-спам и правила (доска 2) ----

export const S2 = {
  feed: { x: 40, y: 92, w: 380, head: 84, row: 46, rowH: 38 },
  oleg: { x: 120, y: 470 },
  health: { x: 230, y: 380 },
  db: { x: 640, y: 290 },
  badge: { x: 640, y: 140 },
  key: { x: 640, y: 466 },
  editor: { x: 840, y: 92, w: 420 },
  agent: { x: 1050, y: 482 },
  agentTag: { x: 925, y: 466 },
  // доска 2: телефоны Марины и Димы, правила уведомлений
  marina: { x: BOARD2 + 100, y: 470 },
  marinaTag: { x: BOARD2 + 100, y: 362 },
  marinaPhone: { x: BOARD2 + 330, y: 310 },
  dima: { x: BOARD2 + 800, y: 470 },
  dimaPhone: { x: BOARD2 + 600, y: 310 },
  rules: { x: BOARD2 + 880, y: 92, w: 360, head: 64, row: 66 },
  agent2: { x: BOARD2 + 920, y: 505 },
}
export const S2_FEED_H = S2.feed.head + COMMENTS.length * S2.feed.row + 44
export const S2_RULES_H = S2.rules.head + RULES.length * S2.rules.row + 12
/** Телефоны на доске 2 — вдвое крупнее натуральной величины: текст 9 × 2 = 18 px в кадре. */
export const BIG_PHONE = 2
export const BIG_FONT = 9
// Окно политики в редакторе — рамка горячей точки «Правило для комментариев»
export const POLICY_BOX: Rect = { x: S2.editor.x - 10, y: S2.editor.y - 10, w: S2.editor.w + 20, h: 40 + 24 + POLICY.length * 32 + 20 }
// Карточка правил уведомлений — рамка горячей точки «Правила уведомлений»
export const RULES_BOX: Rect = { x: S2.rules.x - 10, y: S2.rules.y - 10, w: S2.rules.w + 20, h: S2_RULES_H + 20 }

// ---- Сцена 3: чек-лист (слева), браузер под чужим входом и прогон тестов (справа) ----

export const S3 = {
  list: { x: 40, y: 92, w: 600, head: 64, row: 58 },
  browser: { x: 680, y: 92, w: 560, h: 170 },
  term: { x: 680, y: 282, w: 560 },
}
export const S3_LIST_H = S3.list.head + CHECKS.length * S3.list.row + 12
// Чек-лист целиком — рамка горячей точки «Проверка чужим входом»
export const LIST_BOX: Rect = { x: S3.list.x - 12, y: S3.list.y - 12, w: S3.list.w + 24, h: S3_LIST_H + 24 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: тренировка Анны и сама Анна крупнее (Марины ещё нет)
  s1close: { x: 560, y: 360, zoom: 1.1 },
  // сцена 2: агент, таблица и редактор крупнее (Олег и лента приходят с отъездом)
  s2right: { x: 700, y: 372, zoom: 1.12 },
  // сцена 3: чек-лист крупнее (браузер и терминал приходят с отъездом)
  s3list: { x: 380, y: 340, zoom: 1.15 },
} as const
