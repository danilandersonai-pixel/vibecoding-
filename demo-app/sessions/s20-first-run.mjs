// Сессия 20: первое знакомство и доступность (утро 11 ноября; база — из миграций и seed, db: true). Первая сессия недели 3, ролик дня 15.
// Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next (как в s13 и s19).
// Человек чинит нестабильность s18: e2e/quick-set.spec.ts ждёт вход явно — toHaveURL с пределом 15 с вместо 5 по умолчанию
// (холодный dev не успевал собрать страницу, README: запись --from s18-quick-set); коммит — до первого npm run dev.
// Первый экран нового подопечного: Марина создаёт приглашение, Вера регистрируется по ссылке со страницы (url: { from, match }, как в s17)
// и попадает на «Мои тренировки» — «Тренировок пока нет», и дальше ни слова. Новый тренер: регистрации тренера в приложении нет, поэтому
// человек пишет supabase/tests/new-coach.sql — Наташа в auth.users (пароль только хешем crypt() с bcrypt) и профиль coach, как seed.sql,
// и применяет его psql -f. У Наташи на /clients заголовок и сразу форма «Имя / Добавить», потом «Приглашений пока нет» — о пустом списке
// ни слова. Агент в Plan проходит путь новичка по четырём страницам: меню и выхода нет, «Программы» и «Отчёт» — только по адресу,
// пустые экраны без шага, «Добавить» по имени заводит подопечного без входа, /report без месяца — подсказка для разработчика.
// Исправление, сначала сквозной тест e2e/first-run.spec.ts — красный. Меню по роли components/Nav.tsx в app/layout.tsx — в Suspense:
// меню читает cookie входа, а с cacheComponents это можно только внутри Suspense. Выход — POST /api/logout. Пустые экраны — в три части:
// что здесь будет, что сделать и кнопка («Создать приглашение» у тренера). Форма по имени — «Добавить без входа» с подписью, что войти
// такой подопечный не сможет. /report без месяца — ссылки на месяцы, в которых есть тренировки (из базы, а не по сегодняшней дате).
// Сверх таблицы плана — правка входа first-login: после router.push вход вызывает router.refresh(). В черновом прогоне без неё меню
// после входа не появлялось: общий layout при переходе на клиенте не перерисовывается. Тот же тест — зелёный.
// Доступность: npm install -D @axe-core/playwright (решение автора), агент пишет e2e/a11y.spec.ts — axe с тегами wcag2a и wcag2aa
// на /login, у Марины на /clients и у Анны на /workouts (seed.sql: на их страницах есть данные) в colorScheme light и dark, и вход
// одной клавиатурой: Tab — «Почта» → «Пароль» → «Войти», Enter → /clients. Красный только в тёмной схеме: color-contrast — текст
// #71717b (zinc-500) на #0a0a0a, 4,1 при норме 4,5 : 1. Исправление — токен тёмной схемы в app/globals.css: --color-zinc-500: #a1a1aa.
// Сверх таблицы плана — перезапуск dev-сервера со сбросом кэша (contrast-restart; тот же запрос шлёт кнопка Restart Dev Server
// в Next.js DevTools). В черновом прогоне правка globals.css при запущенном npm run dev до страниц не дошла: загрузчик @tailwindcss/turbopack
// собирает CSS заново, только если у файла сменилось время изменения, а Turbopack сначала зовёт его со старым текстом файла — и страницы
// получают CSS на одну правку старше. Простой перезапуск берёт тот же испорченный кэш Turbopack, со сбросом кэша тот же тест зелёный.
// Сквозные тесты — только свои файлы (npx playwright test e2e/<файл>), по запущенному npm run dev (reuseExistingServer); общий прогон — в s26.
// Строки для кадра сессия создаёт сама: приглашение и Вера — браузером, Наташа — psql -f. Браузер один на сессию: вход меняет cookie.
// Запись с середины цепочки: node scripts/record-session.mjs --from s20-first-run (из course/). Id шагов постоянные: на них ссылаются уроки.
// Запрос ask-first — два хода агента (сверх таблицы плана — ask-first-go «Делай»): сначала тест и красный прогон, потом правки и зелёный.
// Одним ходом два прогона Playwright и восемь правок в окно агента (18 строк) не помещаются даже с ответом в одну строку.
// Режимы в ролике: ask-path — Plan; ask-first, ask-first-go, ask-a11y и ask-contrast — Accept edits (правки без вопроса, команды — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Ссылка-приглашение на странице подопечных: путь /join/ и код из 32 шестнадцатеричных знаков (s17)
const INVITE_LINK = /\/join\/[0-9a-f]{32}/

