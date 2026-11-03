// Сессия 25: исправления после беты (утро 22 ноября — неделя беты прошла; база — из миграций и seed, db: true). Шестая сессия
// недели 3, ролик дня 20. Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
// (как в s13, s19–s24).
// Человек раскладывает замечания беты по трём стопкам дня 8 — docs/beta-findings.md (текст авторский): «Портит данные» — у /join
// нет лимита попыток, а по ответу «почта уже зарегистрирована» видно чужую почту (аудит дня 12); «Мешает каждый день» — /clients/abc
// отвечает «Что-то пошло не так» вместо «не найдено» (журнал дня 19), пустой комментарий молча пропадает (замечание Тимура, s24);
// «Подождёт» — политика программ (0004) не проверяет роль тренера. База сбрасывается на старте каждой сессии, строк feedback и errors
// из s24 в ней нет — список держится на файле, а каждое замечание повторяют шаги этой сессии: первые четыре — красные прогоны
// регрессионных тестов, «Подождёт» — файл человека supabase/tests/as-client-program.sql (вставка программы от имени подопечной
// в транзакции с откатом — INSERT 0 1). Коммит «Замечания беты по стопкам».
// Подводный камень — «исправь всё»: в ветке fix/all на «Исправь все замечания из docs/beta-findings.md» агент одним ходом правит
// пять файлов, без тестов и без прогонов: /join (новый текст на занятую почту и счётчик), lib/rate-limit.ts (второй счётчик рядом
// с первым), карточку подопечного (isNaN), комментарий (throw — пустой комментарий теперь уронит страницу) и новую миграцию программ.
// Код ветки не проверяют и не запускают: git diff main fix/all --stat — пять файлов и ни одного в test/ или e2e/; ветка удаляется
// без слияния (git branch -D).
// Круг одного исправления, сверху вниз, три раза (Accept edits; правки — без вопроса, npx playwright test — с вопросом [y / n]):
// сквозной тест повторяет беду и падает на настоящем поведении → правка кода, тест после красного прогона не трогается → зелёный →
// один коммит: тест и код. Запускается только свой файл (npx playwright test e2e/<файл>); npm run dev поднимает и останавливает
// playwright.config.ts.
//   1. /join — e2e/join-limit.spec.ts: занятая почта и отказ приглашения (тренер отозвал приглашение, пока форму заполняли) — один
//      ответ; шестая попытка по одному коду — «Слишком много попыток». Ответ регистрации тест читает из адреса (?error=…): страница
//      отозванного приглашения своё «Приглашение отозвано» показывает и без формы, от почты оно не зависит. Приглашения тест создаёт
//      сам (pg, DATABASE_URL) и в конце удаляет: счётчик попыток — в памяти dev-сервера, у каждого прогона — свои коды, и тест
//      пойдёт и в общем прогоне s26. Красный: «Приглашение отозвано» ≠ «Эта почта уже зарегистрирована — войдите», шестая — снова
//      «Эта почта уже зарегистрирована — войдите». Правка — app/join/[code]/actions.ts: текст из Global Constraints «Проверьте почту
//      или войдите, если аккаунт уже есть», ограничитель входа lib/rate-limit.ts по ключу join:<код>; проверка формата почты
//      и пароля — своим текстом и попыткой не считается.
//   2. /clients/abc — e2e/not-found.spec.ts: красный — «Что-то пошло не так» вместо «Подопечный не найден», /workouts/abc — 500.
//      Правка — номер из адреса до 18 цифр, иначе notFound(): app/clients/[id]/page.tsx и app/workouts/[id]/page.tsx (id-workout).
//   3. Пустой комментарий — e2e/empty-comment.spec.ts: пробел в поле (required его пропускает) — под полем ошибка; красный — ошибки
//      нет (element(s) not found). Правка — действие app/workouts/[id]/comments.ts возвращает текст ошибки (cm-action), форма
//      components/Comments.tsx показывает его под полем (useActionState).
// git log --stat --oneline -3 — три коммита, в каждом тест и код.
// Сверх таблицы плана: programs-file и programs-check (человек повторяет замечание «Подождёт»), id-workout и cm-action (один шаг —
// один файл). В брифе all-comment правит app/workouts/[id]/actions.ts — такого файла с s23 нет (saveSet и repeatSet ушли в очередь),
// действие комментария живёт в app/workouts/[id]/comments.ts: его и правят all-comment и cm-action.
// Запись с середины цепочки: node scripts/record-session.mjs --from s25-beta-fixes (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: ask-all и круги — Accept edits.
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Замечания беты по стопкам — пишет человек, текст авторский
const FINDINGS = `# Замечания беты

Бета шла неделю, до 22 ноября. Здесь всё, что она нашла: замечание Тимура из «Сообщить о проблеме», строка журнала сбоев и две находки аудита дня 12, которые так и остались открытыми. Стопки — те же, что у отзывов Марины (\`docs/feedback.md\`). В каждом замечании — что делали, что ожидали и что вышло: по этим шагам его можно повторить.

## Портит данные

- **/join: попыткам нет счёта.** Делали: на странице приглашения шесть раз подряд отправили форму с уже зарегистрированной почтой. Ожидали: после пятой попытки — отказ. Вышло: шестая проходит, как и любая следующая, — подбирать почты по одной ссылке можно без конца (аудит дня 12).
- **/join: по ответу видно чужую почту.** Делали: ввели уже зарегистрированную почту, потом — свободную, когда приглашение тем временем отозвали. Ожидали: один и тот же ответ. Вышло: «Эта почта уже зарегистрирована — войдите» и «Приглашение отозвано» — по ответу понятно, есть ли такая почта в приложении (аудит дня 12).

## Мешает каждый день

- **/clients/abc: сбой вместо «не найдено».** Делали: открыли карточку подопечного с буквами вместо номера в адресе. Ожидали: «Подопечный не найден». Вышло: «Что-то пошло не так», в журнале сбоев — \`invalid input syntax for type bigint: "abc"\` (журнал дня 19).
- **Пустой комментарий молча пропадает.** Делали: нажали «Отправить» под тренировкой, в поле был один пробел. Ожидали: подсказку, что комментарий пустой. Вышло: страница обновилась, и всё: ни комментария, ни ошибки (замечание Тимура).

## Подождёт

- **Программу может создать подопечный.** Делали: от имени подопечной вставили программу — \`psql -f supabase/tests/as-client-program.sql\`. Ожидали: отказ, как у приглашений: их создаёт только тренер. Вышло: \`INSERT 0 1\` — политика программ (\`0004_programs.sql\`) сверяет хозяина, но не роль. Чужих данных это не трогает, а страницы программ в меню подопечного нет.
`

