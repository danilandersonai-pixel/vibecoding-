import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { asUser } from "@/lib/db";
import { isDay } from "@/lib/nutrition";
import { photoFile, photoPath } from "@/lib/photos";
import { currentUser } from "@/lib/session";

// Предел снимка — 10 МБ: снимок с телефона меньше
const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/photos — снимок прогресса вошедшего подопечного: form-data photo (JPEG до 10 МБ) и day — день снимка, ГГГГ-ММ-ДД.
// Файл — storage/photos/<подопечный>/<день>.jpg (lib/photos.ts): вне public и вне git. В photos — строка снимка; открыть его
// можно только через GET /api/photos/<id>, где проверяют, кто вошёл. За один день — один снимок: новый заменяет прежний.
// Ответ — id строки и адрес снимка
export async function POST(request: Request) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  // Content-Length — размер всего запроса: снимок и поля формы (на них — запас 64 КБ). Больше предела — 413, запрос не читаем
  if (Number(request.headers.get("content-length")) > MAX_BYTES + 64 * 1024) {
    return Response.json({ error: "Снимок — до 10 МБ" }, { status: 413 });
  }
  // не form-data — ответ 400, а не падение сервера с 500
  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const day = String(form?.get("day") ?? "");
  if (!(photo instanceof File)) return Response.json({ error: "Нужен снимок JPEG в поле photo" }, { status: 400 });
  if (photo.size > MAX_BYTES) return Response.json({ error: "Снимок — до 10 МБ" }, { status: 413 });
  // JPEG — по первым байтам файла (FF D8 FF), а не по типу из запроса: тип ставит клиент, curl -F — по расширению имени
  const bytes = Buffer.from(await photo.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return Response.json({ error: "Нужен снимок JPEG в поле photo" }, { status: 400 });
  }
  // день — как в дневнике питания: ГГГГ-ММ-ДД, и такой день есть в календаре
  if (!isDay(day)) return Response.json({ error: "День снимка — ГГГГ-ММ-ДД, например 2026-11-13" }, { status: 400 });

  const saved = await asUser(uid, async (db) => {
    // снимки загружает подопечный: вошедший — подопечный, если у него есть строка в clients
    const client = await db.query<{ id: string }>("select id from clients where user_id = $1", [uid]);
    if (client.rows.length === 0) return null;
    const clientId = client.rows[0].id;
    const file = photoFile(clientId, day);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
    const { rows } = await db.query<{ id: string }>(
      `insert into photos (client_id, day, path) values ($1, $2, $3)
       on conflict (client_id, day) do update set path = excluded.path
       returning id`,
      [clientId, day, photoPath(clientId, day)],
    );
    return { id: rows[0].id, url: `/api/photos/${rows[0].id}` };
  });
  if (!saved) return Response.json({ error: "Фото прогресса загружает подопечный" }, { status: 403 });
  return Response.json(saved, { status: 201 });
}