// Сквозной тест s18 ждал вход 5 с — предел expect по умолчанию; холодный dev не успевал. Правит человек, кавычки файла — двойные
const QUICK_WAIT = '  await expect(page).toHaveURL(home);\n'
const QUICK_WAIT_15 =
  '  // холодный dev собирает страницу после входа дольше 5 с (предел expect по умолчанию) — ждём до 15 с\n' +
  '  await expect(page).toHaveURL(home, { timeout: 15_000 });\n'

// Новый тренер — пишет человек, по образцу seed.sql: в auth.users только хеш пароля (crypt() с bcrypt), профиль тренера.
// Не демо-данные и не миграция: запускается вручную. id — по порядку после пятерых из seed.sql
const NEW_COACH = `-- Новый тренер без подопечных: Наташа. Регистрации тренера в приложении нет, поэтому заводим её, как тренеров в seed.sql:
-- пользователь в auth.users (пароль demo-password, в базе только его хеш bcrypt) и профиль тренера.
-- Это не демо-данные и не миграция: запускается вручную (psql -f), чтобы пройти первый день нового тренера.
insert into auth.users (id, email, encrypted_password) values
  ('66666666-6666-6666-6666-666666666666', 'natasha@example.com', crypt('demo-password', gen_salt('bf')));

insert into profiles (id, role, name) values
  ('66666666-6666-6666-6666-666666666666', 'coach', 'Наташа');
`

// Сквозной тест первого дня — пишет агент до кода: Наташа видит «Подопечных пока нет» и «Создать приглашение», Вера — что
// тренировку назначит тренер; в меню по роли есть «Выйти», и выход ведёт на /login. Вход ждёт до 15 с, как quick-set после e2e-wait
const FIRST_E2E = `import { expect, test, type Page } from "@playwright/test";

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
  await login(page, "natasha@example.com", /\\/clients$/);
  await expect(page.getByText("Подопечных пока нет")).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать приглашение" })).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Подопечные", "Программы", "Отчёт"]);
  await menu.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\\/login$/);
});

test("новый подопечный знает, что тренировку назначит тренер", async ({ page }) => {
  await login(page, "vera@example.com", /\\/workouts$/);
  await expect(page.getByText("Тренировок пока нет")).toBeVisible();
  await expect(page.getByText("Первую тренировку назначит тренер")).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Меню" });
  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки"]);
  await expect(menu.getByRole("button", { name: "Выйти" })).toBeVisible();
});
`

// Меню по роли — пишет агент: тренеру «Подопечные · Программы · Отчёт · Выйти», подопечному «Мои тренировки · Выйти»; кто не вошёл — без меню
const NAV = `import Link from "next/link";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [["/workouts", "Мои тренировки"]],
};

// Меню вошедшего: разделы его роли и «Выйти». Кто не вошёл (вход, приглашение), меню не видит.
// Роль — из своего профиля: чужие профили база не отдаст (RLS)
export default async function Nav() {
  const uid = await currentUser();
  if (!uid) return null;
  const role = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ role: string }>("select role from profiles where id = $1", [uid]);
    return rows[0]?.role;
  });
  if (!role) return null;

  return (
    <nav aria-label="Меню" className="mx-auto flex w-full max-w-md flex-wrap items-center gap-4 px-8 pt-4">
      {LINKS[role]?.map(([href, label]) => (
        <Link key={href} href={href} className="underline">
          {label}
        </Link>
      ))}
      {/* выход — обычная форма: cookie стирает сервер (app/api/logout) */}
      <form action="/api/logout" method="post" className="ml-auto">
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1">
          Выйти
        </button>
      </form>
    </nav>
  );
}
`

// Выход — пишет агент: обычная форма из меню шлёт POST, сервер стирает cookie сессии и уводит на /login (303 — уже GET)
const LOGOUT = `import { cookies } from "next/headers";

// POST /api/logout — выход: cookie сессии стирается (имя — как в lib/session.ts), и человек попадает на страницу входа.
// 303 — браузер откроет /login обычным GET, а не повторит POST
export async function POST() {
  (await cookies()).delete("session");
  return new Response(null, { status: 303, headers: { Location: "/login" } });
}
`