// Замечание «Подождёт» руками — пишет человек: вставка программы от имени подопечной, в конце откат
const CLIENT_PROGRAM_SQL = `-- Может ли подопечная создать программу: вставка от имени Анны (подопечная Марины, supabase/seed.sql), как её выполнил бы Supabase.
-- Политика «тренер ведёт свои программы» (0004_programs.sql) сверяет только хозяина (coach_id = auth.uid()), а роль — нет;
-- приглашения (0008_invites.sql) создаёт только тренер. Замечание беты «Подождёт» (docs/beta-findings.md). В конце rollback — ничего не меняется
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';
insert into programs (coach_id, title) values ('33333333-3333-3333-3333-333333333333', 'Программа подопечной') returning title;
rollback;
`

// --- Ветка fix/all: «исправь всё» одним ходом, без тестов (удаляется без слияния). Пишет агент; код правдоподобный и не проверенный ---

// Регистрация по приглашению после s24 — дословно
const JOIN_ACTION = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { startSession } from "@/lib/session";

// Ответ на занятую почту: та же почта другими буквами или повтор, который поймал unique в auth.users
const TAKEN = "Эта почта уже зарегистрирована — войдите";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Тренерское приглашение (0014_coach_invites.sql) делает нового пользователя тренером. Потом вход и первый экран по роли. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(code)}?error=\${encodeURIComponent(error)}\`);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) back(TAKEN);

  const db = await pool.connect();
  let uid: string;
  let role: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    // роль — из приглашения: обычное заводит подопечного, тренерское — тренера
    const accepted = await db.query<{ role: string }>("select accept_invite($1, $2, $3) as role", [code, uid, name]);
    role = accepted.rows[0].role;
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  // первый экран: тренеру — подопечные, подопечному — его тренировки
  redirect(role === "coach" ? "/clients" : "/workouts");
}

// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return TAKEN;
  if (code === "P0001" && message) return message;
  return null;
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`
// all-join: новый текст на занятую почту и счётчик попыток — отказ приглашения по-прежнему отвечает своими словами
const JOIN_ACTION_ALL = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { recordJoin, tooManyJoins } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

