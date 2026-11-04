import { readFile, rm } from "node:fs/promises";
import { asUser } from "@/lib/db";
import { photoFile } from "@/lib/photos";
import { currentUser } from "@/lib/session";

// Снимок прогресса по id: файл лежит в storage/photos, вне public, — отдаёт и удаляет его только этот маршрут.
// Строку снимка ищет запрос от имени вошедшего (asUser): RLS отдаёт её подопечному и его тренеру. Остальным строки нет,
// и ответ им тот же, что на несуществующий снимок, — 404: чужой не узнает даже, что снимок есть.
// Файл — по номеру подопечного и дню из строки (photoFile в lib/photos.ts), а не по строке пути.

// Строка снимка: чей и за какой день
type Photo = { client_id: string; day: string };

// GET /api/photos/<id> — файл снимка: без входа 401, чужому 404, подопечному и его тренеру — JPEG
export async function GET(_request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  // id — число: «abc» не дойдёт до базы
  const photo = /^\d+$/.test(id)
    ? await asUser(uid, async (db) => {
        const { rows } = await db.query<Photo>("select client_id, day::text as day from photos where id = $1", [id]);
        return rows[0];
      })
    : undefined;
  // строки нет — или строка есть, а файла нет: тот же ответ 404, а не 500
  const file = photo && (await readFile(photoFile(photo.client_id, photo.day)).catch(() => null));
  if (!file) return Response.json({ error: "Снимка нет" }, { status: 404 });
  // тип ставит сервер, nosniff — браузер не угадывает его по содержимому; снимок личный — ни браузер, ни прокси его не сохраняют
  return new Response(file, {
    headers: { "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" },
  });
}

// DELETE /api/photos/<id> — подопечный удаляет свой снимок: строку и файл, одной транзакцией — не удалился файл, вернётся строка.
// Тренер снимки только видит: удалить строку ему, как и чужому, не даст RLS — ответ 404
export async function DELETE(_request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  const deleted = /^\d+$/.test(id)
    ? await asUser(uid, async (db) => {
        // returning вернёт строку, только если RLS дала её удалить
        const { rows } = await db.query<Photo>("delete from photos where id = $1 returning client_id, day::text as day", [id]);
        if (rows[0]) await rm(photoFile(rows[0].client_id, rows[0].day), { force: true });
        return rows[0];
      })
    : undefined;
  if (!deleted) return Response.json({ error: "Снимка нет" }, { status: 404 });
  return new Response(null, { status: 204 });
}
