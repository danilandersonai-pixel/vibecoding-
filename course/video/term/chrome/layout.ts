import { HEADER, MONO, SAFE } from '../theme'

// Геометрия шапки: Header и Verdict стоят на одной строке и считают позиции по ширине знака Martian Mono.

/** Ширина одного знака Martian Mono 24 px, px. */
export const CELL = MONO.size * MONO.advance
/** Базовая линия текста шапки: цифры по центру над полосой глав (она занимает последние 2 px полосы y 32–80). */
export const BASELINE = HEADER.y + HEADER.h / 2 + 6
/** Левый и правый край шапки — поля кадра. */
export const LEFT = SAFE.x
export const RIGHT = SAFE.x + SAFE.w