// Ответ на занятую почту — без «зарегистрирована»: по нему не узнать чужую почту
const TAKEN = "Проверьте почту или войдите, если аккаунт уже есть";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Тренерское приглашение (0014_coach_invites.sql) делает нового пользователя тренером. Потом вход и первый экран по роли. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(code)}?error=\${encodeURIComponent(error)}\`);
  // не больше 5 попыток за 15 минут по одному приглашению
  if (tooManyJoins(code)) back("Слишком много попыток");
  recordJoin(code);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) back(TAKEN);

  const db = await pool.connect();
  let uid: string;
  let role: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    // роль — из приглашения: обычное заводит подопечного, тренерское — тренера
    const accepted = await db.query<{ role: string }>("select accept_invite($1, $2, $3) as role", [code, uid, name]);
    role = accepted.rows[0].role;
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    const refused = refusal(err);
    if (refused) back(refused);
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  // первый экран: тренеру — подопечные, подопечному — его тренировки
  redirect(role === "coach" ? "/clients" : "/workouts");
}

// Понятная ошибка вместо 500: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refusal(err: unknown): string | null {
  const { code, message } = err as { code?: string; message?: string };
  if (code === "23505") return TAKEN;
  if (code === "P0001" && message) return message;
  return null;
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`

// all-rate: второй счётчик рядом с ограничителем входа
const RATE_LAST = `// Запомнить неудачный вход по этой почте.
export function recordFailure(email: string): void {
  recent(email).push(Date.now());
}
`
const RATE_JOINS = `// Запомнить неудачный вход по этой почте.
export function recordFailure(email: string): void {
  recent(email).push(Date.now());
}

// Регистрации по коду приглашения (/join): не больше 5 за 15 минут.
const joins = new Map<string, number[]>();

export function tooManyJoins(code: string): boolean {
  const now = Date.now();
  const times = (joins.get(code) ?? []).filter((at) => now - at < WINDOW_MS);
  joins.set(code, times);
  return times.length >= LIMIT;
}

export function recordJoin(code: string): void {
  joins.set(code, [...(joins.get(code) ?? []), Date.now()]);
}
`

// all-id: карточка подопечного — isNaN (номер «1.5» по-прежнему уйдёт в запрос к bigint)
const CLIENT_ID = `  const { id } = await params;
  const { week, error } = await searchParams;
`
const CLIENT_ID_ALL = `  const { id } = await params;
  if (isNaN(Number(id))) notFound();
  const { week, error } = await searchParams;
`

// all-comment: пустой комментарий — throw (страница сбоя вместо подсказки)
const COMMENT_EMPTY = `  if (body === "" || body.length > 1000) return;
`
const COMMENT_THROW = `  if (body === "") throw new Error("Комментарий пустой");
  if (body.length > 1000) return;
`

