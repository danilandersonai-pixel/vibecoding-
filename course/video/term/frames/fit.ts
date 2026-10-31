import { textWidth, wrapText } from '../text'

// Запас на ширину текста Golos Text. Замер (GOLOS.avg) — среднее по репликам, а у отдельной строки знак бывает шире:
// замер на названиях разделов книги, цифрах и ячейках таблиц дал до +6 % у длинных строк и до +12 % у коротких слов с широкими буквами («Абонемент»).
// Кадры схем, досок, плана и итога считают переносы и столбцы с этим запасом, чтобы строка не доходила до края рамки.
export const FIT = 1.08

/** Ширина текста с запасом, px. */
export const fitWidth = (text: string, sizePx: number): number => textWidth(text, sizePx * FIT)

/** Перенос по словам в ширину maxWidth с запасом на ширину знаков. */
export const fitWrap = (text: string, sizePx: number, maxWidth: number): string[] => wrapText(text, sizePx * FIT, maxWidth)
