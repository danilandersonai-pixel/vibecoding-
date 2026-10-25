// Нормализация текста для поиска: нижний регистр, «ё» → «е», всё кроме букв и цифр — пробел.
// Метки совпадений ставятся в исходной строке, поэтому fold меняет символы по одному и не меняет длину:
// позиция в свёрнутой строке — та же позиция в исходной.

// Буквы, цифры и знаки, которые к ним «приклеиваются» (ударения); остальное — разделитель
const SEPARATOR = /[^\p{L}\p{N}\p{M}]/gu

// Посимвольная замена с той же длиной строки; символ вне BMP (два кодовых элемента) даёт два пробела
export function fold(text: string): string {
  let lower = text.toLowerCase()
  // у редких букв (İ) строчная форма длиннее — такие символы оставляем как есть, чтобы не сдвинуть позиции
  if (lower.length !== text.length) {
    lower = Array.from(text, (ch) => {
      const l = ch.toLowerCase()
      return l.length === ch.length ? l : ch
    }).join('')
  }
  return lower.replaceAll('ё', 'е').replace(SEPARATOR, (m) => ' '.repeat(m.length))
}

// Свёрнутая строка без повторных и крайних пробелов — для сравнения слов и названий (позиций не хранит)
export function squash(folded: string): string {
  return folded.replace(/ +/g, ' ').trim()
}

export function normalize(text: string): string {
  return squash(fold(text))
}

// Слова запроса; пустой массив, если после нормализации запрос короче 2 символов
export function queryWords(query: string): string[] {
  const n = normalize(query)
  return n.length < 2 ? [] : [...new Set(n.split(' '))]
}
