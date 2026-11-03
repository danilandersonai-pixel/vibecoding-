import { join } from "node:path";

// Где лежат снимки прогресса: storage/photos/<подопечный>/<день>.jpg — вне public (сервер сам их не отдаёт) и вне git
// (/storage/ в .gitignore). Путь к файлу собирает сервер из номера подопечного и дня: строке пути из базы файлы не доверяют.

// Путь снимка от корня проекта. Только номер и день ГГГГ-ММ-ДД — «../» и чужая папка в путь не пройдут
export function photoPath(clientId: string, day: string): string {
  if (!/^\d+$/.test(clientId) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Нет пути снимка для «${clientId}», «${day}»`);
  return `storage/photos/${clientId}/${day}.jpg`;
}

// Файл снимка на диске. turbopackIgnore: путь вычисляется, и next build иначе приложил бы к серверной сборке весь проект —
// со storage/ (снимки людей) и backups/ (копии базы)
export function photoFile(clientId: string, day: string): string {
  return join(/*turbopackIgnore: true*/ process.cwd(), photoPath(clientId, day));
}
