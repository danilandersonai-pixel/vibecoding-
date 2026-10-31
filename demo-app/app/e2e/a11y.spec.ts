import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Доступность: axe по правилам WCAG 2 уровней A и AA — на входе, у тренера и у подопечного, в светлой и тёмной схеме;
// и вход одной клавиатурой. Тренер — Марина, подопечная — Анна (supabase/seed.sql): на их страницах есть данные.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

// Нарушения на открытой странице: правило, сколько элементов его нарушают и что не так с первым из них — словами axe
async function violations(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return result.violations.map((rule) => `${rule.id}: ${rule.nodes.length} — ${rule.nodes[0].any[0]?.message ?? rule.help}`);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(colorScheme === "light" ? "светлая схема" : "тёмная схема", () => {
    test.use({ colorScheme });

    test("вход", async ({ page }) => {
      await page.goto("/login");
      expect(await violations(page)).toEqual([]);
    });

    test("тренер", async ({ page }) => {
      await login(page, "marina@example.com", /\/clients$/);
      expect(await violations(page)).toEqual([]);
    });

    test("подопечный", async ({ page }) => {
      await login(page, "anna@example.com", /\/workouts$/);
      expect(await violations(page)).toEqual([]);
    });
  });
}

test("вход одной клавиатурой: Почта → Пароль → Войти, Enter", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Почта")).toBeFocused();
  await page.keyboard.type("marina@example.com");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Пароль")).toBeFocused();
  await page.keyboard.type("demo-password");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Войти" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/clients$/, { timeout: 15_000 });
});
