import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };

// Подопечные вошедшего тренера, у каждого — дата последней тренировки
export default async function ClientsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const clients = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(
      `select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}`}
              className="block rounded border border-zinc-300 p-4 text-xl font-semibold"
            >
              {client.name}
              <span className="block text-sm font-normal text-zinc-500">
                {client.last ? `Последняя тренировка: ${formatDay(client.last)}` : "Тренировок пока нет"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
