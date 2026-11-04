// Разбор веса из поля формы: возвращает число или текст ошибки для пользователя.
// Тесты — lib/weight.test.ts.
const NOT_A_NUMBER = "Вес должен быть числом, например 60";
const NOT_POSITIVE = "Вес должен быть больше нуля";

export function parseWeight(text: string): number | string {
  // «62,5» — тоже число: запятую меняем на точку
  const normalized = text.trim().replace(",", ".");
  // Number("") === 0, поэтому пустое поле отсекаем до Number
  const kg = normalized === "" ? NaN : Number(normalized);
  if (!Number.isFinite(kg)) return NOT_A_NUMBER;
  if (kg <= 0) return NOT_POSITIVE;
  return kg;
}
