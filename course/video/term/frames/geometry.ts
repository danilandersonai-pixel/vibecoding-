import type { CSSProperties } from 'react'
import { CELL } from '../chrome/layout'
import type { Rect } from '../frame'
import { monoChars } from '../text'
import { MONO, SAFE, T } from '../theme'

// Геометрия окна записи (терминал, редактор, дифф): всё в координатах холста 1920 × 1080, до камеры.
// Окно занимает весь SAFE: полоса заголовка 48 px и тело с девятнадцатью строками Martian Mono 24 px.

export { CELL }

export const WIN = {
  bar: 48, // полоса заголовка
  radius: 8,
  border: 2,
  pad: 24, // поле текста слева и справа
  rows: 19, // строк в теле: 19 · 36 = 684 из 728 px, по 22 px сверху и снизу
}
/** Высота строки текста. */
export const LH = MONO.line
/** Тело окна под полосой заголовка. */
export const BODY: Rect = { x: SAFE.x, y: SAFE.y + WIN.bar, w: SAFE.w, h: SAFE.h - WIN.bar }
const ROW0 = BODY.y + (BODY.h - WIN.rows * LH) / 2

/** Верх строки i тела окна (с нуля). */
export const rowTop = (i: number) => ROW0 + i * LH
/** Базовая линия текста в строке i. */
export const baseline = (i: number) => rowTop(i) + 26
/** Левый край текста терминала и диффа. */
export const TEXT_X = SAFE.x + WIN.pad
/** Знаков в строке терминала и диффа: окно за вычетом полей. */
export const COLS = monoChars(SAFE.w - 2 * WIN.pad)

/** Стиль строки Martian Mono 24 px: знаки без лигатур, пробелы сохраняются. */
export const MONO_STYLE: CSSProperties = { fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none', whiteSpace: 'pre' }

/** Ширина n знаков, px. */
export const cells = (n: number) => n * CELL

/** Ширина самой длинной из строк в px (не меньше одного знака), плюс extra знаков. */
export const widest = (rows: string[], extra = 0) => cells(Math.max(1, ...rows.map((r) => [...r].length)) + extra)

/** Первые n знаков строки — по знакам Unicode, а не по кодовым единицам. */
export const take = (text: string, n: number) => [...text].slice(0, Math.max(0, n)).join('')

/** Части кадра, вышедшие за SAFE, — для problems. */
export function outsideSafe(layout: Record<string, Rect>): string[] {
  const eps = 0.01
  return Object.entries(layout)
    .filter(([, r]) => r.x < SAFE.x - eps || r.y < SAFE.y - eps || r.x + r.w > SAFE.x + SAFE.w + eps || r.y + r.h > SAFE.y + SAFE.h + eps)
    .map(([name]) => `часть «${name}» выходит за безопасную область`)
}

export type Wrapped = { text: string; /** Номер первого знака строки в исходном тексте. */ from: number }

/**
 * Перенос по словам в строки не длиннее cols знаков (как в терминале): слово длиннее строки режется по знакам,
 * пробел на месте переноса не показывается. Перевод строки считается пробелом. Знаки — Unicode.
 */
export function wrapWords(text: string, cols: number): Wrapped[] {
  const chars = [...text.replace(/\n/g, ' ')]
  const width = Math.max(1, Math.floor(cols))
  const rows: Wrapped[] = []
  let i = 0
  while (i < chars.length) {
    if (chars.length - i <= width) {
      rows.push({ text: chars.slice(i).join(''), from: i })
      break
    }
    let cut = -1
    for (let j = i + width; j > i; j--) {
      if (chars[j] === ' ') {
        cut = j
        break
      }
    }
    if (cut < 0) {
      rows.push({ text: chars.slice(i, i + width).join(''), from: i })
      i += width
    } else {
      rows.push({ text: chars.slice(i, cut).join(''), from: i })
      i = cut + 1
    }
  }
  return rows.length > 0 ? rows : [{ text: '', from: 0 }]
}
