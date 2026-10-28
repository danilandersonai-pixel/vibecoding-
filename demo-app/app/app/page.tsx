"use client";

import { useEffect, useState, type FormEvent } from "react";

type WorkoutSet = { weight: number; reps: number };

export default function Home() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [error, setError] = useState("");

  // при открытии страницы показываем уже сохранённые подходы
  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => setSets(data.sets));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, reps }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setError("");
    setSets([...sets, data.set]);
    setWeight("");
    setReps("");
  }

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Тренировка</h1>

      <form onSubmit={save} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input
            id="weight"
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input
            id="reps"
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 font-semibold">Сохранённые подходы</h2>
      {sets.length === 0 ? (
        <p className="mt-2 text-zinc-500">Подходов пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {sets.map((set, i) => (
            <li key={i}>
              {set.weight} кг × {set.reps}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