// all-programs: политика программ с проверкой роли — новая миграция в ветке
const PROGRAMS_SQL = `-- Программы создаёт только тренер: политика вставки проверяет роль, как у приглашений (0008_invites.sql)
drop policy "тренер ведёт свои программы" on programs;
create policy "тренер ведёт свои программы" on programs
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and auth.uid() in (select id from profiles where role = 'coach'));
`

// --- Круг 1: /join ---
const JOIN_E2E = `import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { pool } from "../lib/db";

// Регистрация по приглашению /join/<код> (docs/beta-findings.md, «Портит данные»): по ответу не узнать, есть ли чужая почта,
// и подбирать почты по одной ссылке без конца нельзя. Занятая почта и отказ приглашения — один ответ; шестая неудачная попытка
// за 15 минут по одному коду — «Слишком много попыток».
// Счётчик попыток живёт в памяти dev-сервера, поэтому каждый тест создаёт своё приглашение Марины (supabase/seed.sql) и в конце
// его удаляет: прошлые прогоны на тест не влияют. Занятая почта — Анны из seed.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/*.test.ts.
const MARINA = "11111111-1111-1111-1111-111111111111";
const TAKEN = "anna@example.com";
const SAME = "Проверьте почту или войдите, если аккаунт уже есть";
const TOO_MANY = "Слишком много попыток, подождите 15 минут";

const codes: string[] = [];

test.afterAll(async () => {
  await pool.query("delete from invites where code = any($1)", [codes]);
  await pool.end();
});

// Новое приглашение Марины, код ставит база
async function newInvite(): Promise<string> {
  const { rows } = await pool.query<{ code: string }>("insert into invites (coach_id) values ($1) returning code", [MARINA]);
  codes.push(rows[0].code);
  return rows[0].code;
}

// Открыть приглашение и заполнить форму
async function fill(page: Page, code: string, email: string) {
  await page.goto(\`/join/\${code}\`);
  await page.getByLabel("Имя").fill("Новичок");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
}

// Отправить форму. Ответ — текст, с которым регистрация вернула на страницу приглашения (?error=…)
async function send(page: Page): Promise<string | null> {
  await page.getByRole("button", { name: "Присоединиться" }).click();
  await expect(page).toHaveURL(/[?&]error=/);
  return new URL(page.url()).searchParams.get("error");
}

test("занятая почта и отказ приглашения — один ответ", async ({ page }) => {
  test.slow();
  const code = await newInvite();
  await fill(page, code, TAKEN);
  const taken = await send(page);
  // свободная почта, а приглашение тренер отозвал, пока форму заполняли
  await fill(page, code, \`free-\${randomUUID()}@example.com\`);
  await pool.query("update invites set revoked_at = now() where code = $1", [code]);
  const refused = await send(page);
  expect(refused).toBe(taken);
  expect(taken).toBe(SAME);
});

test("шестая попытка по одному приглашению — «Слишком много попыток»", async ({ page }) => {
  test.slow();
  const code = await newInvite();
  for (let attempt = 1; attempt <= 5; attempt++) {
    await fill(page, code, TAKEN);
    expect(await send(page), \`попытка \${attempt}\`).not.toBe(TOO_MANY);
  }
  await fill(page, code, TAKEN);
  expect(await send(page)).toBe(TOO_MANY);
});
`
const JOIN_ACTION_FIXED = `"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { checkName } from "@/lib/names";
import { recordFailure, tooManyAttempts } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

// Один ответ на занятую почту и на отказ приглашения: по ответу не узнать, есть ли такая почта в приложении
const SAME = "Проверьте почту или войдите, если аккаунт уже есть";
// Ответ после 5 неудачных попыток за 15 минут по одному коду приглашения — как у входа (app/api/login)
const TOO_MANY = "Слишком много попыток, подождите 15 минут";

// Регистрация по приглашению /join/<код>: новый пользователь в auth.users и профиль подопечного, затем база принимает приглашение
// (accept_invite, 0008_invites.sql): тренер — из записи приглашения, а не из адреса; использованное, отозванное и просроченное — отказ.
// Тренерское приглашение (0014_coach_invites.sql) делает нового пользователя тренером. Потом вход и первый экран по роли. Запросы — от владельца базы одной транзакцией, как вход (app/api/login): пользователям таблица auth.users закрыта,
// а отказ откатывает и нового пользователя.
// Неудачные попытки считает ограничитель входа (lib/rate-limit.ts) — по коду приглашения, а не по почте: почты при подборе
// каждый раз новые. Проверка формата почты и пароля отвечает своим текстом и попыткой не считается.
export async function join(code: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  // почта — без пробелов по краям, буквы как ввели: так её ищет вход (app/api/login)
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // ошибку страница покажет под формой
  const back = (error: string): never =>
    redirect(\`/join/\${encodeURIComponent(code)}?error=\${encodeURIComponent(error)}\`);
  const attempts = \`join:\${code}\`;
  if (tooManyAttempts(attempts)) back(TOO_MANY);
  const invalid = checkName(name) ?? checkAccount(email, password);
  if (invalid) back(invalid);
  // та же почта другими буквами — тоже занята: unique в auth.users различает заглавные и строчные
  const taken = await pool.query("select 1 from auth.users where lower(email) = lower($1)", [email]);
  if (taken.rows.length > 0) {
    recordFailure(attempts);
    back(SAME);
  }

  const db = await pool.connect();
  let uid: string;
  let role: string;
  try {
    await db.query("begin");
    // пароль в базе — только хешем: crypt() с солью bcrypt, как у пользователей seed.sql
    const user = await db.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf'))) returning id",
      [email, password],
    );
    uid = user.rows[0].id;
    await db.query("insert into profiles (id, role, name) values ($1, 'client', $2)", [uid, name]);
    // роль — из приглашения: обычное заводит подопечного, тренерское — тренера
    const accepted = await db.query<{ role: string }>("select accept_invite($1, $2, $3) as role", [code, uid, name]);
    role = accepted.rows[0].role;
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    if (refused(err)) {
      recordFailure(attempts);
      back(SAME);
    }
    throw err;
  } finally {
    db.release();
  }
  // вход — та же cookie сессии, что после /api/login
  await startSession(uid);
  // первый экран: тренеру — подопечные, подопечному — его тренировки
  redirect(role === "coach" ? "/clients" : "/workouts");
}

// Отказ, а не сбой: такая почта уже есть (unique в auth.users) или приглашение не принято (raise exception в accept_invite)
function refused(err: unknown): boolean {
  const { code } = err as { code?: string };
  return code === "23505" || code === "P0001";
}

// Почта и пароль из формы: null — годятся, иначе текст ошибки для страницы
function checkAccount(email: string, password: string): string | null {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Проверьте почту";
  if (password.length < 8) return "Пароль — не короче 8 знаков";
  return null;
}
`

