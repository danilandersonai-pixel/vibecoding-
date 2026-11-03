"use client";

// Страница сбоя: на сервере или в браузере что-то сломалось. Человеку — понятные слова и что делать дальше, без текста ошибки
// и стектрейса: подробности сервер уже записал в журнал сбоев (instrumentation.ts, таблица errors). Меню остаётся над страницей.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Что-то пошло не так</h1>
      <p className="mt-2 text-zinc-500">Сбой записан, мы разберёмся.</p>
      <p className="mt-2">Попробуйте ещё раз. Если не выйдет — напишите, что делали, через «Сообщить о проблеме» в меню.</p>
      <button type="button" onClick={() => retry()} className="mt-6 rounded bg-zinc-900 px-4 py-2 text-white">
        Попробовать ещё раз
      </button>
    </main>
  );
}
