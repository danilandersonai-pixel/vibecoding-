import { expect, test } from "vitest";
import { monthReport } from "./report";

// подходы «вес × повторы»
const sets = (...pairs: [number, number][]) =>
  pairs.map(([weight, reps]) => ({ weight, reps }));

// Тренировки Анны из supabase/seed.sql
const ANNA = [
  // 50 × 10 три раза = 1500 кг
  { title: "Ноги", day: "2026-10-19", sets: sets([50, 10], [50, 10], [50, 10]) },
  // 40 × 12 + 40 × 10 + 45 × 8 = 480 + 400 + 360 = 1240 кг
  { title: "Спина и бицепс", day: "2026-10-21", sets: sets([40, 12], [40, 10], [45, 8]) },
  // 26 октября — уже следующая неделя
  { title: "Грудь и плечи", day: "2026-10-26", sets: sets([30, 10], [30, 10], [35, 8]) },
];

test("недели октября — с понедельника 28 сентября по воскресенье 1 ноября", () => {
  const weeks = monthReport("2026-10", ANNA).map((week) => `${week.start} — ${week.end}`);
  expect(weeks).toEqual([
    "2026-09-28 — 2026-10-04",
    "2026-10-05 — 2026-10-11",
    "2026-10-12 — 2026-10-18",
    "2026-10-19 — 2026-10-25",
    "2026-10-26 — 2026-11-01",
  ]);
});

test("неделя Анны 19–25 октября: 2 тренировки, 2740 кг, средний 1370", () => {
  const week = monthReport("2026-10", ANNA).find((w) => w.start === "2026-10-19");
  expect(week).toEqual({
    start: "2026-10-19",
    end: "2026-10-25",
    workouts: 2,
    volume: 1500 + 1240,
    average: 2740 / 2,
    // самый большой вес по названию тренировки до конца недели
    records: new Map([
      ["Ноги", 50],
      ["Спина и бицепс", 45],
    ]),
  });
});

// Неделя без тренировок (docs/report.md): «тренировок не было», без среднего
test("неделя 5–11 октября без тренировок — среднего нет", () => {
  const week = monthReport("2026-10", ANNA).find((w) => w.start === "2026-10-05");
  expect(week?.workouts, "тренировок").toBe(0);
  expect(week?.volume, "объём").toBe(0);
  expect(week?.average, "средний").toBeNull();
});
