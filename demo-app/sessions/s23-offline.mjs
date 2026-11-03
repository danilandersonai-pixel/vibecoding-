// Сессия 23: тренировка без интернета (утро 14 ноября; база — из миграций и seed, db: true). Четвёртая сессия недели 3, ролик дня 18.
// Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next (как в s13, s19–s22).
// Повод — вопрос Анны из отзывов (docs/feedback.md, s13, стопка «Портит данные»): что будет с подходом, если в зале пропадёт интернет.
// Сеть отключает Playwright: context.setOffline в сквозном тесте приложения (браузер шагов записи сеть не отключает, режим полёта
// на телефоне локально не записать — подпись урока «Playwright отключает сеть»). Запускается только свой файл, e2e/offline.spec.ts:
// playwright.config.ts (s07) сам поднимает npm run dev и сам его останавливает, поэтому шага dev в сессии нет.
// Сначала тест (Accept edits): без сети Анна на «Груди и плечах» (тренировка 3 в seed.sql; «Ноги» считает e2e/quick-set.spec.ts)
// записывает подход — он ждёт с пометкой «не отправлено», сеть вернулась — уходит, Марина видит его на карточке Анны; второй
// тест — «Повторить подход» без сети тоже ждёт в очереди. Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и
// после; подходы — 50 × 10, как у других сквозных тестов: в общем прогоне s26 тесты идут параллельно, и quick-set.spec.ts ждёт
// последний подход Анны «50 кг × 10» в списке у Марины.
// Красный — настоящий (проверен черновым прогоном): форма и «Повторить подход» — серверные действия, без сети запрос не уходит —
// в журнал сервера браузер пишет «Uncaught TypeError: Failed to fetch» у обеих <form>, пометки «не отправлено» нет; подход в базу
// не попадает (lost-db это подтверждает: в счёте нет подходов этого прогона).
// Очередь (Accept edits), первым ходом: lib/sets.ts — правила подхода (parseSet) одни для формы и сервера, с верхними пределами
// (повторы — int в базе); lib/queue.ts — очередь своя у каждого вошедшего (sets-queue:<id>: подходы Анны не уйдут под входом
// Олега), по порядку; ответ есть — подход уходит из очереди: «отправлено» или «не принято» (отказ сервера не держит следующие);
// ответа нет — первый ждёт; испорченная строка в localStorage — пустая очередь; тест очереди lib/queue.test.ts. Вторым ходом
// («Делай»): маршрут POST /api/workouts/[id]/sets — JSON, cookie входа, asUser (RLS: чужая тренировка — 404; /api/sets занят
// прототипом s02 до s26); components/SetForm.tsx — форма и «Повторить подход» кладут подход в очередь вошедшего с номером
// crypto.randomUUID() и пометкой «не отправлено», «отправлено» — только после ответа «принято»; сети нет — ждёт события online,
// ответа нет — повтор через 3 с, 6 с, 12 с … не дольше минуты; область aria-live — всегда в разметке. Номер очередь шлёт, а сервер
// его пока не знает. Подход в очереди — «50 кг, 10 повторов — …», без «50 кг × 10»: getByText("50 кг × 10") e2e/cycle.spec.ts
// находит только строку подхода. Серверные действия saveSet и repeatSet больше не нужны — app/workouts/[id]/actions.ts удаляется.
// Человек дописывает ожидание в e2e/cycle.spec.ts и e2e/quick-set.spec.ts: подход теперь уходит через очередь и маршрут, первый
// запрос к которому холодный dev собирает несколько секунд, — ждём до 15 с, как e2e-wait в s20 (тесты не запускаются: общий
// прогон — в s26; в черновом прогоне они зелёные вместе с offline.spec.ts на двух и четырёх процессах).
// Подводный камень — потерянный ответ, настоящий вывод: в тесте page.route пропускает первый запрос на сервер (route.fetch), а ответ
// обрывает (route.abort); через 3 с телефон отправляет подход снова — у Марины две строки: «Expected: 1», «Received: 2». psql —
// подходов «Груди и плеч» в базе (три из seed и подходы прогонов теста).
// Исправление (Accept edits): 0013_sets_client_key.sql — client_key uuid unique, null допускается (у подходов seed номера нет);
// psql -f — с подтверждения. Маршрут: номер обязателен, insert … on conflict (client_key) do nothing, на повтор — тот же ответ
// «принято». Тот же тест зелёный. С s24 миграцию 0013 применяет рекордер (шаг schema в s24).
// Конфликт правок (Анна правит подход без связи, Марина — план) — только доской урока: правки назначенной тренировки в приложении нет.
// Сверх таблицы плана: q-lib, q-queue, q-queue-test, q-unit (очередь — свой модуль с тестом), ask-queue-go (второй ход «Делай»:
// одним ходом шаги в окно агента не помещаются), q-actions (серверные действия страницы тренировки больше никто не вызывает),
// cycle-wait и quick-wait (правки человека); lost-db считает тренировку 3, а не 1.
// Строк для кадра сессия не создаёт: браузерных шагов нет, подходы пишет сквозной тест.
// Запись с середины цепочки: node scripts/record-session.mjs --from s23-offline (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: все запросы — Accept edits (правки без вопроса, npx playwright test, vitest, rm и psql — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Сквозной тест — пишет агент первым. Сеть у Анны отключает Playwright; подходы теста — по заметке на карточке у Марины
const OFFLINE_E2E = `import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Грудь и плечи» (id 3 в supabase/seed.sql; «Ноги» считает e2e/quick-set.spec.ts)
// записывает подход без сети — он ждёт на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина
// видит его на карточке Анны. «Повторить подход» без сети — тоже в очередь.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после: от того, сколько их уже в базе, он не зависит.
// Подходы — 50 × 10, как у других сквозных тестов: у Марины в списке подопечных e2e/quick-set.spec.ts ждёт последний подход
// Анны «50 кг × 10», а тесты в общем прогоне идут параллельно.
const NOTE = "без связи";

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("без сети подход ждёт с пометкой «не отправлено», сеть вернулась — уходит, тренер видит", async ({ browser }) => {
  // холодный dev собирает каждую страницу при первом заходе: тесту — втрое больше времени
  test.slow();
  // у Марины и Анны — свои браузеры, у каждой своя cookie входа; сеть пропадает только у Анны
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(NOTE, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/3");
  await anna.context().setOffline(true);
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByLabel("Заметка").fill(NOTE);
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  await expect(anna.getByText("50 кг, 10 повторов — не отправлено")).toBeVisible();

  await anna.context().setOffline(false);
  // «отправлено» — только после ответа сервера; первый запрос к маршруту холодный dev собирает несколько секунд
  await expect(anna.getByText("50 кг, 10 повторов — отправлено")).toBeVisible({ timeout: 15_000 });
  await marina.reload();
  await expect(seen).toHaveCount(before + 1);
});

test("без сети «Повторить подход» тоже ждёт в очереди", async ({ browser }) => {
  test.slow();
  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/3");
  const repeat = anna.getByRole("button", { name: "Повторить подход" });
  // на кнопке — прошлый подход, «Повторить подход (50 кг, 10 повторов)»; в очереди — он же
  const set = (await repeat.textContent())?.match(/\\((.+)\\)/)?.[1];
  await anna.context().setOffline(true);
  await repeat.click();
  await expect(anna.getByText(\`\${set} — не отправлено\`)).toBeVisible();
  await anna.context().setOffline(false);
  await expect(anna.getByText(\`\${set} — отправлено\`)).toBeVisible({ timeout: 15_000 });
});
`

