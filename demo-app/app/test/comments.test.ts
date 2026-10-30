// @vitest-environment node
// Негативный тест: комментарий Анны к её тренировке видят она и её тренер Марина, а Света, подопечная Игоря, — нет;
// Света не может написать под тренировкой Анны, а Анна — от имени Марины.
// Права проверяет база (RLS, supabase/migrations/0007_comments_rls.sql): запросы идут от имени разных людей, как в asUser из lib/db.ts.
// Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback): в базе после него ничего не остаётся.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер Анны, Света — подопечная Игоря; тренировка 1 — «Ноги» Анны
const MARINA = "11111111-1111-1111-1111-111111111111";
const ANNA = "33333333-3333-3333-3333-333333333333";
const SVETA = "55555555-5555-5555-5555-555555555555";
const LEGS = 1;
const KNEE = "Последний подход тяжело, ноет колено";
const INSERT = "insert into comments (workout_id, author_id, body) values ($1, $2, $3)";

afterAll(() => pool.end());

// Запросы fn в одной транзакции с откатом; as(uid) — дальше от имени uid: роль authenticated и sub в request.jwt.claims
async function rolledBack<T>(fn: (db: PoolClient, as: (uid: string) => Promise<void>) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  const as = async (uid: string) => {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
  };
  try {
    await db.query("begin");
    return await fn(db, as);
  } finally {
    await db.query("rollback");
    db.release();
  }
}

// Анна пишет комментарий под «Ногами», затем reader читает комментарии к этой тренировке
const commentsSeenBy = (reader: string) =>
  rolledBack(async (db, as) => {
    await as(ANNA);
    await db.query(INSERT, [LEGS, ANNA, KNEE]);
    await as(reader);
    const { rows } = await db.query<{ body: string }>("select body from comments where workout_id = $1", [LEGS]);
    return rows.map((row) => row.body);
  });

// uid пишет комментарий под «Ногами», автор — author
const write = (uid: string, author: string) =>
  rolledBack(async (db, as) => {
    await as(uid);
    await db.query(INSERT, [LEGS, author, "Привет от Светы"]);
  });

test("Света, подопечная Игоря, не видит комментарий Анны", async () => {
  expect(await commentsSeenBy(SVETA)).toEqual([]);
});

test("Анна видит свой комментарий", async () => {
  expect(await commentsSeenBy(ANNA)).toContain(KNEE);
});

test("Марина, тренер Анны, видит комментарий Анны", async () => {
  expect(await commentsSeenBy(MARINA)).toContain(KNEE);
});

test("Света не может написать под тренировкой Анны", async () => {
  await expect(write(SVETA, SVETA)).rejects.toThrow("row-level security");
});

test("Анна не может написать от имени Марины", async () => {
  await expect(write(ANNA, MARINA)).rejects.toThrow("row-level security");
});
