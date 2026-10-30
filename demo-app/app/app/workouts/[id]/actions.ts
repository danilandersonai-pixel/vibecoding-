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

  // заметка необязательна: пустое поле — без заметки (null); длиннее 200 знаков не примет и база
  const note = String(form.get("note") ?? "").trim() || null;
  if (note && note.length > 200) redirect(fail("Заметка — не длиннее 200 знаков"));

  const setId = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4) returning id",
      [workoutId, weight, reps, note],
    );
    return rows[0].id;
  });
  // журнал сервера: только id подхода и время — без имени и заметки, это данные о здоровье
  console.log("Подход сохранён", { setId, time: new Date().toLocaleTimeString("ru-RU") });
  // та же страница заново — с новым подходом и без прежней ошибки в адресе
  redirect(page);
}

// Одно касание: ещё один подход в тренировку workoutId с весом и повторами её прошлого подхода. Прошлый подход берём из базы,
// а не из формы — подставить в запрос свой вес нельзя. Подходов нет — вставлять нечего (кнопки на странице тогда и нет).
// Запрос идёт от имени вошедшего: в чужую тренировку не даст вписать RLS.
export async function repeatSet(workoutId: string) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) =>
    db.query(
      `insert into sets (workout_id, weight, reps)
       select workout_id, weight, reps from sets where workout_id = $1 order by id desc limit 1`,
      [workoutId],
    ),
  );
  redirect(`/workouts/${workoutId}`);
}
