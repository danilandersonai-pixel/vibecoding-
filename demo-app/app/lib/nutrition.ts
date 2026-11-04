// Питание: порция, правдоподобие ккал, числа из формы, день из адреса и итог дня. Правила — docs/nutrition.md, тесты — lib/nutrition.test.ts.
// Значения с этикетки — на 100 г, граммы — вес порции. Расчёт ничего не округляет: округляют при показе.

// Запись дневника для расчёта: граммы порции и значения с этикетки на 100 г — ккал, белки, жиры и углеводы, г
export type FoodEntry = { grams: number; kcal: number; protein: number; fat: number; carbs: number };

// Какое значение с этикетки складывать в итог дня
export type Value = "kcal" | "protein" | "fat" | "carbs";

// Больше 900 ккал на 100 г не бывает: в грамме чистого жира 9 ккал
const KCAL_MAX = 900;

// Порция: значение на 100 г × граммы / 100
export function portion(per100: number, grams: number): number {
  return (per100 * grams) / 100;
}

// Ккал на 100 г: больше 900 — скорее всего, вписали килоджоули из соседней строки этикетки. Возвращает вопрос или null
export function checkPer100(kcal: number): string | null {
  return kcal > KCAL_MAX ? "Больше 900 ккал на 100 г не бывает — это кДж?" : null;
}

// Число из поля формы — как на этикетке: «52,5» с запятой тоже число (запятую меняем на точку, как lib/weight.ts).
// Ноль годится (жиров 0 г), поэтому не parseWeight: тот ждёт вес больше нуля. Пустое, не число или меньше нуля — null
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  // Number("") === 0, поэтому пустое поле отсекаем до Number
  const value = normalized === "" ? NaN : Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// День из адреса — «ГГГГ-ММ-ДД», и такой день есть в календаре. «2026-02-30» по формату годится, но Date перенесёт его
// на 2 марта — сверяем с тем, что вышло; год с 1-го (нулевого года нет и в базе)
export function isDay(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || text < "0001") return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

// Итог дня — сумма порций за день, без округления: ккал или другое значение с этикетки
export function dayTotal(entries: FoodEntry[], value: Value = "kcal"): number {
  return entries.reduce((sum, entry) => sum + portion(entry[value], entry.grams), 0);
}

// Экран дня у подопечного: ккал каждой порции — до целых, как в строке. «Итого» — тот же итог, что в сводке тренера: одна функция
// и одно округление (docs/nutrition.md), а не сумма показанных строк: столбец может с итогом не сойтись, верен итог
export function dayLines(entries: FoodEntry[]): { kcal: number[]; total: number } {
  const kcal = entries.map((entry) => Math.round(portion(entry.kcal, entry.grams)));
  return { kcal, total: daySummary(entries).kcal };
}

// Сводка тренера за день: итоги ккал, белков, жиров и углеводов — dayTotal, округление одно, при показе
export function daySummary(entries: FoodEntry[]): Record<Value, number> {
  const total = (value: Value) => Math.round(dayTotal(entries, value));
  return { kcal: total("kcal"), protein: total("protein"), fat: total("fat"), carbs: total("carbs") };
}