// Проверка доступности — пишет агент, код приложения не меняет: axe (wcag2a, wcag2aa) на трёх страницах в двух схемах и вход
// одной клавиатурой. Нарушение печатается словами axe — правило, сколько элементов и что не так с первым
const A11Y_E2E = `import AxeBuilder from "@axe-core/playwright";
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
  return result.violations.map((rule) => \`\${rule.id}: \${rule.nodes.length} — \${rule.nodes[0].any[0]?.message ?? rule.help}\`);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(colorScheme === "light" ? "светлая схема" : "тёмная схема", () => {
    test.use({ colorScheme });

    test("вход", async ({ page }) => {
      await page.goto("/login");
      expect(await violations(page)).toEqual([]);
    });

    test("тренер", async ({ page }) => {
      await login(page, "marina@example.com", /\\/clients$/);
      expect(await violations(page)).toEqual([]);
    });

    test("подопечный", async ({ page }) => {
      await login(page, "anna@example.com", /\\/workouts$/);
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
  await expect(page).toHaveURL(/\\/clients$/, { timeout: 15_000 });
});
`

// Страница подопечных после s18 — дословно, как в состоянии s19-reliability
const CLIENTS_PAGE = `import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { addClient } from "./actions";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };
// Последний подход подопечного, его тренировка и растёт ли вес; growing — null, если подход в тренировке один: сравнивать не с чем
type Latest = { id: string; workout: string; weight: number; reps: number; growing: boolean | null };
// Действующее приглашение тренера: не принято, не отозвано, срок не вышел
type Invite = { id: string; code: string };

// Тренер создаёт приглашение на себя: код и срок ставит база (0008_invites.sql), записать приглашение чужому не даст RLS
async function createInvite() {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("insert into invites (coach_id) values ($1)", [uid]));
  redirect("/clients");
}

// Тренер отзывает приглашение: по ссылке больше не зарегистрироваться. Чужое приглашение отозвать не даст RLS
async function revokeInvite(id: string) {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) => db.query("update invites set revoked_at = now() where id = $1", [id]));
  redirect("/clients");
}

// Подопечные вошедшего тренера, у каждого — дата последней тренировки, последний подход и растёт ли вес; под списком форма нового подопечного и приглашения
export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const { clients, invites } = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const found = await db.query<Client>(
      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id\`,
      [uid],
    );
    // действующие приглашения: срок сверяют часы базы, на странице дат нет
    const active = await db.query<Invite>(
      \`select id, code from invites
        where coach_id = $1 and accepted_by is null and revoked_at is null and expires_at > now()
        order by id\`,
      [uid],
    );
    // последний подход каждого — по порядку записи, с названием его тренировки. Вес растёт, если этот подход тяжелее прошлого
    // подхода той же тренировки или с тем же весом повторов больше; подход в тренировке один — сравнивать не с чем (null).
    // Только подопечные этого тренера — как в запросах выше; чужих база не отдаст и так (RLS)
    const latest = await db.query<Latest>(
      \`with ranked as (
         select w.client_id, w.title, s.weight, s.reps,
                lag(s.weight) over by_workout as prev_weight, lag(s.reps) over by_workout as prev_reps,
                row_number() over (partition by w.client_id order by s.id desc) as n
           from sets s
           join workouts w on w.id = s.workout_id
           join clients c on c.id = w.client_id
          where c.coach_id = $1
         window by_workout as (partition by s.workout_id order by s.id)
       )
       select client_id as id, title as workout, weight::float8 as weight, reps,
              case when prev_weight is null then null
                   else weight > prev_weight or (weight = prev_weight and reps > prev_reps) end as growing
         from ranked
        where n = 1\`,
      [uid],
    );
    const byClient = new Map(latest.rows.map((row) => [row.id, row]));
    return { clients: found.rows.map((client) => ({ ...client, latest: byClient.get(client.id) })), invites: active.rows };
  });
  // адрес сайта для ссылки — из запроса: localhost:3000 при разработке, свой домен на сервере
  const head = await headers();
  const origin = \`\${head.get("x-forwarded-proto") ?? "http"}://\${head.get("host")}\`;

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={\`/clients/\${client.id}\`}
              className="block rounded border border-zinc-300 p-4 text-xl font-semibold"
            >
              {client.name}
              <span className="block text-sm font-normal text-zinc-500">
                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
              </span>
              {client.latest && (
                <span className="block text-sm font-normal text-zinc-500">
                  Последний подход: {client.latest.weight} кг × {client.latest.reps}, {client.latest.workout}
                </span>
              )}
              {client.latest && client.latest.growing !== null && (
                <span className="block text-sm font-normal text-zinc-500">
                  {client.latest.growing ? "Вес растёт" : "Вес не растёт"}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <form action={addClient} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Добавить
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Приглашения</h2>
      <p className="mt-2 text-zinc-500">Ссылка действует 48 часов, по ней регистрируются один раз.</p>
      {invites.length === 0 ? (
        <p className="mt-2 text-zinc-500">Приглашений пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center gap-2">
              <span className="break-all font-mono text-sm">{\`\${origin}/join/\${invite.code}\`}</span>
              <form action={revokeInvite.bind(null, invite.id)}>
                <button type="submit" className="rounded border border-zinc-300 px-3 py-1 text-sm">
                  Отозвать
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={createInvite} className="mt-4">
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Создать приглашение
        </button>
      </form>
    </main>
  );
}
`

