import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { addMeasurement } from "./actions";

export const metadata: Metadata = { title: "Замеры" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// День «ГГГГ-ММ-ДД» по-русски: «16 октября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(`${day}T00:00`));
// Число по-русски, с запятой: 64,8
const num = (value: number) => value.toLocaleString("ru-RU");

// Замер: день и числа — вес, кг; талия и бёдра, см
type Measurement = { id: string; day: string; weight: number; waist: number; hips: number };
// Снимок прогресса: id и день; файл отдаёт /api/photos/<id>
type Photo = { id: string; day: string };

// Поля замера: имя в форме и подпись
const FIELDS: [name: string, label: string][] = [
  ["weight", "Вес, кг"],
  ["waist", "Талия, см"],
  ["hips", "Бёдра, см"],
];

// Замеры вошедшего подопечного по датам, форма нового замера и снимки прогресса. Дату вписывают в форме: от сегодняшнего дня
// страница не зависит. Замеры и снимки ведёт подопечный, тренер видит их на карточке подопечного. Чужие база не отдаст (RLS)
export default async function MeasurementsPage({ searchParams }: PageProps<"/measurements">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;

  const data = await asUser(uid, async (db) => {
    // замеры есть только у подопечного: вошедший — подопечный, если у него есть строка в clients
    const client = await db.query<{ id: string }>("select id from clients where user_id = $1", [uid]);
    if (client.rows.length === 0) return null;
    // значения из numeric — числами (float8)
    const measurements = await db.query<Measurement>(
      `select id, day::text as day, weight::float8 as weight, waist::float8 as waist, hips::float8 as hips
         from measurements
        where client_id = $1
        order by day`,
      [client.rows[0].id],
    );
    // снимки прогресса (0012_photos.sql): id и день — файл отдаёт маршрут /api/photos/<id>, проверив, кто вошёл
    const photos = await db.query<Photo>("select id, day::text as day from photos where client_id = $1 order by day", [
      client.rows[0].id,
    ]);
    return { measurements: measurements.rows, photos: photos.rows };
  });

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Замеры</h1>
        <p className="mt-6">Замеры ведёт подопечный. Его замеры по датам — на карточке подопечного.</p>
        <Link href="/clients" className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-white">
          К подопечным
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Замеры</h1>

      {data.measurements.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Замеров пока нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будут вес, талия и бёдра по датам: видно, как меняется тело, даже когда вес стоит.</p>
          <p className="mt-2">Запишите первый замер ниже: дату и три числа.</p>
        </section>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {data.measurements.map((m) => (
            <li key={m.id}>
              {dayOf(m.day)}: вес {num(m.weight)} кг, талия {num(m.waist)} см, бёдра {num(m.hips)} см
            </li>
          ))}
        </ul>
      )}

      <form action={addMeasurement} className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новый замер</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input id="day" name="day" type="date" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        {FIELDS.map(([name, label]) => (
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

      <h2 className="mt-8 text-xl font-semibold">Фото прогресса</h2>
      {data.photos.length === 0 ? (
        <p className="mt-2 text-zinc-500">Снимков пока нет: раз в месяц — снимок, и рядом с замерами видно, как меняется тело.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {data.photos.map((photo) => (
            <li key={photo.id}>
              <a href={`/api/photos/${photo.id}`} className="underline">
                Снимок {dayOf(photo.day)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
