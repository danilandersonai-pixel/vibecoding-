import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { addClient } from "./actions";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };
// Последний подход подопечного, его тренировка и растёт ли вес; growing — null, если подход в тренировке один: сравнивать не с чем
type Latest = { id: string; workout: string; weight: number; reps: number; growing: boolean | null };
// Действующее приглашение тренера: не принято, не отозвано, срок не вышел
type Invite = { id: string; code: string };

// Тренер создаёт приглашение на себя: код и срок ставит база (0008_invites.sql), записать приглашение чужому не даст RLS
async function createInvite() {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("insert into invites (coach_id) values ($1)", [uid]));
  redirect("/clients");
}

// Тренер отзывает приглашение: по ссылке больше не зарегистрироваться. Чужое приглашение отозвать не даст RLS
async function revokeInvite(id: string) {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("update invites set revoked_at = now() where id = $1", [id]));
  redirect("/clients");
}

// Подопечные вошедшего тренера, у каждого — дата последней тренировки, последний подход и растёт ли вес; под списком форма нового подопечного и приглашения
export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const { clients, invites } = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const found = await db.query<Client>(
      `select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id`,
      [uid],
    );
    // действующие приглашения: срок сверяют часы базы, на странице дат нет
    const active = await db.query<Invite>(
      `select id, code from invites
        where coach_id = $1 and accepted_by is null and revoked_at is null and expires_at > now()
        order by id`,
      [uid],
    );
    // последний подход каждого — по порядку записи, с названием его тренировки. Вес растёт, если этот подход тяжелее прошлого
    // подхода той же тренировки или с тем же весом повторов больше; подход в тренировке один — сравнивать не с чем (null).
    // Только подопечные этого тренера — как в запросах выше; чужих база не отдаст и так (RLS)
    const latest = await db.query<Latest>(
      `with ranked as (
         select w.client_id, w.title, s.weight, s.reps,
                lag(s.weight) over by_workout as prev_weight, lag(s.reps) over by_workout as prev_reps,
                row_number() over (partition by w.client_id order by s.id desc) as n
           from sets s
           join workouts w on w.id = s.workout_id
           join clients c on c.id = w.client_id
          where c.coach_id = $1
         window by_workout as (partition by s.workout_id order by s.id)
       )
       select client_id as id, title as workout, weight::float8 as weight, reps,
              case when prev_weight is null then null
                   else weight > prev_weight or (weight = prev_weight and reps > prev_reps) end as growing
         from ranked
        where n = 1`,
      [uid],
    );
    const byClient = new Map(latest.rows.map((row) => [row.id, row]));
    return { clients: found.rows.map((client) => ({ ...client, latest: byClient.get(client.id) })), invites: active.rows };
  });
  // адрес сайта для ссылки — из запроса: localhost:3000 при разработке, свой домен на сервере
  const head = await headers();
  const origin = `${head.get("x-forwarded-proto") ?? "http"}://${head.get("host")}`;

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
              {client.latest && (
                <span className="block text-sm font-normal text-zinc-500">
                  Последний подход: {client.latest.weight} кг × {client.latest.reps}, {client.latest.workout}
                </span>
              )}
              {client.latest && client.latest.growing !== null && (
                <span className="block text-sm font-normal text-zinc-500">
                  {client.latest.growing ? "Вес растёт" : "Вес не растёт"}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <form action={addClient} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Добавить
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Приглашения</h2>
      <p className="mt-2 text-zinc-500">Ссылка действует 48 часов, по ней регистрируются один раз.</p>
      {invites.length === 0 ? (
        <p className="mt-2 text-zinc-500">Приглашений пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center gap-2">
              <span className="break-all font-mono text-sm">{`${origin}/join/${invite.code}`}</span>
              <form action={revokeInvite.bind(null, invite.id)}>
                <button type="submit" className="rounded border border-zinc-300 px-3 py-1 text-sm">
                  Отозвать
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={createInvite} className="mt-4">
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Создать приглашение
        </button>
      </form>
    </main>
  );
}
