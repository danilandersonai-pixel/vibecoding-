// Общие координаты холста 1280×720 ролика «Фоновые агенты»: по ним рисуют сцены,
// ставится камера и считаются горячие точки. Вторая «доска» — справа от кадра (x 1280–2560),
// третья — ещё правее (x 2560–3840): к ним переезжает камера.

export const BOARD2 = 1280
export const BOARD3 = 2560

// Телефон крупнее натуральной величины: текст экрана 12 px × 1,5 = 18 px в кадре (размеры общие для набора).
export { PHONE_FONT, PHONE_SCALE } from '../kit/screens/layout'

type Rect = { x: number; y: number; w: number; h: number }

// Сцена 1: Марина пишет записку стажёру, стажёр заполняет расписание зала, Марина тренирует Анну;
// вечером — чек-лист приёмки и возврат на доработку; стажёр становится агентом.
export const S1 = {
  marina: { x: 150, y: 410 },
  // вечером Марина подходит к чек-листу
  marinaEvening: { x: 330, y: 410 },
  anna: { x: 450, y: 420 },
  intern: { x: 760, y: 410 },
  note: { x: 250, y: 96, w: 470, row: 52 },
  // расписание: пять дней по три занятия
  table: { x: 850, y: 96, w: 380, h: 300 },
  grid: { x: 868, y: 186, col: 70, row: 64, cellW: 62, cellH: 54 },
  sun: { x: 266, y: 150 },
  check: { x: 430, y: 96, w: 360, row: 54 },
}
export const S1_NOTE_H = 72 + 3 * S1.note.row
export const S1_CHECK_H = 70 + 3 * S1.check.row

// Сцена 2: четыре ступени (доска 1); круг агента в песочнице и пул-реквест (доска 2).
export const S2 = {
  steps: { x: 60, w: 280, gap: 15, bottom: 480, top0: 410, rise: 70 },
  // сценки на третьей и четвёртой ступенях
  pair: { marina: { x: 720, y: 212 }, agent: { x: 860, y: 214 } },
  solo: { x: 1010, y: 142 },
  tasksX: 1150,
  ruleY: 528,
  frame: { x: BOARD2 + 30, y: 96, w: 770, h: 424 },
  node: { w: 200, h: 76 },
  task: { x: BOARD2 + 60, y: 170 },
  plan: { x: BOARD2 + 310, y: 170 },
  act: { x: BOARD2 + 560, y: 170 },
  obs: { x: BOARD2 + 560, y: 380 },
  check: { x: BOARD2 + 310, y: 380 },
  budget: { x: BOARD2 + 640, y: 118, w: 140 },
  pr: { x: BOARD2 + 850, y: 330, w: 390, h: 130 },
  marina: { x: BOARD2 + 1045, y: 205 },
}
// Ступени агента рядом и в фоне со сценками и правилом под ними — рамка горячей точки (левее — карточка «Чат», её не задевает)
export const STEPS_BOX: Rect = { x: 643, y: 64, w: 616, h: 492 }
// Песочница с кругом и пул-реквест — рамка горячей точки
export const LOOP_BOX: Rect = { x: BOARD2 + 22, y: 88, w: 1226, h: 440 }

// Сцена 3: агенты на рынке и три места работы Claude (доска 1); окно приложения с двумя сессиями (доска 2).
export const S3 = {
  names: { y1: 112, y2: 160, gap: 16 },
  pick: { y: 214 },
  cards: { x: 60, y: 252, w: 370, h: 196, gap: 25 },
  laptop: { x: 560, y: 500 },
  app: { x: BOARD2 + 40, y: 96, w: 1200, h: 400 },
  side: 330,
  item: { y: 86, h: 100, gap: 10 },
  panel: { y: 56, h: 300, gap: 20 },
  mergeY: 536,
}
export const CARDS_BOX: Rect = { x: S3.cards.x - 8, y: S3.cards.y - 8, w: 3 * S3.cards.w + 2 * S3.cards.gap + 16, h: S3.cards.h + 16 }
export const APP_BOX: Rect = { x: S3.app.x - 8, y: S3.app.y - 8, w: S3.app.w + 16, h: S3.app.h + 16 }