// «Мои тренировки» после s07 — дословно, как в состоянии s19-reliability
const WORKOUTS_PAGE = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Мои тренировки" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS)
export default async function WorkoutsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const workouts = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; title: string; day: Date }>(
      \`select w.id, w.title, w.day
         from workouts w join clients c on c.id = w.client_id
        where c.user_id = $1
        order by w.day\`,
      [uid],
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Мои тренировки</h1>

      {workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={\`/workouts/\${workout.id}\`} className="text-xl font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

// app/layout.tsx после s04 — дословно, как в состоянии s19-reliability
const LAYOUT = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Тренировка",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
`

// Отчёт тренера после s15 — дословно, как в состоянии s19-reliability
const REPORT_PAGE = `import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { monthReport, type ReportWorkout } from "@/lib/report";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Отчёт" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Месяц отчёта — из адреса, ГГГГ-ММ: от сегодняшней даты отчёт не зависит
const MONTH = /^\\d{4}-(0[1-9]|1[0-2])$/;

// День «ГГГГ-ММ-ДД» по-русски: «19 октября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(\`\${day}T00:00\`));

// Неделя по-русски: «19–25 октября», на стыке месяцев — «28 сентября — 4 октября»
function weekLabel(start: string, end: string): string {
  if (start.slice(0, 7) === end.slice(0, 7)) return \`\${Number(start.slice(8))}–\${dayOf(end)}\`;
  return \`\${dayOf(start)} — \${dayOf(end)}\`;
}

// Отчёт тренера за месяц по неделям (docs/report.md): у каждого подопечного по неделе — тренировок, объём, средний объём и рекорды.
// Подопечных и тренировки база отдаёт от имени тренера: чужих не будет (RLS)
export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { month } = await searchParams;
  if (typeof month !== "string" || !MONTH.test(month)) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Отчёт</h1>
        <p className="mt-6 text-zinc-500">Месяц — в адресе: /report?month=2026-10</p>
      </main>
    );
  }
  const data = await asUser(uid, async (db) => {
    const clients = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    // тренировки подопечных с подходами одним запросом: день — строкой ГГГГ-ММ-ДД, вес из json — числом
    const workouts = await db.query<ReportWorkout & { client_id: string }>(
      \`select w.client_id, w.title, w.day::text as day,
              coalesce(json_agg(json_build_object('weight', s.weight, 'reps', s.reps) order by s.id)
                filter (where s.id is not null), '[]') as sets
         from workouts w
         join clients c on c.id = w.client_id
         left join sets s on s.workout_id = w.id
        where c.coach_id = $1
        group by w.id
        order by w.day\`,
      [uid],
    );
    return { clients: clients.rows, workouts: workouts.rows };
  });
  // «октябрь»: название месяца без числа
  const name = new Date(\`\${month}-01T00:00\`).toLocaleDateString("ru-RU", { month: "long" });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">
        Отчёт за {name} {month.slice(0, 4)}
      </h1>

      {data.clients.length === 0 && <p className="mt-6 text-zinc-500">Подопечных пока нет</p>}
      {data.clients.map((client) => (
        <section key={client.id} className="mt-8">
          <h2 className="text-xl font-semibold">{client.name}</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {monthReport(
              month,
              data.workouts.filter((workout) => workout.client_id === client.id),
            ).map((week) => (
              <li key={week.start}>
                <h3 className="font-semibold">{weekLabel(week.start, week.end)}</h3>
                {week.workouts === 0 ? (
                  <p className="text-zinc-500">тренировок не было</p>
                ) : (
                  <>
                    <p>Тренировок: {week.workouts}</p>
                    <p>Объём: {week.volume} кг</p>
                    <p>Средний объём: {week.average} кг</p>
                  </>
                )}
                {week.records.size > 0 && (
                  <p className="text-sm text-zinc-500">
                    Рекорды на конец недели: {[...week.records].map(([title, weight]) => \`\${title} — \${weight} кг\`).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
`

// Куски страницы подопечных, которые правка переставляет: форма по имени, ошибка под ней и кнопка приглашения (как в s17)
const ADD_FORM = (label, margin) => `      <form action={addClient} className="${margin} flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          ${label}
        </button>
      </form>
`
const ERROR_ALERT = `      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
`
const CREATE_INVITE = `      <form action={createInvite} className="mt-4">
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Создать приглашение
        </button>
      </form>
`

// Пустой список у тренера — правка агента (first-clients): пустой экран в три части с кнопкой «Создать приглашение» над списком
// (список без подопечных пуст и в кадре не виден), вторая такая же кнопка под приглашениями — только когда подопечные есть;
// форма по имени — под приглашениями, «Добавить без входа» с подписью, что войти такой подопечный не сможет
const CLIENTS_FIRST = chain(CLIENTS_PAGE, [
  [
    '// Подопечные вошедшего тренера, у каждого — дата последней тренировки, последний подход и растёт ли вес; под списком форма нового подопечного и приглашения\n',
    '// Подопечные вошедшего тренера, у каждого — дата последней тренировки, последний подход и растёт ли вес; ниже приглашения\n' +
      '// и подопечный без входа. Подопечных нет — пустой экран в три части: что здесь будет, что сделать и кнопка\n',
  ],
  [
    `      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <ul className="mt-6 flex flex-col gap-3">
`,
    `      <h1 className="text-3xl font-semibold">Подопечные</h1>
      {clients.length === 0 && (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Подопечных пока нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будут ваши подопечные: последняя тренировка, последний подход и растёт ли вес.</p>
          <p className="mt-2">Создайте приглашение и отправьте ссылку подопечному: по ней он зарегистрируется и попадёт к вам.</p>
          <form action={createInvite} className="mt-4">
            <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
              Создать приглашение
            </button>
          </form>
        </section>
      )}
      <ul className="mt-6 flex flex-col gap-3">
`,
  ],
  [
    `      </ul>

${ADD_FORM('Добавить', 'mt-8')}
${ERROR_ALERT}
      <h2 className="mt-8 text-xl font-semibold">Приглашения</h2>
`,
    `      </ul>

      <h2 className="mt-8 text-xl font-semibold">Приглашения</h2>
`,
  ],
  [
    `${CREATE_INVITE}    </main>
`,
    `      {/* у пустого списка такая кнопка уже есть */}
      {clients.length > 0 && (
${indent(CREATE_INVITE)}      )}

      <h2 className="mt-8 text-xl font-semibold">Подопечный без входа</h2>
      <p className="mt-2 text-zinc-500">Войти в приложение такой подопечный не сможет, а значит, и записать подходы. Чтобы он вёл дневник сам, отправьте ему приглашение.</p>
${ADD_FORM('Добавить без входа', 'mt-4')}
${ERROR_ALERT}    </main>
`,
  ],
])

// Пустой список у подопечного — правка агента (first-workouts): что здесь будет, что тренировку назначит тренер, и «Обновить»
const WORKOUTS_FIRST = chain(WORKOUTS_PAGE, [
  [
    '// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS)\n',
    '// Тренировки вошедшего подопечного — те, что назначил тренер. Чужих база не отдаст (RLS).\n' +
      '// Тренировок нет — пустой экран в три части: что здесь будет, что сделать и кнопка\n',
  ],
  [
    `      {workouts.length === 0 ? (
        <p className="mt-6 text-zinc-500">Тренировок пока нет</p>
      ) : (
`,
    `      {workouts.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Тренировок пока нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будут тренировки от тренера: открываете тренировку и записываете вес и повторы.</p>
          <p className="mt-2">Первую тренировку назначит тренер: как только назначит, она появится здесь.</p>
          <Link href="/workouts" className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-white">
            Обновить
          </Link>
        </section>
      ) : (
`,
  ],
])

// Меню над каждой страницей — правка агента (first-layout): в Suspense, потому что меню читает cookie входа
const LAYOUT_NAV = chain(LAYOUT, [
  [
    'import type { Metadata } from "next";\nimport "./globals.css";\n',
    'import type { Metadata } from "next";\nimport { Suspense } from "react";\nimport Nav from "@/components/Nav";\nimport "./globals.css";\n',
  ],
  [
    'export default function RootLayout({ children }: LayoutProps<"/">) {\n',
    '// Меню — над каждой страницей. Оно читает cookie входа, поэтому стоит в Suspense: страница не ждёт меню\n' +
      'export default function RootLayout({ children }: LayoutProps<"/">) {\n',
  ],
  [
    '      <body className="min-h-full flex flex-col">{children}</body>\n',
    '      <body className="min-h-full flex flex-col">\n        <Suspense>\n          <Nav />\n        </Suspense>\n        {children}\n      </body>\n',
  ],
])

// После входа — правка агента (first-login, сверх таблицы плана): меню в общем layout перечитывает cookie только с сервера
const LOGIN_PUSH = `    // тренер — к своим подопечным, подопечный — к своим тренировкам
    router.push(data.role === "coach" ? "/clients" : "/workouts");
`
const LOGIN_REFRESH = `${LOGIN_PUSH}    // cookie входа новая: меню в общем layout (components/Nav.tsx) перечитает её только с сервера
    router.refresh();
`

// Отчёт без месяца — правка агента (first-report): вместо подсказки для разработчика — месяцы с тренировками из базы
// (без настоящих часов), тренировок нет — пустой экран в три части. Название месяца — одна функция для ссылок и заголовка
const REPORT_FIRST = chain(REPORT_PAGE, [
  ['import type { Metadata } from "next";\nimport { redirect } from "next/navigation";\n', 'import type { Metadata } from "next";\nimport Link from "next/link";\nimport { redirect } from "next/navigation";\n'],
  [
    '// День «ГГГГ-ММ-ДД» по-русски',
    `// Месяц «ГГГГ-ММ» по-русски, без числа: «октябрь»
const monthName = (month: string) => new Date(\`\${month}-01T00:00\`).toLocaleDateString("ru-RU", { month: "long" });

// День «ГГГГ-ММ-ДД» по-русски`,
  ],
  [
    '// Подопечных и тренировки база отдаёт от имени тренера: чужих не будет (RLS)\n',
    '// Без месяца в адресе — месяцы, в которых у подопечных есть тренировки (из базы, а не по сегодняшней дате); тренировок нет —\n' +
      '// пустой экран в три части. Подопечных и тренировки база отдаёт от имени тренера: чужих не будет (RLS)\n',
  ],
  [
    `  if (typeof month !== "string" || !MONTH.test(month)) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Отчёт</h1>
        <p className="mt-6 text-zinc-500">Месяц — в адресе: /report?month=2026-10</p>
      </main>
    );
  }
`,
    `  if (typeof month !== "string" || !MONTH.test(month)) {
    const months = await asUser(uid, async (db) => {
      const { rows } = await db.query<{ month: string }>(
        \`select distinct to_char(w.day, 'YYYY-MM') as month
           from workouts w join clients c on c.id = w.client_id
          where c.coach_id = $1
          order by month desc\`,
        [uid],
      );
      return rows.map((row) => row.month);
    });
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Отчёт</h1>
        {months.length === 0 ? (
          <section className="mt-6 rounded border border-zinc-300 p-4">
            <h2 className="text-xl font-semibold">Отчёта пока нет</h2>
            <p className="mt-2 text-zinc-500">Здесь будет отчёт за месяц по неделям: тренировки, объём и рекорды каждого подопечного.</p>
            <p className="mt-2">Отчёт соберётся из тренировок: назначьте первую на карточке подопечного.</p>
            <Link href="/clients" className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-white">
              К подопечным
            </Link>
          </section>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {months.map((m) => (
              <li key={m}>
                <Link href={\`/report?month=\${m}\`} className="underline">
                  Отчёт за {monthName(m)} {m.slice(0, 4)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }
`,
  ],
  [
    `  // «октябрь»: название месяца без числа
  const name = new Date(\`\${month}-01T00:00\`).toLocaleDateString("ru-RU", { month: "long" });

`,
    '',
  ],
  ['        Отчёт за {name} {month.slice(0, 4)}\n', '        Отчёт за {monthName(month)} {month.slice(0, 4)}\n'],
])

// Тёмная схема в app/globals.css после s12 — дословно. Правка агента (contrast-css): токен второстепенного текста светлее
const CSS_DARK = `@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
`
const CSS_DARK_CONTRAST = `@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    /* второстепенный текст (zinc-500, docs/design.md): на тёмном фоне #71717b даёт 4,1 : 1, а тексту нужно 4,5 : 1 (WCAG AA).
       В тёмной схеме токен светлее — #a1a1aa, 7,7 : 1; в светлой остаётся прежним (4,8 : 1 на белом) */
    --color-zinc-500: #a1a1aa;
  }
}
`

// Перезапуск dev-сервера со сбросом кэша Turbopack — тот же запрос шлёт кнопка Restart Dev Server в Next.js DevTools.
// Сервер поднимается заново на том же порту за секунду-две; sleep — чтобы Playwright не начал раньше и не запустил второй npm run dev
const RESTART = "curl -sX POST 'localhost:3000/__nextjs_restart_dev?invalidateFileSystemCache=1' && sleep 5"

// Отступ на 2 пробела: кнопка приглашения под условием
function indent(text) {
  return text.replace(/^(?=.)/gm, '  ')
}

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s20-first-run: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

// Несколько замен подряд, каждая — ровно одного вхождения
function chain(text, pairs) {
  return pairs.reduce((acc, [find, replace]) => replaceOnce(acc, find, replace), text)
}

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })

