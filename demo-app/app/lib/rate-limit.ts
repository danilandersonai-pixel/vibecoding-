// Ограничитель попыток: не больше 5 за 15 минут по одному ключу. Вход (app/api/login) считает неудачные входы по почте,
// регистрация по приглашению (app/join/[code]/actions.ts) — попытки по коду приглашения, ключ join:<код>.
// Счётчик — в памяти процесса, поэтому сбрасывается при перезапуске сервера (dev-сервер — заново с нуля);
// для нескольких процессов нужен был бы общий счётчик (например, в базе или Redis).
// Вход проверяет лимит до запроса к базе, а неудачу записывает после него: одновременные попытки входа проходят проверку разом.
// takeAttempt проверяет и записывает за один шаг, без await между ними, — пачкой одновременных запросов лимит не обойти.
const WINDOW_MS = 15 * 60_000;
const LIMIT = 5;
const attempts = new Map<string, number[]>();

// Недавние попытки по ключу: старше 15 минут отбрасываем, ключ без недавних попыток не храним.
function recent(key: string): number[] {
  const now = Date.now();
  const times = (attempts.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (times.length > 0) attempts.set(key, times);
  else attempts.delete(key);
  return times;
}

// Запомнить попытку по ключу.
function remember(key: string): void {
  attempts.set(key, [...recent(key), Date.now()]);
}

// true, если по этому ключу лимит за окно уже исчерпан.
export function tooManyAttempts(key: string): boolean {
  return recent(key).length >= LIMIT;
}

// Запомнить неудачный вход по этому ключу (почте).
export function recordFailure(key: string): void {
  remember(key);
}

// Засчитать попытку, если лимит не исчерпан: проверка и запись — сразу, без await между ними. false — лимит исчерпан.
export function takeAttempt(key: string): boolean {
  if (tooManyAttempts(key)) return false;
  remember(key);
  return true;
}
