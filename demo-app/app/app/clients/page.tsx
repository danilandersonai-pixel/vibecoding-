import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечные вошедшего тренера
export default async function ClientsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const clients = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
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
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
