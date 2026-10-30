import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assignProgram, createProgram } from "./actions";

export const metadata: Metadata = { title: "Программы" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Программа тренера со строками шаблона: упражнение из библиотеки, подходы × повторы; id строки из json_agg — число
type Program = { id: string; title: string; items: { id: number; exercise: string; sets: number; reps: number }[] };

// Программы вошедшего тренера, под каждой — назначение подопечному на 4 недели с даты; ниже — новая программа из библиотеки.
// Чужих программ и подопечных база не отдаст (RLS)
export default async function ProgramsPage({ searchParams }: PageProps<"/programs">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const data = await asUser(uid, async (db) => {
    // программы со строками одним запросом: json_agg собирает строки шаблона в массив, у программы без строк — []
    const programs = await db.query<Program>(
      `select p.id, p.title,
              coalesce(json_agg(json_build_object('id', pi.id, 'exercise', e.name, 'sets', pi.sets, 'reps', pi.reps) order by pi.id)
                filter (where pi.id is not null), '[]') as items
         from programs p
         left join program_items pi on pi.program_id = p.id
         left join exercises e on e.id = pi.exercise_id
        where p.coach_id = $1
        group by p.id
        order by p.id`,
      [uid],
    );
    // подсказки полей: упражнения библиотеки и подопечные тренера
    const exercises = await db.query<{ id: string; name: string }>("select id, name from exercises order by id");
    const clients = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    return { programs: programs.rows, exercises: exercises.rows, clients: clients.rows };
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Программы</h1>

      {data.programs.length === 0 ? (
        <p className="mt-6 text-zinc-500">Программ пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-6">
          {data.programs.map((program) => (
            <li key={program.id}>
              <h2 className="text-xl font-semibold">{program.title}</h2>
              <ul className="mt-1">
                {program.items.map((item) => (
                  <li key={item.id}>
                    {item.exercise} — {item.sets} × {item.reps}
                  </li>
                ))}
              </ul>
              {/* назначение: id программы действие получает отсюда, подопечного и дату — из формы */}
              <form action={assignProgram.bind(null, program.id)} className="mt-3 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`client-${program.id}`}>Подопечный</label>
                  <input
                    id={`client-${program.id}`}
                    name="client"
                    list="clients"
                    required
                    className="rounded border border-zinc-300 px-3 py-2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`start-${program.id}`}>С даты</label>
                  <input
                    id={`start-${program.id}`}
                    name="start"
                    type="date"
                    required
                    className="rounded border border-zinc-300 px-3 py-2"
                  />
                </div>
                <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
                  Назначить
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={createProgram} className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая программа</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input id="title" name="title" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="exercise">Упражнение</label>
          <input
            id="exercise"
            name="exercise"
            list="exercises"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sets">Подходы</label>
          <input id="sets" name="sets" inputMode="numeric" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input id="reps" name="reps" inputMode="numeric" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Создать
        </button>
      </form>

      {/* подсказки для полей «Упражнение» и «Подопечный» */}
      <datalist id="exercises">
        {data.exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.name} />
        ))}
      </datalist>
      <datalist id="clients">
        {data.clients.map((client) => (
          <option key={client.id} value={client.name} />
        ))}
      </datalist>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
