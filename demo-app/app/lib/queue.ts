import type { NewSet } from "@/lib/sets";

// Очередь подходов на телефоне: подход сначала ложится сюда, потом уходит на сервер по порядку (components/SetForm.tsx).
// Хранилище — localStorage браузера (в тестах — его подмена): там лежат только подходы, которые ещё ждут отправки.
// Очередь — своя у каждого вошедшего: чужие подходы с этого телефона не уйдут под другим входом.

// Подход в очереди: номер (uuid), тренировка и сам подход; error — почему он пока ждёт («войдите снова»)
export type Queued = NewSet & { key: string; workoutId: string; error?: string };
// Чем кончилась отправка: «отправлено» — сервер ответил «принято»; «не принято» — сервер отказал, повтор не поможет
export type Sent = NewSet & { key: string; workoutId: string; status: "отправлено" | "не принято"; error?: string };
// Ответ сервера на подход или null — ответа нет (сети нет, связь оборвалась)
export type Send = (item: Queued) => Promise<Response | null>;
type Store = Pick<Storage, "getItem" | "setItem">;

export const queueKey = (userId: string) => `sets-queue:${userId}`;

// Пауза перед повтором, когда сеть есть, а ответа нет: 3 с, 6 с, 12 с … не дольше минуты
export const retryDelay = (attempt: number) => Math.min(3000 * 2 ** attempt, 60_000);

// Похоже ли на подход очереди: строку в localStorage мог испортить кто угодно
function isQueued(item: unknown): item is Queued {
  const q = item as Queued;
  return (
    typeof q === "object" &&
    q !== null &&
    typeof q.key === "string" &&
    typeof q.workoutId === "string" &&
    typeof q.weight === "number" &&
    typeof q.reps === "number" &&
    (q.note === null || typeof q.note === "string")
  );
}

// Очередь из строки хранилища: испорченная строка, не массив, чужие элементы — пропускаем, страница не падает
export function parseQueue(raw: string | null): Queued[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isQueued) : [];
  } catch {
    return [];
  }
}

export function readQueue(storage: Store, userId: string): Queued[] {
  return parseQueue(storage.getItem(queueKey(userId)));
}

function writeQueue(storage: Store, userId: string, queue: Queued[]) {
  storage.setItem(queueKey(userId), JSON.stringify(queue));
}

// Новый подход — в конец очереди вошедшего, со своим номером
export function enqueue(storage: Store, userId: string, set: NewSet & { workoutId: string }) {
  writeQueue(storage, userId, [...readQueue(storage, userId), { ...set, key: crypto.randomUUID() }]);
}

// Отправка очереди вошедшего по порядку: первый подход, за ним следующий. Возвращает, почему остановилась:
// «done» — очередь пуста; «retry» — ответа нет или сбой сервера, первый подход ждёт; «login» — вход истёк.
// onSent — про каждый подход, который ушёл из очереди
export async function flush(
  storage: Store,
  userId: string,
  send: Send,
  onSent: (sent: Sent) => void,
): Promise<"done" | "retry" | "login"> {
  for (;;) {
    const [item] = readQueue(storage, userId);
    if (!item) return "done";
    const response = await send(item);
    if (!response || response.status >= 500) return "retry";
    if (response.status === 401) {
      writeQueue(storage, userId, readQueue(storage, userId).map((q) => (q.key === item.key ? { ...q, error: "войдите снова" } : q)));
      return "login";
    }
    // ответ есть — подход уходит из очереди; отказ сервера — «не принято», и очередь идёт дальше
    const reply = response.ok ? null : await response.json().catch(() => null);
    writeQueue(storage, userId, readQueue(storage, userId).filter((q) => q.key !== item.key));
    const { key, workoutId, weight, reps, note } = item;
    onSent(
      response.ok
        ? { key, workoutId, weight, reps, note, status: "отправлено" }
        : { key, workoutId, weight, reps, note, status: "не принято", error: reply?.error ?? `ответ ${response.status}` },
    );
  }
}
