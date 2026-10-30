import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { join } from "./actions";

export const metadata: Metadata = { title: "Приглашение" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Приглашение из базы: от какого тренера и действует ли ещё
type Invite = { coach: string; used: boolean; revoked: boolean; expired: boolean };

// Почему приглашение не действует — те же слова, что у accept_invite в базе; null — действует
function refusal(invite: Invite): string | null {
  if (invite.used) return "Приглашение уже использовано";
  if (invite.revoked) return "Приглашение отозвано";
  if (invite.expired) return "Срок приглашения истёк";
  return null;
}

// Приглашение по коду из адреса /join/<код>: тренер — из записи приглашения. Использованное, отозванное и просроченное — отказ
// без формы; срок сверяют часы базы, на странице дат нет. Человек по ссылке ещё не вошёл, поэтому приглашение читаем
// от владельца базы, как вход (app/api/login)
export default async function JoinPage({ params, searchParams }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const { error } = await searchParams;
  const { rows } = await pool.query<Invite>(
    `select p.name as coach, i.accepted_by is not null as used, i.revoked_at is not null as revoked, i.expires_at <= now() as expired
       from invites i join profiles p on p.id = i.coach_id
      where i.code = $1`,
    [code],
  );
  if (rows.length === 0) notFound();
  const refused = refusal(rows[0]);
  // поля приходят из формы, а код действие получает отсюда и проверяет заново в базе
  const register = join.bind(null, code);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Приглашение</h1>
      {refused ? (
        <>
          <p role="alert" className="mt-4 text-red-600">
            {refused}
          </p>
          <Link href="/login" className="mt-6 inline-block underline">
            Войти
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2">Тренер {rows[0].coach} приглашает вас в дневник тренировок. Ссылка одноразовая.</p>

          <form action={register} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="name">Имя</label>
              <input id="name" name="name" required autoComplete="name" className="rounded border border-zinc-300 px-3 py-2" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email">Почта</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </div>
            <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
              Присоединиться
            </button>
          </form>

          {typeof error === "string" && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
