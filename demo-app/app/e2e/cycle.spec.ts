import { expect, test, type Page } from "@playwright/test";

// Сценарии 1–2 из docs/spec.md целиком: Марина назначает тренировку Анне, Анна вписывает подход, Марина видит объём.
// Название каждый раз новое: тест не зависит от того, что уже есть в базе.
const title = `Сквозной тест ${Date.now()}`;

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(home);
}

test("Марина назначает тренировку, Анна вписывает подход, Марина видит объём", async ({ browser }) => {
  // у Марины и Анны — свои браузеры, у каждой своя cookie входа
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\/clients$/);
  await marina.getByRole("link", { name: "Анна" }).click();
  await marina.getByLabel("Название").fill(title);
  await marina.getByLabel("Дата", { exact: true }).fill("2026-11-09");
  await marina.getByRole("button", { name: "Назначить" }).click();
  await expect(marina.getByRole("link", { name: title })).toBeVisible();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.getByRole("link", { name: title }).click();
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  await expect(anna.getByText("50 кг × 10")).toBeVisible();

  await marina.getByRole("link", { name: title }).click();
  await expect(marina.getByText("Объём: 500 кг")).toBeVisible();
});
