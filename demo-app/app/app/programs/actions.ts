"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Программа назначается на 4 недели: тренировка раз в неделю
const WEEKS = 4;

// Ошибку страница покажет под формами: её текст — в адресе
const fail = (error: string) => `/programs?error=${encodeURIComponent(error)}`;

// Целое число больше нуля из поля формы, иначе null
function positive(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Тренер создаёт программу: название и строка шаблона — упражнение из библиотеки, подходы × повторы.
// Запрос идёт от имени тренера: программа записывается ему (coach_id = uid), в чужую программу строку не даст вставить RLS.
export async function createProgram(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const title = String(form.get("title") ?? "").trim();
  const exercise = String(form.get("exercise") ?? "").trim();
  const sets = positive(form.get("sets"));
  const reps = positive(form.get("reps"));
  if (title === "") redirect(fail("Нужно название программы"));
  if (sets === null || reps === null) redirect(fail("Подходы и повторы — целые числа больше нуля"));

  const created = await asUser(uid, async (db) => {
    const found = await db.query<{ id: string }>("select id from exercises where name = $1", [exercise]);
    if (found.rows.length === 0) return false;
    const program = await db.query<{ id: string }>(
      "insert into programs (coach_id, title) values ($1, $2) returning id",
      [uid, title],
    );
    await db.query("insert into program_items (program_id, exercise_id, sets, reps) values ($1, $2, $3, $4)", [
      program.rows[0].id,
      found.rows[0].id,
      sets,
      reps,
    ]);
    return true;
  });
  if (!created) redirect(fail("Такого упражнения нет в библиотеке"));
  redirect("/programs");
}

// Тренер назначает программу programId подопечному на 4 недели: тренировка раз в неделю с даты из формы, название — как у программы.
// В каждую тренировку — строки шаблона; упражнение, подходы и повторы база кладёт в них копией (0005_programs_copy.sql),
// поэтому правка и удаление шаблона назначенное не тронут. Подопечный — по имени среди подопечных тренера; чужого не отдаст RLS.
export async function assignProgram(programId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const name = String(form.get("client") ?? "").trim();
  const start = String(form.get("start") ?? "");
  // дата начала — ГГГГ-ММ-ДД из поля даты: даты тренировок идут от неё, а не от сегодняшнего дня
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) redirect(fail("Нужна дата начала"));

  const error = await asUser(uid, async (db) => {
    const clients = await db.query<{ id: string }>("select id from clients where coach_id = $1 and name = $2", [uid, name]);
    if (clients.rows.length === 0) return "Нет такого подопечного";
    if (clients.rows.length > 1) return "Подопечных с таким именем несколько";
    const program = await db.query<{ title: string }>("select title from programs where id = $1", [programId]);
    if (program.rows.length === 0) return "Программа не найдена";
    for (let week = 0; week < WEEKS; week++) {
      // день тренировки считает база: дата начала + 7 дней × неделя
      const workout = await db.query<{ id: string }>(
        "insert into workouts (client_id, title, day) values ($1, $2, $3::date + 7 * $4::int) returning id",
        [clients.rows[0].id, program.rows[0].title, start, week],
      );
      await db.query(
        "insert into workout_items (workout_id, program_item_id) select $1, id from program_items where program_id = $2 order by id",
        [workout.rows[0].id, programId],
      );
    }
    return null;
  });
  if (error) redirect(fail(error));
  // страница подтвердит назначение: «Назначено тренировок: 4»
  redirect(`/programs?assigned=${WEEKS}`);
}
