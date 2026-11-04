import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { dayLines, isDay, type FoodEntry } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";
import { addEntry } from "./actions";

export const metadata: Metadata = { title: "Питание" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// День «ГГГГ-ММ-ДД» по-русски: «12 ноября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(`${day}T00:00`));

// Запись дневника: продукт, граммы порции и значения с этикетки на 100 г
type Entry = FoodEntry & { id: string; product: string };
// Цели тренера на день: ккал, белки, жиры и углеводы, г
type Goals = { kcal: number; protein: number; fat: number; carbs: number };

// Поля значений с этикетки: имя в форме и подпись
const PER_100: [name: string, label: string][] = [
  ["kcal", "Ккал"],
  ["protein", "Белки, г"],
  ["fat", "Жиры, г"],
  ["carbs", "Углеводы, г"],
];

// Дневник питания вошедшего подопечного за день из адреса (docs/nutrition.md): что съедено, ккал каждой порции и итог; ниже — новая запись.
// Без дня в адресе — дни, за которые есть записи, и выбор дня; дня нет в календаре — страница так и говорит.
// Дневник ведёт подопечный: у тренера своего дневника нет. Чужой дневник база не отдаст (RLS)
export default async function NutritionPage({ searchParams }: PageProps<"/nutrition">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { day, error } = await searchParams;

  // дневник есть только у подопечного: вошедший — подопечный, если у него есть строка в clients
  const client = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string }>("select id from clients where user_id = $1", [uid]);
    return rows[0];
  });
  if (!client) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Питание</h1>
        <p className="mt-6">Дневник питания ведёт подопечный. Цели и сводка его дневника — на карточке подопечного.</p>
        <Link href="/clients" className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-white">
          К подопечным
        </Link>
      </main>
    );
  }

  if (typeof day !== "string" || !isDay(day)) {
    const days = await asUser(uid, async (db) => {
      const { rows } = await db.query<{ day: string }>(
        "select distinct day::text as day from food_entries where client_id = $1 order by day desc",
        [client.id],
      );
      return rows.map((row) => row.day);
    });
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Питание</h1>
        {typeof day === "string" && day !== "" && (
          <p role="alert" className="mt-6 text-red-600">
            Дня «{day}» в календаре нет — выберите день ниже.
          </p>
        )}
        {days.length === 0 ? (
          <section className="mt-6 rounded border border-zinc-300 p-4">
            <h2 className="text-xl font-semibold">Записей пока нет</h2>
            <p className="mt-2 text-zinc-500">Здесь будет дневник питания: что вы съели за день и сколько это ккал.</p>
            <p className="mt-2">Выберите день и запишите первый продукт: граммы порции и числа с этикетки.</p>
          </section>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {days.map((d) => (
              <li key={d}>
                <Link href={`/nutrition?day=${d}`} className="underline">
                  {dayOf(d)}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <form action="/nutrition" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="day">День</label>
            <input id="day" name="day" type="date" required className="rounded border border-zinc-300 px-3 py-2" />
          </div>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
            Открыть
          </button>
        </form>
      </main>
    );
  }

  const data = await asUser(uid, async (db) => {
    // записи подопечного за день; значения из numeric — числами (float8)
    const entries = await db.query<Entry>(
      `select id, product, grams::float8 as grams, kcal::float8 as kcal, protein::float8 as protein,
              fat::float8 as fat, carbs::float8 as carbs
         from food_entries
        where client_id = $1 and day = $2
        order by id`,
      [client.id, day],
    );
    const goals = await db.query<Goals>("select kcal, protein, fat, carbs from nutrition_goals where client_id = $1", [client.id]);
    return { entries: entries.rows, goals: goals.rows[0] };
  });
  // ккал строк и «Итого» для экрана — lib/nutrition.ts
  const lines = dayLines(data.entries);
  // день — в действии формы: запись попадёт в этот день
  const add = addEntry.bind(null, day);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Питание</h1>
      <p className="mt-2 text-xl">{dayOf(day)}</p>
      {data.goals ? (
        <p className="mt-2 text-zinc-500">
          Цель тренера на день: {data.goals.kcal} ккал, белки {data.goals.protein} г, жиры {data.goals.fat} г, углеводы{" "}
          {data.goals.carbs} г
        </p>
      ) : (
        <p className="mt-2 text-zinc-500">Цели на день поставит тренер</p>
      )}

      {data.entries.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Записей за день нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будет всё, что вы съели за день: ккал каждой порции и итог.</p>
          <p className="mt-2">Запишите продукт ниже: граммы порции и числа с этикетки на 100 г.</p>
        </section>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-2">
            {data.entries.map((entry, i) => (
              <li key={entry.id}>
                {entry.product}, {entry.grams.toLocaleString("ru-RU")} г — {lines.kcal[i]} ккал
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xl font-semibold">Итого: {lines.total} ккал</p>
        </>
      )}

      <form action={add} className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Записать продукт</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="product">Продукт</label>
          <input id="product" name="product" required maxLength={200} className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="grams">Порция, г</label>
          <input id="grams" name="grams" inputMode="decimal" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <p className="text-zinc-500">С этикетки, на 100 г:</p>
        {PER_100.map(([name, label]) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name}>{label}</label>
            <input id={name} name={name} inputMode="decimal" required className="rounded border border-zinc-300 px-3 py-2" />
          </div>
        ))}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Записать
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <Link href="/nutrition" className="mt-8 inline-block underline">
        Другие дни
      </Link>
    </main>
  );
}
