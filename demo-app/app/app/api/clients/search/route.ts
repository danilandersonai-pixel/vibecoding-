import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GET /api/clients/search?q= — поиск подопечного по имени.
// Имя идёт параметром ($1), а не в строку запроса: склеить SQL больше нельзя.
// Запрос — от имени вошедшего тренера (asUser), поэтому видно только его подопечных; без входа — 401.
export async function GET(request: Request) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await asUser(uid, async (db) => {
    const result = await db.query<{ id: string; name: string }>(
      "select id, name from clients where name ilike '%' || $1 || '%' order by id",
      [q],
    );
    return result.rows;
  });
  return Response.json(rows);
}
