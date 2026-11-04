// Уведомления тренеру о подходах подопечного — правила, тесты в lib/notify.test.ts:
// одно уведомление на тренировку, а не на каждый подход; ночью, с 22:00 до 8:00 по часовому поясу получателя, — в 8:00 утра.
// Своих часов у функций нет: время подхода приходит снаружи, поэтому тест проверяет их на фиксированных датах.

// Подход: в какой тренировке и когда сохранён
export type SavedSet = { workoutId: string; savedAt: Date };
// Уведомление тренеру: о какой тренировке и когда отправить
export type CoachNotice = { workoutId: string; sendAt: Date };

// Тихие часы по местному времени получателя: с 22:00 до 8:00
const QUIET_FROM = 22;
const QUIET_TO = 8;

// Местные дата и время в поясе timeZone (например, Europe/Moscow) — числами
function localTime(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute"), second: part("second") };
}

// На сколько миллисекунд местное время пояса впереди UTC в момент at: у Москвы — на 3 часа
function offsetAt(at: Date, timeZone: string): number {
  const t = localTime(at, timeZone);
  return Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) - Math.floor(at.getTime() / 1000) * 1000;
}

// Когда отправить уведомление о событии в момент at: днём — сразу, в тихие часы — в 8:00 по поясу получателя
// (после 22:00 — следующим утром, после полуночи — этим же)
export function sendTime(at: Date, timeZone: string): Date {
  const { year, month, day, hour } = localTime(at, timeZone);
  if (hour >= QUIET_TO && hour < QUIET_FROM) return at;
  // 8:00 по местным часам, записанные как время UTC; Date.UTC сам переносит 32-е число на следующий месяц
  const morning = Date.UTC(year, month - 1, hour >= QUIET_FROM ? day + 1 : day, QUIET_TO);
  // в UTC — минус сдвиг пояса, причём сдвиг на само утро: ночью пояс мог перейти на летнее время
  return new Date(morning - offsetAt(new Date(morning - offsetAt(at, timeZone)), timeZone));
}

// Уведомления тренеру о подходах: одно на тренировку — по её первому подходу, остальные подходы нового не дают
export function coachNotices(sets: SavedSet[], timeZone: string): CoachNotice[] {
  const first = new Map<string, Date>();
  for (const set of sets) {
    const seen = first.get(set.workoutId);
    if (!seen || set.savedAt.getTime() < seen.getTime()) first.set(set.workoutId, set.savedAt);
  }
  return [...first].map(([workoutId, savedAt]) => ({ workoutId, sendAt: sendTime(savedAt, timeZone) }));
}
