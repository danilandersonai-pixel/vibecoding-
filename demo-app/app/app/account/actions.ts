"use server";

import { rm } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// «Удалить аккаунт» (docs/privacy.md): подопечный удаляет свой аккаунт — все свои строки и файлы фото.
// Строки удаляет функция базы delete_account() (0017_delete_account.sql): только вошедшего и по порядку. Файлы снимков — папка
// storage/photos/<номер подопечного> (lib/photos.ts); её удаляем в той же транзакции, до commit: не удалились файлы — строки
// вернутся, и удаление можно повторить. Потом выход — cookie сессии стирается — и главная
export async function deleteAccount() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, async (db) => {
    const { rows } = await db.query<{ client: string }>("select delete_account() as client");
    // номер подопечного — из базы, только цифры. turbopackIgnore: путь вычисляется, и next build иначе приложил бы
    // к серверной сборке весь проект — как у photoFile в lib/photos.ts
    await rm(join(/*turbopackIgnore: true*/ process.cwd(), "storage/photos", rows[0].client), { recursive: true, force: true });
  });
  // имя cookie — как в lib/session.ts
  (await cookies()).delete("session");
  redirect("/");
}
