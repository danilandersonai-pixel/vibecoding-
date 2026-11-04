import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Грудь и плечи» (id 3 в supabase/seed.sql; «Ноги» считает e2e/quick-set.spec.ts)
// записывает подход без сети — он ждёт на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина
// видит его на карточке Анны. «Повторить подход» без сети — тоже в очередь.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после: от того, сколько их уже в базе, он не зависит.
// Подходы — 50 × 10, как у других сквозных тестов: у Марины в списке подопечных e2e/quick-set.spec.ts ждёт последний подход
// Анны «50 кг × 10», а тесты в общем прогоне идут параллельно.
const NOTE = "без связи";
const LOST = "ответ потерялся";

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  // холодный dev собирает страницу после входа дольше 5 с — ждём до 15 с
  await expect(page).toHaveURL(home, { timeout: 15_000 });
}

test("без сети подход ждёт с пометкой «не отправлено», сеть вернулась — уходит, тренер видит", async ({ browser }) => {
  // холодный dev собирает каждую страницу при первом заходе: тесту — втрое больше времени
  test.slow();
  // у Марины и Анны — свои браузеры, у каждой своя cookie входа; сеть пропадает только у Анны
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(NOTE, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.goto("/workouts/3");
  await anna.context().setOffline(true);
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByLabel("Заметка").fill(NOTE);
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  await expect(anna.getByText("50 кг, 10 повторов — не отправлено")).toBeVisible();

  await anna.context().setOffline(false);
  // «отправлено» — только после ответа сервера; первый запрос к маршруту холодный dev собирает несколько секунд
  await expect(anna.getByText("50 кг, 10 повторов — отправлено")).toBeVisible({ timeout: 15_000 });
  await marina.reload();
  await expect(seen).toHaveCount(before + 1);
});

test("без сети «Повторить подход» тоже ждёт в очереди", async ({ browser }) => {
  test.slow();
  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.goto("/workouts/3");
  const repeat = anna.getByRole("button", { name: "Повторить подход" });
  // на кнопке — прошлый подход, «Повторить подход (50 кг, 10 повторов)»; в очереди — он же
  const set = (await repeat.textContent())?.match(/\((.+)\)/)?.[1];
  await anna.context().setOffline(true);
  await repeat.click();
  await expect(anna.getByText(`${set} — не отправлено`)).toBeVisible();
  await anna.context().setOffline(false);
  await expect(anna.getByText(`${set} — отправлено`)).toBeVisible({ timeout: 15_000 });
});

test("ответ потерялся — один подход, одна строка", async ({ browser }) => {
  test.slow();
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(LOST, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.goto("/workouts/3");
  // первый ответ теряется по дороге: запрос доходит до сервера (route.fetch), а телефон ответа не получает (route.abort)
  await anna.route(
    "**/api/workouts/3/sets",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await anna.getByLabel("Вес, кг").fill("50");
  await anna.getByLabel("Повторы").fill("10");
  await anna.getByLabel("Заметка").fill(LOST);
  await anna.getByRole("button", { name: "Сохранить подход" }).click();
  // телефон не знает, что сервер подход принял, и через 3 с отправляет его снова
  await expect(anna.getByText("50 кг, 10 повторов — отправлено")).toBeVisible({ timeout: 15_000 });
  await marina.reload();
  expect((await seen.count()) - before, "строк подхода у тренера").toBe(1);
});
