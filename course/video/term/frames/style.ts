import type { CSSProperties } from 'react'
import { T } from '../theme'

// Общие помощники разметки кадров без записей (Figure, Board, Agenda, Recap).

/** Стиль текста Golos Text: кегль и вес (по умолчанию 500). */
export const golos = (size: number, weight = 500): CSSProperties => ({ fontFamily: T.font, fontSize: size, fontWeight: weight })

/** Число для разметки: не больше двух знаков после запятой. */
export const n = (v: number): number => +v.toFixed(2)
