// Сессия 7: основной цикл и тесты. База — из миграций и seed (db: true: рекордер применяет supabase/ сам, данные s06 не переходят).
// Агент делает сценарии 1–2 из docs/spec.md: тренер на /clients/[id] назначает тренировку (действие app/clients/[id]/actions.ts),
// подопечный видит свои тренировки из базы на /workouts и вписывает подходы на /workouts/[id] (вес разбирает parseWeight), объём —
// volume() в lib/volume.ts; выдуманные данные lib/workouts.ts из s03 удаляются. Анна добавляет всё в индекс и читает изменение:
// git diff --stat HEAD, затем дифф страницы тренера. Марина назначает Анне «Грудь и спина» на 2 ноября — дата в списке «как у
// большинства», new Date(day).toLocaleDateString(): сервер работает с языком системы (LC_ALL=C.UTF-8), и выходит американское 11/2/2026.
// Агент пишет formatDay() в lib/dates.ts — «2 ноября». Анна входит, вписывает подход 60 × 8 — объём 480 кг. Тест на объём по требованию;
// Анна ломает формулу (вес + повторы), npm test красный, git restore возвращает файл из индекса — зелёный. В конце Playwright и сквозной
// тест: Марина назначает, Анна вписывает подход, Марина видит объём. Запись с середины цепочки: node scripts/record-session.mjs
// --from s07-cycle (из course/). Id шагов постоянные: на них ссылаются уроки.

// Страницы с базой при cacheComponents (как в s06): страница ждёт данных целиком
const INSTANT = `// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;
`

// Карточка подопечного после s06 — дословно (если файл другой, рекордер скажет «find не найден»)
const CLIENT_PAGE_S06 = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечный" };

