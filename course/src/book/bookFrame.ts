// Книга в рамке курса (iframe srcdoc). У такого документа адрес about:srcdoc — якоря нет,
// поэтому стартовый раздел подставляется прямо в читалку книги (public/book.html).

// Как читалка при первой раскладке берёт раздел из якоря адреса
export const BOOK_HASH_READ = 'const h = (location.hash || "").slice(1);'

// Текст книги для srcdoc: чтение якоря заменено на стартовый раздел. Раздел — строкой JS без «<»: закрывающий
// </script> из него не получится (маршрут и так пускает только [\w-]). Без раздела или без фрагмента
// (книгу пересобрали) — текст как есть: книга откроется там, где читатель остановился, а не упадёт
export function bookSrcdoc(html: string, section?: string): string {
  if (!section || !html.includes(BOOK_HASH_READ)) return html
  const start = JSON.stringify(section).replaceAll('<', '\\u003c')
  // функция, а не строка замены: в строке «$&» и подобные значили бы подстановку
  return html.replace(BOOK_HASH_READ, () => `const h = ${start} || (location.hash || "").slice(1);`)
}
