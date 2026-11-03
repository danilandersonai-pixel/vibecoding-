"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { recordFailure, tooManyAttempts } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

// Один ответ на занятую почту и на отказ приглашения: по ответу не узнать, есть ли такая почта в приложении
const SAME = "Проверьте почту или войдите, если аккаунт уже есть";
// Ответ после 5 неудачных попыток за 15 минут по одному коду приглашения — как у входа (app/api/login)
const TOO_MANY = "Слишком много попыток, подождите 15 минут";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Тренерское приглашение (0014_coach_invites.sql) делает нового пользователя тренером. Потом вход и первый экран по роли. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
// Неудачные попытки считает ограничитель входа (lib/rate-limit.ts) — по коду приглашения, а не по почте: почты при подборе
// каждый раз новые. Проверка формата почты и пароля отвечает своим текстом и попыткой не считается.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(`/join/${encodeURIComponent(code)}?error=${encodeURIComponent(error)}`);
  const attempts = `join:${code}`;
  if (tooManyAttempts(attempts)) back(TOO_MANY);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) {
    recordFailure(attempts);
    back(SAME);
  }

  const db = await pool.connect();
  let uid: string;
  let role: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    // роль — из приглашения: обычное заводит подопечного, тренерское — тренера
    const accepted = await db.query<{ role: string }>("select accept_invite($1, $2, $3) as role", [code, uid, name]);
    role = accepted.rows[0].role;
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    if (refused(err)) {
      recordFailure(attempts);
      back(SAME);
    }
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  // первый экран: тренеру — подопечные, подопечному — его тренировки
  redirect(role === "coach" ? "/clients" : "/workouts");
}

// Отказ, а не сбой: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refused(err: unknown): boolean {
  const { code } = err as { code?: string };
  return code === "23505" || code === "P0001";
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
