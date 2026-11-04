import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

// Регистрация по приглашению /join/<код> (docs/beta-findings.md, «Портит данные»): занятую почту не отличить от недействующего
// приглашения — ответ один, и подбирать почты по одной ссылке без конца нельзя: шестая попытка за 15 минут по одному коду —
// «Слишком много попыток», даже если запросы пришли разом.
// Счётчик попыток живёт в памяти dev-сервера, поэтому каждый тест создаёт своё приглашение Марины (supabase/seed.sql) и в конце
// его удаляет: прошлые прогоны на тест не влияют. Занятая почта — Анны из seed.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения. Подключение — своё, а не общий pool приложения
// из lib/db: его тест не закрывает.
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const MARINA = "11111111-1111-1111-1111-111111111111";
const TAKEN = "anna@example.com";
const SAME = "Проверьте почту или войдите, если аккаунт уже есть";
const TOO_MANY = "Слишком много попыток, подождите 15 минут";

const codes: string[] = [];

test.afterAll(async () => {
  await db.query("delete from invites where code = any($1)", [codes]);
  await db.end();
});

// Новое приглашение Марины, код ставит база
async function newInvite(): Promise<string> {
  const { rows } = await db.query<{ code: string }>("insert into invites (coach_id) values ($1) returning code", [MARINA]);
  codes.push(rows[0].code);
  return rows[0].code;
}

// Открыть приглашение и заполнить форму
async function fill(page: Page, code: string, email: string) {
  await page.goto(`/join/${code}`);
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
  await fill(page, code, `free-${randomUUID()}@example.com`);
  await db.query("update invites set revoked_at = now() where code = $1", [code]);
  const refused = await send(page);
  expect(refused).toBe(taken);
  expect(taken).toBe(SAME);
});

test("шестая попытка по одному приглашению — «Слишком много попыток»", async ({ page }) => {
  test.slow();
  const code = await newInvite();
  for (let attempt = 1; attempt <= 5; attempt++) {
    await fill(page, code, TAKEN);
    expect(await send(page), `попытка ${attempt}`).not.toBe(TOO_MANY);
  }
  await fill(page, code, TAKEN);
  expect(await send(page)).toBe(TOO_MANY);
});

test("шесть попыток разом — одна из них «Слишком много попыток»", async ({ context }) => {
  test.slow();
  const code = await newInvite();
  // шесть вкладок с заполненной формой, «Присоединиться» — во всех сразу
  const pages = await Promise.all(Array.from({ length: 6 }, () => context.newPage()));
  for (const page of pages) await fill(page, code, TAKEN);
  const answers = await Promise.all(pages.map(send));
  expect(answers.filter((answer) => answer === TOO_MANY).length).toBe(1);
});
