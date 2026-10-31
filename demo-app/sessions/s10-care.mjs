// Сессия 10: бережно к людям и данным. База — из миграций и seed (db: true; seed-load.sql не применяется: у Марины снова Анна и Олег).
// Агент добавляет подопечного на /clients: поле «Имя», кнопка «Добавить» (действие app/clients/actions.ts, вставка от имени тренера),
// проверку имени пишет «как у большинства» — только латиница и пробел (lib/names.ts), ошибка «Имя может содержать только буквы».
// Марина вводит «Ольга» — не проходит. Человек просит имена на любом языке, с дефисом и апострофом («Анна-Мария», «Д'Артаньян»):
// агент сначала пишет тест (lib/names.test.ts), потом правит проверку (буквы любого алфавита, пробел, дефис, апостроф) и запускает его.
// «Ольга» и «Анна-Мария» добавлены. Анна входит; агент по просьбе «писать в журнал сервера сохранение подхода» печатает в консоль
// подопечного и заметку целиком (app/workouts/[id]/actions.ts) — Анна вписывает подход с заметкой «болит колено», и в журнале сервера
// имя и данные о здоровье. Человек просит оставить только id подхода и время — тот же ввод, и в журнале ни имени, ни заметки.
// Лицензии зависимостей — npx license-checker --summary. Коммит с меткой ИИ в сообщении (два абзаца, строка Co-Authored-By) и git log -1.
// Запись с середины цепочки: node scripts/record-session.mjs --from s10-care (из course/). Id шагов постоянные: на них ссылаются уроки.
// Сканер секретов .githooks/pre-commit действует: в коде нет присвоений вида «…KEY = "…"» / «…SECRET = "…"» длиннее 12 знаков.

// Список подопечных после s09 — дословно (если файл другой, рекордер скажет «find не найден»)
const CLIENTS_S09 = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };

// Подопечные вошедшего тренера, у каждого — дата последней тренировки
export default async function ClientsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const clients = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(
      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id\`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={\`/clients/\${client.id}\`}
              className="block rounded border border-zinc-300 p-4 text-xl font-semibold"
            >
              {client.name}
              <span className="block text-sm font-normal text-zinc-500">
                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`

// Список подопечных с формой «Имя» / «Добавить»; ошибку проверки имени действие кладёт в адрес, страница показывает её под формой
const CLIENTS_ADD = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { addClient } from "./actions";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };

