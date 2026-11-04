import { expect, test } from "vitest";
import { checkName } from "./names";

const ONLY_LETTERS = "Имя может содержать только буквы";

test("кириллица — «Ольга»", () => {
  expect(checkName("Ольга")).toBeNull();
});

test("латиница — «Olga»", () => {
  expect(checkName("Olga")).toBeNull();
});

test("двойное имя через дефис — «Анна-Мария»", () => {
  expect(checkName("Анна-Мария")).toBeNull();
});

test("апостроф — «Д'Артаньян»", () => {
  expect(checkName("Д'Артаньян")).toBeNull();
});

test("имя из двух слов через пробел — «Анна Мария»", () => {
  expect(checkName("Анна Мария")).toBeNull();
});

test("другие алфавиты — «José», «李雷», «Ευγενία»", () => {
  for (const name of ["José", "李雷", "Ευγενία"]) expect(checkName(name), name).toBeNull();
});

test("цифры и знаки — ошибка", () => {
  for (const name of ["Анна2", "Анна!", "<b>Анна</b>", "Анна_Мария"]) expect(checkName(name), name).toBe(ONLY_LETTERS);
});

test("дефис, апостроф или пробел в начале — ошибка", () => {
  for (const name of ["-Анна", "'Анна", " Анна"]) expect(checkName(name), name).toBe(ONLY_LETTERS);
});

test("пустое имя — ошибка", () => {
  expect(checkName("")).toBe(ONLY_LETTERS);
});
