// @vitest-environment node
// Одноразовое приглашение по ссылке: принятое — подопечный тренера из записи приглашения; второй раз — «уже использовано»;
// отозванное и просроченное — отказ. Принимает приглашение функция базы accept_invite (supabase/migrations/0008_invites.sql),
// её же вызывает регистрация app/join/[code]/actions.ts. Срок сверяют часы базы, поэтому просроченное приглашение тест вставляет
// сразу «из прошлого», а не ждёт двое суток. Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback).
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер, Анна — её подопечная
const MARINA = "11111111-1111-1111-1111-111111111111";
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
