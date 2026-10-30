// Сессия 17: приглашение по ссылке и повторный аудит (утро 8 ноября; база — из миграций и seed, db: true). Пятая сессия недели 2,
// ролик дня 12. Регистрации в приложении до сих пор нет, вход — свой маршрут по auth.users (Supabase Auth в слое нет), поэтому
// регистрацию по приглашению агент пишет сам: пользователь в auth.users (пароль — только хеш crypt() с bcrypt), профиль подопечного,
// подопечный тренера и вход той же cookie, что у /api/login; повтор почты — понятная ошибка, а не 500.
// Сначала — наивно, как у большинства: ссылка /join/<id тренера>, тренер берётся из адреса, ссылка вечная и многоразовая. Марина видит
// её на странице подопечных; по ней регистрируется Ольга, а потом по той же, пересланной, ссылке — Кирилл, и psql показывает обоих
// у Марины. Исправление: одноразовое приглашение — таблица invites в 0008_invites.sql (код из 16 случайных байт, срок 48 часов,
// кто принял, отзыв, RLS — создаёт только тренер, — и права по столбцам) и функция базы accept_invite: тренер — из записи приглашения,
// второй раз — «уже использовано», отозванное и просроченное — отказ. Сначала тест с базой (test/invites.test.ts; просроченное — вставка
// «из прошлого», ждать двое суток не нужно). Миграцию агент применяет psql -q -f: без строк CREATE TABLE… восемь шагов помещаются
// в окно агента. Наивный код не коммитился, поэтому его убирает rm, а не git rm. Марина создаёт приглашение, по нему
// регистрируется Вера, второй раз ссылка отвечает «Приглашение уже использовано». На страницах нет настоящих дат: срок сверяет база.
// Потом агент в Plan проверяет приглашения по шести вопросам главы 8 — только читает и пишет отчёт, код не меняет.
// Код приглашения случайный, заранее его не знает никто: шаги Веры открывают ссылку со страницы invite-new (url: { from, match }).
// Запись с середины цепочки: node scripts/record-session.mjs --from s17-invite (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: ask-join и ask-invite — Accept edits (правки без вопроса, psql, rm и vitest — с вопросом [y / n]), ask-audit — Plan.
// В окне ask-invite — diffLines: 0 и одна строка вывода vitest (outLines inv-run [7, 7] или [4, 4]): весь вывод не помещается.
// Разработчица в репликах агента по имени не названа: подопечная тоже Анна.

// id из supabase/seed.sql
const MARINA = '11111111-1111-1111-1111-111111111111'
const ANNA = '33333333-3333-3333-3333-333333333333'

// Ссылка-приглашение на странице подопечных: путь /join/ и код из 32 шестнадцатеричных знаков
const INVITE_LINK = /\/join\/[0-9a-f]{32}/

// Форма регистрации — одна у наивной страницы и у страницы приглашения: имя, почта, пароль и «Присоединиться»
const JOIN_FORM = `      <form action={register} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" required autoComplete="name" className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email">Почта</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Присоединиться
        </button>
      </form>
`

const ERROR_ALERT = `      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
`

// Наивная страница приглашения — пишет агент: тренер из адреса /join/<id тренера>, ссылка вечная и многоразовая
const JOIN_PAGE_NAIVE = `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { join } from "./actions";

export const metadata: Metadata = { title: "Приглашение" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Приглашение по ссылке /join/<id тренера>: кто приглашает и форма регистрации — имя, почта и пароль.
// Человек по ссылке ещё не вошёл, поэтому имя тренера читаем от владельца базы, как вход (app/api/login)
export default async function JoinPage({ params, searchParams }: PageProps<"/join/[coach]">) {
  const { coach } = await params;
  const { error } = await searchParams;
  // id тренера — uuid: другой адрес в базу не отправляем
  if (!/^[0-9a-f-]{36}$/.test(coach)) notFound();
  const { rows } = await pool.query<{ name: string }>("select name from profiles where id = $1 and role = 'coach'", [coach]);
  if (rows.length === 0) notFound();
  // поля приходят из формы, а тренера действие получает отсюда
  const register = join.bind(null, coach);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Приглашение</h1>
      <p className="mt-2">Тренер {rows[0].name} приглашает вас в дневник тренировок.</p>

${JOIN_FORM}
${ERROR_ALERT}    </main>
  );
}
`

// Почта и пароль из формы — одна проверка у обеих версий регистрации
const CHECK_ACCOUNT = `// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`

