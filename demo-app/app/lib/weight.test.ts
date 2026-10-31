import { expect, test } from "vitest";
import { parseWeight } from "./weight";

const NOT_A_NUMBER = "Вес должен быть числом, например 60";
const NOT_POSITIVE = "Вес должен быть больше нуля";

test("целое число", () => {
  expect(parseWeight("60")).toBe(60);
});

test("запятая — десятичный разделитель", () => {
  expect(parseWeight("62,5")).toBe(62.5);
});

test("отрицательный вес — ошибка", () => {
  expect(parseWeight("-5")).toBe(NOT_POSITIVE);
});

test("число с буквами — ошибка", () => {
  expect(parseWeight("60 кг")).toBe(NOT_A_NUMBER);
});

test("пустое поле — ошибка", () => {
  expect(parseWeight("")).toBe(NOT_A_NUMBER);
});
