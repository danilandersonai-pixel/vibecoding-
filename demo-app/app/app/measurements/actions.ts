"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { isDay, parseAmount } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";

// Новый замер вошедшего подопечного: дата из формы и три числа — вес, кг; талия и бёдра, см («64,8» с запятой тоже число,
// как parseAmount в дневнике питания). За один день — один замер: новый заменяет прежний.
// Запрос идёт от имени вошедшего: записать замер чужому не даст RLS (политика «подопечный ведёт свои замеры»)
export async function addMeasurement(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  // ошибку страница покажет под формой: её текст — в адресе
  const fail = (error: string) => `/measurements?error=${encodeURIComponent(error)}`;

  const day = String(form.get("day") ?? "");
  if (!isDay(day)) redirect(fail("Дата замера — день из календаря"));
  const [weight, waist, hips] = ["weight", "waist", "hips"].map((name) => parseAmount(String(form.get(name) ?? "")));
  // parseAmount пропускает 0, а замер — больше нуля
  if (!weight || !waist || !hips) redirect(fail("Вес, талия и бёдра — числа больше нуля, например 64,8"));

  // замер — в строку вошедшего подопечного; у тренера строки в clients нет, и не запишется ничего
  const { rowCount } = await asUser(uid, (db) =>
    db.query(
      `insert into measurements (client_id, day, weight, waist, hips)
       select id, $2::date, $3::numeric, $4::numeric, $5::numeric from clients where user_id = $1
       on conflict (client_id, day) do update set weight = excluded.weight, waist = excluded.waist, hips = excluded.hips`,
      [uid, day, weight, waist, hips],
    ),
  );
  if (rowCount === 0) redirect(fail("Замеры ведёт подопечный"));
  // страница заново — с новым замером и без прежней ошибки в адресе
  redirect("/measurements");
}
