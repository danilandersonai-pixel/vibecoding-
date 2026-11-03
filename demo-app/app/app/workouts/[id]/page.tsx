import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetForm from "@/components/SetForm";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { repsText } from "@/lib/sets";
import { volume } from "@/lib/volume";
import { repeatSet } from "./actions";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход», форма нового подхода с очередью
// на отправку (components/SetForm.tsx) и комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
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
  // одно касание: ещё раз прошлый подход этой тренировки — тот, что на кнопке; вес и повторы действие возьмёт из базы
  const last = workout.sets.at(-1);
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
        <form action={repeatSet.bind(null, id, last.id)} className="mt-6">
          <button type="submit" className="w-full rounded bg-zinc-900 px-4 py-2 text-white">
            Повторить подход ({last.weight} кг, {repsText(last.reps)})
          </button>
        </form>
      )}

      {/* новый подход — сначала в очередь на телефоне, потом на сервер: без сети он не пропадёт */}
      <SetForm workoutId={id} />

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
