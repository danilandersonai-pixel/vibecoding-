// @vitest-environment node
// Негативный тест: замеры тела Анны — данные о здоровье — видят она и её тренер Марина, а Света, подопечная Игоря, — нет;
// записать замер Анне Света тоже не может.
// Права проверяет база (RLS, supabase/migrations/0011_measurements.sql): запросы идут от имени разных людей, как в asUser из lib/db.ts.
// Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback): в базе после него ничего не остаётся.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер Анны, Света — подопечная Игоря; Анна в clients — id 1
const MARINA = "11111111-1111-1111-1111-111111111111";
const ANNA = "33333333-3333-3333-3333-333333333333";
const SVETA = "55555555-5555-5555-5555-555555555555";
const ANNA_CLIENT = 1;
// замер за 13 ноября: вес 64,1 кг, талия 71,5 см, бёдра 97 см
const INSERT = `insert into measurements (client_id, day, weight, waist, hips) values ($1, '2026-11-13', 64.1, 71.5, 97)`;

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

// Анна записывает свой замер, затем reader читает замеры Анны: дни замеров
const measurementsSeenBy = (reader: string) =>
  rolledBack(async (db, as) => {
    await as(ANNA);
    await db.query(INSERT, [ANNA_CLIENT]);
    await as(reader);
    const { rows } = await db.query<{ day: string }>("select day::text as day from measurements where client_id = $1", [ANNA_CLIENT]);
    return rows.map((row) => row.day);
  });

// у Анны могут быть и замеры из приложения — проверяем замер теста, а не точный состав
test("Анна записывает свой замер и видит его", async () => {
  expect(await measurementsSeenBy(ANNA)).toContain("2026-11-13");
});

test("Марина, тренер Анны, видит её замеры", async () => {
  expect(await measurementsSeenBy(MARINA)).toContain("2026-11-13");
});

test("Света, подопечная Игоря, не видит замеры Анны", async () => {
  expect(await measurementsSeenBy(SVETA)).toEqual([]);
});

test("Света не может записать замер Анне", async () => {
  const write = rolledBack(async (db, as) => {
    await as(SVETA);
    await db.query(INSERT, [ANNA_CLIENT]);
  });
  await expect(write).rejects.toThrow("row-level security");
});
