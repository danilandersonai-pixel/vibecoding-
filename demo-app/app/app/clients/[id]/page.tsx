import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addComment } from "@/app/workouts/[id]/comments";
import Comments, { type WorkoutComment } from "@/components/Comments";
import ProgressChart from "@/components/ProgressChart";
import SetList from "@/components/SetList";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { progress } from "@/lib/progress";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };

// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки с подходами, объёмом и комментариями
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    // тренировки с подходами одним запросом: left join берёт и тренировки без подходов, json_agg собирает подходы в массив
    const workouts = await db.query<Workout>(
      `select w.id, w.title, w.day, coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]') as sets
         from workouts w left join sets s on s.workout_id = w.id
        where w.client_id = $1
        group by w.id
        order by w.day`,
      [id],
    );
    // комментарии к тренировкам подопечного одним запросом: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment & { workout_id: string }>(
      `select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where w.client_id = $1
        order by cm.id`,
      [id],
    );
    return client.rows.length > 0
      ? { name: client.rows[0].name, workouts: workouts.rows, comments: comments.rows }
      : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);
  // комментарии одной тренировки
  const commentsOf = (workoutId: string) => card.comments.filter((comment) => comment.workout_id === workoutId);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <form action={assign} className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая тренировка</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input
            id="day"
            name="day"
            type="date"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Назначить
        </button>
      </form>

      <h2 className="mt-8 text-xl font-semibold">Тренировки</h2>
      {card.workouts.length === 0 ? (
        <p className="mt-2 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={`/workouts/${workout.id}`} className="font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
              <SetList sets={workout.sets} className="mt-1 text-sm" />
              <p className="text-sm font-medium">Объём, кг: {volume(workout.sets)}</p>
              {/* под тренировкой, где подопечный написал, — его комментарии и ответ тренера; после отправки — снова эта карточка */}
              {commentsOf(workout.id).length > 0 && (
                <Comments
                  comments={commentsOf(workout.id)}
                  action={addComment.bind(null, workout.id, `/clients/${id}`)}
                  className="mt-2 text-sm"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ProgressChart data={progress(card.workouts)} />
    </main>
  );
}
