"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Замечание вошедшего — в таблицу feedback (0015_feedback.sql): страница, что делали, что ожидали и что вышло.
// Запрос — от имени вошедшего: автора ставит база (auth.uid()), записать замечание за другого не даст RLS.
// Прочитать замечания приложение не может: их читает владелец базы
export async function sendProblem(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const [page, did, expected, got] = ["page", "did", "expected", "got"].map((name) => String(form.get(name) ?? "").trim());
  // ошибку страница покажет под формой; страница, где была проблема, остаётся в адресе
  const back = (error: string): never =>
    redirect(`/problem?page=${encodeURIComponent(page)}&error=${encodeURIComponent(error)}`);
  if (!page || !did || !expected || !got) back("Заполните все четыре поля: страница, что делали, что ожидали и что вышло");
  if (page.length > 200 || [did, expected, got].some((text) => text.length > 2000)) {
    back("Страница — не длиннее 200 знаков, остальные поля — не длиннее 2000");
  }
  await asUser(uid, (db) =>
    db.query("insert into feedback (page, did, expected, got) values ($1, $2, $3, $4)", [page, did, expected, got]),
  );
  // та же страница — со словом «записано» и пустой формой
  redirect("/problem?sent=1");
}
