"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { enqueue, flush, parseQueue, queueKey, retryDelay, type Queued, type Sent } from "@/lib/queue";
import { parseSet, repsText, type NewSet } from "@/lib/sets";

// «Повторить подход» и форма нового подхода — через очередь на телефоне (lib/queue.ts). Подход сначала ложится в очередь
// вошедшего в localStorage с пометкой «не отправлено», потом уходит на сервер, по порядку; «отправлено» — только после ответа
// сервера. Сети нет — очередь ждёт события online; сеть есть, а ответа нет — повтор через 3 с, 6 с, 12 с … не дольше минуты.
// Очередь уходит, пока открыта страница тренировки: без сети страницу заново не открыть — service worker нет.

// Прошлый подход тренировки — для «Повторить подход»
type Last = { weight: number; reps: number };

const EMPTY: Queued[] = [];
const NO_RESULTS: Sent[] = [];

// localStorage с оповещением: после каждой записи страница перечитывает очередь
const listeners = new Set<() => void>();
const store = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    listeners.forEach((listener) => listener());
  },
};
function subscribe(listener: () => void) {
  listeners.add(listener);
  // очередь могла измениться в другой вкладке
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Очередь вошедшего. Снимок — тот же массив, пока строка в хранилище не изменилась (так его ждёт useSyncExternalStore)
let cached: { key: string; raw: string | null; queue: Queued[] } | null = null;
function snapshot(userId: string): Queued[] {
  const key = queueKey(userId);
  const raw = localStorage.getItem(key);
  if (cached?.key !== key || cached.raw !== raw) cached = { key, raw, queue: parseQueue(raw) };
  return cached.queue;
}

// Ушедшие из очереди подходы — «отправлено» и «не принято»: в хранилище их нет, страница показывает их, пока открыта
let results: Sent[] = NO_RESULTS;

// Подход на сервер; ответа нет (сети нет, обрыв, 15 с без ответа) — null
const post = (item: Queued) =>
  fetch(`/api/workouts/${item.workoutId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: item.key, weight: item.weight, reps: item.reps, note: item.note }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

let sending = false;
let attempt = 0;
let retry: ReturnType<typeof setTimeout> | undefined;

// Отправка очереди вошедшего; onSent — после каждого ушедшего подхода: страница перечитает список подходов
async function send(userId: string, onSent: () => void) {
  if (sending) return;
  sending = true;
  clearTimeout(retry);
  try {
    // сети нет — ждём события online
    if (!navigator.onLine) return;
    const stop = await flush(store, userId, post, (sent) => {
      attempt = 0;
      results = [...results, sent];
      listeners.forEach((listener) => listener());
      onSent();
    });
    // ответа нет или сбой сервера — первый подход ждёт, повтор с паузой; очередь пуста или вход истёк — не повторяем
    if (stop === "retry") retry = setTimeout(() => void send(userId, onSent), retryDelay(attempt++));
  } finally {
    sending = false;
  }
}

export default function SetForm({ workoutId, userId, last }: { workoutId: string; userId: string; last: Last | null }) {
  const router = useRouter();
  const waiting = useSyncExternalStore(subscribe, () => snapshot(userId), () => EMPTY);
  const done = useSyncExternalStore(subscribe, () => results, () => NO_RESULTS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sendNow = () => void send(userId, () => router.refresh());
    sendNow();
    window.addEventListener("online", sendNow);
    return () => window.removeEventListener("online", sendNow);
  }, [userId, router]);

  // подход — в очередь вошедшего и сразу на сервер, если есть сеть
  function add(set: NewSet) {
    enqueue(store, userId, { ...set, workoutId });
    void send(userId, () => router.refresh());
  }

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
    add(set);
    form.reset();
  }

  // подходы этой тренировки: ушедшие — «30 кг, 10 повторов — отправлено», ждущие — «… — не отправлено»
  const lines = [
    ...done.filter((item) => item.workoutId === workoutId).map((item) => ({ ...item, wait: false })),
    ...waiting.filter((item) => item.workoutId === workoutId).map((item) => ({ ...item, status: "не отправлено", wait: true })),
  ];

  return (
    <>
      {/* одно касание: ещё раз прошлый подход этой тренировки — через ту же очередь */}
      {last && (
        <button
          type="button"
          onClick={() => add({ weight: last.weight, reps: last.reps, note: null })}
          className="mt-6 w-full rounded bg-zinc-900 px-4 py-2 text-white"
        >
          Повторить подход ({last.weight} кг, {repsText(last.reps)})
        </button>
      )}

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

      {/* область объявлений — всегда в разметке: экранный диктор прочтёт и первое «не отправлено» */}
      <div aria-live="polite" className="mt-4">
        {lines.length > 0 && (
          <ul aria-label="Очередь на отправку" className="flex flex-col gap-1">
            {lines.map((item) => (
              <li key={item.key} className={item.wait ? "font-medium" : "text-zinc-500"}>
                {item.weight} кг, {repsText(item.reps)} — {item.status}
                {item.error && `: ${item.error}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
