import { expect, test } from "vitest";
import { volume } from "./volume";

test("три подхода по 10 раз с весом 50 кг — 1500 кг", () => {
  const sets = [
    { weight: 50, reps: 10 },
    { weight: 50, reps: 10 },
    { weight: 50, reps: 10 },
  ];
  expect(volume(sets)).toBe(1500);
});

test("пустая тренировка — 0", () => {
  expect(volume([])).toBe(0);
});
