import { expect, test } from "vitest";
import { checkPer100, dayLines, daySummary, dayTotal, isDay, parseAmount, portion } from "./nutrition";

// Правила — docs/nutrition.md: значения с этикетки на 100 г, порция = значение × граммы / 100

test("порция: 60 г при 350 ккал на 100 г — 210 ккал", () => {
  expect(portion(350, 60)).toBe(210);
});

test("1464 на 100 г — это кДж: переспросить", () => {
  // 350 ккал × 4,184 = 1464 кДж — число из соседней строки этикетки
  expect(checkPer100(1464)).toBe("Больше 900 ккал на 100 г не бывает — это кДж?");
  expect(checkPer100(350)).toBeNull();
});

test("числа как на этикетке: «52,5» с запятой — 52,5", () => {
  expect(parseAmount("52,5")).toBe(52.5);
  // пустое поле и число с единицей — не число
  expect(parseAmount("")).toBeNull();
  expect(parseAmount("60 г")).toBeNull();
});

test("день из адреса: «2026-11-12» — день, «2026-02-30» и «12.11.2026» — нет", () => {
  expect(isDay("2026-11-12")).toBe(true);
  // по формату годится, но 30 февраля в календаре нет
  expect(isDay("2026-02-30")).toBe(false);
  expect(isDay("12.11.2026")).toBe(false);
});

// День 12 ноября: граммы порции и значения с этикеток на 100 г
const DAY = [
  // овсяные хлопья: 352 × 45 / 100 = 158,4 ккал
  { grams: 45, kcal: 352, protein: 12.3, fat: 6.2, carbs: 61.8 },
  // молоко 2,5 %: 53 × 200 / 100 = 106 ккал
  { grams: 200, kcal: 53, protein: 2.8, fat: 2.5, carbs: 4.7 },
  // гречка ядрица: 308 × 80 / 100 = 246,4 ккал
  { grams: 80, kcal: 308, protein: 12.6, fat: 3.3, carbs: 57.1 },
];

test("итог дня — сумма порций без округления: 158,4 + 106 + 246,4 = 510,8 ккал", () => {
  expect(dayTotal(DAY)).toBeCloseTo(510.8);
  // белки так же: 5,535 + 5,6 + 10,08 = 21,215 г
  expect(dayTotal(DAY, "protein")).toBeCloseTo(21.215);
});

// Один итог на двоих (docs/nutrition.md): «Итого» на экране подопечного — то же число, что в сводке тренера, на тех же трёх строках.
// Сводка — dayTotal и одно округление: 510,8 → 511
test("итог экрана подопечного = итог сводки тренера: 511 ккал", () => {
  expect(dayLines(DAY).total).toBe(daySummary(DAY).kcal);
});
