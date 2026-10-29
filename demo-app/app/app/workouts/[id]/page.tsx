import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { saveSet } from "./actions";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: подходы, объём и форма нового подхода. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    return found.rows.length > 0 ? { title: found.rows[0].title, sets: sets.rows } : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>

      <ul className="mt-6 flex flex-col gap-1">
        {workout.sets.map((set) => (
          <li key={set.id}>
            {set.weight} кг × {set.reps}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>

      <form action={save} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input
            id="weight"
            name="weight"
            inputMode="decimal"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input
            id="reps"
            name="reps"
            inputMode="numeric"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