// Ответы агента — авторские, по прочитанному и по выводу его шагов
const ASK_PATH_REPLY =
  'Новый тренер на /clients видит заголовок и сразу форму «Имя / Добавить»: о пустом списке ни слова, а эта форма заводит ' +
  'подопечного без почты и пароля — без входа. Новый подопечный видит «Тренировок пока нет» — и не знает, что дальше. ' +
  'Меню и выхода нет: в layout только страница, «Программы» и «Отчёт» открываются лишь по адресу, а /report без месяца ' +
  'показывает подсказку для разработчика.'
const ASK_FIRST_REPLY =
  'Тест красный, как и должен: у Наташи нет «Подопечных пока нет», у Веры — ни слова о том, что тренировку назначит тренер. ' +
  'Дальше — меню по роли с «Выйти» в layout, пустые экраны в три части и отчёт по месяцам. Делать?'
const ASK_FIRST_GO_REPLY =
  'Меню по роли с «Выйти» (POST /api/logout), вход обновляет страницу — меню видно сразу. Пустые экраны в три части, ' +
  '«Добавить без входа» с подписью, отчёт без месяца — по месяцам с тренировками.'
const ASK_A11Y_REPLY =
  'Нарушено одно правило — color-contrast, и только в тёмной схеме: у тренера 10 элементов, у подопечного 3 — текст #71717b ' +
  'на фоне #0a0a0a, 4,1 при норме 4,5 : 1. Вход, светлая схема и вход одной клавиатурой — без замечаний.'
