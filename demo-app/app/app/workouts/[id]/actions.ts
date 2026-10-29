"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { parseWeight } from "@/lib/weight";

// Подход в тренировку workoutId: вес и повторы из формы.
// Запрос идёт от имени вошедшего, и в чужую тренировку вписать не даст RLS (политика «подопечный добавляет подходы»).
export async function saveSet(workoutId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const page = `/workouts/${workoutId}`;
  // ошибку страница покажет под формой: её текст — в адресе
  const fail = (error: string) => `${page}?error=${encodeURIComponent(error)}`;

  // вес разбирает lib/weight.ts: число или текст ошибки
  const weight = parseWeight(String(form.get("weight") ?? ""));
  if (typeof weight === "string") redirect(fail(weight));
  const reps = Number(form.get("reps"));
  if (!Number.isInteger(reps) || reps <= 0) redirect(fail("Повторы — целое число больше нуля"));

  await asUser(uid, (db) =>
    db.query("insert into sets (workout_id, weight, reps) values ($1, $2, $3)", [workoutId, weight, reps]),
  );
  // та же страница заново — с новым подходом и без прежней ошибки в адресе
  redirect(page);
}
