"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Комментарий к тренировке workoutId от имени вошедшего: подопечный пишет под тренировкой, тренер отвечает.
// page — страница, где написали: после отправки она сразу покажет новый комментарий.
// Возвращает текст ошибки — форма (components/Comments.tsx) покажет его под полем — или null, если комментарий записан
export async function addComment(workoutId: string, page: string, _state: string | null, form: FormData): Promise<string | null> {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  // пустой комментарий не сохраняем и говорим почему; длиннее 1000 знаков не примет и база
  const body = String(form.get("body") ?? "").trim();
  if (body === "") return "Комментарий пустой — напишите текст";
  if (body.length > 1000) return "Комментарий — не длиннее 1000 знаков";
  await asUser(uid, (db) =>
    db.query("insert into comments (workout_id, author_id, body) values ($1, $2, $3)", [workoutId, uid, body]),
  );
  revalidatePath(page);
  return null;
}
