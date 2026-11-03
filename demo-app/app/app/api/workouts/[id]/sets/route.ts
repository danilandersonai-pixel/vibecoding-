import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseSet } from "@/lib/sets";

// Номер подхода — uuid, как его даёт crypto.randomUUID() на телефоне
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/workouts/<id>/sets — подход в тренировку id от имени вошедшего: JSON { key, weight, reps, note }, key — номер подхода.
// Его шлёт очередь на телефоне (components/SetForm.tsx): подход уходит, когда есть сеть, а «отправлено» на телефоне — только
// после этого ответа, «принято». Правила подхода — parseSet из lib/sets.ts, те же, что у формы.
// Номер принимается один раз: ответ «принято» потерялся, и телефон прислал тот же подход снова — второй строки не будет,
// а ответ тот же, «принято», и телефон перестанет его слать.
export async function POST(request: Request, { params }: RouteContext<"/api/workouts/[id]/sets">) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const { id } = await params;
  // не JSON в теле — ответ 400, а не падение сервера с 500
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { key, weight, reps, note }" }, { status: 400 });
  }
  // без номера повтор не узнать
  const key = typeof body.key === "string" && UUID.test(body.key) ? body.key : null;
  if (!key) return Response.json({ error: "Нужен номер подхода key — uuid" }, { status: 400 });
  const set = parseSet(body);
  if (typeof set === "string") return Response.json({ error: set }, { status: 400 });

  // id — число: «abc» не дойдёт до базы. Тренировку видят только её подопечный и его тренер (RLS) — остальным 404
  const saved =
    /^\d+$/.test(id) &&
    (await asUser(uid, async (db) => {
      const workout = await db.query("select id from workouts where id = $1", [id]);
      if (workout.rows.length === 0) return false;
      // подход с этим номером уже есть — on conflict do nothing: строка не добавится, ответ тот же
      await db.query(
        `insert into sets (workout_id, weight, reps, note, client_key) values ($1, $2, $3, $4, $5)
         on conflict (client_key) do nothing`,
        [id, set.weight, set.reps, set.note, key],
      );
      return true;
    }));
  if (!saved) return Response.json({ error: "Тренировки нет" }, { status: 404 });
  return Response.json({ status: "принято" }, { status: 201 });
}