// Начало регистрации — одно у обеих версий: поля формы, проверка, пользователь в auth.users (пароль — хешем) и профиль подопечного.
// back — назад на страницу ссылки с ошибкой под формой; segment — параметр с частью адреса после /join/
const joinStart = (segment) => `  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов и строчными: по ней входят, и в auth.users она одна на человека (unique)
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(${segment})}?error=\${encodeURIComponent(error)}\`);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);

  const db = await pool.connect();
  let uid: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
`

const JOIN_END = `  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  redirect("/workouts");
}
`

const ACTION_IMPORTS = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { startSession } from "@/lib/session";
`

// Наивная регистрация — пишет агент: подопечный того тренера, чей id в адресе
const JOIN_ACTION_NAIVE = `${ACTION_IMPORTS}
// Регистрация по ссылке /join/<id тренера>: новый пользователь в auth.users, профиль подопечного и подопечный этого тренера,
// затем вход. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users
// закрыта, а при ошибке в базе не остаётся половины регистрации.
export async function join(coach: string, form: FormData) {
${joinStart('coach')}    await db.query("insert into clients (coach_id, user_id, name) values ($1, $2, $3)", [coach, uid, name]);
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    // такая почта уже есть (unique в auth.users) — понятная ошибка, а не 500
    if ((err as { code?: string }).code === "23505") back("Эта почта уже зарегистрирована — войдите");
    throw err;
${JOIN_END}
${CHECK_ACCOUNT}`

// Страница подопечных после s16 (её правит invite-link) — дословно, как в состоянии s16-comments
const CLIENTS_PAGE = `import type { Metadata } from "next";
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

// Адрес сайта для ссылки — из запроса (одна строка у обеих версий страницы подопечных)
const ORIGIN = `  // адрес сайта для ссылки — из запроса: localhost:3000 при разработке, свой домен на сервере
  const head = await headers();
  const origin = \`\${head.get("x-forwarded-proto") ?? "http"}://\${head.get("host")}\`;
`

// Ссылка-приглашение на странице подопечных — правка агента (invite-link): вечная ссылка с id вошедшего тренера
const CLIENTS_NAIVE = chain(CLIENTS_PAGE, [
  ['import type { Metadata } from "next";\n', 'import type { Metadata } from "next";\nimport { headers } from "next/headers";\n'],
  ['под списком форма нового подопечного\n', 'под списком форма нового подопечного и ссылка-приглашение\n'],
  ['    return rows;\n  });\n', `    return rows;\n  });\n${ORIGIN}`],
  [
    '          {error}\n        </p>\n      )}\n',
    `          {error}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Ссылка-приглашение</h2>
      <p className="mt-2 text-zinc-500">Отправьте её подопечному: по ней он зарегистрируется и попадёт к вам.</p>
      <p className="mt-2 break-all font-mono text-sm">{\`\${origin}/join/\${uid}\`}</p>
`,
  ],
])

// Тест приглашений — пишет агент до кода. Данные создаёт сам в транзакции с откатом; просроченное — вставка «из прошлого»
const INVITES_TEST = `// @vitest-environment node
// Одноразовое приглашение по ссылке: принятое — подопечный тренера из записи приглашения; второй раз — «уже использовано»;
// отозванное и просроченное — отказ. Принимает приглашение функция базы accept_invite (supabase/migrations/0008_invites.sql),
// её же вызывает регистрация app/join/[code]/actions.ts. Срок сверяют часы базы, поэтому просроченное приглашение тест вставляет
// сразу «из прошлого», а не ждёт двое суток. Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback).
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер, Анна — её подопечная
const MARINA = "${MARINA}";
const ANNA = "${ANNA}";

afterAll(() => pool.end());

// Запросы fn в одной транзакции с откатом — от владельца базы, как регистрация
async function rolledBack<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("begin");
    return await fn(db);
  } finally {
    await db.query("rollback");
    db.release();
  }
}

// Новый пользователь, как при регистрации: строка в auth.users и профиль подопечного; возвращает его id
async function newUser(db: PoolClient, email: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, encrypted_password) values ($1, crypt('demo-password', gen_salt('bf'))) returning id",
    [email],
  );
  await db.query("insert into profiles (id, role, name) values ($1, 'client', 'Новичок')", [rows[0].id]);
  return rows[0].id;
}

// Приглашение Марины, код и срок ставит база; insert — другая вставка, например «из прошлого». Возвращает код
async function newInvite(db: PoolClient, insert = "insert into invites (coach_id) values ($1) returning code"): Promise<string> {
  return (await db.query<{ code: string }>(insert, [MARINA])).rows[0].code;
}

const accept = (db: PoolClient, code: string, user: string) =>
  db.query("select accept_invite($1, $2, 'Новичок')", [code, user]);

// Дальше в транзакции — от имени uid, как asUser в lib/db.ts: роль authenticated и sub в request.jwt.claims
async function as(db: PoolClient, uid: string) {
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
}

test("код — 32 шестнадцатеричных знака, срок — 48 часов", async () => {
  const insert = "insert into invites (coach_id) values ($1) returning code, expires_at - created_at = interval '48 hours' as two_days";
  const invite = await rolledBack(async (db) => (await db.query<{ code: string; two_days: boolean }>(insert, [MARINA])).rows[0]);
  expect(invite.code).toMatch(/^[0-9a-f]{32}$/);
  expect(invite.two_days).toBe(true);
});

test("принятое приглашение — подопечный тренера из записи приглашения", async () => {
  const coach = await rolledBack(async (db) => {
    const code = await newInvite(db);
    const user = await newUser(db, "new@example.com");
    await accept(db, code, user);
    return (await db.query<{ coach_id: string }>("select coach_id from clients where user_id = $1", [user])).rows[0].coach_id;
  });
  expect(coach).toBe(MARINA);
});

test("второй раз — «уже использовано»", async () => {
  const twice = rolledBack(async (db) => {
    const code = await newInvite(db);
    await accept(db, code, await newUser(db, "first@example.com"));
    await accept(db, code, await newUser(db, "second@example.com"));
  });
  await expect(twice).rejects.toThrow("Приглашение уже использовано");
});

test("отозванное приглашение — отказ", async () => {
  const revoked = rolledBack(async (db) => {
    const code = await newInvite(db);
    await db.query("update invites set revoked_at = now() where code = $1", [code]);
    await accept(db, code, await newUser(db, "new@example.com"));
  });
  await expect(revoked).rejects.toThrow("Приглашение отозвано");
});

test("созданное 49 часов назад — «срок истёк»", async () => {
  // срок — 48 часов от создания: приглашение «из прошлого» истекло час назад
  const old =
    "insert into invites (coach_id, created_at, expires_at) values ($1, now() - interval '49 hours', now() - interval '1 hour') returning code";
  const expired = rolledBack(async (db) => {
    const code = await newInvite(db, old);
    await accept(db, code, await newUser(db, "new@example.com"));
  });
  await expect(expired).rejects.toThrow("Срок приглашения истёк");
});

test("подопечный приглашений не создаёт", async () => {
  const insert = rolledBack(async (db) => {
    await as(db, ANNA);
    await db.query("insert into invites (coach_id) values ($1)", [ANNA]);
  });
  await expect(insert).rejects.toThrow("row-level security");
});
`

// Одноразовые приглашения — пишет агент: код, срок, кто принял, отзыв, RLS и права по столбцам; принимает приглашение база.
// Имена политик короче 63 байт. now() в транзакции — время её начала: тест вставляет срок «из прошлого» относительно него
const INVITES_SQL = `-- Приглашение по ссылке: одноразовый код вместо вечной ссылки /join/<id тренера> — её переслали, и по ней зарегистрировался чужой.
-- Код — 16 случайных байт (32 шестнадцатеричных знака): не угадать и не перебрать. Тренер — из этой записи, а не из адреса.
-- Приглашение действует 48 часов и один раз; тренер может его отозвать.
create table invites (
  id bigint generated by default as identity primary key,
  code text not null unique default encode(gen_random_bytes(16), 'hex'),
  coach_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  -- кто зарегистрировался по приглашению: после этого оно не действует
  accepted_by uuid references profiles (id),
  -- когда тренер отозвал приглашение
  revoked_at timestamptz
);

-- RLS: тренер видит свои приглашения, создаёт их на себя и отзывает свои; подопечный приглашений не создаёт
alter table invites enable row level security;

create policy "тренер видит свои приглашения" on invites
  for select to authenticated using (coach_id = auth.uid());
create policy "тренер создаёт приглашения" on invites
  for insert to authenticated with check (
    coach_id = auth.uid() and auth.uid() in (select id from profiles where role = 'coach'));
create policy "тренер отзывает приглашения" on invites
  for update to authenticated using (coach_id = auth.uid());

-- Права по столбцам: код, срок и «кто принял» ставит только база; тренер пишет лишь coach_id и revoked_at
revoke all on invites from anon, authenticated;
grant select, insert (coach_id), update (revoked_at) on invites to authenticated;

-- Принять приглашение: новый пользователь new_user становится подопечным тренера из записи приглашения.
-- Строка приглашения — под замком (for update): по одному коду не зарегистрируются двое. Срок сверяют часы базы.
-- Вызывает регистрация (app/join/[code]/actions.ts) от владельца базы; anon и authenticated функцию не вызовут.
create function accept_invite(invite_code text, new_user uuid, client_name text) returns void
language plpgsql
set search_path = public
as $$
declare
  invite invites;
begin
  select * into invite from invites where code = invite_code for update;
  if not found then
    raise exception 'Приглашение не найдено';
  elsif invite.accepted_by is not null then
    raise exception 'Приглашение уже использовано';
  elsif invite.revoked_at is not null then
    raise exception 'Приглашение отозвано';
  elsif invite.expires_at <= now() then
    raise exception 'Срок приглашения истёк';
  end if;
  update invites set accepted_by = new_user where id = invite.id;
  insert into clients (coach_id, user_id, name) values (invite.coach_id, new_user, client_name);
end;
$$;

revoke execute on function accept_invite(text, uuid, text) from public, anon, authenticated;
`

// Страница приглашения по коду — пишет агент: тренер из записи приглашения, отказ без формы
const JOIN_PAGE = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { join } from "./actions";

export const metadata: Metadata = { title: "Приглашение" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Приглашение из базы: от какого тренера и действует ли ещё
type Invite = { coach: string; used: boolean; revoked: boolean; expired: boolean };

// Почему приглашение не действует — те же слова, что у accept_invite в базе; null — действует
function refusal(invite: Invite): string | null {
  if (invite.used) return "Приглашение уже использовано";
  if (invite.revoked) return "Приглашение отозвано";
  if (invite.expired) return "Срок приглашения истёк";
  return null;
}

// Приглашение по коду из адреса /join/<код>: тренер — из записи приглашения. Использованное, отозванное и просроченное — отказ
// без формы; срок сверяют часы базы, на странице дат нет. Человек по ссылке ещё не вошёл, поэтому приглашение читаем
// от владельца базы, как вход (app/api/login)
export default async function JoinPage({ params, searchParams }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const { error } = await searchParams;
  const { rows } = await pool.query<Invite>(
    \`select p.name as coach, i.accepted_by is not null as used, i.revoked_at is not null as revoked, i.expires_at <= now() as expired
       from invites i join profiles p on p.id = i.coach_id
      where i.code = $1\`,
    [code],
  );
  if (rows.length === 0) notFound();
  const refused = refusal(rows[0]);
  // поля приходят из формы, а код действие получает отсюда и проверяет заново в базе
  const register = join.bind(null, code);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Приглашение</h1>
      {refused ? (
        <>
          <p role="alert" className="mt-4 text-red-600">
            {refused}
          </p>
          <Link href="/login" className="mt-6 inline-block underline">
            Войти
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2">Тренер {rows[0].coach} приглашает вас в дневник тренировок. Ссылка одноразовая.</p>

${indent(JOIN_FORM)}
${indent(ERROR_ALERT)}        </>
      )}
    </main>
  );
}
`

// Регистрация по приглашению — пишет агент: тренера назначает база по записи приглашения (accept_invite)
const JOIN_ACTION = `${ACTION_IMPORTS}
// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Потом вход. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
${joinStart('code')}    await db.query("select accept_invite($1, $2, $3)", [code, uid, name]);
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
${JOIN_END}
// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return "Эта почта уже зарегистрирована — войдите";
  if (code === "P0001" && message) return message;
  return null;
}

${CHECK_ACCOUNT}`

// Приглашения на странице подопечных — правка агента (inv-link): вместо вечной ссылки — «Создать приглашение», действующие
// приглашения со ссылкой и «Отозвать». Действия — прямо в странице (inline "use server"): их зовут только её формы
const CLIENTS_INVITES = chain(CLIENTS_NAIVE, [
  [
    'type Client = { id: string; name: string; last: Date | null };\n',
    `type Client = { id: string; name: string; last: Date | null };
// Действующее приглашение тренера: не принято, не отозвано, срок не вышел
type Invite = { id: string; code: string };

// Тренер создаёт приглашение на себя: код и срок ставит база (0008_invites.sql), записать приглашение чужому не даст RLS
async function createInvite() {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("insert into invites (coach_id) values ($1)", [uid]));
  redirect("/clients");
}

// Тренер отзывает приглашение: по ссылке больше не зарегистрироваться. Чужое приглашение отозвать не даст RLS
async function revokeInvite(id: string) {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("update invites set revoked_at = now() where id = $1", [id]));
  redirect("/clients");
}
`,
  ],
  ['под списком форма нового подопечного и ссылка-приглашение\n', 'под списком форма нового подопечного и приглашения\n'],
  [
    `  const clients = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(`,
    `  const { clients, invites } = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const found = await db.query<Client>(`,
  ],
  [
    '    return rows;\n  });\n',
    `    // действующие приглашения: срок сверяют часы базы, на странице дат нет
    const active = await db.query<Invite>(
      \`select id, code from invites
        where coach_id = $1 and accepted_by is null and revoked_at is null and expires_at > now()
        order by id\`,
      [uid],
    );
    return { clients: found.rows, invites: active.rows };
  });
`,
  ],
  [
    `      <h2 className="mt-8 text-xl font-semibold">Ссылка-приглашение</h2>
      <p className="mt-2 text-zinc-500">Отправьте её подопечному: по ней он зарегистрируется и попадёт к вам.</p>
      <p className="mt-2 break-all font-mono text-sm">{\`\${origin}/join/\${uid}\`}</p>
`,
    `      <h2 className="mt-8 text-xl font-semibold">Приглашения</h2>
      <p className="mt-2 text-zinc-500">Ссылка действует 48 часов, по ней регистрируются один раз.</p>
      {invites.length === 0 ? (
        <p className="mt-2 text-zinc-500">Приглашений пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center gap-2">
              <span className="break-all font-mono text-sm">{\`\${origin}/join/\${invite.code}\`}</span>
              <form action={revokeInvite.bind(null, invite.id)}>
                <button type="submit" className="rounded border border-zinc-300 px-3 py-1 text-sm">
                  Отозвать
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={createInvite} className="mt-4">
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Создать приглашение
        </button>
      </form>
`,
  ],
])

// Отступ на 4 пробела: форма страницы приглашения стоит внутри <>…</>
function indent(text) {
  return text.replace(/^(?=.)/gm, '    ')
}

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s17-invite: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

// Несколько замен подряд, каждая — ровно одного вхождения
function chain(text, pairs) {
  return pairs.reduce((acc, [find, replace]) => replaceOnce(acc, find, replace), text)
}

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })
const joinAs = (name, email) => ({ Имя: name, Почта: email, Пароль: 'demo-password' })

export default {
  id: 's17-invite',
  from: 's16-comments',
  date: '2026-11-08T10:00:00+03:00',
  db: true,
  steps: [
    {
      // Accept edits: файлы — без вопроса. Наивно: тренер из адреса, ссылка вечная и многоразовая
      id: 'ask-join',
      agent: {
        prompt: 'Приглашение по ссылке: тренер даёт ссылку /join/…, человек вводит имя, почту и пароль и становится его подопечным',
        reply:
          'Ссылка /join/<id тренера> — на странице подопечных. По ней человек регистрируется: пароль — только хешем, ' +
          'занятая почта — ошибкой; он становится подопечным этого тренера и сразу входит.',
      },
      steps: [
        { id: 'join-page', write: 'app/join/[coach]/page.tsx', content: JOIN_PAGE_NAIVE },
        { id: 'join-action', write: 'app/join/[coach]/actions.ts', content: JOIN_ACTION_NAIVE },
        { id: 'invite-link', edit: 'app/clients/page.tsx', find: CLIENTS_PAGE, replace: CLIENTS_NAIVE },
      ],
    },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: login('marina@example.com') },
    // вечная ссылка с id Марины
    { id: 'marina-link', browser: { url: '/clients' } },
    // строки для кадра сессия создаёт сама: Ольга регистрируется по ссылке Марины (браузер — один на сессию, вход меняет cookie)
    { id: 'olga-join', browser: { url: `/join/${MARINA}`, fill: joinAs('Ольга', 'olga@example.com'), click: 'Присоединиться' } },
    // ссылку переслали: по той же ссылке Кирилл — тоже подопечный Марины
    { id: 'kirill-join', browser: { url: `/join/${MARINA}`, fill: joinAs('Кирилл', 'kirill@example.com'), click: 'Присоединиться' } },
    { id: 'clients-db', run: `psql -c "select name from clients where coach_id = '${MARINA}' order by id"` },
    {
      // Accept edits: файлы — без вопроса, psql, rm и vitest — с вопросом [y / n]. Сначала тест
      id: 'ask-invite',
      agent: {
        prompt:
          'Ссылка вечная и многоразовая: её переслали — и Кирилл стал подопечным Марины. Сделай приглашение одноразовым: ' +
          'длинный случайный код, срок 48 часов, тренер — из записи приглашения, отзыв. Сначала тесты',
        reply:
          'Приглашение — строка invites: случайный код, срок 48 часов, отзыв; тренера и повтор проверяет база (accept_invite). ' +
          'Ольга и Кирилл остались у Марины: прошлые регистрации я не трогал.',
      },
      steps: [
        { id: 'inv-test', write: 'test/invites.test.ts', content: INVITES_TEST },
        { id: 'inv-sql', write: 'supabase/migrations/0008_invites.sql', content: INVITES_SQL },
        // -q — без строк CREATE TABLE, ALTER TABLE…: с ними восемь шагов не помещаются в окно агента; ошибки psql печатает и так
        { id: 'inv-apply', run: 'psql -q -f supabase/migrations/0008_invites.sql' },
        // наивный код не коммитился: убираем папку целиком, git rm тут нечего убирать
        { id: 'inv-old', run: "rm -r 'app/join/[coach]'" },
        { id: 'inv-page', write: 'app/join/[code]/page.tsx', content: JOIN_PAGE },
        { id: 'inv-action', write: 'app/join/[code]/actions.ts', content: JOIN_ACTION },
        { id: 'inv-link', edit: 'app/clients/page.tsx', find: CLIENTS_NAIVE, replace: CLIENTS_INVITES },
        { id: 'inv-run', run: 'npx vitest run test/invites.test.ts' },
      ],
    },
    // после Кирилла cookie — его: снова вход Марины
    { id: 'login-marina2', browser: login('marina@example.com') },
    { id: 'invite-new', browser: { url: '/clients', click: 'Создать приглашение' } },
    // код случайный: ссылку берём со страницы invite-new
    { id: 'vera-join', browser: { url: { from: 'invite-new', match: INVITE_LINK }, fill: joinAs('Вера', 'vera@example.com'), click: 'Присоединиться' } },
    { id: 'invite-reuse', browser: { url: { from: 'invite-new', match: INVITE_LINK } } },
    {
      // Plan: только чтение и отчёт, код агент не меняет
      id: 'ask-audit',
      agent: {
        prompt:
          'Проверь приглашения по шести вопросам главы 8: откуда данные, кто может вызвать, что сделает злоумышленник, ' +
          'что в журналах, какие права у процесса, что изменилось вне задачи. Код не меняй — только отчёт и места, где не уверен',
        reply:
          '1. Данные: код из адреса, имя, почта и пароль из формы — недоверенные; в SQL идут только параметрами, имя и почта проверены. ' +
          '2. Зарегистрироваться может любой по ссылке, без входа; тренер — из записи приглашения, создаёт её только тренер. ' +
          '3. Злоумышленник: 32 знака не угадать; повтор, отзыв и срок отсекает accept_invite, строка — под замком. ' +
          '4. Журналы: код — в адресе, значит, и в журнале запросов сервера; пароль не печатается, в базе — только хеш. ' +
          '5. Права: регистрация — от владельца базы, мимо RLS, как вход; тренер пишет только coach_id и revoked_at, ' +
          'accept_invite пользователям закрыта. 6. Вне задачи: пакетов нет, проверки не ослаблены; но мимо RLS через pool ' +
          'теперь ходит и /join, а lib/db.ts пишет, что только вход. ' +
          'Не уверен: лимита попыток на /join нет; пользователя создаём раньше, чем принимаем приглашение, — ' +
          'по ответу «почта уже зарегистрирована» можно проверить чужую почту.',
      },
      steps: [
        { id: 'a-action', read: 'app/join/[code]/actions.ts' },
        { id: 'a-sql', read: 'supabase/migrations/0008_invites.sql' },
      ],
    },
    { id: 'c-invite', commit: 'Приглашение по одноразовой ссылке' },
  ],
}
