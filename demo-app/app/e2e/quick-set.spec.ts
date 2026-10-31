import { expect, test, type Page } from "@playwright/test";

// Подход в одно касание: Анна на тренировке «Ноги» (id 1 в supabase/seed.sql, там подходы 50 × 10) нажимает «Повторить подход» —
// подходов «50 кг × 10» становится на один больше; Марина в списке подопечных видит у Анны последний подход «50 кг × 10».
// Подходы тест считает до и после нажатия: от того, сколько их уже в базе, он не зависит.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(home);
}

test("Анна повторяет подход одним касанием, Марина видит его в списке подопечных", async ({ browser }) => {
  // у Анны и Марины — свои браузеры, у каждой своя cookie входа
  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.goto("/workouts/1");
  const sets = anna.getByText("50 кг × 10", { exact: true });
  const before = await sets.count();
  await anna.getByRole("button", { name: "Повторить подход" }).click();
  await expect(sets).toHaveCount(before + 1);

  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\/clients$/);
  await expect(marina.getByRole("link", { name: /^Анна/ })).toContainText("Последний подход: 50 кг × 10");
});
