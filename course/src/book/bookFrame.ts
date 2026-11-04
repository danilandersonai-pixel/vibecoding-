import type { Theme } from '../theme'

// Книга в рамке курса (iframe srcdoc). У такого документа адрес about:srcdoc — якоря нет,
// поэтому стартовый раздел подставляется прямо в читалку книги (public/book.html).

// Как читалка при первой раскладке берёт раздел из якоря адреса
export const BOOK_HASH_READ = 'const h = (location.hash || "").slice(1);'

// Текст книги для srcdoc: чтение якоря заменено на стартовый раздел. Раздел — строкой JS без «<»: закрывающий
// </script> из него не получится (маршрут и так пускает только [\w-]). Без раздела или без фрагмента
// (книгу пересобрали) — якорь как есть: книга откроется там, где читатель остановился, а не упадёт.
// theme — тема курса: книга берёт её из data-theme корня, иначе шла бы за системой и не совпала с курсом
export function bookSrcdoc(html: string, section?: string, theme?: Theme): string {
  let doc = html
  if (section && doc.includes(BOOK_HASH_READ)) {
    const start = JSON.stringify(section).replaceAll('<', '\\u003c')
    // функция, а не строка замены: в строке «$&» и подобные значили бы подстановку
    doc = doc.replace(BOOK_HASH_READ, () => `const h = ${start} || (location.hash || "").slice(1);`)
  }
  if (theme) doc = doc.replace('<html>', `<html data-theme="${theme}">`)
  return doc
}
