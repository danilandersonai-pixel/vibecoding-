import { GOLOS, MONO } from './theme'

// Размер текста до отрисовки: кадры считают, сколько знаков влезает и где переносить, чистыми функциями без DOM.

/** Сколько знаков Martian Mono размера size (px) влезает в ширину widthPx. */
export function monoChars(widthPx: number, size: number = MONO.size): number {
  return Math.max(0, Math.floor(widthPx / (size * MONO.advance) + 1e-9))
}

/** Перенос моноширинной строки по ширине, как в терминале: ровно maxChars знаков в строке, отступы сохраняются; пустая строка → ['']. */
export function wrapMono(line: string, maxChars: number): string[] {
  const chars = [...line]
  const width = Math.max(1, Math.floor(maxChars))
  if (chars.length <= width) return [line]
  const rows: string[] = []
  for (let i = 0; i < chars.length; i += width) rows.push(chars.slice(i, i + width).join(''))
  return rows
}

/** Обрезка до maxChars знаков с «…» на конце (с учётом самого «…»). */
export function fitText(text: string, maxChars: number): string {
  const chars = [...text]
  if (chars.length <= maxChars) return text
  if (maxChars <= 0) return ''
  return chars.slice(0, maxChars - 1).join('') + '…'
}

/** Оценка ширины текста Golos Text 500 в px: число знаков × кегль × средняя ширина знака из замера. */
export function textWidth(text: string, sizePx: number): number {
  return [...text].length * sizePx * GOLOS.avg
}

/** Перенос текста Golos Text по словам в ширину maxWidth; слово шире строки режется по знакам; пустой текст → ['']. */
export function wrapText(text: string, sizePx: number, maxWidth: number): string[] {
  const perLine = Math.max(1, Math.floor(maxWidth / (sizePx * GOLOS.avg) + 1e-9))
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/[ \t\n]+/).filter(Boolean)) {
    let rest = [...word]
    // Слово длиннее строки режется по знакам, начиная с новой строки.
    while (rest.length > perLine) {
      if (current) {
        lines.push(current)
        current = ''
      }
      lines.push(rest.slice(0, perLine).join(''))
      rest = rest.slice(perLine)
    }
    const piece = rest.join('')
    if (!current) current = piece
    else if ([...current].length + 1 + rest.length <= perLine) current += ' ' + piece
    else {
      lines.push(current)
      current = piece
    }
  }
  if (current || lines.length === 0) lines.push(current)
  return lines
}
