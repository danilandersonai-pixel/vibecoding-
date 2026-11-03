"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Одно касание: ещё один подход в тренировку workoutId с весом и повторами подхода setId — того, что на кнопке. Вес и повторы
// берём из базы, а не из формы: подставить в запрос свой вес нельзя; подход другой тренировки не повторится (workout_id = $1).
// Запрос идёт от имени вошедшего: в чужую тренировку не даст вписать RLS.
export async function repeatSet(workoutId: string, setId: string) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) =>
    db.query(
      `insert into sets (workout_id, weight, reps)
       select workout_id, weight, reps from sets where id = $2 and workout_id = $1`,
      [workoutId, setId],
    ),
  );
  redirect(`/workouts/${workoutId}`);
}
