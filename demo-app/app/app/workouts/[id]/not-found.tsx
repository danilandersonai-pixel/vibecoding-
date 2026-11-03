// Тренировки нет или она не своя (чужую база не отдаст — RLS): страница так и говорит, а не отвечает сбоем. Меню — над страницей
export default function WorkoutNotFound() {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Тренировка не найдена</h1>
      <p className="mt-2 text-zinc-500">Такой тренировки нет среди ваших — разделы в меню выше.</p>
    </main>
  );
}
