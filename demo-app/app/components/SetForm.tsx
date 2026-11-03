"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { parseSet, repsText, type NewSet } from "@/lib/sets";

// Форма нового подхода с очередью на телефоне. Подход сначала ложится в очередь (localStorage — она переживёт и пропавшую сеть,
// и перезагрузку страницы) с пометкой «не отправлено», потом уходит на сервер, по порядку. «отправлено» — только после ответа
// сервера. Сети нет — очередь ждёт события online; ответ не пришёл, а сеть есть — повтор через 3 с.
// У каждого подхода свой номер (crypto.randomUUID()): по нему очередь знает, какой подход отмечать.

// Подход в очереди: номер, тренировка, вес, повторы, заметка и что с ним
type Queued = NewSet & { key: string; workoutId: string; status: "не отправлено" | "отправлено" | "не принято"; error?: string };

const QUEUE = "sets-queue";
const RETRY_MS = 3000;
const EMPTY: Queued[] = [];

// Очередь из localStorage. Снимок — тот же массив, пока строка в хранилище не изменилась (так его ждёт useSyncExternalStore)
let cached: { raw: string | null; queue: Queued[] } = { raw: null, queue: EMPTY };
function readQueue(): Queued[] {
  const raw = localStorage.getItem(QUEUE);
  if (raw !== cached.raw) {
    let queue = EMPTY;
    try {
      queue = raw ? (JSON.parse(raw) as Queued[]) : EMPTY;
    } catch {
      // испорченная строка — пустая очередь, а не упавшая страница
    }
    cached = { raw, queue };
  }
  return cached.queue;
}

const listeners = new Set<() => void>();
function writeQueue(queue: Queued[]) {
  localStorage.setItem(QUEUE, JSON.stringify(queue));
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  // очередь могла измениться в другой вкладке
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Отметка подхода по номеру
function mark(key: string, status: Queued["status"], error?: string) {
  writeQueue(readQueue().map((item) => (item.key === key ? { ...item, status, error } : item)));
}

let sending = false;
let retry: ReturnType<typeof setTimeout> | undefined;

// Отправка по порядку: первый неотправленный подход, за ним следующий. onSent — после каждого ответа: страница перечитает подходы
async function sendQueue(onSent: () => void) {
  if (sending) return;
  sending = true;
  clearTimeout(retry);
  try {
    for (;;) {
      const item = readQueue().find((queued) => queued.status === "не отправлено");
      // всё отправлено — или сети нет: подход ждёт события online
      if (!item || !navigator.onLine) return;
      const response = await fetch(`/api/workouts/${item.workoutId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.key, weight: item.weight, reps: item.reps, note: item.note }),
      }).catch(() => null);
      // ответа нет (сеть пропала по дороге) или сбой сервера — подход остаётся «не отправлено», повтор через 3 с
      if (!response || response.status >= 500) {
        retry = setTimeout(() => void sendQueue(onSent), RETRY_MS);
        return;
      }
      // вход истёк — подход ждёт: после входа очередь отправит его со страницы тренировки
      if (response.status === 401) {
        mark(item.key, "не отправлено", "войдите снова");
        return;
      }
      if (response.ok) {
        mark(item.key, "отправлено");
      } else {
        // сервер подход не принял (тренировки нет, неверные числа): повтор не поможет
        const reply = await response.json().catch(() => null);
        mark(item.key, "не принято", reply?.error ?? `ответ ${response.status}`);
      }
      onSent();
    }
  } finally {
    sending = false;
  }
}

export default function SetForm({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const queue = useSyncExternalStore(subscribe, readQueue, () => EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // с прошлого раза в очереди остаются только неотправленные: отправленные уже есть в списке подходов страницы
    const stored = readQueue();
    const waiting = stored.filter((item) => item.status === "не отправлено");
    if (waiting.length < stored.length) writeQueue(waiting);
    const send = () => void sendQueue(() => router.refresh());
    send();
    window.addEventListener("online", send);
    return () => window.removeEventListener("online", send);
  }, [router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const set = parseSet({ weight: fields.get("weight"), reps: fields.get("reps"), note: fields.get("note") });
    if (typeof set === "string") {
      setError(set);
      return;
    }
    setError(null);
    writeQueue([...readQueue(), { ...set, key: crypto.randomUUID(), workoutId, status: "не отправлено" }]);
    form.reset();
    void sendQueue(() => router.refresh());
  }

  // подходы этой тренировки в очереди: «50 кг, 10 повторов — не отправлено»
  const mine = queue.filter((item) => item.workoutId === workoutId);

  return (
    <>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input id="weight" name="weight" inputMode="decimal" className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input id="reps" name="reps" inputMode="numeric" className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="note">Заметка</label>
          <input
            id="note"
            name="note"
            maxLength={200}
            placeholder="Необязательно, до 200 знаков"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {mine.length > 0 && (
        <ul aria-label="Очередь на отправку" aria-live="polite" className="mt-4 flex flex-col gap-1">
          {mine.map((item) => (
            <li key={item.key} className={item.status === "не отправлено" ? "font-medium" : "text-zinc-500"}>
              {item.weight} кг, {repsText(item.reps)} — {item.status}
              {item.error && `: ${item.error}`}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
