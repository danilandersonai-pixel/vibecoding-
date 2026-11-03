import { expect, test, type Page } from "@playwright/test";

// Первый день в приложении: новый тренер без подопечных и новый подопечный без тренировок. Пустой экран — в три части:
// что здесь будет, что сделать и кнопка. Меню — по роли, в нём «Выйти».
// Наташа — тренер из supabase/tests/new-coach.sql, Вера — подопечная Марины по приглашению; пароль у обеих demo-password.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("новый тренер видит, с чего начать, и может выйти", async ({ page }) => {
  await login(page, "natasha@example.com", /\/clients$/);
  await expect(page.getByText("Подопечных пока нет")).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать приглашение" })).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Подопечные", "Программы", "Отчёт"]);
  await menu.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  // cookie входа стёрта: меню нет, а страница тренера снова ведёт на вход
  await expect(page.getByRole("navigation", { name: "Меню" })).toHaveCount(0);
  await page.goto("/clients");
  await expect(page).toHaveURL(/\/login$/);
});

test("новый подопечный знает, что тренировку назначит тренер", async ({ page }) => {
  await login(page, "vera@example.com", /\/workouts$/);
  await expect(page.getByText("Тренировок пока нет")).toBeVisible();
  await expect(page.getByText("Первую тренировку назначит тренер")).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание", "Замеры"]);
  await expect(menu.getByRole("button", { name: "Выйти" })).toBeVisible();
});
