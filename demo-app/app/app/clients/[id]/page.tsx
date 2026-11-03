import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addComment } from "@/app/workouts/[id]/comments";
import Comments, { type WorkoutComment } from "@/components/Comments";
import ProgressChart from "@/components/ProgressChart";
import SetList from "@/components/SetList";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { dayTotal, shown, type FoodEntry } from "@/lib/nutrition";
import { progress } from "@/lib/progress";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { assignWorkout, saveGoals } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };
// Цели на день: ккал, белки, жиры и углеводы, г
type Goals = { kcal: number; protein: number; fat: number; carbs: number };
// День недели в сводке питания: ГГГГ-ММ-ДД и записи дневника за этот день (значения из json — числа)
type NutritionDay = { day: string; entries: FoodEntry[] };

// Неделя сводки — из адреса, ?week=ГГГГ-ММ-ДД, первый день недели: от сегодняшней даты сводка не зависит
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// День «ГГГГ-ММ-ДД» по-русски: «12 ноября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(`${day}T00:00`));

// Поля целей: имя в форме и подпись
const GOALS: [name: keyof Goals, label: string][] = [
  ["kcal", "Ккал"],
  ["protein", "Белки, г"],
  ["fat", "Жиры, г"],
  ["carbs", "Углеводы, г"],
];

// Карточка подопечного по id из адреса: имя; питание — цели на день и сводка недели из адреса; форма «Назначить»
// и тренировки с подходами, объёмом и комментариями
export default async function ClientPage({ params, searchParams }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { week } = await searchParams;
  const weekStart = typeof week === "string" && DAY.test(week) ? week : null;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    // тренировки с подходами одним запросом: left join берёт и тренировки без подходов, json_agg собирает подходы в массив
    const workouts = await db.query<Workout>(
      `select w.id, w.title, w.day, coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]') as sets
         from workouts w left join sets s on s.workout_id = w.id
        where w.client_id = $1
        group by w.id
        order by w.day`,
      [id],
    );
    // комментарии к тренировкам подопечного одним запросом: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment & { workout_id: string }>(
      `select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where w.client_id = $1
        order by cm.id`,
      [id],
    );
    // цели на день — одна строка на подопечного (0010_nutrition.sql)
    const goals = await db.query<Goals>("select kcal, protein, fat, carbs from nutrition_goals where client_id = $1", [id]);
    // неделя из адреса: семь дней от weekStart, у каждого — записи дневника. Дни считает база (дата + число дней)
    const days = weekStart
      ? await db.query<NutritionDay>(
          `select d.day::text as day,
                  coalesce(json_agg(json_build_object('grams', f.grams, 'kcal', f.kcal, 'protein', f.protein, 'fat', f.fat,
                                                      'carbs', f.carbs) order by f.id) filter (where f.id is not null), '[]') as entries
             from (select $2::date + n as day from generate_series(0, 6) as n) d
             left join food_entries f on f.client_id = $1 and f.day = d.day
            group by d.day
            order by d.day`,
          [id, weekStart],
        )
      : null;
    // без недели в адресе — недели, за которые есть записи: понедельник каждой (день минус номер дня недели и ещё 1)
    const weeks = await db.query<{ week: string }>(
      `select distinct (day - (extract(isodow from day)::int - 1))::text as week
         from food_entries where client_id = $1
        order by week desc`,
      [id],
    );
    return client.rows.length > 0
      ? {
          name: client.rows[0].name,
          workouts: workouts.rows,
          comments: comments.rows,
          goals: goals.rows[0],
          days: days?.rows,
          weeks: weeks.rows.map((row) => row.week),
        }
      : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);
  const setGoals = saveGoals.bind(null, id);
  const goals = card.goals;
  // комментарии одной тренировки
  const commentsOf = (workoutId: string) => card.comments.filter((comment) => comment.workout_id === workoutId);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Питание</h2>
        <p className="mt-2 text-zinc-500">
          {goals
            ? `Цель на день: ${goals.kcal} ккал, белки ${goals.protein} г, жиры ${goals.fat} г, углеводы ${goals.carbs} г`
            : "Целей на день пока нет"}
        </p>
        <form action={setGoals} className="mt-4 flex flex-col gap-4">
          {GOALS.map(([name, label]) => (
            <div key={name} className="flex flex-col gap-1">
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type="number"
                min={0}
                required
                defaultValue={goals?.[name]}
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </div>
          ))}
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
            Сохранить
          </button>
        </form>

        {card.days ? (
          <>
            <h3 className="mt-6 font-semibold">Неделя с {dayOf(card.days[0].day)}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {card.days.map(({ day, entries }) =>
                entries.length === 0 ? (
                  <li key={day} className="text-zinc-500">
                    {dayOf(day)}: нет записей
                  </li>
                ) : (
                  // итог дня — dayTotal, показывает shown: как на экране подопечного
                  <li key={day}>
                    {dayOf(day)}: {shown(dayTotal(entries), "ккал")}{goals && ` из ${goals.kcal}`}
                    <span className="block text-sm text-zinc-500">
                      белки {shown(dayTotal(entries, "protein"), "г")}{goals && ` из ${goals.protein}`}, жиры{" "}
                      {shown(dayTotal(entries, "fat"), "г")}{goals && ` из ${goals.fat}`}, углеводы{" "}
                      {shown(dayTotal(entries, "carbs"), "г")}{goals && ` из ${goals.carbs}`}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </>
        ) : card.weeks.length === 0 ? (
          <p className="mt-6 text-zinc-500">Записей в дневнике пока нет: подопечный ведёт его сам, в разделе «Питание».</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {card.weeks.map((start) => (
              <li key={start}>
                <Link href={`/clients/${id}?week=${start}`} className="underline">
                  Неделя с {dayOf(start)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={assign} className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая тренировка</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input
            id="day"
            name="day"
            type="date"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Назначить
        </button>
      </form>

      <h2 className="mt-8 text-xl font-semibold">Тренировки</h2>
      {card.workouts.length === 0 ? (
        <p className="mt-2 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={`/workouts/${workout.id}`} className="font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
              <SetList sets={workout.sets} className="mt-1 text-sm" />
              <p className="text-sm font-medium">Объём, кг: {volume(workout.sets)}</p>
              {/* под тренировкой, где подопечный написал, — его комментарии и ответ тренера; после отправки — снова эта карточка */}
              {commentsOf(workout.id).length > 0 && (
                <Comments
                  comments={commentsOf(workout.id)}
                  action={addComment.bind(null, workout.id, `/clients/${id}`)}
                  className="mt-2 text-sm"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ProgressChart data={progress(card.workouts)} />
    </main>
  );
}