// --- Круг 2: нечисловой номер ---
const NOT_FOUND_E2E = `import { expect, test, type Page } from "@playwright/test";

// Нечисловой номер в адресе — «не найдено», а не сбой (docs/beta-findings.md, «Мешает каждый день»; журнал сбоев дня 19):
// номер из адреса уходил в запрос к столбцу bigint, и /clients/abc отвечал «Что-то пошло не так».
// Марина и Анна — из supabase/seed.sql, пароль demo-password.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("нечисловой номер подопечного — «Подопечный не найден», 404", async ({ page }) => {
  await login(page, "marina@example.com", /\\/clients$/);
  const response = await page.goto("/clients/abc");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Подопечный не найден");
  expect(response?.status()).toBe(404);
});

test("нечисловой номер тренировки — 404, а не сбой", async ({ page }) => {
  await login(page, "anna@example.com", /\\/workouts$/);
  const response = await page.goto("/workouts/abc");
  expect(response?.status()).toBe(404);
});
`
const CLIENT_ID_FIXED = `  const { id } = await params;
  // номер подопечного — целое число (bigint в базе, до 18 цифр): буквы в адресе — «не найдено», а не сбой запроса
  if (!/^\\d{1,18}$/.test(id)) notFound();
  const { week, error } = await searchParams;
`
const WORKOUT_ID = `  const { id } = await params;
  const workout = await asUser(uid, async (db) => {
`
const WORKOUT_ID_FIXED = `  const { id } = await params;
  // номер тренировки — целое число (bigint в базе, до 18 цифр): буквы в адресе — «не найдено», а не сбой запроса
  if (!/^\\d{1,18}$/.test(id)) notFound();
  const workout = await asUser(uid, async (db) => {
`

