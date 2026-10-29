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
