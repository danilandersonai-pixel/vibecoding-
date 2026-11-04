// @vitest-environment node
// Чужие данные закрывает база (RLS), а не страница: запросы идут от имени разных людей, как в приложении.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения.
import { afterAll, expect, test } from "vitest";
import { asUser, pool } from "../lib/db";

// id из supabase/seed.sql
const MARINA = "11111111-1111-1111-1111-111111111111";
const IGOR = "22222222-2222-2222-2222-222222222222";

// Имена подопечных, которых видно от имени uid
function clientNames(uid: string): Promise<string[]> {
  return asUser(uid, async (db) => {
    const { rows } = await db.query<{ name: string }>("select name from clients order by id");
    return rows.map((row) => row.name);
  });
}

afterAll(() => pool.end());

test("Марина видит своих подопечных и не видит Свету", async () => {
  const names = await clientNames(MARINA);
  // список мог пополниться данными для замера (seed-load.sql) — проверяем своих и чужую, а не точный состав
  expect(names).toContain("Анна");
  expect(names).toContain("Олег");
  expect(names).not.toContain("Света");
});

test("Игорь не видит Анну и её тренировок", async () => {
  expect(await clientNames(IGOR)).not.toContain("Анна");
  // id 1 — Анна
  const workouts = await asUser(IGOR, async (db) => (await db.query("select id from workouts where client_id = 1")).rows);
  expect(workouts).toEqual([]);
});

test("без входа не видно ничего", async () => {
  // роль anon — запрос без входа, как в Supabase
  const db = await pool.connect();
  try {
    await db.query("begin");
    await db.query("set local role anon");
    const { rows } = await db.query("select id from clients");
    expect(rows).toEqual([]);
  } finally {
    await db.query("rollback");
    db.release();
  }
});
