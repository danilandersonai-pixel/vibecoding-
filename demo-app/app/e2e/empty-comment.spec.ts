import { expect, test, type Page } from "@playwright/test";

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
  await login(page, "anna@example.com", /\/workouts$/);
  await page.goto("/workouts/3");
  const form = page.locator("form").filter({ has: page.getByLabel("Комментарий") });
  await form.getByLabel("Комментарий").fill(" ");
  await form.getByRole("button", { name: "Отправить" }).click();
  await expect(form.getByRole("alert")).toHaveText("Комментарий пустой — напишите текст");
});
