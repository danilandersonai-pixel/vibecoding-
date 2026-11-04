"use client";

// Страница сбоя: на сервере или в браузере что-то сломалось. Человеку — понятные слова и что делать дальше, без текста ошибки
// и стектрейса. Сбои сервера записывает журнал (instrumentation.ts, таблица errors); ошибки в браузере он не видит —
// о них человек расскажет через «Сообщить о проблеме». Меню остаётся над страницей.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Что-то пошло не так</h1>
      <p className="mt-2 text-zinc-500">Это ошибка приложения, а не ваша.</p>
      <p className="mt-2">Попробуйте ещё раз. Если не выйдет — напишите, что делали, через «Сообщить о проблеме» в меню.</p>
      <button type="button" onClick={() => retry()} className="mt-6 rounded bg-zinc-900 px-4 py-2 text-white">
        Попробовать ещё раз
      </button>
    </main>
  );
}
