import { expect, test } from "vitest";
import { progress } from "./progress";

// Сценарий 3 из docs/spec.md «Тренер видит прогресс»: по тесту на каждое требование.
// «Ноги» три недели подряд: разминка 40 × 10 и рабочий вес 50, 55 и 60 кг
const WEEK_1 = { day: new Date("2026-10-19"), sets: [{ weight: 40, reps: 10 }, { weight: 50, reps: 8 }] };
const WEEK_2 = { day: new Date("2026-10-26"), sets: [{ weight: 40, reps: 10 }, { weight: 55, reps: 8 }] };
const WEEK_3 = { day: new Date("2026-11-02"), sets: [{ weight: 40, reps: 10 }, { weight: 60, reps: 8 }] };

test("тренер видит, как менялся вес", () => {
  // в строке тренировки — лучший вес, а не разминка
  expect(progress([WEEK_1, WEEK_2, WEEK_3]).map((row) => row.weight)).toEqual([50, 55, 60]);
});

test("тренер видит, сколько всего поднято за тренировку", () => {
  // 40 × 10 + 60 × 8 = 400 + 480
  expect(progress([WEEK_3])[0].volume).toBe(880);
});

test("по неделям 50, 55 и 60 кг — три строки по порядку недель", () => {
  // тренировки пришли не по порядку, а строки всё равно идут по датам
  const rows = progress([WEEK_3, WEEK_1, WEEK_2]);
  expect(rows.map((row) => [row.day, row.weight])).toEqual([
    [WEEK_1.day, 50],
    [WEEK_2.day, 55],
    [WEEK_3.day, 60],
  ]);
});
