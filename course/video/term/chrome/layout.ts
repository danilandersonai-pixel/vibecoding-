import { monoChars } from '../text'
import { HEADER, MONO, SAFE } from '../theme'

// Геометрия шапки: Header и Verdict стоят на одной строке и считают позиции по ширине знака Martian Mono.

/** Ширина одного знака Martian Mono 24 px, px. */
export const CELL = MONO.size * MONO.advance
/** Базовая линия текста шапки: цифры по центру над полосой глав (она занимает последние 2 px полосы y 32–80). */
export const BASELINE = HEADER.y + HEADER.h / 2 + 6
/** Левый край и правый край шапки — поля кадра. */
export const LEFT = SAFE.x
export const RIGHT = SAFE.x + SAFE.w
/** Знаков в строке шапки. */
export const HEADER_COLS = monoChars(SAFE.w)

/**
 * Сколько знаков шапки остаётся названию главы: слева id ролика, два пробела, номер, «/07 · »; справа — right знаков
 * (ссылка на книгу или метки ошибки) и промежуток в три знака; right = 0 — справа ничего.
 */
export function titleRoom(lessonId: string, right: number): number {
  return HEADER_COLS - ([...lessonId].length + 2 + 2) - 3 - 3 - (right > 0 ? right + 3 : 0)
}

/** Сколько знаков шапки занимают px справа (с запасом на неточность дробной ширины знака). */
export const cellsFor = (px: number) => Math.max(0, Math.ceil(px / CELL - 1e-6))

/** Ссылка на книгу в шапке: не длиннее max знаков; если рядом с названием главы ей остаётся меньше min — название не помещается. */
export const HEADER_BOOK = { max: 56, min: 24 }

/** Сколько знаков остаётся ссылке на книгу рядом с названием главы title (не больше HEADER_BOOK.max). */
export function bookRoom(lessonId: string, title: string): number {
  return Math.min(HEADER_BOOK.max, HEADER_COLS - ([...lessonId].length + 2 + 2) - 3 - 3 - [...title].length - 3)
}

/** Метки сцены-ошибки (Verdict): поле текста в плашке, промежуток между плашками, подписи. */
export const PILL = { pad: 14, gap: 16, y: HEADER.y + 3, h: HEADER.h - 10 }
export const VERDICT_LABEL = { mistake: 'Типичная ошибка', wrong: 'Неверно', right: 'Верно' }

/** Ширина плашки с подписью label, px. */
export const pillWidth = (label: string) => [...label].length * CELL + 2 * PILL.pad

/** Сколько места справа в шапке занимают метки сцены-ошибки, px: «Типичная ошибка» и, если есть вердикты, место под самый широкий. */
export function verdictWidth(hasVerdicts: boolean): number {
  return pillWidth(VERDICT_LABEL.mistake) + (hasVerdicts ? pillWidth(VERDICT_LABEL.wrong) + PILL.gap : 0)
}
