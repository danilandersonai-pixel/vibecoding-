// @vitest-environment node
// Фото прогресса — снимок тела, данные о здоровье. Файл лежит вне public и вне git; открыть его можно только через маршрут
// с проверкой, кто вошёл: снимок видят подопечный и его тренер (RLS, supabase/migrations/0012_photos.sql), удаляет — сам подопечный,
// строку вместе с файлом. Загрузка принимает только JPEG — по первым байтам файла, а не по типу из запроса — и до 10 МБ.
// Тест вызывает маршруты app/api/photos, как их вызывает сервер; вход подменён (currentUser из lib/session): подпись cookie
// проверяет вход, здесь проверяются права. Снимок теста — за 13 октября, в конце тест убирает его строки и файл.
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

// id из supabase/seed.sql: Марина — тренер Анны и Олега, Игорь — тренер Светы; Анна в clients — id 1
const MARINA = "11111111-1111-1111-1111-111111111111";
const IGOR = "22222222-2222-2222-2222-222222222222";
const ANNA = "33333333-3333-3333-3333-333333333333";
const OLEG = "44444444-4444-4444-4444-444444444444";
const SVETA = "55555555-5555-5555-5555-555555555555";
// чужие снимку Анны: подопечная другого тренера, другой тренер, другой подопечный того же тренера
const OTHERS = [SVETA, IGOR, OLEG];
const DAY = "2026-10-13";
const STORED = `storage/photos/1/${DAY}.jpg`;
// строка снимка без файла: файла за этот день нет
const LOST_DAY = "2026-09-13";
// начало и конец файла JPEG: FF D8 FF … FF D9
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
// начало файла PNG — не снимок JPEG, как бы ни назывался файл
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

// маршрут снимка по id — GET и DELETE
const byId = () => import("../app/api/photos/[id]/route");
// файлы и папки внутри dir, пути от dir
const filesIn = (dir: string) => readdirSync(dir, { recursive: true, encoding: "utf8" }).sort();

// Загрузка от имени Анны за DAY: файл photo.jpg с типом image/jpeg и содержимым bytes
function upload(bytes: BlobPart) {
  login.uid = ANNA;
  const form = new FormData();
  form.append("photo", new File([bytes], "photo.jpg", { type: "image/jpeg" }));
  form.append("day", DAY);
  return POST(new Request("http://localhost/api/photos", { method: "POST", body: form }));
}

let id = "";
let publicBefore: string[] = [];

// Анна загружает снимок за 13 октября
beforeAll(async () => {
  publicBefore = filesIn("public");
  id = (await (await upload(JPEG)).json()).id;
});

// строки и файл снимка теста — прочь, даже если тест упал
afterAll(async () => {
  await pool.query("delete from photos where client_id = 1 and day in ($1, $2)", [DAY, LOST_DAY]);
  await rm(STORED, { force: true });
  await pool.end();
});

test("снимок лежит вне public и вне git", () => {
  // в public ничего не прибавилось: по адресу /uploads/… снимок без входа не открыть
  expect(filesIn("public")).toEqual(publicBefore);
  // git check-ignore -q: путь в .gitignore — код 0, иначе execFileSync бросит ошибку
  expect(() => execFileSync("git", ["check-ignore", "-q", STORED])).not.toThrow();
});

test("загрузка: JPEG — по первым байтам, а не по типу из запроса; больше 10 МБ — 413", async () => {
  // PNG под именем photo.jpg и с типом image/jpeg
  expect((await upload(PNG)).status).toBe(400);
  // JPEG на 10 МБ и 1 байт
  const big = new Uint8Array(10 * 1024 * 1024 + 1);
  big.set(JPEG);
  expect((await upload(big)).status).toBe(413);
});

test("открыть снимок: без входа — 401, чужим — 404, Марине и Анне — JPEG", async () => {
  const { GET } = await byId();
  const open = (uid: string | null) => {
    login.uid = uid;
    return GET(new Request(`http://localhost/api/photos/${id}`), { params: Promise.resolve({ id }) });
  };
  expect((await open(null)).status).toBe(401);
  for (const uid of OTHERS) expect((await open(uid)).status, uid).toBe(404);
  for (const uid of [MARINA, ANNA]) {
    const response = await open(uid);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    // браузер не угадывает тип по содержимому
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  }
});

test("строка есть, а файла нет — 404, а не 500", async () => {
  const { GET } = await byId();
  const { rows } = await pool.query<{ id: string }>(
    "insert into photos (client_id, day, path) values (1, $1, $2) returning id",
    [LOST_DAY, `storage/photos/1/${LOST_DAY}.jpg`],
  );
  login.uid = ANNA;
  const response = await GET(new Request(`http://localhost/api/photos/${rows[0].id}`), { params: Promise.resolve({ id: rows[0].id }) });
  expect(response.status).toBe(404);
});

test("удаляет снимок сам подопечный — строку и файл; чужим и Марине нельзя", async () => {
  const { DELETE } = await byId();
  const remove = (uid: string) => {
    login.uid = uid;
    return DELETE(new Request(`http://localhost/api/photos/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
  };
  for (const uid of [...OTHERS, MARINA]) expect((await remove(uid)).status, uid).toBe(404);
  expect(existsSync(STORED)).toBe(true);
  expect((await remove(ANNA)).status).toBe(204);
  expect(existsSync(STORED)).toBe(false);
  const { rows } = await pool.query("select id from photos where id = $1", [id]);
  expect(rows).toEqual([]);
});
