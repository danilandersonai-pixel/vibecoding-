import { expect, test, type Page } from "@playwright/test";

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
  await login(page, "marina@example.com", /\/clients$/);
  const response = await page.goto("/clients/abc");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Подопечный не найден");
  expect(response?.status()).toBe(404);
});

test("нечисловой номер тренировки — 404, а не сбой", async ({ page }) => {
  await login(page, "anna@example.com", /\/workouts$/);
  const response = await page.goto("/workouts/abc");
  expect(response?.status()).toBe(404);
});
