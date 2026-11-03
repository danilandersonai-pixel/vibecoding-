// Сессия 23: тренировка без интернета (утро 14 ноября; база — из миграций и seed, db: true). Четвёртая сессия недели 3, ролик дня 18.
// Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next (как в s13, s19–s22).
// Повод — вопрос Анны из отзывов (docs/feedback.md, s13, стопка «Портит данные»): что будет с подходом, если в зале пропадёт интернет.
// Сеть отключает Playwright: context.setOffline в сквозном тесте приложения (браузер шагов записи сеть не отключает, режим полёта
// на телефоне локально не записать — подпись урока «Playwright отключает сеть»). Запускается только свой файл, e2e/offline.spec.ts:
// playwright.config.ts (s07) сам поднимает npm run dev и сам его останавливает, поэтому шага dev в сессии нет.
// Сначала тест (Accept edits): без сети Анна записывает подход на «Ногах» (тренировка 1 в seed.sql) — он ждёт с пометкой
// «не отправлено», сеть вернулась — уходит, Марина видит его на карточке Анны. Свои подходы тест узнаёт по заметке (её видит тренер)
// и считает до и после, как e2e/quick-set.spec.ts: от прежних строк он не зависит, «Повторить подход» заметку не копирует, а вес
// и повторы — 50 × 10, как в seed: в общем прогоне s26 quick-set.spec.ts повторяет последний подход «Ног» и считает «50 кг × 10».
// Красный — настоящий (проверен черновым прогоном): форма — серверное действие, без сети запрос не уходит — в журнал сервера браузер
// пишет «Uncaught TypeError: Failed to fetch» у <form action={save}>, пометки «не отправлено» нет (на странице — общее «This page
// couldn’t load»), подход в базу не попал.
// Очередь (Accept edits): lib/sets.ts — правила подхода (parseSet) одни для формы и сервера; маршрут POST /api/workouts/[id]/sets —
// JSON, cookie входа, asUser (RLS: чужая тренировка — 404); /api/sets занят прототипом s02 до s26. components/SetForm.tsx — подход
// сначала в очередь в localStorage с номером crypto.randomUUID() и пометкой «не отправлено», отправка по порядку, «отправлено» —
// только после ответа сервера «принято»; сети нет — ждёт события online, ответа нет — повтор через 3 с. Номер очередь шлёт,
// а сервер его пока не знает. Подход в очереди — «50 кг, 10 повторов — не отправлено», без «50 кг × 10»: getByText("50 кг × 10")
// e2e/cycle.spec.ts находит только строку подхода. Серверное действие saveSet больше не нужно — его нет.
// Подводный камень — потерянный ответ, настоящий вывод: в тесте page.route пропускает первый запрос на сервер (route.fetch), а ответ
// обрывает (route.abort); телефон отправляет подход снова — у Марины две строки: «Expected: 1», «Received: 2». psql — подходов
// «Ног» в базе (три из seed и подходы прогонов теста).
// Исправление (Accept edits): 0013_sets_client_key.sql — client_key uuid unique, null допускается (у подходов seed номера нет);
// psql -f — с подтверждения. Маршрут: номер обязателен, insert … on conflict (client_key) do nothing, на повтор — тот же ответ
// «принято». Тот же тест зелёный. С s24 миграцию 0013 применяет рекордер (шаг schema в s24).
// Конфликт правок (Анна правит подход без связи, Марина — план) — только доской урока: правки назначенной тренировки в приложении нет.
// Сверх таблицы плана (шаг — один файл): q-lib (правила подхода — для формы и маршрута) и q-actions (saveSet больше никто не вызывает).
// Строк для кадра сессия не создаёт: браузерных шагов нет, подходы пишет сквозной тест.
// Запись с середины цепочки: node scripts/record-session.mjs --from s23-offline (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: все запросы — Accept edits (правки без вопроса, npx playwright test и psql — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Сквозной тест — пишет агент первым. Сеть у Анны отключает Playwright; подходы теста — по заметке на карточке у Марины
const OFFLINE_E2E = `import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Ноги» (id 1 в supabase/seed.sql) записывает подход без сети — он ждёт
// на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина видит его на карточке Анны.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после, как e2e/quick-set.spec.ts: от того, сколько их
// уже в базе, он не зависит, а «Повторить подход» заметку не копирует.
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
  await anna.goto("/workouts/1");
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
  // повторы — из поля формы или число из JSON; через String: Number(true) — это 1, а String(true) — не число
  const reps = Number(String(input.reps ?? ""));
  if (!Number.isInteger(reps) || reps <= 0) return "Повторы — целое число больше нуля";
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

// Маршрут подхода — пишет агент: JSON, cookie входа, asUser. Номер подхода из очереди он пока не читает
const SETS_ROUTE = `import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseSet } from "@/lib/sets";