${INSTANT}
// Карточка подопечного по id из адреса: имя и тренировки
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    const workouts = await db.query<{ id: string; title: string; date: string }>(
      "select id, title, to_char(day, 'DD.MM.YYYY') as date from workouts where client_id = $1 order by day",
      [id],
    );
    return client.rows.length > 0 ? { name: client.rows[0].name, workouts: workouts.rows } : null;
  });
  if (!card) notFound();

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>
      {card.workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <h2 className="text-xl font-semibold">{workout.title}</h2>
              <p className="text-sm text-zinc-500">{workout.date}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

// Действие тренера: новая тренировка подопечного. Запрос — от имени тренера: чужому подопечному назначить не даст RLS
const ASSIGN_ACTION = `"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Тренер назначает тренировку подопечному clientId: название и день.
// Запрос идёт от имени тренера, и чужому подопечному назначить не даст RLS (политика «тренер добавляет тренировки»).
export async function assignWorkout(clientId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const title = String(form.get("title") ?? "").trim();
  const day = String(form.get("day") ?? "");
  // без названия или без даты (ГГГГ-ММ-ДД из поля даты) ничего не назначаем
  if (title === "" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) return;
  await asUser(uid, (db) =>
    db.query("insert into workouts (client_id, title, day) values ($1, $2, $3)", [clientId, title, day]),
  );
  // карточка подопечного покажет новую тренировку сразу после нажатия
  revalidatePath(\`/clients/\${clientId}\`);
}
`

// Карточка подопечного: форма назначения и тренировки. Дата — «как у большинства»: toLocaleDateString() без языка.
// day из базы — Date (pg разбирает date как полночь по часам сервера). Названия ведут на тренировку: тренеру её видно по RLS.
const clientPage = (dateImport, dateText) => `import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
${dateImport}import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

${INSTANT}
// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    const workouts = await db.query<{ id: string; title: string; day: Date }>(
      "select id, title, day from workouts where client_id = $1 order by day",
      [id],
    );
    return client.rows.length > 0 ? { name: client.rows[0].name, workouts: workouts.rows } : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <form action={assign} className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая тренировка</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input
            id="day"
            name="day"
            type="date"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Назначить
        </button>
      </form>

      <h2 className="mt-8 text-xl font-semibold">Тренировки</h2>
      {card.workouts.length === 0 ? (
        <p className="mt-2 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={\`/workouts/\${workout.id}\`} className="font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{${dateText}}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

const DATE_IMPORT = 'import { formatDay } from "@/lib/dates";\n'
const DATE_US = 'new Date(workout.day).toLocaleDateString()'
const DATE_RU = 'formatDay(workout.day)'
const CLIENT_PAGE = clientPage('', DATE_US)
const CLIENT_PAGE_RU = clientPage(DATE_IMPORT, DATE_RU)

// «Мои тренировки» из базы вместо lib/workouts.ts: тренировки вошедшего подопечного (c.user_id = его uid)
const workoutsPage = (dateImport, dateText) => `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
${dateImport}import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Мои тренировки" };

${INSTANT}
// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS)
export default async function WorkoutsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const workouts = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; title: string; day: Date }>(
      \`select w.id, w.title, w.day
         from workouts w join clients c on c.id = w.client_id
        where c.user_id = $1
        order by w.day\`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Мои тренировки</h1>

      {workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={\`/workouts/\${workout.id}\`} className="text-xl font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{${dateText}}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

const WORKOUTS_PAGE = workoutsPage('', DATE_US)
const WORKOUTS_PAGE_RU = workoutsPage(DATE_IMPORT, DATE_RU)

// Тренировка: подходы, объём и форма нового подхода. Ошибку разбора действие кладёт в адрес (?error=…), страница показывает её под формой
const WORKOUT_PAGE = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { saveSet } from "./actions";

export const metadata: Metadata = { title: "Тренировка" };

${INSTANT}
// Тренировка по id из адреса: подходы, объём и форма нового подхода. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    return found.rows.length > 0 ? { title: found.rows[0].title, sets: sets.rows } : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>

      <ul className="mt-6 flex flex-col gap-1">
        {workout.sets.map((set) => (
          <li key={set.id}>
            {set.weight} кг × {set.reps}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>

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
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
`

// Действие подопечного: подход в тренировку. Вес разбирает parseWeight из s04; ошибка возвращается на страницу в адресе
const SETS_ACTION = `"use server";

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

  await asUser(uid, (db) =>
    db.query("insert into sets (workout_id, weight, reps) values ($1, $2, $3)", [workoutId, weight, reps]),
  );
  // та же страница заново — с новым подходом и без прежней ошибки в адресе
  redirect(page);
}
`

// Объём — отдельной функцией: его считают страницы, а проверяет тест. Формулу человек потом нарочно ломает (шаг break)
const VOLUME_LIB = `// Объём тренировки, кг: сумма «вес × повторы» по подходам; у тренировки без подходов — 0.
// Три подхода по 10 раз с весом 50 кг — 1500 кг.
export type WorkoutSet = { weight: number; reps: number };

export function volume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0);
}
`

const DATES_LIB = `// День тренировки по-русски: «2 ноября». Язык задан явно: без него toLocaleDateString() берёт язык системы,
// где работает сервер, и дата выходит как 11/2/2026.
export function formatDay(day: Date): string {
  return day.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
`

// Тест по требованию из запроса: числа — те же, что в запросе (и в docs/spec.md)
const VOLUME_TEST = `import { expect, test } from "vitest";
import { volume } from "./volume";

test("три подхода по 10 раз с весом 50 кг — 1500 кг", () => {
  const sets = [
    { weight: 50, reps: 10 },
    { weight: 50, reps: 10 },
    { weight: 50, reps: 10 },
  ];
  expect(volume(sets)).toBe(1500);
});

test("пустая тренировка — 0", () => {
  expect(volume([])).toBe(0);
});
`

const VITEST_CONFIG = `import { configDefaults, defineConfig } from "vitest/config";

// Vitest запускает модульные тесты (npm test). В e2e/ — сквозные тесты Playwright, их запускает npx playwright test.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
`

const PW_CONFIG = `import { defineConfig, devices } from "@playwright/test";

// Сквозные тесты из e2e/ — в настоящем браузере, по приложению на http://localhost:3000.
// Если npm run dev уже запущен, тесты идут по нему; если нет — Playwright запустит его сам.
export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
`

// Сквозной тест: у Марины и Анны свои браузеры (у каждой своя cookie входа). Тренировка с новым названием на каждый запуск —
// тест не зависит от того, что уже лежит в базе, и не мешает следующим шагам: в базе только прибавляется тренировка с подходом.
const E2E_TEST = `import { expect, test, type Page } from "@playwright/test";

// Сценарии 1–2 из docs/spec.md целиком: Марина назначает тренировку Анне, Анна вписывает подход, Марина видит объём.
// Название каждый раз новое: тест не зависит от того, что уже есть в базе.
const title = \`Сквозной тест \${Date.now()}\`;

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(home);
}

test("Марина назначает тренировку, Анна вписывает подход, Марина видит объём", async ({ browser }) => {
  // у Марины и Анны — свои браузеры, у каждой своя cookie входа
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await marina.getByRole("link", { name: "Анна" }).click();
  await marina.getByLabel("Название").fill(title);
  await marina.getByLabel("Дата").fill("2026-11-09");
  await marina.getByRole("button", { name: "Назначить" }).click();
  await expect(marina.getByRole("link", { name: title })).toBeVisible();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.getByRole("link", { name: title }).click();
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  await expect(anna.getByText("50 кг × 10")).toBeVisible();

  await marina.getByRole("link", { name: title }).click();
  await expect(marina.getByText("Объём: 500 кг")).toBeVisible();
});
`

// .gitignore заготовки create-next-app: отчёты Playwright (test-results/ после каждого запуска) — рядом с /coverage
const IGNORE_TESTING = '# testing\n/coverage\n'
const IGNORE_TESTING_PW = '# testing\n/coverage\n/test-results/\n/playwright-report/\n'

export default {
  id: 's07-cycle',
  from: 's06-auth',
  date: '2026-11-01T10:00:00+03:00',
  db: true,
  steps: [
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    {
      id: 'ask-assign',
      agent: {
        prompt:
          'Основной цикл по сценариям 1–2 из docs/spec.md: тренер на /clients/[id] назначает тренировку (поля «Название», «Дата», кнопка «Назначить»); ' +
          'подопечный видит свои тренировки из базы на /workouts и вписывает подходы на /workouts/[id] ' +
          '(поля «Вес, кг», «Повторы», кнопка «Сохранить подход», разбор веса — parseWeight); объём — в lib/volume.ts',
        reply:
          'Сделал основной цикл. Тренер: на /clients/[id] форма «Название», «Дата» и кнопка «Назначить», под ней тренировки подопечного; ' +
          'действие app/clients/[id]/actions.ts добавляет тренировку от имени тренера, чужому подопечному назначить не даст RLS. ' +
          'Подопечный: /workouts теперь из базы, только его тренировки; на /workouts/[id] подходы, объём и форма «Вес, кг», «Повторы», ' +
          '«Сохранить подход» — вес разбирает parseWeight, ошибка видна под формой. Объём считает volume() из lib/volume.ts. ' +
          'Выдуманные данные lib/workouts.ts больше не нужны — удалил.',
      },
      steps: [
        { id: 'assign-action', write: 'app/clients/[id]/actions.ts', content: ASSIGN_ACTION },
        { id: 'client-page2', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE_S06, replace: CLIENT_PAGE },
        { id: 'workouts-db', write: 'app/workouts/page.tsx', content: WORKOUTS_PAGE },
        { id: 'workout-page', write: 'app/workouts/[id]/page.tsx', content: WORKOUT_PAGE },
        { id: 'sets-action', write: 'app/workouts/[id]/actions.ts', content: SETS_ACTION },
        { id: 'volume-lib', write: 'lib/volume.ts', content: VOLUME_LIB },
        { id: 'drop-fake', run: 'git rm -q lib/workouts.ts' },
      ],
    },
    // новые файлы попадают в git diff HEAD только из индекса; из него же git restore потом вернёт lib/volume.ts
    { id: 'stage', run: 'git add -A' },
    { id: 'diff-stat', run: 'git diff --stat HEAD' },
    { id: 'diff-assign', run: "git diff HEAD -- 'app/clients/[id]/page.tsx'" },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    { id: 'assign', browser: { url: '/clients/1', fill: { Название: 'Грудь и спина', Дата: '2026-11-02' }, click: 'Назначить' } },
    {
      id: 'ask-date',
      agent: {
        prompt: 'Даты показываются как 11/2/2026, а приложение русское: нужно «2 ноября»',
        reply:
          'Добавил lib/dates.ts: formatDay() пишет день по-русски — «2 ноября». Язык в нём задан явно: toLocaleDateString() без языка ' +
          'берёт язык системы, где работает сервер, отсюда 11/2/2026. formatDay теперь на карточке подопечного у тренера и в «Моих тренировках».',
      },
      steps: [
        { id: 'dates-lib', write: 'lib/dates.ts', content: DATES_LIB },
        { id: 'date-use-1', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE, replace: CLIENT_PAGE_RU },
        { id: 'date-use-2', edit: 'app/workouts/page.tsx', find: WORKOUTS_PAGE, replace: WORKOUTS_PAGE_RU },
      ],
    },
    { id: 'assign-view', browser: { url: '/clients/1' } },
    { id: 'login-anna', browser: { url: '/login', fill: { Почта: 'anna@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    // «Грудь и спина» — тренировка 6: в seed тренировки 1–5 (identity по порядку вставки), шаг assign добавил шестую
    { id: 'log-set', browser: { url: '/workouts/6', fill: { 'Вес, кг': '60', Повторы: '8' }, click: 'Сохранить подход' } },
    {
      id: 'ask-volume-test',
      agent: {
        prompt: 'Тест на объём по требованию: три подхода по 10 раз с весом 50 кг — 1500 кг; пустая тренировка — 0',
        reply:
          'Написал lib/volume.test.ts — два теста ровно по требованию: три подхода по 10 раз с весом 50 кг дают 1500 кг, ' +
          'тренировка без подходов — 0. Запустил npx vitest run lib/volume.test.ts — оба прошли.',
      },
      steps: [
        { id: 'volume-test', write: 'lib/volume.test.ts', content: VOLUME_TEST },
        { id: 'volume-run', run: 'npx vitest run lib/volume.test.ts' },
      ],
    },
    // проверка теста: человек нарочно ломает формулу — тест должен упасть
    { id: 'break', edit: 'lib/volume.ts', find: 'weight * reps', replace: 'weight + reps' },
    { id: 'red', run: 'npm test' },
    { id: 'unbreak', run: 'git restore lib/volume.ts' },
    { id: 'green', run: 'npm test' },
    { id: 'pw', run: 'npm install -D @playwright/test@1.56.1' },
    {
      id: 'ask-e2e',
      agent: {
        prompt: 'Сквозной тест сценария: Марина назначает тренировку Анне, Анна вписывает подход, Марина видит объём',
        reply:
          'Написал e2e/cycle.spec.ts: Марина входит и назначает Анне тренировку, Анна в своём браузере вписывает подход 50 кг × 10, ' +
          'Марина открывает эту тренировку и видит «Объём: 500 кг». Название каждый раз новое — тест не зависит от того, что уже есть в базе. ' +
          'playwright.config.ts: тесты из e2e/, адрес http://localhost:3000, запущенный npm run dev берётся как есть. ' +
          'Vitest папку e2e/ больше не трогает (vitest.config.ts), отчёты Playwright — в .gitignore. npx playwright test — тест прошёл.',
      },
      steps: [
        { id: 'vitest-config', write: 'vitest.config.ts', content: VITEST_CONFIG },
        { id: 'pw-config', write: 'playwright.config.ts', content: PW_CONFIG },
        { id: 'e2e-file', write: 'e2e/cycle.spec.ts', content: E2E_TEST },
        // test-results/ появляется после каждого запуска Playwright: до запуска — в .gitignore
        { id: 'e2e-ignore', edit: '.gitignore', find: IGNORE_TESTING, replace: IGNORE_TESTING_PW },
        { id: 'e2e-run', run: 'npx playwright test' },
      ],
    },
    { id: 'c-cycle', commit: 'Основной цикл: назначить тренировку, вписать подходы; тесты' },
  ],
}