const ASK_CONTRAST_REPLY =
  'Второстепенный текст (zinc-500) в тёмной схеме — #a1a1aa: 7,7 : 1 вместо 4,1. Запущенный dev отдаёт правку globals.css ' +
  'с опозданием, поэтому перед проверкой перезапустил его со сбросом кэша. axe чист в обеих схемах.'

const joinAs = (name, email) => ({ Имя: name, Почта: email, Пароль: 'demo-password' })

export default {
  id: 's20-first-run',
  from: 's19-reliability',
  date: '2026-11-11T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // нестабильность s18: вход ждали 5 с, холодный dev не успевал — правит человек
    { id: 'e2e-wait', edit: 'e2e/quick-set.spec.ts', find: QUICK_WAIT, replace: QUICK_WAIT_15 },
    { id: 'c-e2e-wait', commit: 'Сквозной тест ждёт вход' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: login('marina@example.com') },
    { id: 'invite-vera', browser: { url: '/clients', click: 'Создать приглашение' } },
    // код случайный: ссылку берём со страницы invite-vera. Вера — на «Мои тренировки», и дальше ни слова
    { id: 'vera-join', browser: { url: { from: 'invite-vera', match: INVITE_LINK }, fill: joinAs('Вера', 'vera@example.com'), click: 'Присоединиться' } },
    // новый тренер: регистрации тренера нет — пишет человек, как seed.sql
    { id: 'natasha-file', write: 'supabase/tests/new-coach.sql', content: NEW_COACH },
    { id: 'natasha-apply', run: 'psql -f supabase/tests/new-coach.sql' },
    // после Веры cookie — её: вход Наташи
    { id: 'login-natasha', browser: login('natasha@example.com') },
    // заголовок, сразу форма «Имя / Добавить», «Приглашений пока нет» — о пустом списке ни слова
    { id: 'natasha-empty', browser: { url: '/clients' } },
    {
      // Plan: только чтение и ответ, код агент не меняет
      id: 'ask-path',
      agent: {
        prompt: 'Пройди путь нового тренера и нового подопечного: что они видят первым, где пусто и куда идти дальше. Код не меняй',
        reply: ASK_PATH_REPLY,
      },
      steps: [
        { id: 'p-clients', read: 'app/clients/page.tsx' },
        { id: 'p-workouts', read: 'app/workouts/page.tsx' },
        { id: 'p-layout', read: 'app/layout.tsx' },
        { id: 'p-report', read: 'app/report/page.tsx' },
      ],
    },
    {
      // Accept edits: правки — без вопроса, npx playwright test — с вопросом [y / n]. Сначала сквозной тест
      id: 'ask-first',
      agent: {
        prompt:
          'Сделай первый экран: меню по роли с выходом, пустые экраны в три части — что здесь будет, что сделать, кнопка. Сначала сквозной тест',
        reply: ASK_FIRST_REPLY,
      },
      steps: [
        { id: 'first-e2e', write: 'e2e/first-run.spec.ts', content: FIRST_E2E },
        // по запущенному npm run dev (reuseExistingServer); только свой файл
        { id: 'first-red', run: 'npx playwright test e2e/first-run.spec.ts' },
      ],
    },
    {
      // сверх таблицы плана: тот же запрос, второй ход — правки и зелёный тест (одним ходом десять шагов не помещаются в окно)
      id: 'ask-first-go',
      agent: { prompt: 'Делай', reply: ASK_FIRST_GO_REPLY },
      steps: [
        { id: 'first-nav', write: 'components/Nav.tsx', content: NAV },
        { id: 'first-layout', edit: 'app/layout.tsx', find: LAYOUT, replace: LAYOUT_NAV },
        { id: 'first-logout', write: 'app/api/logout/route.ts', content: LOGOUT },
        // сверх таблицы плана: без router.refresh() меню после входа не появляется (черновой прогон)
        { id: 'first-login', edit: 'app/login/page.tsx', find: LOGIN_PUSH, replace: LOGIN_REFRESH },
        { id: 'first-clients', edit: 'app/clients/page.tsx', find: CLIENTS_PAGE, replace: CLIENTS_FIRST },
        { id: 'first-workouts', edit: 'app/workouts/page.tsx', find: WORKOUTS_PAGE, replace: WORKOUTS_FIRST },
        { id: 'first-report', edit: 'app/report/page.tsx', find: REPORT_PAGE, replace: REPORT_FIRST },
        { id: 'first-green', run: 'npx playwright test e2e/first-run.spec.ts' },
      ],
    },
    { id: 'c-first', commit: 'Первый экран: меню, выход, пустые экраны с шагом' },
    // Наташа по-прежнему вошла: пустой экран в три части и меню
    { id: 'natasha-hint', browser: { url: '/clients' } },
    { id: 'login-vera', browser: login('vera@example.com') },
    { id: 'vera-hint', browser: { url: '/workouts' } },
    // новая зависимость разработки — только командой npm (решение автора)
    { id: 'a11y-install', run: 'npm install -D @axe-core/playwright' },
    {
      // Accept edits: тест — без вопроса, npx playwright test — с вопросом [y / n]; код приложения агент не меняет
      id: 'ask-a11y',
      agent: {
        prompt:
          'Проверь доступность: axe на входе, у тренера и у подопечного в светлой и тёмной схеме, и вход одной клавиатурой. Сначала тест, код не меняй',
        reply: ASK_A11Y_REPLY,
      },
      steps: [
        { id: 'a11y-e2e', write: 'e2e/a11y.spec.ts', content: A11Y_E2E },
        { id: 'a11y-red', run: 'npx playwright test e2e/a11y.spec.ts' },
      ],
    },
    {
      // Accept edits: правка — без вопроса, перезапуск dev и npx playwright test — с вопросом [y / n]
      id: 'ask-contrast',
      agent: {
        prompt: 'Исправь контраст в тёмной схеме токенами в globals.css, остальное не трогай',
        reply: ASK_CONTRAST_REPLY,
      },
      steps: [
        { id: 'contrast-css', edit: 'app/globals.css', find: CSS_DARK, replace: CSS_DARK_CONTRAST },
        // сверх таблицы плана: правку globals.css запущенный dev отдаёт на одну правку старше — сброс кэша и перезапуск
        { id: 'contrast-restart', run: RESTART },
        { id: 'a11y-green', run: 'npx playwright test e2e/a11y.spec.ts' },
      ],
    },
    { id: 'c-a11y', commit: 'Доступность: axe и клавиатура, контраст тёмной схемы' },
  ],
}
