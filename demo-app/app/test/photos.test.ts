// @vitest-environment node
// Фото прогресса — снимок тела, данные о здоровье. Файл лежит вне public и вне git; открыть его можно только через маршрут
// с проверкой, кто вошёл: снимок видят подопечный и его тренер (RLS, supabase/migrations/0012_photos.sql), удаляет — сам подопечный,
// строку вместе с файлом. Тест вызывает маршруты app/api/photos, как их вызывает сервер; вход подменён (currentUser из lib/session):
// подпись cookie проверяет вход, здесь проверяются права. Снимок теста — за 13 октября, в конце тест убирает его строку и файл.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { POST } from "../app/api/photos/route";
import { pool } from "../lib/db";

// Кто вошёл: маршрут спросит currentUser, а тест отвечает за него — Анна, Света, Марина или никто
const login = vi.hoisted(() => ({ uid: null as string | null }));
vi.mock("@/lib/session", () => ({ currentUser: async () => login.uid }));

// id из supabase/seed.sql: Марина — тренер Анны, Света — подопечная Игоря; Анна в clients — id 1
const MARINA = "11111111-1111-1111-1111-111111111111";
const ANNA = "33333333-3333-3333-3333-333333333333";
const SVETA = "55555555-5555-5555-5555-555555555555";
const DAY = "2026-10-13";
const STORED = `storage/photos/1/${DAY}.jpg`;
// начало и конец файла JPEG: содержимое снимка маршрутам не важно
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

// маршрут снимка по id — GET и DELETE
const byId = () => import("../app/api/photos/[id]/route");
// файлы и папки внутри dir, пути от dir
const filesIn = (dir: string) => readdirSync(dir, { recursive: true, encoding: "utf8" }).sort();

let id = "";
let publicBefore: string[] = [];

// Анна загружает снимок за 13 октября
beforeAll(async () => {
  publicBefore = filesIn("public");
  login.uid = ANNA;
  const form = new FormData();
  form.append("photo", new File([JPEG], "photo.jpg", { type: "image/jpeg" }));
  form.append("day", DAY);
  const response = await POST(new Request("http://localhost/api/photos", { method: "POST", body: form }));
  id = (await response.json()).id;
});

// строка и файл снимка теста — прочь, даже если тест упал
afterAll(async () => {
  await pool.query("delete from photos where client_id = 1 and day = $1", [DAY]);
  await rm(STORED, { force: true });
  await pool.end();
});

test("снимок лежит вне public и вне git", () => {
  // в public ничего не прибавилось: по адресу /uploads/… снимок без входа не открыть
  expect(filesIn("public")).toEqual(publicBefore);
  // git check-ignore -q: путь в .gitignore — код 0, иначе execFileSync бросит ошибку
  expect(() => execFileSync("git", ["check-ignore", "-q", STORED])).not.toThrow();
});

test("открыть снимок: без входа — 401, Свете — 404, Марине и Анне — JPEG", async () => {
  const { GET } = await byId();
  const open = (uid: string | null) => {
    login.uid = uid;
    return GET(new Request(`http://localhost/api/photos/${id}`), { params: Promise.resolve({ id }) });
  };
  expect((await open(null)).status).toBe(401);
  expect((await open(SVETA)).status).toBe(404);
  for (const uid of [MARINA, ANNA]) {
    const response = await open(uid);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  }
});

test("удаляет снимок сам подопечный — строку и файл; Свете и Марине нельзя", async () => {
  const { DELETE } = await byId();
  const remove = (uid: string) => {
    login.uid = uid;
    return DELETE(new Request(`http://localhost/api/photos/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
  };
  expect((await remove(SVETA)).status).toBe(404);
  expect((await remove(MARINA)).status).toBe(404);
  expect(existsSync(STORED)).toBe(true);
  expect((await remove(ANNA)).status).toBe(204);
  expect(existsSync(STORED)).toBe(false);
  const { rows } = await pool.query("select id from photos where id = $1", [id]);
  expect(rows).toEqual([]);
});
