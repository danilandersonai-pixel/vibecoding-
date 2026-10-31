import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Мои тренировки" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS).
// Тренировок нет — пустой экран в три части: что здесь будет, что сделать и кнопка
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
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Тренировок пока нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будут тренировки от тренера: открываете тренировку и записываете вес и повторы.</p>
          <p className="mt-2">Первую тренировку назначит тренер: как только назначит, она появится здесь.</p>
          <Link href="/workouts" className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-white">
            Обновить
          </Link>
        </section>
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
