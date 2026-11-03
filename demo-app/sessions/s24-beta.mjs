// Сессия 24: бета — приглашение тренера, замечания и сбои (утро 15 ноября; база — из миграций и seed, db: true). Пятая сессия
// недели 3, ролик дня 19. Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
// (как в s13, s19–s23). Шаг schema — psql \d sets: client_key и его уникальный индекс из 0013_sets_client_key.sql, которую с этой
// сессии применяет рекордер (Review Focus 1: миграции он применяет с ON_ERROR_STOP и падает на ошибке).
// План беты пишет человек — docs/beta.md (текст авторский): Полина, Тимур и Ксения — тренеры из других залов; неделя, до 22 ноября;
// три настоящих дела; замечания — кнопкой «Сообщить о проблеме»: что делали, что ожидали, что вышло; одну сессию смотрим молча;
// «нравится?» не спрашиваем.
// Подводный камень — настоящий вывод: тренера беты звать некуда, приглашение заводит только подопечного. Марина создаёт обычное
// приглашение, выходит через меню (marina-logout: иначе над формой приглашения было бы её меню), Полина регистрируется по ссылке
// со страницы (url: { from, match }, как в s17 и s20) и попадает на «Мои тренировки»; psql — Полина client, тренер у неё есть.
// Исправление, сначала тест (Accept edits): test/invites.test.ts — тренерское приглашение заводит тренера без строки в clients,
// обычное — подопечного Марины; тренер тренерского приглашения не создаст. Красный — у invites нет столбца role. Вторым ходом
// («Делай»): 0014_coach_invites.sql — у приглашения роль (client по умолчанию), у тренерского нет тренера-хозяина (coach_id пуст);
// права по столбцам из 0008 дают тренеру писать лишь coach_id, поэтому тренерское создаёт только владелец базы — кнопки в приложении
// нет. accept_invite — заново: по тренерскому приглашению профиль становится coach, строки в clients нет; функция возвращает роль.
// Страница /join — текст тренерского приглашения (тренера у него нет — left join), регистрация ведёт тренера на /clients.
// Человек пишет supabase/tests/beta-invites.sql — тренерские приглашения Тимура и Ксении с заданными кодами — и применяет psql -f.
// Полина выходит (polina-logout), Тимур открывает /join/<свой код>, регистрируется — пустой экран тренера дня 15 «Подопечных пока нет».
// Приглашение Ксении в сессии остаётся неиспользованным.
// Замечания в одно место (Accept edits): 0015_feedback.sql — пишет вошедший (автора ставит база — auth.uid()), политики на чтение
// нет: читает только владелец базы; /problem — страница, что делали, что ожидали, что вышло; страницу подставляет ссылка
// «Сообщить о проблеме» в меню (components/ProblemLink.tsx — usePathname, ?page=/clients/1), её можно поправить. Человек дописывает
// пункт меню в e2e/first-run.spec.ts (fb-e2e): тест сверяет список ссылок меню (тест ждёт Наташу и Веру — запуск в s26; в черновом
// прогоне с ними все пять файлов e2e зелёные). После коммита человек перезапускает dev со сбросом кэша (dev-restart, тот же запрос,
// что contrast-restart в s20): в черновом прогоне запущенный dev отдавал страницы, собранные впервые после правки меню (/problem,
// /clients/[id]), со старым меню — без «Сообщить о проблеме», а уже открытые раньше — с новым. Тимур отправляет замечание — текст
// авторский: пустой комментарий молча пропадает (его разбирает s25), — psql показывает строку.
// Сбой, о котором не напишут, — настоящий (проверен черновым прогоном): /clients/abc у Тимура — 500, страница Next «This page
// couldn’t load»: id из адреса идёт в запрос к bigint — в выводе сервера «invalid input syntax for type bigint: "abc"» со стектрейсом,
// а таблицы errors нет — 0. Исправление, сначала тест (Accept edits): test/errors.test.ts зовёт onRequestError так, как его зовёт
// Next, и ищет строку в журнале (свою строку в конце удаляет); пользователям приложения журнал закрыт. Красный — instrumentation.ts
// нет. Вторым ходом («Делай»): 0016_errors.sql — путь, сообщение и время (время ставит база, в кадр оно не попадает); app/error.tsx —
// «Что-то пошло не так» без текста ошибки и стектрейса, меню остаётся; instrumentation.ts — onRequestError пишет путь и сообщение
// в errors. В черновом прогоне Next 16 зовёт onRequestError и в next dev, а новый instrumentation.ts подхватывает без перезапуска
// (в рабочей сборке next start — тоже: та же строка в журнале). /clients/abc — «Что-то пошло не так», в errors — путь и сообщение.
// Сверх таблицы плана: marina-logout и polina-logout (смена человека в браузере — через «Выйти»), ci-page (страница /join: у
// тренерского приглашения тренера нет), fb-action и fb-link (один шаг — один файл), fb-e2e (правка человека), dev-restart
// (перезапуск dev), ask-coach-invite-go и ask-errors-go (второй ход «Делай»: одним ходом шаги в окно агента не помещаются).
// Строки для кадра сессия создаёт сама: приглашение, Полина и Тимур — браузером; тренерские приглашения — psql -f своего файла;
// замечание — браузером. Браузер один на сессию: регистрация и вход меняют cookie.
// Запись с середины цепочки: node scripts/record-session.mjs --from s24-beta (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: все запросы — Accept edits (правки без вопроса, vitest и psql — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Ссылка-приглашение на странице подопечных: путь /join/ и код из 32 шестнадцатеричных знаков (s17)
const INVITE_LINK = /\/join\/[0-9a-f]{32}/

