import { expect, test, type Page } from "@playwright/test";

// Подход в зале без интернета: Анна на тренировке «Ноги» (id 1 в supabase/seed.sql) записывает подход без сети — он ждёт
// на телефоне с пометкой «не отправлено»; сеть вернулась — подход уходит на сервер, и Марина видит его на карточке Анны.
// Сеть отключает Playwright (context.setOffline) — так тест проверяет телефон без связи.
// Свои подходы тест узнаёт по заметке (её видит тренер) и считает до и после, как e2e/quick-set.spec.ts: от того, сколько их
// уже в базе, он не зависит, а «Повторить подход» заметку не копирует.
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
  await anna.goto("/workouts/1");
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

test("ответ потерялся — один подход, одна строка", async ({ browser }) => {
  // холодный dev, как в первом тесте
  test.slow();
  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\/clients$/);
  await marina.goto("/clients/1");
  const seen = marina.getByText(LOST, { exact: true });
  const before = await seen.count();

  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\/workouts$/);
  await anna.goto("/workouts/1");
  // первый ответ теряется по дороге: запрос доходит до сервера (route.fetch), а телефон ответа не получает (route.abort)
  await anna.route(
    "**/api/workouts/1/sets",
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