// POST /api/workouts/<id>/sets — подход в тренировку id от имени вошедшего: JSON { weight, reps, note }.
// Его шлёт очередь на телефоне (components/SetForm.tsx): подход уходит, когда есть сеть, а «отправлено» на телефоне — только
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

// Форма с очередью — пишет агент: localStorage, номер crypto.randomUUID(), отправка по порядку и по событию online
const SET_FORM = `"use client";

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
      const response = await fetch(\`/api/workouts/\${item.workoutId}/sets\`, {
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
        mark(item.key, "не принято", reply?.error ?? \`ответ \${response.status}\`);
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
              {item.error && \`: \${item.error}\`}
            </li>
          ))}
        </ul>
      )}
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

// Страница тренировки — правка агента (q-page): вместо формы с серверным действием — SetForm; повторы словом — из lib/sets.ts
const WORKOUT_PAGE_QUEUE = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetForm from "@/components/SetForm";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { repsText } from "@/lib/sets";
import { volume } from "@/lib/volume";
import { repeatSet } from "./actions";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход», форма нового подхода с очередью
// на отправку (components/SetForm.tsx) и комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
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

      {/* новый подход — сначала в очередь на телефоне, потом на сервер: без сети он не пропадёт */}
      <SetForm workoutId={id} />

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
`

// Действия страницы тренировки после s22 — дословно, как в состоянии s22-progress
const WORKOUT_ACTIONS = `"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseWeight } from "@/lib/weight";

// Подход в тренировку workoutId: вес и повторы из формы.
// Запрос идёт от имени вошедшего, и в чужую тренировку вписать не даст RLS (политика «подопечный добавляет подходы»).
export async function saveSet(workoutId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const page = \`/workouts/\${workoutId}\`;
  // ошибку страница покажет под формой: её текст — в адресе
  const fail = (error: string) => \`\${page}?error=\${encodeURIComponent(error)}\`;

  // вес разбирает lib/weight.ts: число или текст ошибки
  const weight = parseWeight(String(form.get("weight") ?? ""));
  if (typeof weight === "string") redirect(fail(weight));
  const reps = Number(form.get("reps"));
  if (!Number.isInteger(reps) || reps <= 0) redirect(fail("Повторы — целое число больше нуля"));

  // заметка необязательна: пустое поле — без заметки (null); длиннее 200 знаков не примет и база
  const note = String(form.get("note") ?? "").trim() || null;
  if (note && note.length > 200) redirect(fail("Заметка — не длиннее 200 знаков"));

  const setId = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4) returning id",
      [workoutId, weight, reps, note],
    );
    return rows[0].id;
  });
  // журнал сервера: только id подхода и время — без имени и заметки, это данные о здоровье
  console.log("Подход сохранён", { setId, time: new Date().toLocaleTimeString("ru-RU") });
  // та же страница заново — с новым подходом и без прежней ошибки в адресе
  redirect(page);
}

// Одно касание: ещё один подход в тренировку workoutId с весом и повторами подхода setId — того, что на кнопке. Вес и повторы
// берём из базы, а не из формы: подставить в запрос свой вес нельзя; подход другой тренировки не повторится (workout_id = $1).
// Запрос идёт от имени вошедшего: в чужую тренировку не даст вписать RLS.
export async function repeatSet(workoutId: string, setId: string) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) =>
    db.query(
      \`insert into sets (workout_id, weight, reps)
       select workout_id, weight, reps from sets where id = $2 and workout_id = $1\`,
      [workoutId, setId],
    ),
  );
  redirect(\`/workouts/\${workoutId}\`);
}
`

