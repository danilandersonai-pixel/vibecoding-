import Link from "next/link";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки и дневник питания
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
  ],
};

// Меню вошедшего: разделы его роли и «Выйти». Кто не вошёл (вход, приглашение), меню не видит.
// Роль — из своего профиля: чужие профили база не отдаст (RLS)
export default async function Nav() {
  const uid = await currentUser();
  if (!uid) return null;
  const role = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ role: string }>("select role from profiles where id = $1", [uid]);
    return rows[0]?.role;
  });
  if (!role) return null;

  return (
    <nav aria-label="Меню" className="mx-auto flex w-full max-w-md flex-wrap items-center gap-4 px-8 pt-4">
      {LINKS[role]?.map(([href, label]) => (
        <Link key={href} href={href} className="underline">
          {label}
        </Link>
      ))}
      {/* выход — обычная форма: cookie стирает сервер (app/api/logout) */}
      <form action="/api/logout" method="post" className="ml-auto">
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1">
          Выйти
        </button>
      </form>
    </nav>
  );
}
