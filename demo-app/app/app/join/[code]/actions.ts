"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { startSession } from "@/lib/session";

// Ответ на занятую почту: та же почта другими буквами или повтор, который поймал unique в auth.users
const TAKEN = "Эта почта уже зарегистрирована — войдите";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Потом вход. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(`/join/${encodeURIComponent(code)}?error=${encodeURIComponent(error)}`);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) back(TAKEN);

  const db = await pool.connect();
  let uid: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    await db.query("select accept_invite($1, $2, $3)", [code, uid, name]);
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  redirect("/workouts");
}

// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return TAKEN;
  if (code === "P0001" && message) return message;
  return null;
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