// Правила подхода — пишет агент: одни для формы на телефоне и для сервера; повторы словом — сюда со страницы тренировки
const SETS_LIB = `import { parseWeight } from "@/lib/weight";

// Новый подход: вес, повторы и заметка. Одни правила для формы на телефоне (components/SetForm.tsx) и для сервера
// (app/api/workouts/[id]/sets): форма не ставит в очередь подход, который сервер не примет.
export type NewSet = { weight: number; reps: number; note: string | null };

// Подход из полей формы или из тела запроса: NewSet или текст ошибки для пользователя
export function parseSet(input: { weight?: unknown; reps?: unknown; note?: unknown }): NewSet | string {
  // вес разбирает lib/weight.ts: число или текст ошибки
  const weight = parseWeight(String(input.weight ?? ""));
  if (typeof weight === "string") return weight;
  if (weight > 1000) return "Вес — не больше 1000 кг";
  // повторы — из поля формы или число из JSON; через String: Number(true) — это 1, а String(true) — не число
  const reps = Number(String(input.reps ?? ""));
  if (!Number.isInteger(reps) || reps <= 0) return "Повторы — целое число больше нуля";
  // столбец reps — int: 3 000 000 000 база не примет, сервер ответит сбоем, а сбой очередь повторяет — такой подход в неё не ставим
  if (reps > 1000) return "Повторы — не больше 1000";
  // заметка необязательна: пустое поле — без заметки (null); длиннее 200 знаков не примет и база
  const note = String(input.note ?? "").trim() || null;
  if (note && note.length > 200) return "Заметка — не длиннее 200 знаков";
  return { weight, reps, note };
}

// Повторы словом по правилам русского языка: «1 повтор», «2 повтора», «10 повторов»
const REPS: Record<string, string> = { one: "повтор", few: "повтора", many: "повторов", other: "повтора" };
export function repsText(reps: number): string {
  return \`\${reps} \${REPS[new Intl.PluralRules("ru").select(reps)]}\`;
}
`

