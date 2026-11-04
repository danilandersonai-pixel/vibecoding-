"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { checkName } from "@/lib/names";
import { currentUser } from "@/lib/session";

// Тренер добавляет подопечного: имя из формы. Подопечный записывается вошедшему тренеру (coach_id = uid).
// Запрос идёт от имени тренера, и записать подопечного чужому тренеру не даст RLS (политика «тренер добавляет своих»).
export async function addClient(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const name = String(form.get("name") ?? "").trim();
  // пустое имя ничего не добавляет; остальное проверяет lib/names.ts, ошибку страница покажет под формой
  if (name === "") redirect("/clients");
  const error = checkName(name);
  if (error) redirect(`/clients?error=${encodeURIComponent(error)}`);
  await asUser(uid, (db) => db.query("insert into clients (coach_id, name) values ($1, $2)", [uid, name]));
  // тот же список заново — с новым подопечным и без прежней ошибки в адресе
  redirect("/clients");
}