// Сцена 4: Дима, агент и неудачный пул-реквест; журнал зацикливания (доска 1); три ловушки (доска 2).
export const S4 = {
  dima: { x: 140, y: 410 },
  agent: { x: 470, y: 410 },
  pr: { x: 620, y: 110, w: 610, h: 190 },
  journal: { x: 620, y: 96, w: 610 },
  row: 32,
  budgetY: 456,
  fixY: 516,
  cards: { x: BOARD2 + 40, y: 110, w: 380, h: 370, gap: 30 },
}
// Высота журнала: восемь строк действий
export const JOURNAL_ROWS = 8
export const JOURNAL_H = 40 + 16 * 2 + JOURNAL_ROWS * S4.row
// журнал, бюджет и три плашки «что делать» под ним
export const JOURNAL_BOX: Rect = { x: S4.journal.x - 8, y: S4.journal.y - 8, w: S4.journal.w + 16, h: S4.fixY + 18 + 8 - (S4.journal.y - 8) }
export const TRAPS_BOX: Rect = { x: S4.cards.x - 8, y: S4.cards.y - 8, w: 3 * S4.cards.w + 2 * S4.cards.gap + 16, h: S4.cards.h + 16 }

// Сцена 5: права агента (доска 1); записка из четырёх частей (доска 2); с чего начинать (доска 3).
export const S5 = {
  perms: { x: 60, y: 96, w: 700, row: 54 },
  box: { x: 800, y: 150, w: 200, h: 330 },
  agent: { x: 900, y: 362 },
  marina: { x: 1150, y: 410 },
  keep: { x: 1150, y: 196 },
  cards: { x: BOARD2 + 40, y: 96, w: 580, h1: 160, h2: 236, gap: 20 },
  low: { x: BOARD3 + 60, y: 150, w: 520, row: 66 },
  flow: { x: BOARD3 + 640, y: 170 },
  marina3: { x: BOARD3 + 1180, y: 410 },
}
export const PERMS_H = 70 + 5 * S5.perms.row + 14
export const PERMS_BOX: Rect = { x: S5.perms.x - 8, y: S5.perms.y - 8, w: 1196, h: PERMS_H + 16 }
export const NOTE_BOX: Rect = { x: S5.cards.x - 8, y: S5.cards.y - 8, w: 2 * S5.cards.w + S5.cards.gap + 16, h: S5.cards.h1 + S5.cards.gap + S5.cards.h2 + 16 }

// Сцена 6: пул-реквест и чек-лист приёмки (доска 1); проверка руками и вопрос агенту (доска 2).
export const S6 = {
  pr: { x: 50, y: 90, w: 710, h: 440 },
  check: { x: 800, y: 90, w: 430, row: 54 },
  marina: { x: 1015, y: 445 },
  phone1: { x: BOARD2 + 170, y: 300 },
  phone2: { x: BOARD2 + 470, y: 300 },
  chat: { x: BOARD2 + 660, y: 96, w: 580 },
}
export const S6_CHECK_H = 70 + 4 * S6.check.row
export const ACCEPT_BOX: Rect = { x: S6.pr.x - 8, y: S6.pr.y - 8, w: S6.check.x + S6.check.w - S6.pr.x + 16, h: S6.pr.h + 26 }

// Сцена 7: семь возможностей Claude Code (доска 1); итог — путь задачи от Марины к агенту и обратно (доска 2).
export const S7 = {
  cards: { x: 45, y: 96, w: 280, h: 150, gap: 23, gapY: 24 },
  agent: { x: 1170, y: 486 },
  marina: { x: BOARD2 + 200, y: 420 },
  agent2: { x: BOARD2 + 1080, y: 420 },
  sum: { x: BOARD2 + 60, y: 110, w: 275, h: 130, gap: 20 },
}
export const TOOLS_BOX: Rect = { x: S7.cards.x - 8, y: S7.cards.y - 8, w: 4 * S7.cards.w + 3 * S7.cards.gap + 16, h: 2 * S7.cards.h + S7.cards.gapY + 16 }

// Планы камеры: центр кадра на холсте и приближение. Под каждым планом содержимое
// остаётся выше y ≈ 565 в кадре (там начинается плашка субтитров в две строки)
// и не заходит под плашку сцены вверху слева.
export const SHOT = {
  whole: { x: 640, y: 360, zoom: 1 },
  board2: { x: BOARD2 + 640, y: 360, zoom: 1 },
  board3: { x: BOARD3 + 640, y: 360, zoom: 1 },
  // сцена 1: Марина, записка и стажёр крупно (расписания ещё нет)
  s1left: { x: 450, y: 345, zoom: 1.18 },
  // сцена 1: вечер — чек-лист, расписание и стажёр чуть крупнее
  s1right: { x: 700, y: 330, zoom: 1.08 },
} as const
