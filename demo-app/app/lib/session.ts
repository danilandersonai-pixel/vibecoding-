import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Сессия — cookie «uid.подпись». Подпись — HMAC-SHA256 с секретом SESSION_SECRET из .env.local:
// без секрета чужой uid в cookie не подставить. httpOnly — JavaScript страницы cookie не прочитает.
const COOKIE = "session";

function sign(uid: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Не задан SESSION_SECRET");
  return createHmac("sha256", secret).update(uid).digest("base64url");
}

// После входа: cookie с подписанным uid
export async function startSession(uid: string) {
  (await cookies()).set(COOKIE, `${uid}.${sign(uid)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

// Кто вошёл: uid из cookie, если подпись верна, иначе null
export async function currentUser(): Promise<string | null> {
  const [uid, signature] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!uid || !signature) return null;
  const expected = Buffer.from(sign(uid));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? uid : null;
}
