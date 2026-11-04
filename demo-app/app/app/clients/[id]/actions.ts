"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Тренер назначает тренировку подопечному clientId: название и день.
// Запрос идёт от имени тренера, и чужому подопечному назначить не даст RLS (политика «тренер добавляет тренировки»).
export async function assignWorkout(clientId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const title = String(form.get("title") ?? "").trim();
  const day = String(form.get("day") ?? "");
  // без названия или без даты (ГГГГ-ММ-ДД из поля даты) ничего не назначаем
  if (title === "" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  await asUser(uid, (db) =>
    db.query("insert into workouts (client_id, title, day) values ($1, $2, $3)", [clientId, title, day]),
  );
  // карточка подопечного покажет новую тренировку сразу после нажатия
  revalidatePath(`/clients/${clientId}`);
}

// Тренер ставит подопечному clientId цели на день из формы: ккал, белки, жиры и углеводы, г (docs/nutrition.md) — целые числа
// в границах 0010_nutrition.sql. Целей у подопечного одна строка: новые заменяют прежние. Цели чужому подопечному не даст поставить RLS
// (политика «тренер ведёт цели своих»)
export async function saveGoals(clientId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const page = `/clients/${clientId}`;
  // пустое поле — не число (Number("") дал бы 0)
  const goals = ["kcal", "protein", "fat", "carbs"].map((name) => {
    const text = String(form.get(name) ?? "").trim();
    return text === "" ? NaN : Number(text);
  });
  const [kcal, ...grams] = goals;
  // ошибку карточка покажет под формой целей: её текст — в адресе
  const fits = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  if (!fits(kcal, 1, 10000) || !grams.every((n) => fits(n, 0, 1000))) {
    redirect(`${page}?error=${encodeURIComponent("Цели — целые числа: ккал от 1 до 10 000, белки, жиры и углеводы от 0 до 1000 г")}`);
  }
  await asUser(uid, (db) =>
    db.query(
      `insert into nutrition_goals (client_id, kcal, protein, fat, carbs) values ($1, $2, $3, $4, $5)
       on conflict (client_id) do update
         set kcal = excluded.kcal, protein = excluded.protein, fat = excluded.fat, carbs = excluded.carbs`,
      [clientId, ...goals],
    ),
  );
  // карточка заново — с новыми целями и без прежней ошибки в адресе
  redirect(page);
}