// --- Круг 3: пустой комментарий ---
const EMPTY_COMMENT_E2E = `import { expect, test, type Page } from "@playwright/test";

// Пустой комментарий — понятная ошибка под полем, а не тишина (docs/beta-findings.md, «Мешает каждый день»; замечание Тимура):
// в поле один пробел, «Отправить» — страница обновлялась, и всё: ни комментария, ни ошибки. Поле с required пробел пропускает.
// Анна — из supabase/seed.sql, пароль demo-password; тренировка 3 «Грудь и плечи» — её. Пустой комментарий в базу не попадает.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("комментарий из одного пробела — ошибка под полем", async ({ page }) => {
  await login(page, "anna@example.com", /\\/workouts$/);
  await page.goto("/workouts/3");
  const form = page.locator("form").filter({ has: page.getByLabel("Комментарий") });
  await form.getByLabel("Комментарий").fill(" ");
  await form.getByRole("button", { name: "Отправить" }).click();
  await expect(form.getByRole("alert")).toHaveText("Комментарий пустой — напишите текст");
});
`
// Действие комментария и форма после s16 — дословно
const COMMENT_ACTION = `"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Комментарий к тренировке workoutId от имени вошедшего: подопечный пишет под тренировкой, тренер отвечает.
// page — страница, где написали: после отправки она сразу покажет новый комментарий.
export async function addComment(workoutId: string, page: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  // пустой комментарий не сохраняем; длиннее 1000 знаков не примет и база
  const body = String(form.get("body") ?? "").trim();
  if (body === "" || body.length > 1000) return;
  await asUser(uid, (db) =>
    db.query("insert into comments (workout_id, author_id, body) values ($1, $2, $3)", [workoutId, uid, body]),
  );
  revalidatePath(page);
}
`
const COMMENT_ACTION_FIXED = `"use server";

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
`
const COMMENTS = `// Комментарии к тренировке: «Анна: текст» по строке, под ними поле «Комментарий» и кнопка «Отправить».
// Один вывод для страницы тренировки у подопечного (app/workouts/[id]) и карточки подопечного у тренера (app/clients/[id]);
// отступы задаёт страница через className. Текст комментария React выводит как текст, а не как разметку.
export type WorkoutComment = { id: string; author: string; body: string };

type Props = {
  comments: WorkoutComment[];
  // действие формы: комментарий к этой тренировке от имени вошедшего (app/workouts/[id]/comments.ts)
  action: (form: FormData) => Promise<void>;
  className?: string;
};

export default function Comments({ comments, action, className }: Props) {
  return (
    <div className={className}>
      {comments.length === 0 ? (
        <p className="text-zinc-500">Комментариев пока нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {comments.map((comment) => (
            <li key={comment.id}>
              <span className="font-semibold">{comment.author}:</span> {comment.body}
            </li>
          ))}
        </ul>
      )}
      {/* подпись вокруг поля, а не htmlFor: на карточке тренера таких форм может быть несколько, и id не повторяются */}
      <form action={action} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Комментарий
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
        </button>
      </form>
    </div>
  );
}
`
const COMMENTS_FIXED = `"use client";

import { useActionState, useId } from "react";

// Комментарии к тренировке: «Анна: текст» по строке, под ними поле «Комментарий» и кнопка «Отправить».
// Один вывод для страницы тренировки у подопечного (app/workouts/[id]) и карточки подопечного у тренера (app/clients/[id]);
// отступы задаёт страница через className. Текст комментария React выводит как текст, а не как разметку.
// Ошибку отправки (пустой комментарий) возвращает действие, и форма показывает её под полем.
export type WorkoutComment = { id: string; author: string; body: string };

type Props = {
  comments: WorkoutComment[];
  // действие формы: комментарий к этой тренировке от имени вошедшего (app/workouts/[id]/comments.ts); вернёт текст ошибки или null
  action: (state: string | null, form: FormData) => Promise<string | null>;
  className?: string;
};

export default function Comments({ comments, action, className }: Props) {
  // ошибка последней отправки этой формы: у каждой тренировки на карточке тренера — своя
  const [error, send] = useActionState(action, null);
  const errorId = useId();
  return (
    <div className={className}>
      {comments.length === 0 ? (
        <p className="text-zinc-500">Комментариев пока нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {comments.map((comment) => (
            <li key={comment.id}>
              <span className="font-semibold">{comment.author}:</span> {comment.body}
            </li>
          ))}
        </ul>
      )}
      {/* подпись вокруг поля, а не htmlFor: на карточке тренера таких форм может быть несколько, и id не повторяются */}
      <form action={send} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Комментарий
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        {error && (
          <p id={errorId} role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
        </button>
      </form>
    </div>
  );
}
`

