import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { repeatSet, saveSet } from "./actions";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход», форма нового подхода и комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // упражнения по программе: копия строк шаблона в строках тренировки — «Присед — 3 × 10»
    const items = await db.query<{ id: string; exercise: string; sets: number; reps: number }>(
      "select id, exercise, sets, reps from workout_exercises where workout_id = $1 order by id",
      [id],
    );
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    // комментарии к тренировке: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment>(
      `select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where cm.workout_id = $1
        order by cm.id`,
      [id],
    );
    return found.rows.length > 0
      ? { title: found.rows[0].title, items: items.rows, sets: sets.rows, comments: comments.rows }
      : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);
  // одно касание: ещё раз прошлый подход этой тренировки — вес и повторы действие возьмёт из базы
  const last = workout.sets.at(-1);
  const repeat = repeatSet.bind(null, id);
  // комментарий — к этой тренировке, после отправки — снова эта страница
  const comment = addComment.bind(null, id, `/workouts/${id}`);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>
      {workout.items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 font-medium">
          {workout.items.map((item) => (
            <li key={item.id}>
              {item.exercise} — {item.sets} × {item.reps}
            </li>
          ))}
        </ul>
      )}

      {workout.sets.length === 0 ? (
        <p className="mt-6 text-zinc-500">Подходов пока нет</p>
      ) : (
        <SetList sets={workout.sets} className="mt-6 flex flex-col gap-1" />
      )}
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>
      {last && (
        <form action={repeat} className="mt-6">
          <button type="submit" className="w-full rounded bg-zinc-900 px-4 py-2 text-white">
            Повторить подход: {last.weight} кг × {last.reps}
          </button>
        </form>
      )}

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
        <div className="flex flex-col gap-1">
          <label htmlFor="note">Заметка</label>
          <input
            id="note"
            name="note"
            maxLength={200}
            placeholder="Необязательно, до 200 знаков"
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

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
