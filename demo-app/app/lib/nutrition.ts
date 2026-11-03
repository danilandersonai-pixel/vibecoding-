// Питание: порция, правдоподобие ккал, числа из формы и итог дня. Правила — docs/nutrition.md, тесты — lib/nutrition.test.ts.
// Значения с этикетки — на 100 г, граммы — вес порции. Расчёт ничего не округляет: округляет shown, при показе.

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

// Итог дня — сумма порций за день, без округления: ккал или другое значение с этикетки
export function dayTotal(entries: FoodEntry[], value: Value = "kcal"): number {
  return entries.reduce((sum, entry) => sum + portion(entry[value], entry.grams), 0);
}

// Число для показа — одна функция для экрана подопечного и сводки тренера: до целых и с единицей, «511 ккал».
// Округление только здесь, один раз: порции и итог дня приходят сюда как есть
export function shown(value: number, unit: string): string {
  return `${Math.round(value)} ${unit}`;
}
