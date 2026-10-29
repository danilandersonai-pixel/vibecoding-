import Link from "next/link";

export default function ClientNotFound() {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечный не найден</h1>
      <p className="mt-2 text-zinc-500">Его нет среди ваших подопечных.</p>
      <Link href="/clients" className="mt-6 inline-block underline">
        К списку подопечных
      </Link>
    </main>
  );
}
