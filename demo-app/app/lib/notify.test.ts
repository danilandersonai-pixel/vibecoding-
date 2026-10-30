import { expect, test } from "vitest";
import { coachNotices } from "./notify";

// Получатель — тренер Марина, её пояс — Москва. Время в тестах фиксированное: настоящие часы не участвуют
const MOSCOW = "Europe/Moscow";

// Тренировка из 5 упражнений по 3 подхода — 15 подходов, с 18:00 по Москве каждые 3 минуты
const START = Date.parse("2026-11-07T18:00:00+03:00");
const sets = Array.from({ length: 15 }, (_, i) => ({ workoutId: "1", savedAt: new Date(START + i * 3 * 60_000) }));

test("15 подходов одной тренировки — одно уведомление", () => {
  expect(coachNotices(sets, MOSCOW)).toEqual([{ workoutId: "1", sendAt: new Date("2026-11-07T18:00:00+03:00") }]);
});

// По Москве 23:40, а по UTC — 20:40: тихие часы считаются по поясу получателя, а не сервера
test("подход в 23:40 по Москве — уведомление в 8:00 утра", () => {
  const late = [{ workoutId: "1", savedAt: new Date("2026-11-07T23:40:00+03:00") }];
  expect(coachNotices(late, MOSCOW)).toEqual([{ workoutId: "1", sendAt: new Date("2026-11-08T08:00:00+03:00") }]);
});
