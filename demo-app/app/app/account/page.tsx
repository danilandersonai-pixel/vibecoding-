import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Аккаунт" };

// Страница читает cookie входа и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Аккаунт вошедшего. Подопечный удаляет его сам вместе со всеми данными (docs/privacy.md, «Как удалить аккаунт»);
// аккаунт тренера так не удалить — у него подопечные. Роль и имя — из своего профиля: чужие база не отдаст (RLS)
export default async function AccountPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const profile = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ name: string; role: string }>("select name, role from profiles where id = $1", [uid]);
    return rows[0];
  });
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Аккаунт</h1>
      <p className="mt-2 text-zinc-500">{profile.name}</p>
      {profile.role === "client" ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Удаление аккаунта</h2>
          <p className="mt-2">
            Удалится всё, что о вас хранится: тренировки и подходы, комментарии, питание, замеры и фото. Вернуть их будет нельзя.
          </p>
          <form action={deleteAccount} className="mt-4">
            <button type="submit" className="rounded bg-red-700 px-4 py-2 text-white">
              Удалить аккаунт
            </button>
          </form>
        </section>
      ) : (
        <p className="mt-6">Аккаунт тренера удаляем вручную: у тренера подопечные. Напишите нам через «Сообщить о проблеме» в меню.</p>
      )}
    </main>
  );
}