// Очередь — пишет агент: своя у каждого вошедшего, по порядку; ответ есть — подход уходит из очереди
const QUEUE_LIB = `import type { NewSet } from "@/lib/sets";

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

export const queueKey = (userId: string) => \`sets-queue:\${userId}\`;

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
        : { key, workoutId, weight, reps, note, status: "не принято", error: reply?.error ?? \`ответ \${response.status}\` },
    );
  }
}
`

// Тест очереди — пишет агент: хранилище и сервер подменены
const QUEUE_TEST = `import { expect, test } from "vitest";
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
`

// Маршрут подхода — пишет агент: JSON, cookie входа, asUser. Номер подхода из очереди он пока не читает
const SETS_ROUTE = `import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseSet } from "@/lib/sets";

// POST /api/workouts/<id>/sets — подход в тренировку id от имени вошедшего: JSON { weight, reps, note }.
// Его шлёт очередь на телефоне (lib/queue.ts): подход уходит, когда есть сеть, а «отправлено» на телефоне — только
// после этого ответа, «принято». Правила подхода — parseSet из lib/sets.ts, те же, что у формы.
export async function POST(request: Request, { params }: RouteContext<"/api/workouts/[id]/sets">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  // не JSON в теле — ответ 400, а не падение сервера с 500
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { weight, reps, note }" }, { status: 400 });
  }
  const set = parseSet(body);
  if (typeof set === "string") return Response.json({ error: set }, { status: 400 });

  // id — число: «abc» не дойдёт до базы. Тренировку видят только её подопечный и его тренер (RLS) — остальным 404
  const saved =
    /^\\d+$/.test(id) &&
    (await asUser(uid, async (db) => {
      const workout = await db.query("select id from workouts where id = $1", [id]);
      if (workout.rows.length === 0) return false;
      await db.query("insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4)", [
        id,
        set.weight,
        set.reps,
        set.note,
      ]);
      return true;
    }));
  if (!saved) return Response.json({ error: "Тренировки нет" }, { status: 404 });
  return Response.json({ status: "принято" }, { status: 201 });
}
`

// Форма с очередью — пишет агент: localStorage вошедшего, номер crypto.randomUUID(), отправка по порядку и по событию online
const SET_FORM = `"use client";

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
  fetch(\`/api/workouts/\${item.workoutId}/sets\`, {
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
                {item.error && \`: \${item.error}\`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
`