// Код тренерского приглашения Тимура — из файла beta-invites.sql (код Ксении в сессии не нужен)
const TIMUR_CODE = '7d3e9a41c52b4f08b6e1d0a9f3c27e58'

// План беты — пишет человек, текст авторский
const BETA_DOC = `# Бета-тест

Неделю приложением пользуются тренеры, которые его ещё не видели, — со своими подопечными и своими делами. Ищем, где человек застревает, пока приложение не увидели все.

## Кто

- Полина, Тимур и Ксения — тренеры из других залов.
- Каждый заходит по своей ссылке-приглашению.

## Срок

- Неделя, до 22 ноября.
- 22 ноября — разбор замечаний.

## Задачи

Не «посмотрите приложение», а настоящие дела:

1. Пригласить своего подопечного.
2. Назначить ему программу.
3. Открыть отчёт за месяц.

## Замечания

- Все замечания — в одно место: кнопкой «Сообщить о проблеме» в меню.
- В замечании три части: что делали, что ожидали, что вышло. «Не работает» без них не разобрать.

## Наблюдение

- Одну сессию с каждым смотрим молча: даём задачу, не подсказываем и записываем, где человек застрял.
- «Нравится?» не спрашиваем: из вежливости ответят «да», и мы ничего не узнаем. Спрашиваем, что человек делал и чего ждал.
`

// Тест приглашений после s17 — дословно, как в состоянии s23-offline
const INVITES_TEST = `// @vitest-environment node
// Одноразовое приглашение по ссылке: принятое — подопечный тренера из записи приглашения; второй раз — «уже использовано»;
// отозванное и просроченное — отказ. Принимает приглашение функция базы accept_invite (supabase/migrations/0008_invites.sql),
// её же вызывает регистрация app/join/[code]/actions.ts. Срок сверяют часы базы, поэтому просроченное приглашение тест вставляет
// сразу «из прошлого», а не ждёт двое суток. Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback).
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина и Игорь — тренеры, Анна — подопечная Марины
const MARINA = "11111111-1111-1111-1111-111111111111";
const IGOR = "22222222-2222-2222-2222-222222222222";
const ANNA = "33333333-3333-3333-3333-333333333333";

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

// Приглашение тренера coach, код и срок ставит база; insert — другая вставка, например «из прошлого». Возвращает код
async function newInvite(db: PoolClient, coach: string, insert = "insert into invites (coach_id) values ($1) returning code") {
  return (await db.query<{ code: string }>(insert, [coach])).rows[0].code;
}

// Тренер подопечного user
async function coachOf(db: PoolClient, user: string): Promise<string> {
  return (await db.query<{ coach_id: string }>("select coach_id from clients where user_id = $1", [user])).rows[0].coach_id;
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
  // приглашения двух тренеров: принявший — подопечный того, чьё приглашение принял, а не первого попавшегося
  const coaches = await rolledBack(async (db) => {
    const fromMarina = await newInvite(db, MARINA);
    const fromIgor = await newInvite(db, IGOR);
    const toIgor = await newUser(db, "to-igor@example.com");
    const toMarina = await newUser(db, "to-marina@example.com");
    await accept(db, fromIgor, toIgor);
    await accept(db, fromMarina, toMarina);
    return [await coachOf(db, toIgor), await coachOf(db, toMarina)];
  });
  expect(coaches).toEqual([IGOR, MARINA]);
});

test("второй раз — «уже использовано»", async () => {
  const twice = rolledBack(async (db) => {
    const code = await newInvite(db, MARINA);
    await accept(db, code, await newUser(db, "first@example.com"));
    await accept(db, code, await newUser(db, "second@example.com"));
  });
  await expect(twice).rejects.toThrow("Приглашение уже использовано");
});

test("отозванное приглашение — отказ", async () => {
  const revoked = rolledBack(async (db) => {
    const code = await newInvite(db, MARINA);
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
    const code = await newInvite(db, MARINA, old);
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

// Тот же тест — правка агента (ci-test): тренерское приглашение заводит тренера без строки в clients, обычное — подопечного;
// тренер тренерского приглашения не создаст
const INVITES_TEST_COACH = `// @vitest-environment node
// Одноразовое приглашение по ссылке: принятое — подопечный тренера из записи приглашения; второй раз — «уже использовано»;
// отозванное и просроченное — отказ. Тренерское приглашение (0014_coach_invites.sql) заводит тренера: профиль coach,
// строки в clients нет. Принимает приглашение функция базы accept_invite, её же вызывает регистрация app/join/[code]/actions.ts. Срок сверяют часы базы, поэтому просроченное приглашение тест вставляет
// сразу «из прошлого», а не ждёт двое суток. Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback).
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина и Игорь — тренеры, Анна — подопечная Марины
const MARINA = "11111111-1111-1111-1111-111111111111";
const IGOR = "22222222-2222-2222-2222-222222222222";
const ANNA = "33333333-3333-3333-3333-333333333333";

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

// Приглашение тренера coach, код и срок ставит база; insert — другая вставка, например «из прошлого». Возвращает код
async function newInvite(db: PoolClient, coach: string, insert = "insert into invites (coach_id) values ($1) returning code") {
  return (await db.query<{ code: string }>(insert, [coach])).rows[0].code;
}

