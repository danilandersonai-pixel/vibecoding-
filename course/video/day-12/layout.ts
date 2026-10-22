import { terminalHeight, type TermLine } from '../kit/screens/layout'

// Общие координаты холста 1280×720 ролика дня 12 «Приглашение по ссылке»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560):
// к ней переезжает камера. Файл чистый (без React): его читает сценарий.

export const BOARD2 = 1280

type Rect = { x: number; y: number; w: number; h: number }

// ---- Приглашение из примера (решение примера, а не правило книги) ----

export type Invite = { code: string; coach: string; createdAt: number; hours: number; acceptedBy: string | null; revoked: boolean }
export type InviteResult = 'ok' | 'notfound' | 'accepted' | 'expired' | 'revoked'

const HOUR = 3600_000

// Марина создала приглашение 22.10 в 18:00; срок 48 часов — выбор примера. Время — «настенное», в UTC.
export const INVITE: Invite = { code: 'k7Qx9fLm2aT4', coach: 'Марина', createdAt: Date.UTC(2026, 9, 22, 18, 0), hours: 48, acceptedBy: 'Анна', revoked: false }

const two = (n: number) => String(n).padStart(2, '0')

/** «до 24.10, 18:00» — когда ссылка перестаёт работать. */
export function untilText(inv: Pick<Invite, 'createdAt' | 'hours'>): string {
  const d = new Date(inv.createdAt + inv.hours * HOUR)
  return `до ${two(d.getUTCDate())}.${two(d.getUTCMonth() + 1)}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`
}

/** Проверки сервера по порядку: код из ссылки ищется в базе, дальше — принято ли, срок, отзыв. */
export function inviteCheck(inv: Invite, code: string, now: number): InviteResult {
  if (code !== inv.code) return 'notfound'
  if (inv.acceptedBy !== null) return 'accepted'
  if (now >= inv.createdAt + inv.hours * HOUR) return 'expired'
  if (inv.revoked) return 'revoked'
  return 'ok'
}

// Цепочка проверок на экране — в том же порядке, что в inviteCheck
export const CHAIN: { ask: string; no: string; fails: InviteResult }[] = [
  { ask: 'код есть в базе?', no: 'не найдено', fails: 'notfound' },
  { ask: 'ещё не принято?', no: 'уже принято', fails: 'accepted' },
  { ask: 'срок не истёк?', no: 'срок истёк', fails: 'expired' },
  { ask: 'не отозвано?', no: 'отозвано', fails: 'revoked' },
]

// Экраны телефона в «проверьте у себя»: кто открывает, что приглашение и что должен ответить сервер
const FRESH: Invite = { ...INVITE, acceptedBy: null }
const SECOND: Invite = { ...INVITE, code: 'p3Rv8sNe5yQc', acceptedBy: null, revoked: true }
export const PHONE_CHECKS: { who: string; note: string; invite: Invite; code: string; at: number; result: InviteResult; screen: string[] }[] = [
  { who: 'тест 1', note: 'новая ссылка', invite: FRESH, code: FRESH.code, at: FRESH.createdAt + HOUR, result: 'ok', screen: ['Вы подопечный', 'Марины'] },
  { who: 'тест 2', note: 'та же ссылка', invite: { ...FRESH, acceptedBy: 'тест 1' }, code: FRESH.code, at: FRESH.createdAt + 2 * HOUR, result: 'accepted', screen: ['Ссылка уже', 'использована'] },
  { who: 'тест 3', note: 'отозвана', invite: SECOND, code: SECOND.code, at: SECOND.createdAt + HOUR, result: 'revoked', screen: ['Приглашение', 'отозвано'] },
  { who: 'тест 4', note: 'в тесте: +49 ч', invite: FRESH, code: FRESH.code, at: FRESH.createdAt + 49 * HOUR, result: 'expired', screen: ['Срок ссылки', 'истёк'] },
]

// ---- Сцена 1: вручную сейчас (слева), по ссылке сегодня (справа), план дня (внизу) ----

export const S1 = {
  marina: { x: 130, y: 300 },
  anna: { x: 1150, y: 300 },
  manual: { x: 240, y: 100, w: 380, h: 230 },
  link: { x: 660, y: 100, w: 380, h: 230 },
  plan: { x: [240, 660], y: 410, w: 380, h: 100 },
}

// ---- Сцена 2: браузер Марины, мессенджер, телефон Анны (верх); правила, база, сервер (низ) ----

export const S2 = {
  marina: { x: 92, y: 260 },
  browser: { x: 170, y: 88, w: 400, h: 290 },
  chat: { x: 610, y: 100, w: 310, h: 172 },
  phone: { x: 1050, y: 250 },
  anna: { x: 1190, y: 336 },
  rls: { x: 90, y: 416, w: 370, h: 104 },
  db: { x: 500, y: 416, w: 330, h: 128 },
  server: { x: 960, y: 480 },
}
// окно браузера: кнопка, поле ссылки и строка списка — в координатах окна
export const S2_BTN = { x: 20, y: 96, w: 360, h: 44 }
export const S2_LINK = { x: 20, y: 154, w: 360, h: 44 }
export const S2_ROW = { x: 20, y: 240, w: 360, h: 36 }
// всё, что рисует путь приглашения, — рамка горячей точки «Путь приглашения»
export const FLOW_BOX: Rect = { x: 36, y: 76, w: 1232, h: 486 }

