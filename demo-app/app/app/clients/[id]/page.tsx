import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Карточка подопечного по id из адреса: имя и тренировки
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    const workouts = await db.query<{ id: string; title: string; date: string }>(
      "select id, title, to_char(day, 'DD.MM.YYYY') as date from workouts where client_id = $1 order by day",
      [id],
    );
    return client.rows.length > 0 ? { name: client.rows[0].name, workouts: workouts.rows } : null;
  });
  if (!card) notFound();

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>
      {card.workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <h2 className="text-xl font-semibold">{workout.title}</h2>
              <p className="text-sm text-zinc-500">{workout.date}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
