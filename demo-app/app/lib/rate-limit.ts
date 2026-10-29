// Ограничитель попыток входа: не больше 5 неудачных за 15 минут по одной почте.
// Счётчик — в памяти процесса, поэтому сбрасывается при перезапуске сервера (dev-сервер — заново с нуля);
// для нескольких процессов нужен был бы общий счётчик (например, в базе или Redis).
const WINDOW_MS = 15 * 60_000;
const LIMIT = 5;
const failures = new Map<string, number[]>();

// Недавние неудачные попытки по почте: старше 15 минут отбрасываем.
function recent(email: string): number[] {
  const now = Date.now();
  const times = (failures.get(email) ?? []).filter((at) => now - at < WINDOW_MS);
  failures.set(email, times);
  return times;
}

// true, если по этой почте уже исчерпан лимит неудачных входов за окно.
export function tooManyAttempts(email: string): boolean {
  return recent(email).length >= LIMIT;
}

// Запомнить неудачный вход по этой почте.
export function recordFailure(email: string): void {
  recent(email).push(Date.now());
}
