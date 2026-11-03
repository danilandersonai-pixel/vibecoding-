"use server";

import { rm } from "node:fs/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { photoDir } from "@/lib/photos";
import { currentUser } from "@/lib/session";

// Слово, которое человек вписывает, чтобы удалить аккаунт: одно нажатие по ошибке ничего не удалит
const CONFIRM = "удалить";

// «Удалить аккаунт» (docs/privacy.md): подопечный удаляет свой аккаунт — все свои строки и файлы фото.
// Сначала подтверждение: в поле формы вписано «удалить» — проверяет сервер, а не только браузер; иначе ошибка под формой
// и ничего не удаляется. Строки удаляет функция базы delete_account() (0017_delete_account.sql): только вошедшего и по порядку.
// Файлы снимков — папка storage/photos/<номер подопечного> (photoDir в lib/photos.ts); её удаляем в той же транзакции,
// до commit: не удалились файлы — строки вернутся, и удаление можно повторить. Потом выход — cookie сессии стирается — и главная
export async function deleteAccount(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== CONFIRM) {
    redirect(`/account?error=${encodeURIComponent(`Чтобы удалить аккаунт, впишите «${CONFIRM}»`)}`);
  }
  await asUser(uid, async (db) => {
    const { rows } = await db.query<{ client: string }>("select delete_account() as client");
    await rm(photoDir(rows[0].client), { recursive: true, force: true });
  });
  // имя cookie — как в lib/session.ts
  (await cookies()).delete("session");
  redirect("/");
}