// Тренер подопечного user
async function coachOf(db: PoolClient, user: string): Promise<string> {
  return (await db.query<{ coach_id: string }>("select coach_id from clients where user_id = $1", [user])).rows[0].coach_id;
}

const accept = (db: PoolClient, code: string, user: string) =>
  db.query("select accept_invite($1, $2, 'Новичок')", [code, user]);

// Кто user после регистрации: роль профиля и тренер (coach_id — null, если строки в clients нет)
async function whoIs(db: PoolClient, user: string) {
  const { rows } = await db.query<{ role: string; coach_id: string | null }>(
    "select p.role, c.coach_id from profiles p left join clients c on c.user_id = p.id where p.id = $1",
    [user],
  );
  return rows[0];
}

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
  // приглашения двух тренеров: принявший — подопечный того, чьё приглашение принял, а не первого попавшегося
  const coaches = await rolledBack(async (db) => {
    const fromMarina = await newInvite(db, MARINA);
    const fromIgor = await newInvite(db, IGOR);
    const toIgor = await newUser(db, "to-igor@example.com");
    const toMarina = await newUser(db, "to-marina@example.com");
    await accept(db, fromIgor, toIgor);
    await accept(db, fromMarina, toMarina);
    return [await coachOf(db, toIgor), await coachOf(db, toMarina)];
  });
  expect(coaches).toEqual([IGOR, MARINA]);
});

test("второй раз — «уже использовано»", async () => {
  const twice = rolledBack(async (db) => {
    const code = await newInvite(db, MARINA);
    await accept(db, code, await newUser(db, "first@example.com"));
    await accept(db, code, await newUser(db, "second@example.com"));
  });
  await expect(twice).rejects.toThrow("Приглашение уже использовано");
});

