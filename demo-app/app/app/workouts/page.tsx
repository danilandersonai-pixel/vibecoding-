import type { Metadata } from "next";
import { CLIENTS, CURRENT_CLIENT, volume, workoutsOf } from "@/lib/workouts";

export const metadata: Metadata = { title: "Мои тренировки" };

// «2026-10-19» показываем как «19.10.2026»
const formatDate = (date: string) => date.split("-").reverse().join(".");

export default function WorkoutsPage() {
  // Входа пока нет: «я» — константа CURRENT_CLIENT. Тренировок других подопечных здесь нет.
  const workouts = workoutsOf(CURRENT_CLIENT);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Мои тренировки</h1>
      <p className="mt-1 text-zinc-500">Подопечная: {CLIENTS[CURRENT_CLIENT]}</p>

      {workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-6">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <h2 className="text-xl font-semibold">{workout.name}</h2>
              <p className="text-sm text-zinc-500">{formatDate(workout.date)}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {workout.sets.map((set, i) => (
                  <li key={i}>
                    {set.weight} кг × {set.reps}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
