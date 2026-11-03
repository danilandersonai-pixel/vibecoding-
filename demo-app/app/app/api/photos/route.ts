import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { asUser } from "@/lib/db";
import { isDay } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";

// POST /api/photos — снимок прогресса вошедшего подопечного: form-data photo (JPEG) и day — день снимка, ГГГГ-ММ-ДД.
// Файл — storage/photos/<подопечный>/<день>.jpg: вне public (сервер сам его не отдаёт) и вне git (/storage/ в .gitignore).
// В photos — строка с этим путём; открыть снимок можно только через GET /api/photos/<id>, где проверяют, кто вошёл.
// За один день — один снимок: новый заменяет прежний. Ответ — id строки и адрес снимка
export async function POST(request: Request) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  // не form-data — ответ 400, а не падение сервера с 500
  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const day = String(form?.get("day") ?? "");
  if (!(photo instanceof File) || photo.type !== "image/jpeg") {
    return Response.json({ error: "Нужен снимок JPEG в поле photo" }, { status: 400 });
  }
  // день — как в дневнике питания: ГГГГ-ММ-ДД, и такой день есть в календаре
  if (!isDay(day)) return Response.json({ error: "День снимка — ГГГГ-ММ-ДД, например 2026-11-13" }, { status: 400 });

  const saved = await asUser(uid, async (db) => {
    // снимки загружает подопечный: вошедший — подопечный, если у него есть строка в clients
    const client = await db.query<{ id: string }>("select id from clients where user_id = $1", [uid]);
    if (client.rows.length === 0) return null;
    const clientId = client.rows[0].id;
    const path = `storage/photos/${clientId}/${day}.jpg`;
    // turbopackIgnore: next build не кладёт файлы storage/ — снимки людей — в собранный серверный код
    const file = join(/*turbopackIgnore: true*/ process.cwd(), path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await photo.arrayBuffer()));
    const { rows } = await db.query<{ id: string }>(
      `insert into photos (client_id, day, path) values ($1, $2, $3)
       on conflict (client_id, day) do update set path = excluded.path
       returning id`,
      [clientId, day, path],
    );
    return { id: rows[0].id, url: `/api/photos/${rows[0].id}` };
  });
  if (!saved) return Response.json({ error: "Фото прогресса загружает подопечный" }, { status: 403 });
  return Response.json(saved, { status: 201 });
}
