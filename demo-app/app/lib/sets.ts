import { parseWeight } from "@/lib/weight";

// Новый подход: вес, повторы и заметка. Одни правила для формы на телефоне (components/SetForm.tsx) и для сервера
// (app/api/workouts/[id]/sets): форма не ставит в очередь подход, который сервер не примет.
export type NewSet = { weight: number; reps: number; note: string | null };

// Подход из полей формы или из тела запроса: NewSet или текст ошибки для пользователя
export function parseSet(input: { weight?: unknown; reps?: unknown; note?: unknown }): NewSet | string {
  // вес разбирает lib/weight.ts: число или текст ошибки
  const weight = parseWeight(String(input.weight ?? ""));
  if (typeof weight === "string") return weight;
  // повторы — из поля формы или число из JSON; через String: Number(true) — это 1, а String(true) — не число
  const reps = Number(String(input.reps ?? ""));
  if (!Number.isInteger(reps) || reps <= 0) return "Повторы — целое число больше нуля";
  // заметка необязательна: пустое поле — без заметки (null); длиннее 200 знаков не примет и база
  const note = String(input.note ?? "").trim() || null;
  if (note && note.length > 200) return "Заметка — не длиннее 200 знаков";
  return { weight, reps, note };
}

// Повторы словом по правилам русского языка: «1 повтор», «2 повтора», «10 повторов»
const REPS: Record<string, string> = { one: "повтор", few: "повтора", many: "повторов", other: "повтора" };
export function repsText(reps: number): string {
  return `${reps} ${REPS[new Intl.PluralRules("ru").select(reps)]}`;
}