test("отозванное приглашение — отказ", async () => {
  const revoked = rolledBack(async (db) => {
    const code = await newInvite(db, MARINA);
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
    const code = await newInvite(db, MARINA, old);
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

test("тренерское приглашение — тренер без записи в clients; обычное — подопечный тренера", async () => {
  const people = await rolledBack(async (db) => {
    // тренерское приглашение создаёт владелец базы, тренера-хозяина у него нет
    const forCoach = (await db.query<{ code: string }>("insert into invites (role) values ('coach') returning code")).rows[0].code;
    const forClient = await newInvite(db, MARINA);
    const coach = await newUser(db, "new-coach@example.com");
    const client = await newUser(db, "new-client@example.com");
    await accept(db, forCoach, coach);
    await accept(db, forClient, client);
    return [await whoIs(db, coach), await whoIs(db, client)];
  });
  expect(people).toEqual([
    { role: "coach", coach_id: null },
    { role: "client", coach_id: MARINA },
  ]);
});

test("тренер тренерского приглашения не создаст: роль пишет только владелец базы", async () => {
  const insert = rolledBack(async (db) => {
    await as(db, MARINA);
    await db.query("insert into invites (coach_id, role) values ($1, 'coach')", [MARINA]);
  });
  await expect(insert).rejects.toThrow("permission denied");
});
`

// Приглашение с ролью — пишет агент: у тренерского нет тренера-хозяина; accept_invite по роли
const COACH_INVITES_SQL = `-- Приглашение тренера: по нему заводится тренер, а не подопечный (бета, docs/beta.md). Обычное приглашение (0008_invites.sql)
-- по-прежнему заводит подопечного того тренера, кто его создал.
-- role — кого заводит приглашение. У тренерского приглашения тренера-хозяина нет: coach_id пуст.
-- Создаёт тренерское приглашение только владелец базы (psql): тренеру права по столбцам из 0008 дают писать лишь coach_id,
-- поэтому у его приглашений role всегда client. Кнопки в приложении нет.
alter table invites add column role text not null default 'client' check (role in ('client', 'coach'));
alter table invites alter column coach_id drop not null;
alter table invites add constraint invites_coach_by_role check ((role = 'client') = (coach_id is not null));

-- Принять приглашение — с ролью. Регистрация (app/join/[code]/actions.ts) заводит профиль подопечного; по обычному
-- приглашению он становится подопечным тренера из приглашения, как раньше, а по тренерскому — тренером: профиль coach,
-- строки в clients нет. Возвращает роль — регистрация по ней ведёт на первый экран.
drop function accept_invite(text, uuid, text);
create function accept_invite(invite_code text, new_user uuid, client_name text) returns text
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
  if invite.role = 'coach' then
    update profiles set role = 'coach' where id = new_user;
  else
    insert into clients (coach_id, user_id, name) values (invite.coach_id, new_user, client_name);
  end if;
  return invite.role;
end;
$$;

revoke execute on function accept_invite(text, uuid, text) from public, anon, authenticated;
`

// Страница приглашения после s17 — дословно
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

          <form action={register} className="mt-6 flex flex-col gap-4">
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

          {typeof error === "string" && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
`

// Та же страница — правка агента (ci-page): у тренерского приглашения тренера нет — left join и свой текст
const JOIN_PAGE_COACH = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { join } from "./actions";

export const metadata: Metadata = { title: "Приглашение" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Приглашение из базы: кого заводит (role), от какого тренера (у тренерского — null) и действует ли ещё
type Invite = { role: string; coach: string | null; used: boolean; revoked: boolean; expired: boolean };

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
    \`select i.role, p.name as coach, i.accepted_by is not null as used, i.revoked_at is not null as revoked,
            i.expires_at <= now() as expired
       from invites i left join profiles p on p.id = i.coach_id
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
          <p className="mt-2">
            {rows[0].role === "coach"
              ? "Вас приглашают в дневник тренировок тренером: подопечных вы пригласите сами."
              : \`Тренер \${rows[0].coach} приглашает вас в дневник тренировок.\`}{" "}
            Ссылка одноразовая.
          </p>

          <form action={register} className="mt-6 flex flex-col gap-4">
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

          {typeof error === "string" && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
`

// Регистрация по приглашению после s17 — дословно
const JOIN_ACTION = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { startSession } from "@/lib/session";

// Ответ на занятую почту: та же почта другими буквами или повтор, который поймал unique в auth.users
const TAKEN = "Эта почта уже зарегистрирована — войдите";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Потом вход. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(code)}?error=\${encodeURIComponent(error)}\`);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) back(TAKEN);

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
    await db.query("select accept_invite($1, $2, $3)", [code, uid, name]);
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  redirect("/workouts");
}

// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return TAKEN;
  if (code === "P0001" && message) return message;
  return null;
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`

// Та же регистрация — правка агента (ci-join): роль — из accept_invite, первый экран — по роли
const JOIN_ACTION_COACH = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { startSession } from "@/lib/session";

// Ответ на занятую почту: та же почта другими буквами или повтор, который поймал unique в auth.users
const TAKEN = "Эта почта уже зарегистрирована — войдите";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Тренерское приглашение (0014_coach_invites.sql) делает нового пользователя тренером. Потом вход и первый экран по роли. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(code)}?error=\${encodeURIComponent(error)}\`);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) back(TAKEN);

  const db = await pool.connect();
  let uid: string;
  let role: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    // роль — из приглашения: обычное заводит подопечного, тренерское — тренера
    const accepted = await db.query<{ role: string }>("select accept_invite($1, $2, $3) as role", [code, uid, name]);
    role = accepted.rows[0].role;
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  // первый экран: тренеру — подопечные, подопечному — его тренировки
  redirect(role === "coach" ? "/clients" : "/workouts");
}

// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return TAKEN;
  if (code === "P0001" && message) return message;
  return null;
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`

// Тренерские приглашения беты — пишет человек: создаёт их только владелец базы, коды заданы
const BETA_INVITES = `-- Тренерские приглашения беты (docs/beta.md): Тимур и Ксения — тренеры из других залов. По такому приглашению заводится тренер,
-- а не подопечный (0014_coach_invites.sql). Создаёт их только владелец базы — этот файл, psql -f: кнопки в приложении нет.
-- Коды заданы здесь, чтобы ссылки /join/<код> были известны заранее; каждому — своя, лично. Ссылка действует 48 часов и один раз.
-- Это не демо-данные и не миграция: запускается вручную.
insert into invites (role, code) values
  ('coach', '7d3e9a41c52b4f08b6e1d0a9f3c27e58'), -- Тимур
  ('coach', 'b81f4c6e09a345d7a2c8e5f1306d9b4a'); -- Ксения
`

// Замечания — пишет агент: пишет вошедший, читает только владелец базы
const FEEDBACK_SQL = `-- Замечания беты (docs/beta.md) — в одно место: «Сообщить о проблеме» в меню, страница /problem. В замечании — страница,
-- что человек делал, что ожидал и что вышло. Автора и время ставит база.
-- Пишет вошедший, только от своего имени. Читает только владелец базы (psql): политики на чтение нет, и приложение
-- не покажет замечаний никому, даже автору.
create table feedback (
  id bigint generated by default as identity primary key,
  author_id uuid not null default auth.uid() references profiles (id),
  page text not null check (length(page) between 1 and 200),
  did text not null check (length(did) between 1 and 2000),
  expected text not null check (length(expected) between 1 and 2000),
  got text not null check (length(got) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "вошедший пишет своё замечание" on feedback
  for insert to authenticated with check (author_id = auth.uid());

-- Права по столбцам: пользователь пишет только четыре поля замечания и ничего не читает
revoke all on feedback from anon, authenticated;
grant insert (page, did, expected, got) on feedback to authenticated;
`

// Страница «Сообщить о проблеме» и её действие — пишет агент
const PROBLEM_PAGE = `import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { sendProblem } from "./actions";

export const metadata: Metadata = { title: "Сообщить о проблеме" };

// Страница читает cookie входа и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Три части замечания (docs/beta.md): имя в форме и подпись
const PARTS: [name: string, label: string][] = [
  ["did", "Что делали"],
  ["expected", "Что ожидали"],
  ["got", "Что вышло"],
];

// «Сообщить о проблеме»: замечание вошедшего — в одно место, таблицу feedback. Страницу, где он был, подставляет
// ссылка в меню (?page=/clients/1); её можно поправить. Замечание видит только владелец базы
export default async function ProblemPage({ searchParams }: PageProps<"/problem">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { page, sent, error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Сообщить о проблеме</h1>
      <p className="mt-2 text-zinc-500">Что делали, что ожидали и что вышло: по этим трём частям проблему можно повторить и исправить.</p>
      {typeof sent === "string" && (
        <p role="status" className="mt-4 font-medium">
          Спасибо, замечание записано.
        </p>
      )}

      <form action={sendProblem} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="page">Страница</label>
          <input
            id="page"
            name="page"
            required
            maxLength={200}
            defaultValue={typeof page === "string" ? page : ""}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        {PARTS.map(([name, label]) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name}>{label}</label>
            <textarea
              id={name}
              name={name}
              required
              maxLength={2000}
              rows={3}
              className="rounded border border-zinc-300 px-3 py-2"
            />
          </div>
        ))}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
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
const PROBLEM_ACTION = `"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Замечание вошедшего — в таблицу feedback (0015_feedback.sql): страница, что делали, что ожидали и что вышло.
// Запрос — от имени вошедшего: автора ставит база (auth.uid()), записать замечание за другого не даст RLS.
// Прочитать замечания приложение не может: их читает владелец базы
export async function sendProblem(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const [page, did, expected, got] = ["page", "did", "expected", "got"].map((name) => String(form.get(name) ?? "").trim());
  // ошибку страница покажет под формой; страница, где была проблема, остаётся в адресе
  const back = (error: string): never =>
    redirect(\`/problem?page=\${encodeURIComponent(page)}&error=\${encodeURIComponent(error)}\`);
  if (!page || !did || !expected || !got) back("Заполните все четыре поля: страница, что делали, что ожидали и что вышло");
  if (page.length > 200 || [did, expected, got].some((text) => text.length > 2000)) {
    back("Страница — не длиннее 200 знаков, остальные поля — не длиннее 2000");
  }
  await asUser(uid, (db) =>
    db.query("insert into feedback (page, did, expected, got) values ($1, $2, $3, $4)", [page, did, expected, got]),
  );
  // та же страница — со словом «записано» и пустой формой
  redirect("/problem?sent=1");
}
`

// Пункт меню — пишет агент: в адрес формы уходит страница, где человек сейчас
const PROBLEM_LINK = `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// «Сообщить о проблеме» в меню: в адрес формы уходит страница, где человек сейчас, — вспоминать её не нужно
export default function ProblemLink() {
  const pathname = usePathname();
  return (
    <Link href={{ pathname: "/problem", query: pathname === "/problem" ? {} : { page: pathname } }} className="underline">
      Сообщить о проблеме
    </Link>
  );
}
`

// Меню после s20 — дословно, и правка агента (fb-nav): «Сообщить о проблеме» у всех ролей
const NAV = `import Link from "next/link";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки, дневник питания и замеры
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
    ["/measurements", "Замеры"],
  ],
};

// Меню вошедшего: разделы его роли и «Выйти». Кто не вошёл (вход, приглашение), меню не видит.
// Роль — из своего профиля: чужие профили база не отдаст (RLS)
export default async function Nav() {
  const uid = await currentUser();
  if (!uid) return null;
  const role = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ role: string }>("select role from profiles where id = $1", [uid]);
    return rows[0]?.role;
  });
  if (!role) return null;

  return (
    <nav aria-label="Меню" className="mx-auto flex w-full max-w-md flex-wrap items-center gap-4 px-8 pt-4">
      {LINKS[role]?.map(([href, label]) => (
        <Link key={href} href={href} className="underline">
          {label}
        </Link>
      ))}
      {/* выход — обычная форма: cookie стирает сервер (app/api/logout) */}
      <form action="/api/logout" method="post" className="ml-auto">
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1">
          Выйти
        </button>
      </form>
    </nav>
  );
}
`
const NAV_PROBLEM = `import Link from "next/link";
import ProblemLink from "@/components/ProblemLink";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки, дневник питания и замеры
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
    ["/measurements", "Замеры"],
  ],
};

// Меню вошедшего: разделы его роли, «Сообщить о проблеме» и «Выйти». Кто не вошёл (вход, приглашение), меню не видит.
// Роль — из своего профиля: чужие профили база не отдаст (RLS)
export default async function Nav() {
  const uid = await currentUser();
  if (!uid) return null;
  const role = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ role: string }>("select role from profiles where id = $1", [uid]);
    return rows[0]?.role;
  });
  if (!role) return null;

  return (
    <nav aria-label="Меню" className="mx-auto flex w-full max-w-md flex-wrap items-center gap-4 px-8 pt-4">
      {LINKS[role]?.map(([href, label]) => (
        <Link key={href} href={href} className="underline">
          {label}
        </Link>
      ))}
      {/* замечание — у всех ролей: страница, где человек сейчас, подставится в форму */}
      <ProblemLink />
      {/* выход — обычная форма: cookie стирает сервер (app/api/logout) */}
      <form action="/api/logout" method="post" className="ml-auto">
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1">
          Выйти
        </button>
      </form>
    </nav>
  );
}
`

// Сквозной тест первого дня (s20) сверяет список ссылок меню — правка человека (fb-e2e): в меню новый пункт
const FIRST_E2E = `import { expect, test, type Page } from "@playwright/test";

// Первый день в приложении: новый тренер без подопечных и новый подопечный без тренировок. Пустой экран — в три части:
// что здесь будет, что сделать и кнопка. Меню — по роли, в нём «Выйти».
// Наташа — тренер из supabase/tests/new-coach.sql, Вера — подопечная Марины по приглашению; пароль у обеих demo-password.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("новый тренер видит, с чего начать, и может выйти", async ({ page }) => {
  await login(page, "natasha@example.com", /\\/clients$/);
  await expect(page.getByText("Подопечных пока нет")).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать приглашение" })).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Подопечные", "Программы", "Отчёт"]);
  await menu.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\\/login$/);
  // cookie входа стёрта: меню нет, а страница тренера снова ведёт на вход
  await expect(page.getByRole("navigation", { name: "Меню" })).toHaveCount(0);
  await page.goto("/clients");
  await expect(page).toHaveURL(/\\/login$/);
});

test("новый подопечный знает, что тренировку назначит тренер", async ({ page }) => {
  await login(page, "vera@example.com", /\\/workouts$/);
  await expect(page.getByText("Тренировок пока нет")).toBeVisible();
  await expect(page.getByText("Первую тренировку назначит тренер")).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание", "Замеры"]);
  await expect(menu.getByRole("button", { name: "Выйти" })).toBeVisible();
});
`
const FIRST_E2E_PROBLEM = `import { expect, test, type Page } from "@playwright/test";

// Первый день в приложении: новый тренер без подопечных и новый подопечный без тренировок. Пустой экран — в три части:
// что здесь будет, что сделать и кнопка. Меню — по роли, в нём «Выйти».
// Наташа — тренер из supabase/tests/new-coach.sql, Вера — подопечная Марины по приглашению; пароль у обеих demo-password.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("новый тренер видит, с чего начать, и может выйти", async ({ page }) => {
  await login(page, "natasha@example.com", /\\/clients$/);
  await expect(page.getByText("Подопечных пока нет")).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать приглашение" })).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Подопечные", "Программы", "Отчёт", "Сообщить о проблеме"]);
  await menu.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\\/login$/);
  // cookie входа стёрта: меню нет, а страница тренера снова ведёт на вход
  await expect(page.getByRole("navigation", { name: "Меню" })).toHaveCount(0);
  await page.goto("/clients");
  await expect(page).toHaveURL(/\\/login$/);
});

test("новый подопечный знает, что тренировку назначит тренер", async ({ page }) => {
  await login(page, "vera@example.com", /\\/workouts$/);
  await expect(page.getByText("Тренировок пока нет")).toBeVisible();
  await expect(page.getByText("Первую тренировку назначит тренер")).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание", "Замеры", "Сообщить о проблеме"]);
  await expect(menu.getByRole("button", { name: "Выйти" })).toBeVisible();
});
`

// Журнал сбоев — пишет агент: сначала тест, потом таблица, страница ошибки и хук
const ERRORS_TEST = `// @vitest-environment node
// Журнал сбоев: о сбое человек не напишет — сервер записывает его сам. Next вызывает onRequestError из instrumentation.ts
// на каждую ошибку сервера; хук пишет путь запроса и сообщение в таблицу errors (supabase/migrations/0016_errors.sql).
// Тест вызывает хук так, как его зовёт Next, и ищет строку в журнале; свою строку в конце удаляет.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import { randomUUID } from "node:crypto";
import { afterAll, expect, test } from "vitest";
import { onRequestError } from "../instrumentation";
import { asUser, pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер
const MARINA = "11111111-1111-1111-1111-111111111111";

// сообщение этого прогона: по нему тест находит свою строку и только её удаляет
const MESSAGE = \`проверка журнала \${randomUUID()}\`;

afterAll(async () => {
  await pool.query("delete from errors where message = $1", [MESSAGE]);
  await pool.end();
});

test("сбой на сервере — строка в журнале: путь и сообщение", async () => {
  // Next зовёт хук на сервере Node — там NEXT_RUNTIME = "nodejs"
  process.env.NEXT_RUNTIME = "nodejs";
  await onRequestError(
    new Error(MESSAGE),
    { path: "/clients/abc", method: "GET", headers: {} },
    { routerKind: "App Router", routePath: "/clients/[id]", routeType: "render", revalidateReason: undefined },
  );
  const { rows } = await pool.query("select path, message from errors where message = $1", [MESSAGE]);
  expect(rows).toEqual([{ path: "/clients/abc", message: MESSAGE }]);
});

test("журнал закрыт для пользователей приложения", async () => {
  const read = asUser(MARINA, (db) => db.query("select path from errors"));
  await expect(read).rejects.toThrow("permission denied");
});
`
const ERRORS_SQL = `-- Журнал сбоев: о сбое человек не напишет — сервер записывает его сам (instrumentation.ts, onRequestError).
-- В строке — путь запроса, сообщение ошибки и время; время ставит база. Пишет только сервер от владельца базы:
-- от имени пользователей журнал не прочитать и не записать — RLS без политик и без прав.
create table errors (
  id bigint generated by default as identity primary key,
  path text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table errors enable row level security;
revoke all on errors from anon, authenticated;
`
const ERROR_PAGE = `"use client";

// Страница сбоя: на сервере или в браузере что-то сломалось. Человеку — понятные слова и что делать дальше, без текста ошибки
// и стектрейса: подробности сервер уже записал в журнал сбоев (instrumentation.ts, таблица errors). Меню остаётся над страницей.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Что-то пошло не так</h1>
      <p className="mt-2 text-zinc-500">Сбой записан, мы разберёмся.</p>
      <p className="mt-2">Попробуйте ещё раз. Если не выйдет — напишите, что делали, через «Сообщить о проблеме» в меню.</p>
      <button type="button" onClick={() => retry()} className="mt-6 rounded bg-zinc-900 px-4 py-2 text-white">
        Попробовать ещё раз
      </button>
    </main>
  );
}
`
const INSTRUMENTATION = `import type { Instrumentation } from "next";

// Журнал сбоев. Next вызывает onRequestError на сервере при каждой ошибке: страница, маршрут, серверное действие.
// Путь запроса и сообщение ошибки — в таблицу errors (0016_errors.sql) от владельца базы, время ставит база.
// Человек видит app/error.tsx без подробностей, а здесь они остаются для нас.
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  // база — только у сервера на Node: в среде Edge модуля pg нет
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { pool } = await import("@/lib/db");
    const message = error instanceof Error ? error.message : String(error);
    try {
      await pool.query("insert into errors (path, message) values ($1, $2)", [request.path, message]);
    } catch (failed) {
      // журнал недоступен — сбой хотя бы останется в выводе сервера
      console.error("Журнал сбоев недоступен:", failed);
    }
  }
};
`

// Код Тимура в файле приглашений и в адресе шага — один; иначе сессия не загрузится
if (!BETA_INVITES.includes(`'${TIMUR_CODE}'`)) throw new Error('s24-beta: кода Тимура нет в supabase/tests/beta-invites.sql')

// Перезапуск dev со сбросом кэша — как contrast-restart в s20 (тот же запрос шлёт кнопка Restart Dev Server в Next.js DevTools).
// -f: ответ не 2xx — код ошибки; сервер поднимается заново на том же порту — ждём, пока /login снова отвечает
const RESTART =
  "curl -fsS -X POST 'localhost:3000/__nextjs_restart_dev?invalidateFileSystemCache=1' && sleep 2 && " +
  'until curl -fs -o /dev/null localhost:3000/login; do sleep 1; done'

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })
const joinAs = (name, email) => ({ Имя: name, Почта: email, Пароль: 'demo-password' })

// Замечание Тимура — авторский текст беты: что делал, что ожидал, что вышло (s16)
const TIMUR_PROBLEM = {
  Страница: 'Карточка подопечного',
  'Что делали': 'Нажал «Отправить» под тренировкой — в поле был один пробел',
  'Что ожидали': 'Подсказку, что комментарий пустой',
  'Что вышло': 'Страница обновилась, и всё: ни комментария, ни ошибки',
}

// Ответы агента — авторские, по выводу его шагов; что видно в строках Write / Edit / Run, ответ не повторяет
const ASK_COACH_INVITE_REPLY =
  'Тест красный: тренерского приглашения нет — у invites нет столбца role. Дальше — роль у приглашения, регистрация по ней ' +
  'и текст на /join. Делать?'
const ASK_COACH_INVITE_GO_REPLY =
  'У тренерского приглашения нет тренера, роль пишет только владелец базы. По нему регистрация заводит тренера без записи ' +
  'в clients и ведёт на «Подопечные».'
const ASK_REPORT_REPLY =
  'Страницу в форму подставляет ссылка «Сообщить о проблеме» в меню. Автора ставит база; политики на чтение нет — замечания ' +
  'читает только владелец базы.'
const ASK_ERRORS_REPLY =
  'Тест красный: хука нет — instrumentation.ts не найден. Дальше — таблица errors, страница ошибки и onRequestError. Делать?'
const ASK_ERRORS_GO_REPLY =
  'При сбое — «Что-то пошло не так» без текста ошибки. Путь и сообщение onRequestError пишет в errors, время ставит база; ' +
  'пользователям приложения журнал закрыт.'

export default {
  id: 's24-beta',
  from: 's23-offline',
  date: '2026-11-15T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // 0013 с этой сессии применяет рекордер: client_key и его уникальный индекс на месте (Review Focus 1)
    { id: 'schema', run: 'psql -c "\\d sets"' },
    // план беты — пишет человек
    { id: 'beta-doc', write: 'docs/beta.md', content: BETA_DOC },
    { id: 'c-beta-doc', commit: 'План беты' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: login('marina@example.com') },
    // обычное приглашение Марины — для Полины
    { id: 'invite-coach', browser: { url: '/clients', click: 'Создать приглашение' } },
    // сверх таблицы плана: Марина выходит через меню — иначе над формой приглашения её меню
    { id: 'marina-logout', browser: { url: '/clients', click: 'Выйти' } },
    // код случайный: ссылку берём со страницы invite-coach. Полина — тренер беты, а попадает на «Мои тренировки»
    { id: 'polina-join', browser: { url: { from: 'invite-coach', match: INVITE_LINK }, fill: joinAs('Полина', 'polina@example.com'), click: 'Присоединиться' } },
    {
      id: 'polina-db',
      run: `psql -c "select p.name, p.role, c.coach_id is not null as has_coach from profiles p left join clients c on c.user_id = p.id where p.name = 'Полина'"`,
    },
    {
      // Accept edits: правка теста — без вопроса, vitest — с вопросом [y / n]. Сначала тест
      id: 'ask-coach-invite',
      agent: {
        prompt:
          'Тренерам беты нужно своё приглашение: по нему заводится тренер, а не подопечный. Создаёт его только владелец базы, ' +
          'кнопки в приложении нет. Сначала тест',
        reply: ASK_COACH_INVITE_REPLY,
      },
      steps: [
        { id: 'ci-test', edit: 'test/invites.test.ts', find: INVITES_TEST, replace: INVITES_TEST_COACH },
        // красный: у invites нет столбца role
        { id: 'ci-red', run: 'npx vitest run test/invites.test.ts' },
      ],
    },
    {
      // сверх таблицы плана: тот же запрос, второй ход — миграция, страница, регистрация и зелёный тест
      id: 'ask-coach-invite-go',
      agent: { prompt: 'Делай', reply: ASK_COACH_INVITE_GO_REPLY },
      steps: [
        { id: 'ci-sql', write: 'supabase/migrations/0014_coach_invites.sql', content: COACH_INVITES_SQL },
        { id: 'ci-apply', run: 'psql -f supabase/migrations/0014_coach_invites.sql' },
        // сверх таблицы плана: у тренерского приглашения тренера нет — страница /join без left join его бы не нашла
        { id: 'ci-page', edit: 'app/join/[code]/page.tsx', find: JOIN_PAGE, replace: JOIN_PAGE_COACH },
        { id: 'ci-join', edit: 'app/join/[code]/actions.ts', find: JOIN_ACTION, replace: JOIN_ACTION_COACH },
        { id: 'ci-green', run: 'npx vitest run test/invites.test.ts' },
      ],
    },
    { id: 'c-coach-invite', commit: 'Приглашение тренера' },
    // тренерские приглашения создаёт только владелец базы — пишет человек, коды заданы
    { id: 'beta-invites-file', write: 'supabase/tests/beta-invites.sql', content: BETA_INVITES },
    { id: 'beta-invites-apply', run: 'psql -f supabase/tests/beta-invites.sql' },
    // сверх таблицы плана: после регистрации cookie — Полины; она выходит через меню
    { id: 'polina-logout', browser: { url: '/workouts', click: 'Выйти' } },
    // Тимур — по своему коду из beta-invites.sql: пустой экран тренера дня 15
    { id: 'timur-join', browser: { url: `/join/${TIMUR_CODE}`, fill: joinAs('Тимур', 'timur@example.com'), click: 'Присоединиться' } },
    { id: 'timur-db', run: `psql -c "select name, role from profiles where name in ('Тимур', 'Полина')"` },
    {
      // Accept edits: правки — без вопроса, psql — с вопросом [y / n]
      id: 'ask-report',
      agent: {
        prompt:
          'Замечания — в одно место: «Сообщить о проблеме» в меню, форма — что делали, что ожидали, что вышло, страница сама; ' +
          'строка в таблице feedback, читает только владелец базы',
        reply: ASK_REPORT_REPLY,
      },
      steps: [
        { id: 'fb-sql', write: 'supabase/migrations/0015_feedback.sql', content: FEEDBACK_SQL },
        { id: 'fb-apply', run: 'psql -f supabase/migrations/0015_feedback.sql' },
        { id: 'fb-page', write: 'app/problem/page.tsx', content: PROBLEM_PAGE },
        // сверх таблицы плана: один шаг — один файл
        { id: 'fb-action', write: 'app/problem/actions.ts', content: PROBLEM_ACTION },
        { id: 'fb-link', write: 'components/ProblemLink.tsx', content: PROBLEM_LINK },
        { id: 'fb-nav', edit: 'components/Nav.tsx', find: NAV, replace: NAV_PROBLEM },
      ],
    },
    // сверх таблицы плана — правит человек: сквозной тест s20 сверяет ссылки меню (запуск — в общем прогоне s26)
    { id: 'fb-e2e', edit: 'e2e/first-run.spec.ts', find: FIRST_E2E, replace: FIRST_E2E_PROBLEM },
    { id: 'c-feedback', commit: 'Сообщить о проблеме' },
    // сверх таблицы плана — человек: страницы, собранные впервые после правки меню, запущенный dev отдавал со старым меню
    { id: 'dev-restart', run: RESTART },
    // Тимур по-прежнему вошёл: замечание беты — авторский текст
    { id: 'timur-feedback', browser: { url: '/problem', fill: TIMUR_PROBLEM, click: 'Отправить' } },
    { id: 'fb-db', run: 'psql -c "select page, did, expected, got from feedback"' },
    // сбой, о котором тренер не напишет: id из адреса — в запрос к bigint, 500 (проверено черновым прогоном)
    { id: 'crash', browser: { url: '/clients/abc' } },
    // журнала сбоев нет
    { id: 'errors-before', run: `psql -At -c "select count(*) from pg_tables where tablename = 'errors'"` },
    {
      // Accept edits: тест — без вопроса, vitest — с вопросом [y / n]. Сначала тест
      id: 'ask-errors',
      agent: {
        prompt: 'О сбое тренер не напишет. Нужна понятная страница ошибки и журнал сбоев в базе. Сначала тест',
        reply: ASK_ERRORS_REPLY,
      },
      steps: [
        { id: 'err-test', write: 'test/errors.test.ts', content: ERRORS_TEST },
        // красный: хука нет
        { id: 'err-red', run: 'npx vitest run test/errors.test.ts' },
      ],
    },
    {
      // сверх таблицы плана: тот же запрос, второй ход — таблица, страница ошибки, хук и зелёный тест
      id: 'ask-errors-go',
      agent: { prompt: 'Делай', reply: ASK_ERRORS_GO_REPLY },
      steps: [
        { id: 'err-sql', write: 'supabase/migrations/0016_errors.sql', content: ERRORS_SQL },
        { id: 'err-apply', run: 'psql -f supabase/migrations/0016_errors.sql' },
        { id: 'err-page', write: 'app/error.tsx', content: ERROR_PAGE },
        // Next 16 зовёт onRequestError и в next dev; новый файл подхватывается без перезапуска (черновой прогон)
        { id: 'err-hook', write: 'instrumentation.ts', content: INSTRUMENTATION },
        { id: 'err-green', run: 'npx vitest run test/errors.test.ts' },
      ],
    },
    { id: 'c-errors', commit: 'Сбои: понятная страница и журнал' },
    // тот же адрес у Тимура: понятная страница, меню на месте
    { id: 'crash2', browser: { url: '/clients/abc' } },
    // строка сбоя — путь и сообщение; время журнала в кадр не попадает
    { id: 'errors-db', run: 'psql -c "select path, message from errors"' },
  ],
}
