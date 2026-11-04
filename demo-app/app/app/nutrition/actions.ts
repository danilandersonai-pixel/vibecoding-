"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { checkPer100, isDay, parseAmount } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";

// Запись в дневник за день day: продукт, граммы порции и значения с этикетки на 100 г (docs/nutrition.md).
// Запрос идёт от имени вошедшего: в чужой дневник записать не даст RLS (политика «подопечный ведёт свой дневник»)
export async function addEntry(day: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  // день — как в адресе страницы, и такой день есть в календаре
  if (!isDay(day)) redirect("/nutrition");
  const page = `/nutrition?day=${day}`;
  // ошибку страница покажет под формой: её текст — в адресе
  const fail = (error: string) => `${page}&error=${encodeURIComponent(error)}`;

  const product = String(form.get("product") ?? "").trim();
  if (product === "" || product.length > 200) redirect(fail("Продукт — название, до 200 знаков"));
  // числа — как на этикетке, «52,5» с запятой тоже число
  const number = (name: string) => parseAmount(String(form.get(name) ?? ""));
  const grams = number("grams");
  if (grams === null || grams === 0) redirect(fail("Порция — граммы больше нуля, например 60"));
  const [kcal, protein, fat, carbs] = ["kcal", "protein", "fat", "carbs"].map(number);
  if (kcal === null || protein === null || fat === null || carbs === null) {
    redirect(fail("Значения с этикетки — числа на 100 г, например 352"));
  }
  // больше 900 ккал на 100 г не бывает: переспрашиваем, а не записываем
  const question = checkPer100(kcal);
  if (question) redirect(fail(question));

  // запись — в дневник вошедшего подопечного; у тренера строки в clients нет, и не запишется ничего
  const { rowCount } = await asUser(uid, (db) =>
    db.query(
      `insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs)
       select id, $2::date, $3, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric from clients where user_id = $1`,
      [uid, day, product, grams, kcal, protein, fat, carbs],
    ),
  );
  if (rowCount === 0) redirect(fail("Дневник питания ведёт подопечный"));
  // тот же день заново — с новой записью и без прежней ошибки в адресе
  redirect(page);
}
