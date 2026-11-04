import { expect, test } from "vitest";
import { bestWeight, records } from "./records";

// Случай из задачи (docs/tasks/records.md)
const TASK_SETS = [
  { weight: 60, reps: 8 },
  { weight: 62.5, reps: 5 },
  { weight: 57.5, reps: 10 },
];

test("рекорд среди подходов 60 × 8, 62,5 × 5 и 57,5 × 10", () => {
  expect(bestWeight(TASK_SETS)).toBe(62.5);
});

test("рекорд упражнения — по всем тренировкам с этим названием", () => {
  const workouts = [
    { title: "Ноги", sets: [{ weight: 50, reps: 10 }] },
    { title: "Ноги", sets: [{ weight: 55, reps: 10 }] },
    { title: "Грудь и спина", sets: [{ weight: 40, reps: 12 }] },
  ];
  expect(records(workouts)).toEqual(new Map([["Ноги", 55], ["Грудь и спина", 40]]));
});

test("без подходов рекорда нет", () => {
  expect(bestWeight([])).toBeNull();
  expect(records([{ title: "Ноги", sets: [] }])).toEqual(new Map());
});