// Подопечные вошедшего тренера, у каждого — дата последней тренировки; под списком форма нового подопечного
export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const clients = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(
      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id\`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={\`/clients/\${client.id}\`}
              className="block rounded border border-zinc-300 p-4 text-xl font-semibold"
            >
              {client.name}
              <span className="block text-sm font-normal text-zinc-500">
                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={addClient} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Добавить
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

// Первая версия проверки имени — «как у большинства»: латиница и пробел
const NAMES_LIB = `// Проверка имени подопечного из формы: null — имя годится, иначе текст ошибки для тренера.
// Имя — латинские буквы и пробелы: самый частый случай в примерах, его и проверяем.
const ONLY_LETTERS = "Имя может содержать только буквы";

export function checkName(name: string): string | null {
  return /^[A-Za-z ]+$/.test(name) ? null : ONLY_LETTERS;
}
`

// Тест на имена — раньше исправления: «Ольга», «Анна-Мария», «Д'Артаньян» и отказы
const NAMES_TEST = `import { expect, test } from "vitest";
import { checkName } from "./names";

const ONLY_LETTERS = "Имя может содержать только буквы";

test("кириллица — «Ольга»", () => {
  expect(checkName("Ольга")).toBeNull();
});

test("латиница — «Olga»", () => {
  expect(checkName("Olga")).toBeNull();
});

test("двойное имя через дефис — «Анна-Мария»", () => {
  expect(checkName("Анна-Мария")).toBeNull();
});

test("апостроф — «Д'Артаньян»", () => {
  expect(checkName("Д'Артаньян")).toBeNull();
});

test("имя из двух слов через пробел — «Анна Мария»", () => {
  expect(checkName("Анна Мария")).toBeNull();
});

test("другие алфавиты — «José», «李雷», «Ευγενία»", () => {
  for (const name of ["José", "李雷", "Ευγενία"]) expect(checkName(name), name).toBeNull();
});

test("цифры и знаки — ошибка", () => {
  for (const name of ["Анна2", "Анна!", "<b>Анна</b>", "Анна_Мария"]) expect(checkName(name), name).toBe(ONLY_LETTERS);
});

test("дефис, апостроф или пробел в начале — ошибка", () => {
  for (const name of ["-Анна", "'Анна", " Анна"]) expect(checkName(name), name).toBe(ONLY_LETTERS);
});

test("пустое имя — ошибка", () => {
  expect(checkName("")).toBe(ONLY_LETTERS);
});
`

// Исправленная проверка: буквы любого алфавита (\p{L}), значки к буквам (\p{M}), пробел, дефис, апостроф. String.raw — чтобы обратная косая черта осталась как есть
const NAMES_LIB_FIX = String.raw`// Проверка имени подопечного из формы: null — имя годится, иначе текст ошибки для тренера.
// Имя — буквы любого алфавита (\p{L}, с надстрочными значками \p{M}), пробел, дефис и апостроф: «Ольга», «Анна-Мария», «Д'Артаньян».
// Начинается с буквы, чтобы имя не состояло из одних дефисов и пробелов. Тесты — lib/names.test.ts.
const ONLY_LETTERS = "Имя может содержать только буквы";

export function checkName(name: string): string | null {
  return /^\p{L}[\p{L}\p{M} '’-]*$/u.test(name) ? null : ONLY_LETTERS;
}
`

// Действие «Добавить»: вставка от имени тренера (политика «тренер добавляет своих», s06); имя проверяет lib/names.ts
const ADD_ACTION = `"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { checkName } from "@/lib/names";
import { currentUser } from "@/lib/session";

// Тренер добавляет подопечного: имя из формы. Подопечный записывается вошедшему тренеру (coach_id = uid).
// Запрос идёт от имени тренера, и записать подопечного чужому тренеру не даст RLS (политика «тренер добавляет своих»).
export async function addClient(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const name = String(form.get("name") ?? "").trim();
  // пустое имя ничего не добавляет; остальное проверяет lib/names.ts, ошибку страница покажет под формой
  if (name === "") redirect("/clients");
  const error = checkName(name);
  if (error) redirect(\`/clients?error=\${encodeURIComponent(error)}\`);
  await asUser(uid, (db) => db.query("insert into clients (coach_id, name) values ($1, $2)", [uid, name]));
  // тот же список заново — с новым подопечным и без прежней ошибки в адресе
  redirect("/clients");
}
`

// Сохранение подхода после s08 (конец действия saveSet) — дословно
const SAVE_FIND = `  await asUser(uid, (db) =>
    db.query("insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4)", [workoutId, weight, reps, note]),
  );`

// Беспечный журнал: подопечный и заметка целиком
const SAVE_LOG_FULL = `  const saved = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4) returning id",
      [workoutId, weight, reps, note],
    );
    // чей подход: подопечный этой тренировки
    const owner = await db.query<{ id: string; name: string }>(
      "select c.id, c.name from clients c join workouts w on w.client_id = c.id where w.id = $1",
      [workoutId],
    );
    return { setId: rows[0].id, client: owner.rows[0] };
  });
  // журнал сервера: что сохранили — по нему разбираем ошибки
  console.log("Подход сохранён", {
    setId: saved.setId,
    client: saved.client,
    workoutId,
    weight,
    reps,
    note,
    time: new Date().toLocaleTimeString("ru-RU"),
  });`

// Бережный журнал: только id подхода и время
const SAVE_LOG_MIN = `  const setId = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4) returning id",
      [workoutId, weight, reps, note],
    );
    return rows[0].id;
  });
  // журнал сервера: только id подхода и время — без имени и заметки, это данные о здоровье
  console.log("Подход сохранён", { setId, time: new Date().toLocaleTimeString("ru-RU") });`

export default {
  id: 's10-care',
  from: 's09-audit',
  date: '2026-11-02T15:00:00+03:00',
  db: true,
  steps: [
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    {
      id: 'ask-add-client',
      agent: {
        prompt: 'Тренер добавляет подопечного: на /clients поле «Имя» и кнопка «Добавить», с проверкой имени',
        reply:
          'Добавил подопечного на /clients. Под списком форма: поле «Имя» и кнопка «Добавить». Действие app/clients/actions.ts записывает подопечного ' +
          'вошедшему тренеру от его имени — чужому тренеру записать не даст RLS. Имя проверяет lib/names.ts: пока это латинские буквы и пробел, как у ' +
          'большинства имён в примерах; иначе под формой ошибка «Имя может содержать только буквы».',
      },
      steps: [
        { id: 'name-lib', write: 'lib/names.ts', content: NAMES_LIB },
        { id: 'add-action', write: 'app/clients/actions.ts', content: ADD_ACTION },
        { id: 'add-form', edit: 'app/clients/page.tsx', find: CLIENTS_S09, replace: CLIENTS_ADD },
      ],
    },
    // «Ольга» — кириллица: проверка «только латиница» её не пускает, под формой ошибка, в списке Ольги нет
    { id: 'add-olga', browser: { url: '/clients', fill: { Имя: 'Ольга' }, click: 'Добавить' } },
    {
      id: 'ask-names',
      agent: {
        prompt: 'Имя «Ольга» не проходит. Имена бывают на любом языке, с дефисом и апострофом: «Анна-Мария», «Д\'Артаньян». Сначала тест на эти случаи',
        reply:
          'Начал с теста: lib/names.test.ts проверяет «Ольга», «Анна-Мария», «Д\'Артаньян», имя с пробелом, имена других алфавитов и отказы на цифры, знаки ' +
          'и дефис в начале. Потом поправил lib/names.ts: имя начинается с буквы любого алфавита, дальше — буквы, пробел, дефис и апостроф. ' +
          'Запустил npx vitest run lib/names.test.ts.',
      },
      steps: [
        { id: 'names-test', write: 'lib/names.test.ts', content: NAMES_TEST },
        { id: 'names-fix', write: 'lib/names.ts', content: NAMES_LIB_FIX },
        { id: 'names-run', run: 'npx vitest run lib/names.test.ts' },
      ],
    },
    // та же форма: «Ольга» добавлена — стоит в списке
    { id: 'add-olga2', browser: { url: '/clients', fill: { Имя: 'Ольга' }, click: 'Добавить' } },
    // дефис проходит: «Анна-Мария» в списке рядом с Ольгой
    { id: 'add-anna-maria', browser: { url: '/clients', fill: { Имя: 'Анна-Мария' }, click: 'Добавить' } },
    { id: 'login-anna', browser: { url: '/login', fill: { Почта: 'anna@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    {
      id: 'ask-log',
      agent: {
        prompt: 'Пиши в журнал сервера сохранение подхода, чтобы разбирать ошибки',
        reply:
          'Добавил запись в журнал сервера: после сохранения подхода действие saveSet (app/workouts/[id]/actions.ts) печатает «Подход сохранён» ' +
          'и объект: id подхода, подопечный (id и имя), тренировка, вес, повторы, заметка и время. Чтобы знать, чей подход, запрос теперь возвращает ' +
          'и подопечного этой тренировки. По такой строке видно всё, что понадобится при разборе ошибки.',
      },
      steps: [{ id: 'log-full', edit: 'app/workouts/[id]/actions.ts', find: SAVE_FIND, replace: SAVE_LOG_FULL }],
    },
    // «Грудь и плечи» — тренировка 3 из seed, она Анны (1–3); в журнале сервера: имя подопечного и «болит колено»
    { id: 'log-set2', browser: { url: '/workouts/3', fill: { 'Вес, кг': '40', Повторы: '10', Заметка: 'болит колено' }, click: 'Сохранить подход' } },
    {
      id: 'ask-log-fix',
      agent: {
        prompt: 'В журнале — данные о здоровье. Только id подхода и время, без имени и заметки',
        reply:
          'Убрал. Имя подопечного и заметка о колене — данные о здоровье, в журнале им не место. Теперь действие печатает «Подход сохранён», ' +
          'id подхода и время. Запрос подопечного тренировки стал не нужен — убрал и его.',
      },
      steps: [{ id: 'log-min', edit: 'app/workouts/[id]/actions.ts', find: SAVE_LOG_FULL, replace: SAVE_LOG_MIN }],
    },
    // тот же ввод: в журнале сервера строка без имени и заметки
    { id: 'log-set3', browser: { url: '/workouts/3', fill: { 'Вес, кг': '40', Повторы: '10', Заметка: 'болит колено' }, click: 'Сохранить подход' } },
    // лицензии зависимостей: сводка по лицензиям (чем можно пользоваться в проекте)
    { id: 'licenses', run: 'npx --yes license-checker --summary' },
    // сообщение коммита — два абзаца: заголовок и метка ИИ (строка Co-Authored-By); сканер секретов ничего не находит
    { id: 'c-care', commit: 'Имена на любом языке; журнал без данных о здоровье\n\nCo-Authored-By: Claude <noreply@anthropic.com>' },
    // метка видна в истории
    { id: 'show-label', run: 'git log -1' },
  ],
}
