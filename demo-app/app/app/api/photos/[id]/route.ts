import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Снимок прогресса по id: файл лежит в storage/photos, вне public, — отдаёт и удаляет его только этот маршрут.
// Строку снимка ищет запрос от имени вошедшего (asUser): RLS отдаёт её подопечному и его тренеру. Остальным строки нет,
// и ответ им тот же, что на несуществующий снимок, — 404: чужой не узнает даже, что снимок есть.

// Файл снимка по пути из строки photos (storage/photos/…). turbopackIgnore: по пути из базы next build иначе положил бы
// в собранный серверный код весь проект — и storage/ со снимками людей
const fileOf = (path: string) => join(/*turbopackIgnore: true*/ process.cwd(), path);

// GET /api/photos/<id> — файл снимка: без входа 401, чужому 404, подопечному и его тренеру — JPEG
export async function GET(_request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  // id — число: «abc» не дойдёт до базы
  const photo = /^\d+$/.test(id)
    ? await asUser(uid, async (db) => {
        const { rows } = await db.query<{ path: string }>("select path from photos where id = $1", [id]);
        return rows[0];
      })
    : undefined;
  if (!photo) return Response.json({ error: "Снимка нет" }, { status: 404 });
  const file = await readFile(fileOf(photo.path));
  // снимок личный: ни браузер, ни прокси его не сохраняют
  return new Response(file, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" } });
}

// DELETE /api/photos/<id> — подопечный удаляет свой снимок: строку и файл, одной транзакцией — не удалился файл, вернётся строка.
// Тренер снимки только видит: удалить строку ему, как и чужому, не даст RLS — ответ 404
export async function DELETE(_request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  const deleted = /^\d+$/.test(id)
    ? await asUser(uid, async (db) => {
        // returning вернёт путь, только если RLS дала удалить строку
        const { rows } = await db.query<{ path: string }>("delete from photos where id = $1 returning path", [id]);
        if (rows[0]) await rm(fileOf(rows[0].path), { force: true });
        return rows[0];
      })
    : undefined;
  if (!deleted) return Response.json({ error: "Снимка нет" }, { status: 404 });
  return new Response(null, { status: 204 });
}
