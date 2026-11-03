// @vitest-environment node
// Негативный тест: дневник питания Анны — данные о здоровье — видят она и её тренер Марина, а Света, подопечная Игоря, — нет;
// записать в дневник Анны Света тоже не может.
// Права проверяет база (RLS, supabase/migrations/0010_nutrition.sql): запросы идут от имени разных людей, как в asUser из lib/db.ts.
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
// овсяные хлопья, 45 г; с этикетки на 100 г — 352 ккал, белки 12,3 г, жиры 6,2 г, углеводы 61,8 г
const INSERT = `insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs)
                values ($1, '2026-11-12', 'Овсяные хлопья', 45, 352, 12.3, 6.2, 61.8)`;

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

// Анна записывает овсяные хлопья в свой дневник, затем reader читает дневник Анны
const diarySeenBy = (reader: string) =>
  rolledBack(async (db, as) => {
    await as(ANNA);
    await db.query(INSERT, [ANNA_CLIENT]);
    await as(reader);
    const { rows } = await db.query<{ product: string }>("select product from food_entries where client_id = $1", [ANNA_CLIENT]);
    return rows.map((row) => row.product);
  });

// в дневнике Анны могут быть и её записи из приложения — проверяем запись теста, а не точный состав
test("Анна пишет в свой дневник и видит запись", async () => {
  expect(await diarySeenBy(ANNA)).toContain("Овсяные хлопья");
});

test("Марина, тренер Анны, видит её дневник", async () => {
  expect(await diarySeenBy(MARINA)).toContain("Овсяные хлопья");
});

test("Света, подопечная Игоря, не видит дневник Анны", async () => {
  expect(await diarySeenBy(SVETA)).toEqual([]);
});

test("Света не может записать в дневник Анны", async () => {
  const write = rolledBack(async (db, as) => {
    await as(SVETA);
    await db.query(INSERT, [ANNA_CLIENT]);
  });
  await expect(write).rejects.toThrow("row-level security");
});
