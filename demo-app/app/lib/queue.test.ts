import { expect, test } from "vitest";
import { enqueue, flush, parseQueue, queueKey, readQueue, retryDelay, type Send, type Sent } from "./queue";

// Очередь подходов на телефоне — lib/queue.ts. Хранилище — подмена localStorage, сервер — подмена send:
// тест видит, какие подходы ушли и в каком порядке, без браузера и сети.
const ANNA = "33333333-3333-3333-3333-333333333333";
const OLEG = "44444444-4444-4444-4444-444444444444";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

// Подмена сервера: отвечает статусами по очереди и записывает, какие подходы (по весу) к нему пришли
function server(...statuses: (number | null)[]) {
  const got: number[] = [];
  const send: Send = async (item) => {
    got.push(item.weight);
    // ответы кончились — дальше «принято»; null — ответа нет
    const status = statuses.length > 0 ? statuses.shift() : 201;
    if (status === null || status === undefined) return null;
    return Response.json(status < 300 ? { status: "принято" } : { error: "Тренировки нет" }, { status });
  };
  return { got, send };
}

test("очередь — своя у каждого: подход Анны не уходит под входом Олега", async () => {
  const storage = memoryStorage();
  enqueue(storage, ANNA, { workoutId: "3", weight: 30, reps: 10, note: null });
  const { got, send } = server();
  await flush(storage, OLEG, send, () => {});
  expect(got).toEqual([]);
  expect(readQueue(storage, ANNA)).toHaveLength(1);
  // войдёт Анна — подход уйдёт
  expect(await flush(storage, ANNA, send, () => {})).toBe("done");
  expect(got).toEqual([30]);
  expect(readQueue(storage, ANNA)).toEqual([]);
});

test("по порядку; ответа нет — первый подход ждёт, следующие за ним", async () => {
  const storage = memoryStorage();
  for (const weight of [30, 32.5, 35]) enqueue(storage, ANNA, { workoutId: "3", weight, reps: 10, note: null });
  const { got, send } = server(201, null);
  expect(await flush(storage, ANNA, send, () => {})).toBe("retry");
  expect(got).toEqual([30, 32.5]);
  expect(readQueue(storage, ANNA).map((q) => q.weight)).toEqual([32.5, 35]);
});

test("сервер отказал — подход уходит из очереди с «не принято» и не держит следующие", async () => {
  const storage = memoryStorage();
  for (const weight of [30, 35]) enqueue(storage, ANNA, { workoutId: "3", weight, reps: 10, note: null });
  const sent: Sent[] = [];
  const { got, send } = server(404, 201);
  expect(await flush(storage, ANNA, send, (s) => sent.push(s))).toBe("done");
  expect(got).toEqual([30, 35]);
  expect(sent.map((s) => [s.weight, s.status, s.error])).toEqual([
    [30, "не принято", "Тренировки нет"],
    [35, "отправлено", undefined],
  ]);
  expect(readQueue(storage, ANNA)).toEqual([]);
});

test("вход истёк — подход ждёт с «войдите снова»", async () => {
  const storage = memoryStorage();
  enqueue(storage, ANNA, { workoutId: "3", weight: 30, reps: 10, note: null });
  expect(await flush(storage, ANNA, server(401).send, () => {})).toBe("login");
  expect(readQueue(storage, ANNA)).toMatchObject([{ weight: 30, error: "войдите снова" }]);
});

test("испорченная очередь в хранилище — пустая или без чужих элементов, а не упавшая страница", () => {
  for (const raw of ["{", "{}", "42", "null"]) expect(parseQueue(raw), raw).toEqual([]);
  const good = { key: "k", workoutId: "3", weight: 30, reps: 10, note: null };
  expect(parseQueue(JSON.stringify([good, { key: 1 }, "x", null]))).toEqual([good]);
  expect(queueKey(ANNA)).not.toBe(queueKey(OLEG));
});

test("повтор, когда ответа нет: 3 с, 6 с, 12 с … не дольше минуты", () => {
  expect([0, 1, 2, 3, 4, 5, 10].map(retryDelay)).toEqual([3000, 6000, 12_000, 24_000, 48_000, 60_000, 60_000]);
});