// Правка агента (q-actions): saveSet больше никто не вызывает — подход уходит через очередь и маршрут; «Повторить подход» остаётся
const WORKOUT_ACTIONS_QUEUE = `"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Одно касание: ещё один подход в тренировку workoutId с весом и повторами подхода setId — того, что на кнопке. Вес и повторы
// берём из базы, а не из формы: подставить в запрос свой вес нельзя; подход другой тренировки не повторится (workout_id = $1).
// Запрос идёт от имени вошедшего: в чужую тренировку не даст вписать RLS.
export async function repeatSet(workoutId: string, setId: string) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) =>
    db.query(
      \`insert into sets (workout_id, weight, reps)
       select workout_id, weight, reps from sets where id = $2 and workout_id = $1\`,
      [workoutId, setId],
    ),
  );
  redirect(\`/workouts/\${workoutId}\`);
}
`

// Тот же тест — правка агента (lost-e2e): второй тест, ответ теряется по дороге
const OFFLINE_E2E_LOST = `import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Ноги» (id 1 в supabase/seed.sql) записывает подход без сети — он ждёт
// на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина видит его на карточке Анны.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после, как e2e/quick-set.spec.ts: от того, сколько их
// уже в базе, он не зависит, а «Повторить подход» заметку не копирует.
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
  await anna.goto("/workouts/1");
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

test("ответ потерялся — один подход, одна строка", async ({ browser }) => {
  // холодный dev, как в первом тесте
  test.slow();
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(LOST, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/1");
  // первый ответ теряется по дороге: запрос доходит до сервера (route.fetch), а телефон ответа не получает (route.abort)
  await anna.route(
    "**/api/workouts/1/sets",
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
// Его шлёт очередь на телефоне (components/SetForm.tsx): подход уходит, когда есть сеть, а «отправлено» на телефоне — только
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
  'Тест красный: без сети форма сразу отправляет подход на сервер — «Failed to fetch», пометки «не отправлено» нет: ' +
  'подождать сеть подходу негде.'
const ASK_QUEUE_REPLY =
  'Подход сначала ложится в очередь в localStorage — с пометкой «не отправлено» и своим номером crypto.randomUUID(). ' +
  'Уходит по порядку, когда есть сеть; «отправлено» — после ответа «принято», ответа нет — повтор через 3 с.'
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
        // красный: форма — серверное действие, без сети запрос не уходит
        { id: 'off-red', run: E2E },
      ],
    },
    {
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
        // /api/sets занят прототипом s02 — подход живёт под тренировкой
        { id: 'q-route', write: 'app/api/workouts/[id]/sets/route.ts', content: SETS_ROUTE },
        { id: 'q-form', write: 'components/SetForm.tsx', content: SET_FORM },
        { id: 'q-page', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE, replace: WORKOUT_PAGE_QUEUE },
        // сверх таблицы плана: серверное действие формы больше никто не вызывает
        { id: 'q-actions', edit: 'app/workouts/[id]/actions.ts', find: WORKOUT_ACTIONS, replace: WORKOUT_ACTIONS_QUEUE },
        { id: 'q-green', run: E2E },
      ],
    },
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
    // подходы «Ног» в базе: три из seed и подходы прогонов теста, дубль — среди них
    { id: 'lost-db', run: 'psql -At -c "select count(*) from sets where workout_id = 1"' },
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
