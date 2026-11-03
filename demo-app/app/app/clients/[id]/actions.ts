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

// Тренер ставит подопечному clientId цели на день из формы: ккал, белки, жиры и углеводы, г (docs/nutrition.md) — целые числа.
// Целей у подопечного одна строка: новые заменяют прежние. Цели чужому подопечному не даст поставить RLS
// (политика «тренер ведёт цели своих»)
export async function saveGoals(clientId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const goals = ["kcal", "protein", "fat", "carbs"].map((name) => Number(form.get(name)));
  // целые, не меньше нуля, ккал — больше нуля; иначе ничего не сохраняем (пустое поле Number превращает в 0)
  if (!goals.every((n) => Number.isInteger(n) && n >= 0) || goals[0] === 0) return;
  await asUser(uid, (db) =>
    db.query(
      `insert into nutrition_goals (client_id, kcal, protein, fat, carbs) values ($1, $2, $3, $4, $5)
       on conflict (client_id) do update
         set kcal = excluded.kcal, protein = excluded.protein, fat = excluded.fat, carbs = excluded.carbs`,
      [clientId, ...goals],
    ),
  );
  // карточка покажет новые цели сразу после нажатия
  revalidatePath(`/clients/${clientId}`);
}