// ---- Сцена 3: вечная ссылка (доска 1), приглашение с замком (доска 2) ----

export const S3 = {
  link: { x: 330, y: 128 },
  tagY: 186,
  whoY: 236,
  count: { x: 640, y: 128 },
  door: { x: 780, y: 150 },
  chat: { x: 60, y: 272, w: 500, h: 150 },
  strangers: [620, 700, 780],
  strangerY: 336,
  list: { x: 880, y: 90, w: 350, h: 280 },
  marina: { x: 1190, y: 470 },
  hacker: { x: 92, y: 474 },
  guess: { x: 310, y: 474 },
  dima: { x: 880, y: 400, w: 240, h: 118 },
  record: { x: BOARD2 + 60, y: 90, w: 520, h: 330 },
  chain: { x: BOARD2 + 640, y: 90, w: 580, h: 334 },
  stranger2: { x: BOARD2 + 92, y: 492 },
  forward: { x: BOARD2 + 280, y: 476 },
  refuse: { x: BOARD2 + 600, y: 476 },
  rlsPill: { x: BOARD2 + 940, y: 476 },
  marina2: { x: BOARD2 + 1200, y: 492 },
}
export const RECORD_ROW = 50
export const CHAIN_ROW = 58
// запись приглашения и цепочка проверок сервера — рамка горячей точки «Приглашение с замком»
export const LOCK_BOX: Rect = { x: S3.record.x - 10, y: S3.record.y - 10, w: S3.chain.x + S3.chain.w - S3.record.x + 20, h: S3.chain.h + 20 }

// ---- Сцена 4: проверки руками и тестом (доска 1), повторный аудит (доска 2) ----

export const CHECKS = ['тестовый аккаунт принял приглашение', 'та же ссылка второй раз → отказ', 'отозванное приглашение → отказ', 'тест: ссылке 49 часов → отказ', 'новичок видит только своё']
export const QUESTIONS = ['откуда данные?', 'кто может вызвать?', 'что сделает злоумышленник?', 'что попадает в журналы?', 'какие права у процесса?', 'что изменилось вне задачи?']
export const S4 = {
  list: { x: 60, y: 90, w: 640, head: 64, row: 54 },
  phone: { x: 900, y: 250 },
  tester: { x: 1100, y: 330 },
  note: { x: 1100, y: 160 },
  under: { x: 900, y: 452 },
  questions: { x: BOARD2 + 60, y: 84, w: 1160, h: 162, col: 576, row: 34 },
  chat: { x: BOARD2 + 60, y: 262, w: 560 },
  term: { x: BOARD2 + 660, y: 258, w: 560 },
}
export const LIST_H = S4.list.head + CHECKS.length * S4.list.row + 6
// пять проверок — рамка горячей точки «Проверки приглашения»
export const CHECKS_BOX: Rect = { x: S4.list.x - 10, y: S4.list.y - 10, w: S4.list.w + 20, h: LIST_H + 20 }
// тесты в терминале: на каждую проверку из списка и на «список тренера не изменился»
export const TESTS: TermLine[] = [
  { kind: 'cmd', text: 'npm test' },
  { kind: 'ok', text: 'PASS приглашение принимается' },
  { kind: 'ok', text: 'PASS второй раз — отказ' },
  { kind: 'ok', text: 'PASS отозванное — отказ' },
  { kind: 'ok', text: 'PASS через 49 часов — отказ' },
  { kind: 'ok', text: 'PASS список тренера не изменился' },
  { kind: 'ok', text: 'PASS чужие тренировки не видны' },
]
export const TERM_LINES = TESTS.length
// шесть вопросов (вверху), чат с агентом и тесты (внизу) — рамка горячей точки «Повторный аудит»
export const AUDIT_BOX: Rect = { x: S4.questions.x - 10, y: S4.questions.y - 10, w: S4.questions.w + 20, h: S4.term.y + terminalHeight(TERM_LINES) + 8 - (S4.questions.y - 10) }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  // сцена 1: Марина и ручное добавление крупнее
  s1close: { x: 400, y: 255, zoom: 1.15 },
  // сцена 2: Марина и её браузер крупнее
  s2browser: { x: 330, y: 250, zoom: 1.25 },
  // сцена 2: сама ссылка крупно (остальное к этому времени гаснет)
  s2link: { x: 320, y: 250, zoom: 1.5 },
  // сцена 4: чуть крупнее весь первый план
  s4near: { x: 628, y: 320, zoom: 1.05 },
} as const