// Страница тренировки после s22 — дословно, как в состоянии s22-progress
const WORKOUT_PAGE = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { repeatSet, saveSet } from "./actions";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Повторы словом по правилам русского языка: «1 повтор», «2 повтора», «10 повторов»
const REPS: Record<string, string> = { one: "повтор", few: "повтора", many: "повторов", other: "повтора" };
function repsText(reps: number): string {
  return \`\${reps} \${REPS[new Intl.PluralRules("ru").select(reps)]}\`;
}

// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход», форма нового подхода и комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // упражнения по программе: копия строк шаблона в строках тренировки — «Присед — 3 × 10»
    const items = await db.query<{ id: string; exercise: string; sets: number; reps: number }>(
      "select id, exercise, sets, reps from workout_exercises where workout_id = $1 order by id",
      [id],
    );
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    // комментарии к тренировке: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment>(
      \`select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where cm.workout_id = $1
        order by cm.id\`,
      [id],
    );
    return found.rows.length > 0
      ? { title: found.rows[0].title, items: items.rows, sets: sets.rows, comments: comments.rows }
      : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);
  // одно касание: ещё раз прошлый подход этой тренировки — тот, что на кнопке; вес и повторы действие возьмёт из базы
  const last = workout.sets.at(-1);
  // комментарий — к этой тренировке, после отправки — снова эта страница
  const comment = addComment.bind(null, id, \`/workouts/\${id}\`);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>
      {workout.items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 font-medium">
          {workout.items.map((item) => (
            <li key={item.id}>
              {item.exercise} — {item.sets} × {item.reps}
            </li>
          ))}
        </ul>
      )}

      {workout.sets.length === 0 ? (
        <p className="mt-6 text-zinc-500">Подходов пока нет</p>
      ) : (
        <SetList sets={workout.sets} className="mt-6 flex flex-col gap-1" />
      )}
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>
      {last && (
        <form action={repeatSet.bind(null, id, last.id)} className="mt-6">
          <button type="submit" className="w-full rounded bg-zinc-900 px-4 py-2 text-white">
            Повторить подход ({last.weight} кг, {repsText(last.reps)})
          </button>
        </form>
      )}

      <form action={save} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input
            id="weight"
            name="weight"
            inputMode="decimal"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input
            id="reps"
            name="reps"
            inputMode="numeric"
            className="rounded border border-zinc-300 px-3 py-2"
          />
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

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
`

// Страница тренировки — правка агента (q-page): вместо форм с серверными действиями — SetForm с номером вошедшего и прошлым подходом
const WORKOUT_PAGE_QUEUE = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetForm from "@/components/SetForm";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход» и форма нового подхода — через очередь
// на телефоне (components/SetForm.tsx), комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // упражнения по программе: копия строк шаблона в строках тренировки — «Присед — 3 × 10»
    const items = await db.query<{ id: string; exercise: string; sets: number; reps: number }>(
      "select id, exercise, sets, reps from workout_exercises where workout_id = $1 order by id",
      [id],
    );
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    // комментарии к тренировке: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment>(
      \`select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where cm.workout_id = $1
        order by cm.id\`,
      [id],
    );
    return found.rows.length > 0
      ? { title: found.rows[0].title, items: items.rows, sets: sets.rows, comments: comments.rows }
      : null;
  });
  if (!workout) notFound();
  // одно касание: ещё раз прошлый подход этой тренировки — его вес и повторы на кнопке
  const last = workout.sets.at(-1);
  // комментарий — к этой тренировке, после отправки — снова эта страница
  const comment = addComment.bind(null, id, \`/workouts/\${id}\`);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>
      {workout.items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 font-medium">
          {workout.items.map((item) => (
            <li key={item.id}>
              {item.exercise} — {item.sets} × {item.reps}
            </li>
          ))}
        </ul>
      )}

      {workout.sets.length === 0 ? (
        <p className="mt-6 text-zinc-500">Подходов пока нет</p>
      ) : (
        <SetList sets={workout.sets} className="mt-6 flex flex-col gap-1" />
      )}
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>
      {/* новый подход — сначала в очередь вошедшего на телефоне, потом на сервер: без сети он не пропадёт */}
      <SetForm workoutId={id} userId={uid} last={last ? { weight: last.weight, reps: last.reps } : null} />

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
`

// Ожидание подхода в сквозных тестах s07 и s18 — правка человека: подход уходит через очередь и маршрут
const WAIT_COMMENT = '  // подход уходит через очередь и /api/workouts/[id]/sets: первый запрос к маршруту холодный dev собирает несколько секунд\n'
const CYCLE_WAIT = '  await expect(anna.getByText("50 кг × 10")).toBeVisible();\n'
const CYCLE_WAIT_15 = WAIT_COMMENT + '  await expect(anna.getByText("50 кг × 10")).toBeVisible({ timeout: 15_000 });\n'
const QUICK_WAIT = '  await expect(sets).toHaveCount(before + 1);\n'
const QUICK_WAIT_15 = WAIT_COMMENT + '  await expect(sets).toHaveCount(before + 1, { timeout: 15_000 });\n'

// Тот же тест — правка агента (lost-e2e): третий тест, ответ теряется по дороге
const OFFLINE_E2E_LOST = `import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Грудь и плечи» (id 3 в supabase/seed.sql; «Ноги» считает e2e/quick-set.spec.ts)
// записывает подход без сети — он ждёт на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина
// видит его на карточке Анны. «Повторить подход» без сети — тоже в очередь.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после: от того, сколько их уже в базе, он не зависит.
// Подходы — 50 × 10, как у других сквозных тестов: у Марины в списке подопечных e2e/quick-set.spec.ts ждёт последний подход
// Анны «50 кг × 10», а тесты в общем прогоне идут параллельно.
const NOTE = "без связи";
const LOST = "ответ потерялся";

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("без сети подход ждёт с пометкой «не отправлено», сеть вернулась — уходит, тренер видит", async ({ browser }) => {
  // холодный dev собирает каждую страницу при первом заходе: тесту — втрое больше времени
  test.slow();
  // у Марины и Анны — свои браузеры, у каждой своя cookie входа; сеть пропадает только у Анны
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(NOTE, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/3");
  await anna.context().setOffline(true);
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByLabel("Заметка").fill(NOTE);
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  await expect(anna.getByText("50 кг, 10 повторов — не отправлено")).toBeVisible();

  await anna.context().setOffline(false);
  // «отправлено» — только после ответа сервера; первый запрос к маршруту холодный dev собирает несколько секунд
  await expect(anna.getByText("50 кг, 10 повторов — отправлено")).toBeVisible({ timeout: 15_000 });
  await marina.reload();
  await expect(seen).toHaveCount(before + 1);
});

test("без сети «Повторить подход» тоже ждёт в очереди", async ({ browser }) => {
  test.slow();
  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/3");
  const repeat = anna.getByRole("button", { name: "Повторить подход" });
  // на кнопке — прошлый подход, «Повторить подход (50 кг, 10 повторов)»; в очереди — он же
  const set = (await repeat.textContent())?.match(/\\((.+)\\)/)?.[1];
  await anna.context().setOffline(true);
  await repeat.click();
  await expect(anna.getByText(\`\${set} — не отправлено\`)).toBeVisible();
  await anna.context().setOffline(false);
  await expect(anna.getByText(\`\${set} — отправлено\`)).toBeVisible({ timeout: 15_000 });
});

test("ответ потерялся — один подход, одна строка", async ({ browser }) => {
  test.slow();
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(LOST, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/3");
  // первый ответ теряется по дороге: запрос доходит до сервера (route.fetch), а телефон ответа не получает (route.abort)
  await anna.route(
    "**/api/workouts/3/sets",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByLabel("Заметка").fill(LOST);
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  // телефон не знает, что сервер подход принял, и через 3 с отправляет его снова
  await expect(anna.getByText("50 кг, 10 повторов — отправлено")).toBeVisible({ timeout: 15_000 });
  await marina.reload();
  expect((await seen.count()) - before, "строк подхода у тренера").toBe(1);
});
`

// Номер подхода в базе — пишет агент: uuid unique, null допускается
const KEY_SQL = `-- Номер подхода с телефона. Очередь на телефоне (components/SetForm.tsx) даёт каждому подходу свой номер — uuid из
-- crypto.randomUUID() — и, если ответ «принято» не дошёл, отправляет тот же подход снова. unique: строка с этим номером
-- в таблице одна, повтор новой строки не даст. У подходов из seed.sql и записанных раньше номера нет — null: unique
-- пропускает сколько угодно null, поэтому столбец добавляется к таблице с подходами без ошибки.
alter table sets add column client_key uuid unique;
`

// Маршрут — правка агента (key-route): номер обязателен, on conflict (client_key) do nothing, на повтор — тот же ответ
const SETS_ROUTE_KEY = `import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseSet } from "@/lib/sets";

// Номер подхода — uuid, как его даёт crypto.randomUUID() на телефоне
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/workouts/<id>/sets — подход в тренировку id от имени вошедшего: JSON { key, weight, reps, note }, key — номер подхода.
// Его шлёт очередь на телефоне (lib/queue.ts): подход уходит, когда есть сеть, а «отправлено» на телефоне — только
// после этого ответа, «принято». Правила подхода — parseSet из lib/sets.ts, те же, что у формы.
// Номер принимается один раз: ответ «принято» потерялся, и телефон прислал тот же подход снова — второй строки не будет,
// а ответ тот же, «принято», и телефон перестанет его слать.
export async function POST(request: Request, { params }: RouteContext<"/api/workouts/[id]/sets">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  // не JSON в теле — ответ 400, а не падение сервера с 500
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { key, weight, reps, note }" }, { status: 400 });
  }
  // без номера повтор не узнать
  const key = typeof body.key === "string" && UUID.test(body.key) ? body.key : null;
  if (!key) return Response.json({ error: "Нужен номер подхода key — uuid" }, { status: 400 });
  const set = parseSet(body);
  if (typeof set === "string") return Response.json({ error: set }, { status: 400 });

  // id — число: «abc» не дойдёт до базы. Тренировку видят только её подопечный и его тренер (RLS) — остальным 404
  const saved =
    /^\\d+$/.test(id) &&
    (await asUser(uid, async (db) => {
      const workout = await db.query("select id from workouts where id = $1", [id]);
      if (workout.rows.length === 0) return false;
      // подход с этим номером уже есть — on conflict do nothing: строка не добавится, ответ тот же
      await db.query(
        \`insert into sets (workout_id, weight, reps, note, client_key) values ($1, $2, $3, $4, $5)
         on conflict (client_key) do nothing\`,
        [id, set.weight, set.reps, set.note, key],
      );
      return true;
    }));
  if (!saved) return Response.json({ error: "Тренировки нет" }, { status: 404 });
  return Response.json({ status: "принято" }, { status: 201 });
}
`

// Ответы агента — авторские, по выводу его шагов; что видно в строках Write / Edit / Run, ответ не повторяет
const ASK_OFFLINE_REPLY =
  'Тест красный: без сети форма и «Повторить подход» сразу шлют подход на сервер — «Failed to fetch», пометки «не отправлено» нет: ' +
  'подождать сеть подходу негде.'
const ASK_QUEUE_REPLY =
  'Очередь — lib/queue.ts: своя у каждого вошедшего, по порядку; есть ответ — подход уходит из очереди («отправлено» или ' +
  '«не принято»), нет ответа — ждёт. Дальше: маршрут, форма и «Повторить подход» через очередь. Делать?'
const ASK_QUEUE_GO_REPLY =
  'Форма и «Повторить подход» кладут подход в очередь с номером crypto.randomUUID() и пометкой «не отправлено». Уходит, когда ' +
  'есть сеть; «отправлено» — после ответа «принято», нет ответа — повтор через 3, 6, 12 с… не дольше минуты.'
const ASK_LOST_REPLY =
  'Тест красный: у тренера две строки вместо одной. Номер подхода телефон присылает, но сервер его не проверяет — ' +
  'повтор лёг второй строкой.'
const ASK_KEY_REPLY =
  'client_key — uuid unique, у прежних подходов null. Маршрут без номера отвечает 400, а повтор номера — ' +
  'on conflict do nothing и тот же ответ «принято».'

// Только свой файл: общий прогон всех сквозных тестов — в s26
const E2E = 'npx playwright test e2e/offline.spec.ts'

export default {
  id: 's23-offline',
  from: 's22-progress',
  date: '2026-11-14T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // повод — вопрос Анны в отзывах (s13), стопка «Портит данные»
    { id: 'why-grep', run: 'grep -n "интернет" docs/feedback.md' },
    {
      // Accept edits: правки — без вопроса, npx playwright test — с вопросом [y / n]. Сначала сквозной тест
      id: 'ask-offline-test',
      agent: {
        prompt:
          'Подход в зале без интернета: сначала сквозной тест — без сети подход сохраняется с пометкой «не отправлено», ' +
          'сеть вернулась — уходит, тренер видит',
        reply: ASK_OFFLINE_REPLY,
      },
      steps: [
        { id: 'off-e2e', write: 'e2e/offline.spec.ts', content: OFFLINE_E2E },
        // красный: форма и «Повторить подход» — серверные действия, без сети запрос не уходит
        { id: 'off-red', run: E2E },
      ],
    },
    {
      // первый ход: очередь — свой модуль с тестом; маршрут и форму агент предлагает и делает вторым ходом
      id: 'ask-queue',
      agent: {
        prompt:
          'Сделай очередь на телефоне: подход сначала в очередь, отправка по порядку, «отправлено» — только после ответа сервера. ' +
          'У каждого подхода свой номер',
        reply: ASK_QUEUE_REPLY,
      },
      steps: [
        // сверх таблицы плана: правила подхода — одни для формы и маршрута
        { id: 'q-lib', write: 'lib/sets.ts', content: SETS_LIB },
        // сверх таблицы плана: очередь вошедшего — свой модуль, его проверяет тест без браузера
        { id: 'q-queue', write: 'lib/queue.ts', content: QUEUE_LIB },
        { id: 'q-queue-test', write: 'lib/queue.test.ts', content: QUEUE_TEST },
        { id: 'q-unit', run: 'npx vitest run lib/queue.test.ts' },
      ],
    },
    {
      // сверх таблицы плана: тот же запрос, второй ход — маршрут, форма, страница и зелёный сквозной тест
      id: 'ask-queue-go',
      agent: { prompt: 'Делай', reply: ASK_QUEUE_GO_REPLY },
      steps: [
        // /api/sets занят прототипом s02 — подход живёт под тренировкой
        { id: 'q-route', write: 'app/api/workouts/[id]/sets/route.ts', content: SETS_ROUTE },
        { id: 'q-form', write: 'components/SetForm.tsx', content: SET_FORM },
        { id: 'q-page', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE, replace: WORKOUT_PAGE_QUEUE },
        // сверх таблицы плана: серверные действия saveSet и repeatSet больше никто не вызывает — файл удаляется буквальным путём
        { id: 'q-actions', run: "rm 'app/workouts/[id]/actions.ts'" },
        { id: 'q-green', run: E2E },
      ],
    },
    // сверх таблицы плана — правит человек: подход в тестах s07 и s18 теперь уходит через очередь и маршрут — ждём до 15 с
    { id: 'cycle-wait', edit: 'e2e/cycle.spec.ts', find: CYCLE_WAIT, replace: CYCLE_WAIT_15 },
    { id: 'quick-wait', edit: 'e2e/quick-set.spec.ts', find: QUICK_WAIT, replace: QUICK_WAIT_15 },
    { id: 'c-queue', commit: 'Подход без связи: очередь на отправку' },
    {
      // подводный камень: сервер подход принял, а ответ не дошёл — телефон шлёт снова
      id: 'ask-lost',
      agent: { prompt: 'Проверь случай: сервер подход принял, а ответ потерялся — телефон отправит снова', reply: ASK_LOST_REPLY },
      steps: [
        { id: 'lost-e2e', edit: 'e2e/offline.spec.ts', find: OFFLINE_E2E, replace: OFFLINE_E2E_LOST },
        // красный на самом дубле: ожидали 1, получили 2
        { id: 'lost-red', run: E2E },
      ],
    },
    // подходы «Груди и плеч» в базе: три из seed и подходы прогонов теста, дубль — среди них (тест работает на тренировке 3)
    { id: 'lost-db', run: 'psql -At -c "select count(*) from sets where workout_id = 3"' },
    {
      // Accept edits: миграция и тест — с вопросом [y / n]
      id: 'ask-key',
      agent: {
        prompt: 'Сервер должен принимать номер подхода один раз: уникальный ключ в базе, на повтор — «принято». Миграцию — с подтверждения',
        reply: ASK_KEY_REPLY,
      },
      steps: [
        { id: 'key-sql', write: 'supabase/migrations/0013_sets_client_key.sql', content: KEY_SQL },
        { id: 'key-apply', run: 'psql -f supabase/migrations/0013_sets_client_key.sql' },
        { id: 'key-route', edit: 'app/api/workouts/[id]/sets/route.ts', find: SETS_ROUTE, replace: SETS_ROUTE_KEY },
        { id: 'key-green', run: E2E },
      ],
    },
    { id: 'c-key', commit: 'Без дублей: номер подхода принимается один раз' },
  ],
}