// Ответы агента — авторские, по выводу его шагов; что видно в строках Write / Edit / Run, ответ не повторяет
const ASK_ALL_REPLY =
  'Исправил все пять: на /join — новый ответ и лимит попыток, на карточке — «не найдено», пустой комментарий — ошибка, ' +
  'программы создаёт только тренер.'
const ASK_JOIN_FIX_REPLY =
  'Красный был на самой беде: на отказ приглашения ответ другой, шестая попытка проходит. Теперь один ответ и лимит ' +
  'через lib/rate-limit.ts по коду приглашения; тест не менял.'
const ASK_ID_FIX_REPLY =
  'Красный: вместо «не найдено» — «Что-то пошло не так» и 500. Теперь номер с буквами до базы не доходит — notFound(); ' +
  'тест не менял.'
const ASK_COMMENT_FIX_REPLY =
  'Красный: под полем ничего. Теперь действие возвращает текст ошибки, форма показывает его под полем; тест не менял.'

const E2E = (file) => `npx playwright test e2e/${file}`

export default {
  id: 's25-beta-fixes',
  from: 's24-beta',
  date: '2026-11-22T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // замечания беты по стопкам — пишет человек
    { id: 'findings-doc', write: 'docs/beta-findings.md', content: FINDINGS },
    // сверх таблицы плана — человек повторяет замечание «Подождёт»: его в этой сессии не исправляют
    { id: 'programs-file', write: 'supabase/tests/as-client-program.sql', content: CLIENT_PROGRAM_SQL },
    { id: 'programs-check', run: 'psql -f supabase/tests/as-client-program.sql' },
    { id: 'c-findings', commit: 'Замечания беты по стопкам' },
    // подводный камень: «исправь всё» в отдельной ветке
    { id: 'all-branch', run: 'git switch -c fix/all' },
    {
      // Accept edits: пять правок без вопроса, ни одной команды
      id: 'ask-all',
      agent: { prompt: 'Исправь все замечания из docs/beta-findings.md', reply: ASK_ALL_REPLY },
      steps: [
        { id: 'all-join', edit: 'app/join/[code]/actions.ts', find: JOIN_ACTION, replace: JOIN_ACTION_ALL },
        { id: 'all-rate', edit: 'lib/rate-limit.ts', find: RATE_LAST, replace: RATE_JOINS },
        { id: 'all-id', edit: 'app/clients/[id]/page.tsx', find: CLIENT_ID, replace: CLIENT_ID_ALL },
        { id: 'all-comment', edit: 'app/workouts/[id]/comments.ts', find: COMMENT_EMPTY, replace: COMMENT_THROW },
        { id: 'all-programs', write: 'supabase/migrations/0017_programs_coach.sql', content: PROGRAMS_SQL },
      ],
    },
    { id: 'c-all', commit: 'Все замечания беты' },
    // что задело «исправь всё»: пять файлов, и ни одного теста
    { id: 'all-stat', run: 'git diff main fix/all --stat' },
    { id: 'all-drop', run: 'git switch main && git branch -D fix/all' },
    {
      // круг 1, Accept edits: тест — без вопроса, npx playwright test — с вопросом [y / n]. Сначала тест, потом правка кода
      id: 'ask-join-fix',
      agent: {
        prompt:
          'Первое замечание: /join. Сначала тест, который повторяет беду: шесть попыток с занятой почтой. ' +
          'Потом правка, тест после этого не трогай',
        reply: ASK_JOIN_FIX_REPLY,
      },
      steps: [
        { id: 'jf-test', write: 'e2e/join-limit.spec.ts', content: JOIN_E2E },
        // красный: на отказ приглашения ответ другой, шестая попытка не отказ
        { id: 'jf-red', run: E2E('join-limit.spec.ts') },
        { id: 'jf-code', edit: 'app/join/[code]/actions.ts', find: JOIN_ACTION, replace: JOIN_ACTION_FIXED },
        { id: 'jf-green', run: E2E('join-limit.spec.ts') },
      ],
    },
    { id: 'c-join-fix', commit: '/join: один ответ и лимит попыток' },
    {
      // круг 2
      id: 'ask-id-fix',
      agent: { prompt: 'Второе: /clients/abc. Тест, правка, тест не трогать', reply: ASK_ID_FIX_REPLY },
      steps: [
        { id: 'id-test', write: 'e2e/not-found.spec.ts', content: NOT_FOUND_E2E },
        // красный: «Что-то пошло не так» вместо «Подопечный не найден», /workouts/abc — 500
        { id: 'id-red', run: E2E('not-found.spec.ts') },
        { id: 'id-code', edit: 'app/clients/[id]/page.tsx', find: CLIENT_ID, replace: CLIENT_ID_FIXED },
        // сверх таблицы плана: один шаг — один файл
        { id: 'id-workout', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_ID, replace: WORKOUT_ID_FIXED },
        { id: 'id-green', run: E2E('not-found.spec.ts') },
      ],
    },
    { id: 'c-id-fix', commit: 'Нечисловой номер — «не найдено»' },
    {
      // круг 3
      id: 'ask-comment-fix',
      agent: { prompt: 'Третье: пустой комментарий. Тест, правка, тест не трогать', reply: ASK_COMMENT_FIX_REPLY },
      steps: [
        { id: 'cm-test', write: 'e2e/empty-comment.spec.ts', content: EMPTY_COMMENT_E2E },
        // красный: под полем ничего
        { id: 'cm-red', run: E2E('empty-comment.spec.ts') },
        // сверх таблицы плана: один шаг — один файл
        { id: 'cm-action', edit: 'app/workouts/[id]/comments.ts', find: COMMENT_ACTION, replace: COMMENT_ACTION_FIXED },
        { id: 'cm-code', edit: 'components/Comments.tsx', find: COMMENTS, replace: COMMENTS_FIXED },
        { id: 'cm-green', run: E2E('empty-comment.spec.ts') },
      ],
    },
    { id: 'c-comment-fix', commit: 'Пустой комментарий — понятная ошибка' },
    // три исправления — три коммита, в каждом тест и код
    { id: 'fix-log', run: 'git log --stat --oneline -3' },
  ],
}
