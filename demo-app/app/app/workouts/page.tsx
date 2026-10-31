import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Мои тренировки" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS)
export default async function WorkoutsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const workouts = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; title: string; day: Date }>(
      `select w.id, w.title, w.day
         from workouts w join clients c on c.id = w.client_id
        where c.user_id = $1
        order by w.day`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Мои тренировки</h1>

      {workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={`/workouts/${workout.id}`} className="text-xl font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
