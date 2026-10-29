// День тренировки по-русски: «2 ноября». Язык задан явно: без него toLocaleDateString() берёт язык системы,
// где работает сервер, и дата выходит как 11/2/2026.
export function formatDay(day: Date): string {
  return day.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
