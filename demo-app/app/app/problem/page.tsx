import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { sendProblem } from "./actions";

export const metadata: Metadata = { title: "Сообщить о проблеме" };

// Страница читает cookie входа и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Три части замечания (docs/beta.md): имя в форме и подпись
const PARTS: [name: string, label: string][] = [
  ["did", "Что делали"],
  ["expected", "Что ожидали"],
  ["got", "Что вышло"],
];

// «Сообщить о проблеме»: замечание вошедшего — в одно место, таблицу feedback. Страницу, где он был, подставляет
// ссылка в меню (?page=/clients/1); её можно поправить. Замечание видит только владелец базы
export default async function ProblemPage({ searchParams }: PageProps<"/problem">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { page, sent, error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Сообщить о проблеме</h1>
      <p className="mt-2 text-zinc-500">Что делали, что ожидали и что вышло: по этим трём частям проблему можно повторить и исправить.</p>
      {typeof sent === "string" && (
        <p role="status" className="mt-4 font-medium">
          Спасибо, замечание записано.
        </p>
      )}

      <form action={sendProblem} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="page">Страница</label>
          <input
            id="page"
            name="page"
            required
            maxLength={200}
            defaultValue={typeof page === "string" ? page : ""}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        {PARTS.map(([name, label]) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name}>{label}</label>
            <textarea
              id={name}
              name={name}
              required
              maxLength={2000}
              rows={3}
              className="rounded border border-zinc-300 px-3 py-2"
            />
          </div>
        ))}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
