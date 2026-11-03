// @vitest-environment node
// Удаление аккаунта (docs/privacy.md, «Как удалить аккаунт»): подопечный удаляет свой аккаунт — все свои строки и файлы фото.
// Тест заводит двух подопечных Марины (supabase/seed.sql) со всем, что бывает у подопечного: тренировка со строкой и подходом,
// комментарии его и тренера, цели и дневник питания, замер, снимок (строка и файл), принятое приглашение и замечание.
// Первый нажимает «Удалить аккаунт»: от него не остаётся ни строки, ни файла, а у второго всё на месте. Подопечные — новые
// при каждом запуске, второго тест в конце удаляет тем же действием.
// Вход подменён (currentUser из lib/session), cookie тоже: действие стирает её, а запроса в тесте нет.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { deleteAccount } from "../app/account/actions";
import { pool } from "../lib/db";
import { photoFile, photoPath } from "../lib/photos";

// Кто вошёл: действие спросит currentUser, а тест отвечает за него
const login = vi.hoisted(() => ({ uid: null as string | null }));
vi.mock("@/lib/session", () => ({ currentUser: async () => login.uid }));
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: () => undefined }) }));

const MARINA = "11111111-1111-1111-1111-111111111111";
const DAY = "2026-11-13";

// Строки подопечного: таблица, столбец и значение, по которым строку найти
type Row = [table: string, column: string, value: string];
type Client = { user: string; rows: Row[]; photo: string };

// Первая строка ответа — её id
async function id(sql: string, params: unknown[]): Promise<string> {
  return (await pool.query<{ id: string }>(sql, params)).rows[0].id;
}

// Новый подопечный Марины со всеми своими строками и файлом снимка — от владельца базы, как регистрация
async function newClient(): Promise<Client> {
  const user = randomUUID();
  await pool.query("insert into auth.users (id, email, encrypted_password) values ($1, $2, crypt('demo-password', gen_salt('bf')))", [
    user,
    `${user}@example.com`,
  ]);
  await pool.query("insert into profiles (id, role, name) values ($1, 'client', 'Тест')", [user]);
  const client = await id("insert into clients (coach_id, user_id, name) values ($1, $2, 'Тест') returning id", [MARINA, user]);
  const workout = await id("insert into workouts (client_id, title, day) values ($1, 'Ноги', $2) returning id", [client, DAY]);
  const item = await id(
    "insert into workout_items (workout_id, exercise_id, sets, reps) select $1, id, 3, 10 from exercises where name = 'Присед' returning id",
    [workout],
  );
  const set = await id("insert into sets (workout_id, workout_item_id, weight, reps, note) values ($1, $2, 40, 10, 'ноет колено') returning id", [
    workout,
    item,
  ]);
  const own = await id("insert into comments (workout_id, author_id, body) values ($1, $2, 'Тянет поясницу') returning id", [workout, user]);
  const coach = await id("insert into comments (workout_id, author_id, body) values ($1, $2, 'Снизим вес') returning id", [workout, MARINA]);
  await pool.query("insert into nutrition_goals (client_id, kcal, protein, fat, carbs) values ($1, 1800, 100, 60, 200)", [client]);
  const food = await id(
    "insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs) values ($1, $2, 'Творог', 200, 120, 17, 5, 3) returning id",
    [client, DAY],
  );
  const measurement = await id("insert into measurements (client_id, day, weight, waist, hips) values ($1, $2, 61.5, 70, 96) returning id", [
    client,
    DAY,
  ]);
  const photo = await id("insert into photos (client_id, day, path) values ($1, $2, $3) returning id", [client, DAY, photoPath(client, DAY)]);
  await mkdir(dirname(photoFile(client, DAY)), { recursive: true });
  await writeFile(photoFile(client, DAY), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  const invite = await id("insert into invites (coach_id, accepted_by) values ($1, $2) returning id", [MARINA, user]);
  const feedback = await id(
    "insert into feedback (author_id, page, did, expected, got) values ($1, '/workouts', 'Открыла', 'Тренировку', 'Пусто') returning id",
    [user],
  );
  const rows: Row[] = [
    ["auth.users", "id", user],
    ["profiles", "id", user],
    ["clients", "id", client],
    ["workouts", "id", workout],
    ["workout_items", "id", item],
    ["sets", "id", set],
    ["comments", "id", own],
    ["comments", "id", coach],
    ["nutrition_goals", "client_id", client],
    ["food_entries", "id", food],
    ["measurements", "id", measurement],
    ["photos", "id", photo],
    ["invites", "id", invite],
    ["feedback", "id", feedback],
  ];
  return { user, rows, photo: photoFile(client, DAY) };
}

// Какие из строк ещё есть в базе: «таблица.столбец» по строке
async function left(rows: Row[]): Promise<string[]> {
  const found: string[] = [];
  for (const [table, column, value] of rows) {
    const { rowCount } = await pool.query(`select 1 from ${table} where ${column} = $1`, [value]);
    if (rowCount) found.push(`${table}.${column}`);
  }
  return found;
}

let gone: Client;
let stays: Client;

beforeAll(async () => {
  gone = await newClient();
  stays = await newClient();
});

// второго подопечного — тем же действием; первого — тоже, если тест упал раньше удаления
afterAll(async () => {
  for (const client of [gone, stays]) {
    login.uid = client.user;
    await deleteAccount().catch(() => undefined);
  }
  await pool.end();
});

test("подопечный удаляет аккаунт: ни строки, ни файла снимка; у другого подопечного всё на месте", async () => {
  login.uid = gone.user;
  // после удаления — на главную: redirect в действии бросает NEXT_REDIRECT
  await expect(deleteAccount()).rejects.toThrow("NEXT_REDIRECT");
  expect(await left(gone.rows)).toEqual([]);
  expect(existsSync(dirname(gone.photo))).toBe(false);
  expect(await left(stays.rows)).toEqual(stays.rows.map(([table, column]) => `${table}.${column}`));
  expect(existsSync(stays.photo)).toBe(true);
});

test("тренер так аккаунт не удалит: у него подопечные", async () => {
  login.uid = MARINA;
  await expect(deleteAccount()).rejects.toThrow("Удалить можно только свой аккаунт подопечного");
  expect((await pool.query("select 1 from profiles where id = $1", [MARINA])).rowCount).toBe(1);
});
