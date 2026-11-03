// @vitest-environment node
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
const MESSAGE = `проверка журнала ${randomUUID()}`;

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
