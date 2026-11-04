import { cookies } from "next/headers";

// POST /api/logout — выход: cookie сессии стирается (имя — как в lib/session.ts), и человек попадает на страницу входа.
// 303 — браузер откроет /login обычным GET, а не повторит POST
export async function POST() {
  (await cookies()).delete("session");
  return new Response(null, { status: 303, headers: { Location: "/login" } });
}
