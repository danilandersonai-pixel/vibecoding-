import { pool } from "@/lib/db";
import { recordFailure, tooManyAttempts } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

// POST /api/login — { email, password } → { role } и cookie сессии.
// Пароль сверяет база: crypt() хеширует введённый пароль с солью из хеша в auth.users.
// Запрос идёт от владельца базы, как у сервиса входа Supabase: пользователям таблица auth.users закрыта.
// Перед проверкой — ограничитель попыток: больше 5 неудачных входов за 15 минут по одной почте не пускаем (429).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "");
  if (tooManyAttempts(email)) {
    return Response.json({ error: "Слишком много попыток, подождите 15 минут" }, { status: 429 });
  }
  const { rows } = await pool.query<{ id: string; role: string }>(
    `select u.id, p.role
       from auth.users u join profiles p on p.id = u.id
      where u.email = $1 and u.encrypted_password = crypt($2, u.encrypted_password)`,
    [email, String(body?.password ?? "")],
  );
  if (rows.length === 0) {
    recordFailure(email);
    return Response.json({ error: "Неверная почта или пароль" }, { status: 401 });
  }
  await startSession(rows[0].id);
  return Response.json({ role: rows[0].role });
}
