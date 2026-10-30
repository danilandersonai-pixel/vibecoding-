import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { monthReport, type ReportWorkout } from "@/lib/report";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Отчёт" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Месяц отчёта — из адреса, ГГГГ-ММ: от сегодняшней даты отчёт не зависит
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// День «ГГГГ-ММ-ДД» по-русски: «19 октября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(`${day}T00:00`));

// Неделя по-русски: «19–25 октября», на стыке месяцев — «28 сентября — 4 октября»
function weekLabel(start: string, end: string): string {
  if (start.slice(0, 7) === end.slice(0, 7)) return `${Number(start.slice(8))}–${dayOf(end)}`;
  return `${dayOf(start)} — ${dayOf(end)}`;
}

// Отчёт тренера за месяц по неделям (docs/report.md): у каждого подопечного по неделе — тренировок, объём, средний объём и рекорды.
// Подопечных и тренировки база отдаёт от имени тренера: чужих не будет (RLS)
export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { month } = await searchParams;
  if (typeof month !== "string" || !MONTH.test(month)) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Отчёт</h1>
        <p className="mt-6 text-zinc-500">Месяц — в адресе: /report?month=2026-10</p>
      </main>
    );
  }
  const data = await asUser(uid, async (db) => {
    const clients = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    // тренировки подопечных с подходами одним запросом: день — строкой ГГГГ-ММ-ДД, вес из json — числом
    const workouts = await db.query<ReportWorkout & { client_id: string }>(
      `select w.client_id, w.title, w.day::text as day,
              coalesce(json_agg(json_build_object('weight', s.weight, 'reps', s.reps) order by s.id)
                filter (where s.id is not null), '[]') as sets
         from workouts w
         join clients c on c.id = w.client_id
         left join sets s on s.workout_id = w.id
        where c.coach_id = $1
        group by w.id
        order by w.day`,
      [uid],
    );
    return { clients: clients.rows, workouts: workouts.rows };
  });
  // «октябрь»: название месяца без числа
  const name = new Date(`${month}-01T00:00`).toLocaleDateString("ru-RU", { month: "long" });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">
        Отчёт за {name} {month.slice(0, 4)}
      </h1>

      {data.clients.length === 0 && <p className="mt-6 text-zinc-500">Подопечных пока нет</p>}
      {data.clients.map((client) => (
        <section key={client.id} className="mt-8">
          <h2 className="text-xl font-semibold">{client.name}</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {monthReport(
              month,
              data.workouts.filter((workout) => workout.client_id === client.id),
            ).map((week) => (
              <li key={week.start}>
                <h3 className="font-semibold">{weekLabel(week.start, week.end)}</h3>
                {week.workouts === 0 ? (
                  <p className="text-zinc-500">тренировок не было</p>
                ) : (
                  <>
                    <p>Тренировок: {week.workouts}</p>
                    <p>Объём: {week.volume} кг</p>
                    <p>Средний объём: {week.average} кг</p>
                  </>
                )}
                {week.records.size > 0 && (
                  <p className="text-sm text-zinc-500">
                    Рекорды: {[...week.records].map(([title, weight]) => `${title} — ${weight} кг`).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
