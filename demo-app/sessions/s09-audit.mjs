// Сессия 9: аудит безопасности. База — из миграций и seed (db: true). Первым делом убираем причину предупреждения Vite из s07:
// переименовываем vitest.config.ts в .mts (git mv), чтобы запуски vitest и npm run check в этой сессии были чистыми, без смены типа пакета.
// Агент рисует на карточке подопечного график прогресса (объём по тренировкам столбиками, SVG без библиотек, подписи — даты).
// Поиск подопечных: сначала наивный маршрут (общий пул владельца базы мимо RLS и склейка строки ilike '%...%'), curl с вошедшей cookie
// Марины показывает инъекцию «' or 1=1 --» — отдаёт всех, включая чужую Свету; исправление — параметр ($1) и asUser вошедшего тренера,
// без входа 401. Ограничитель входа: 5 неудачных за 15 минут по почте в памяти, дальше 429. Агент советует несуществующий пакет
// rls-route-guard — npm view даёт 404. Сканер секретов .githooks/pre-commit не пускает коммит с ключом в коде (lib/payments.ts),
// секрет переносим в .env.local и process.env. Замер N+1: seed-load.sql добавляет 10 подопечных Марины (12 всего), lib/db.ts в режиме
// разработки печатает каждый запрос «[sql] …» (в тестах и production — нет); список подопечных с датой последней тренировки делает 13 запросов (1 + 12), один запрос (left join, max(day)) — 1.
// Проверка перед слиянием: npm run check = линтер, типы, тесты (нужна база — она есть) и сборка. seed-load сделал жёсткий тест RLS
// («Марина видит двух подопечных») неверным — ослабляем его до свойства (видит своих, не видит Свету), иначе npm run check не пройдёт.
// Запись с середины цепочки: node scripts/record-session.mjs --from s09-audit (из course/). Id шагов постоянные: на них ссылаются уроки.

const CLIENT_ID_S08 = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SetList from "@/components/SetList";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };

// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки с подходами и объёмом
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    // тренировки с подходами одним запросом: left join берёт и тренировки без подходов, json_agg собирает подходы в массив
    const workouts = await db.query<Workout>(
      \`select w.id, w.title, w.day, coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]') as sets
         from workouts w left join sets s on s.workout_id = w.id
        where w.client_id = $1
        group by w.id
        order by w.day\`,
      [id],
    );
    return client.rows.length > 0 ? { name: client.rows[0].name, workouts: workouts.rows } : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <form action={assign} className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая тренировка</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input
            id="day"
            name="day"
            type="date"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Назначить
        </button>
      </form>

      <h2 className="mt-8 text-xl font-semibold">Тренировки</h2>
      {card.workouts.length === 0 ? (
        <p className="mt-2 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={\`/workouts/\${workout.id}\`} className="font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
              <SetList sets={workout.sets} className="mt-1 text-sm" />
              <p className="text-sm font-medium">Объём, кг: {volume(workout.sets)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

const CLIENT_ID_CHART = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProgressChart from "@/components/ProgressChart";
import SetList from "@/components/SetList";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };

// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки с подходами и объёмом
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
    // тренировки с подходами одним запросом: left join берёт и тренировки без подходов, json_agg собирает подходы в массив
    const workouts = await db.query<Workout>(
      \`select w.id, w.title, w.day, coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]') as sets
         from workouts w left join sets s on s.workout_id = w.id
        where w.client_id = $1
        group by w.id
        order by w.day\`,
      [id],
    );
    return client.rows.length > 0 ? { name: client.rows[0].name, workouts: workouts.rows } : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <form action={assign} className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Новая тренировка</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            name="title"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="day">Дата</label>
          <input
            id="day"
            name="day"
            type="date"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Назначить
        </button>
      </form>

      <h2 className="mt-8 text-xl font-semibold">Тренировки</h2>
      {card.workouts.length === 0 ? (
        <p className="mt-2 text-zinc-500">Тренировок пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {card.workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={\`/workouts/\${workout.id}\`} className="font-semibold underline">
                {workout.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatDay(workout.day)}</p>
              <SetList sets={workout.sets} className="mt-1 text-sm" />
              <p className="text-sm font-medium">Объём, кг: {volume(workout.sets)}</p>
            </li>
          ))}
        </ul>
      )}

      <ProgressChart data={card.workouts.map((workout) => ({ day: workout.day, volume: volume(workout.sets) }))} />
    </main>
  );
}
`

const CLIENTS_S08 = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечные вошедшего тренера
export default async function ClientsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const clients = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    return rows;
  });

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
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`

const CLIENTS_N1 = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подопечные" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Подопечный тренера с датой последней тренировки
type Client = { id: string; name: string; last: Date | null };

// Подопечные вошедшего тренера, у каждого — дата последней тренировки
export default async function ClientsPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const clients = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    // дата последней тренировки — отдельным запросом на каждого подопечного
    const withLast: Client[] = [];
    for (const client of rows) {
      const last = await db.query<{ last: Date | null }>(
        "select max(day) as last from workouts where client_id = $1",
        [client.id],
      );
      withLast.push({ ...client, last: last.rows[0].last });
    }
    return withLast;
  });

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
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`

const LASTJOIN_FIND = `    const { rows } = await db.query<{ id: string; name: string }>(
      "select id, name from clients where coach_id = $1 order by id",
      [uid],
    );
    // дата последней тренировки — отдельным запросом на каждого подопечного
    const withLast: Client[] = [];
    for (const client of rows) {
      const last = await db.query<{ last: Date | null }>(
        "select max(day) as last from workouts where client_id = $1",
        [client.id],
      );
      withLast.push({ ...client, last: last.rows[0].last });
    }
    return withLast;`

const LASTJOIN_REPLACE = `    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(
      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id\`,
      [uid],
    );
    return rows;`

const LIMIT_FIND = `import { startSession } from "@/lib/session";

// POST /api/login — { email, password } → { role } и cookie сессии.
// Пароль сверяет база: crypt() хеширует введённый пароль с солью из хеша в auth.users.
// Запрос идёт от владельца базы, как у сервиса входа Supabase: пользователям таблица auth.users закрыта.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { rows } = await pool.query<{ id: string; role: string }>(
    \`select u.id, p.role
       from auth.users u join profiles p on p.id = u.id
      where u.email = $1 and u.encrypted_password = crypt($2, u.encrypted_password)\`,
    [String(body?.email ?? ""), String(body?.password ?? "")],
  );
  if (rows.length === 0) {`

const LIMIT_REPLACE = `import { recordFailure, tooManyAttempts } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";

// POST /api/login — { email, password } → { role } и cookie сессии.
// Пароль сверяет база: crypt() хеширует введённый пароль с солью из хеша в auth.users.
// Запрос идёт от владельца базы, как у сервиса входа Supabase: пользователям таблица auth.users закрыта.
// Перед проверкой — ограничитель попыток: больше 5 неудачных входов за 15 минут по одной почте не пускаем (429).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "");
  if (tooManyAttempts(email)) {
    return Response.json({ error: "Слишком много попыток, подождите 15 минут" }, { status: 429 });
  }
  const { rows } = await pool.query<{ id: string; role: string }>(
    \`select u.id, p.role
       from auth.users u join profiles p on p.id = u.id
      where u.email = $1 and u.encrypted_password = crypt($2, u.encrypted_password)\`,
    [email, String(body?.password ?? "")],
  );
  if (rows.length === 0) {
    recordFailure(email);`

const SQLLOG_FIND = `  try {
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: uid, role: "authenticated" }),
    ]);
    const result = await fn(db);
    await db.query("commit");
    return result;
  } catch (err) {
    await db.query("rollback");
    throw err;
  } finally {`

const SQLLOG_REPLACE = `  const original = db.query;
  const run = original.bind(db);
  try {
    await run("begin");
    await run("set local role authenticated");
    await run("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: uid, role: "authenticated" }),
    ]);
    // Только в режиме разработки (next dev): на время запросов приложения подменяем db.query обёрткой и печатаем
    // в журнал сервера каждый запрос — «[sql] …». В тестах (NODE_ENV=test), сборке и на сервере (production) журнал молчит.
    // Служебные команды транзакции и роли идут мимо (через run), в журнал не попадают — так видно число запросов на страницу.
    if (process.env.NODE_ENV === "development") {
      db.query = ((text: unknown, ...args: unknown[]) => {
        const sql = typeof text === "string" ? text : (text as { text: string }).text;
        console.log(\`[sql] \${String(sql).replace(/\\s+/g, " ").trim()}\`);
        return (run as (...rest: unknown[]) => unknown)(text, ...args);
      }) as PoolClient["query"];
    }
    const result = await fn(db);
    await run("commit");
    return result;
  } catch (err) {
    await run("rollback");
    throw err;
  } finally {
    db.query = original;`

const RLS_FIND = `test("Марина видит двух своих подопечных", async () => {
  expect(await clientNames(MARINA)).toEqual(["Анна", "Олег"]);`

const RLS_REPLACE = `test("Марина видит своих подопечных и не видит Свету", async () => {
  const names = await clientNames(MARINA);
  // список мог пополниться данными для замера (seed-load.sql) — проверяем своих и чужую, а не точный состав
  expect(names).toContain("Анна");
  expect(names).toContain("Олег");
  expect(names).not.toContain("Света");`

const PAYFIX_FIND = `// Заготовка оплаты подписки тренера. Секрет платёжной системы — прямо в коде (так проще на старте).
const PAY_SECRET = "demo-secret-not-real-payments-0001";`

const PAYFIX_REPLACE = `// Заготовка оплаты подписки тренера. Секрет платёжной системы берём из окружения (.env.local), в коде его нет:
// сканер секретов не пустит ключ в коммит, а на сервере его читает process.env.
const PAY_SECRET = process.env.PAY_SECRET ?? "";`

const PAYENV_FIND = `SESSION_SECRET=demo-secret-not-real-session`

const PAYENV_REPLACE = `SESSION_SECRET=demo-secret-not-real-session
PAY_SECRET=demo-secret-not-real-payments-0001`

const PROGRESS_CHART = `// График прогресса подопечного: объём каждой тренировки — столбиком, слева направо по дате. SVG рисуем сами, без библиотек.
// Высота столбика — объём относительно наибольшего; под столбиком — дата тренировки. Цвет берёт у текста (currentColor).
import { formatDay } from "@/lib/dates";

type Point = { day: Date; volume: number };

export default function ProgressChart({ data }: { data: Point[] }) {
  if (data.length === 0) return null;
  const width = 320;
  const barsHeight = 160;
  const gap = 12;
  const labels = 20;
  const max = Math.max(...data.map((point) => point.volume), 1);
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Прогресс: объём по тренировкам</h2>
      <svg viewBox={\`0 0 \${width} \${barsHeight + labels}\`} className="mt-3 w-full text-zinc-900" role="img" aria-label="Объём тренировок по датам">
        {data.map((point, i) => {
          const barHeight = Math.round((point.volume / max) * barsHeight);
          const x = i * (barWidth + gap);
          return (
            <g key={i}>
              <rect x={x} y={barsHeight - barHeight} width={barWidth} height={barHeight} fill="currentColor" />
              <text x={x + barWidth / 2} y={barsHeight + 14} textAnchor="middle" fontSize="10" fill="currentColor">
                {formatDay(point.day)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
`

const SEARCH_NAIVE = `import { pool } from "@/lib/db";

// GET /api/clients/search?q= — поиск подопечного по имени.
// Чтобы быстрее: общим пулом владельца базы (мимо RLS) и имя прямо в строку запроса.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const { rows } = await pool.query<{ id: string; name: string }>(
    \`select id, name from clients where name ilike '%\${q}%' order by id\`,
  );
  return Response.json(rows);
}
`

const SEARCH_FIX = `import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GET /api/clients/search?q= — поиск подопечного по имени.
// Имя идёт параметром ($1), а не в строку запроса: склеить SQL больше нельзя.
// Запрос — от имени вошедшего тренера (asUser), поэтому видно только его подопечных; без входа — 401.
export async function GET(request: Request) {
  const uid = await currentUser();
  if (!uid) return Response.json({ error: "Нужно войти" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await asUser(uid, async (db) => {
    const result = await db.query<{ id: string; name: string }>(
      "select id, name from clients where name ilike '%' || $1 || '%' order by id",
      [q],
    );
    return result.rows;
  });
  return Response.json(rows);
}
`

const RATE_LIMIT = `// Ограничитель попыток входа: не больше 5 неудачных за 15 минут по одной почте.
// Счётчик — в памяти процесса, поэтому сбрасывается при перезапуске сервера (dev-сервер — заново с нуля);
// для нескольких процессов нужен был бы общий счётчик (например, в базе или Redis).
const WINDOW_MS = 15 * 60_000;
const LIMIT = 5;
const failures = new Map<string, number[]>();

// Недавние неудачные попытки по почте: старше 15 минут отбрасываем.
function recent(email: string): number[] {
  const now = Date.now();
  const times = (failures.get(email) ?? []).filter((at) => now - at < WINDOW_MS);
  failures.set(email, times);
  return times;
}

// true, если по этой почте уже исчерпан лимит неудачных входов за окно.
export function tooManyAttempts(email: string): boolean {
  return recent(email).length >= LIMIT;
}

// Запомнить неудачный вход по этой почте.
export function recordFailure(email: string): void {
  recent(email).push(Date.now());
}
`

const PAY_NAIVE = `// Заготовка оплаты подписки тренера. Секрет платёжной системы — прямо в коде (так проще на старте).
const PAY_SECRET = "demo-secret-not-real-payments-0001";

export type Subscription = { coachId: string; plan: "month" | "year" };

// Пока заглушка: позже здесь будет вызов платёжной системы с PAY_SECRET.
export async function startPayment(sub: Subscription): Promise<{ ok: boolean; plan: Subscription["plan"] }> {
  if (!PAY_SECRET) throw new Error("Не задан PAY_SECRET");
  return { ok: true, plan: sub.plan };
}
`

const SEED_LOAD = `-- Данные для замера: ещё 10 подопечных Марины (всего у неё станет 12), у каждого одна-две тренировки.
-- Это не демо-данные и не миграция: запускается вручную (psql -f), чтобы на списке подопечных увидеть N+1.
-- У этих подопечных нет входа в приложение (user_id null) — они нужны только для нагрузки списка.

insert into clients (coach_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Борис'),
  ('11111111-1111-1111-1111-111111111111', 'Вера'),
  ('11111111-1111-1111-1111-111111111111', 'Галина'),
  ('11111111-1111-1111-1111-111111111111', 'Дмитрий'),
  ('11111111-1111-1111-1111-111111111111', 'Егор'),
  ('11111111-1111-1111-1111-111111111111', 'Жанна'),
  ('11111111-1111-1111-1111-111111111111', 'Зоя'),
  ('11111111-1111-1111-1111-111111111111', 'Иван'),
  ('11111111-1111-1111-1111-111111111111', 'Кирилл'),
  ('11111111-1111-1111-1111-111111111111', 'Лариса');

-- По одной тренировке каждому из новых подопечных
insert into workouts (client_id, title, day)
select id, 'Тренировка', date '2026-11-01'
from clients
where coach_id = '11111111-1111-1111-1111-111111111111' and user_id is null;

-- И каждому второму — вторая тренировка (у кого-то одна тренировка, у кого-то две)
insert into workouts (client_id, title, day)
select id, 'Тренировка', date '2026-11-02'
from clients
where coach_id = '11111111-1111-1111-1111-111111111111' and user_id is null and id % 2 = 0;
`

const HOOK = `#!/bin/bash
# Простой сканер секретов перед коммитом. Смотрит, что уходит в коммит (git diff --cached):
# присвоение переменной, в имени которой KEY или SECRET, строкой в кавычках от 12 знаков,
# и начало закрытого ключа (-----BEGIN ... PRIVATE KEY). Нашёл — печатает «Похоже на секрет: файл:строка» и не пускает коммит.
# Настоящие секреты держим в .env.local (он не коммитится), а в коде читаем из process.env.
secret='(KEY|SECRET)[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*"[^"]{12,}"'
begin='-----BEGIN[A-Z ]*PRIVATE KEY'
found=0
while IFS= read -r file; do
  while IFS=: read -r num _; do
    echo "Похоже на секрет: $file:$num"
    found=1
  done < <(git show ":$file" | grep -nE "$secret|$begin")
done < <(git diff --cached --name-only --diff-filter=AM)
exit "$found"
`

export default {
  id: 's09-audit',
  from: 's08-debug',
  date: '2026-11-02T10:00:00+03:00',
  db: true,
  steps: [
    // убрать причину 3-строчного предупреждения Vite (vitest.config.ts из s07 — ESM в CommonJS-пакете): переименовать в .mts, тип пакета не меняем
    { id: 'vitest-warn', run: 'git mv vitest.config.ts vitest.config.mts' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    {
      id: 'ask-chart',
      agent: {
        prompt: 'График прогресса на странице подопечного: объём по тренировкам столбиками, SVG без библиотек, подписи — даты',
        reply:
          'Добавил график на карточку подопечного. components/ProgressChart.tsx рисует объём каждой тренировки столбиком прямо на SVG, без библиотек: ' +
          'столбцы слева направо по дате, под каждым подпись с датой, высота — объём относительно наибольшего. Карточка передаёт в график свои тренировки с объёмом.',
      },
      steps: [
        { id: 'chart-comp', write: 'components/ProgressChart.tsx', content: PROGRESS_CHART },
        { id: 'chart-use', edit: 'app/clients/[id]/page.tsx', find: CLIENT_ID_S08, replace: CLIENT_ID_CHART },
      ],
    },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    // на карточке Анны — три её тренировки и график «Прогресс: объём по тренировкам» с датами
    { id: 'chart-view', browser: { url: '/clients/1' } },
    { id: 'c-chart', commit: 'График прогресса подопечного' },
    {
      id: 'ask-search',
      agent: {
        prompt: 'Поиск подопечного по имени: GET /api/clients/search?q=',
        reply:
          'Сделал маршрут GET /api/clients/search?q=: отдаёт id и имя подопечных, у кого имя содержит q. ' +
          'Чтобы было быстрее, пока хожу общим пулом владельца базы и подставляю q прямо в ilike — к правам и экранированию вернёмся.',
      },
      steps: [{ id: 'search-route', write: 'app/api/clients/search/route.ts', content: SEARCH_NAIVE }],
    },
    { id: 'login-curl', run: 'curl -s -c ~/marina.txt -H \'Content-Type: application/json\' -d \'{"email":"marina@example.com","password":"demo-password"}\' http://localhost:3000/api/login' },
    { id: 'search-ok', run: 'curl -s -b ~/marina.txt -G --data-urlencode \'q=Ан\' http://localhost:3000/api/clients/search' },
    // инъекция: имя склеено в запрос, «' or 1=1 --» отдаёт всех подопечных, включая чужую Свету
    { id: 'inject', run: 'curl -s -b ~/marina.txt -G --data-urlencode "q=\' or 1=1 --" http://localhost:3000/api/clients/search' },
    {
      id: 'ask-inject-fix',
      agent: {
        prompt:
          // команда и ответ — дословно из шага inject (node scripts/print-event.mjs s09-audit inject)
          'Проверила поиск: curl -s -b ~/marina.txt -G --data-urlencode "q=\' or 1=1 --" http://localhost:3000/api/clients/search ' +
          'ответил [{"id":"1","name":"Анна"},{"id":"2","name":"Олег"},{"id":"3","name":"Света"}] — и чужая Света. ' +
          'Параметры вместо склейки, запрос — от имени вошедшего тренера через asUser, без входа — 401',
        reply:
          "Исправил. Имя идёт параметром ($1) через ilike '%' || $1 || '%' — склеить SQL больше нельзя. " +
          'Запрос теперь от имени вошедшего тренера (asUser), поэтому видно только его подопечных и RLS в силе; без входа маршрут отвечает 401 «Нужно войти».',
      },
      steps: [{ id: 'search-fix', write: 'app/api/clients/search/route.ts', content: SEARCH_FIX }],
    },
    // та же инъекция от Марины — теперь пусто: параметр не склеивается, а asUser отдаёт только её подопечных
    { id: 'inject2', run: 'curl -s -b ~/marina.txt -G --data-urlencode "q=\' or 1=1 --" http://localhost:3000/api/clients/search' },
    // без cookie — 401
    { id: 'anon', run: 'curl -s -G --data-urlencode \'q=Ан\' http://localhost:3000/api/clients/search' },
    { id: 'c-search', commit: 'Поиск подопечных: параметры и права вошедшего' },
    {
      id: 'ask-limit',
      agent: {
        prompt: 'Ограничь попытки входа: 5 неудачных за 15 минут, дальше 429 «Слишком много попыток, подождите 15 минут»',
        reply:
          'Добавил ограничитель. lib/rate-limit.ts считает неудачные входы по почте в памяти процесса; после 5 неудачных за 15 минут ' +
          'маршрут входа отвечает 429 «Слишком много попыток, подождите 15 минут». Счётчик в памяти — при перезапуске сервера сбрасывается.',
      },
      steps: [
        { id: 'limit-lib', write: 'lib/rate-limit.ts', content: RATE_LIMIT },
        { id: 'limit-use', edit: 'app/api/login/route.ts', find: LIMIT_FIND, replace: LIMIT_REPLACE },
      ],
    },
    // пять неудачных входов Игоря с неверным паролем — 401, шестой — 429
    { id: 'limit-curl', run: "for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code}\\n' -H 'Content-Type: application/json' -d '{\"email\":\"igor@example.com\",\"password\":\"wrong\"}' http://localhost:3000/api/login; done" },
    { id: 'c-limit', commit: 'Не больше пяти неудачных входов за 15 минут' },
    {
      id: 'ask-pkg',
      agent: {
        prompt: 'Как проще проверять права в маршрутах?',
        reply:
          'Права в маршрутах у нас уже есть: currentUser() даёт вошедшего, asUser прогоняет запрос под его правами (RLS). ' +
          'Чтобы не повторять проверку входа в каждом маршруте, можно поставить пакет rls-route-guard — обёртка, которая сама отвечает 401 без входа ' +
          'и передаёт в обработчик uid. Поставь: npm i rls-route-guard.',
      },
      steps: [{ id: 'pkg-read', read: 'package.json' }],
    },
    // пакета rls-route-guard нет в реестре — npm view возвращает 404
    { id: 'pkg-check', run: 'npm view rls-route-guard' },
    // сканер секретов: не пускает коммит, если в добавленных строках есть ключ или секрет
    { id: 'hook-file', write: '.githooks/pre-commit', content: HOOK },
    { id: 'hook-exec', run: 'chmod +x .githooks/pre-commit' },
    { id: 'hook-on', run: 'git config core.hooksPath .githooks' },
    {
      id: 'ask-pay',
      agent: {
        prompt: 'Заготовка оплаты подписки тренера',
        reply:
          'Набросал lib/payments.ts: тип подписки (месяц или год) и функция startPayment — пока заглушка. ' +
          'Секрет платёжной системы положил прямо в файл, потом вынесем.',
      },
      steps: [{ id: 'pay-lib', write: 'lib/payments.ts', content: PAY_NAIVE }],
    },
    // сканер секретов не пускает коммит: в lib/payments.ts ключ прямо в коде
    { id: 'commit-blocked', run: "git add -A && git commit -m 'Оплата подписки'" },
    {
      id: 'ask-pay-fix',
      agent: {
        prompt: 'Сканер не пустил коммит: секрет в lib/payments.ts. Секрет — в .env.local, в коде — process.env',
        reply:
          'Перенёс секрет: в .env.local добавил PAY_SECRET, а в lib/payments.ts читаю его из process.env.PAY_SECRET. ' +
          'В коде ключа больше нет — сканер пропустит коммит.',
      },
      steps: [
        { id: 'pay-env', edit: '.env.local', find: PAYENV_FIND, replace: PAYENV_REPLACE },
        { id: 'pay-lib-fix', edit: 'lib/payments.ts', find: PAYFIX_FIND, replace: PAYFIX_REPLACE },
      ],
    },
    { id: 'c-pay', commit: 'Заготовка оплаты: секрет из окружения' },
    // данные для замера N+1: ещё 10 подопечных Марины (всего 12), у каждого одна-две тренировки
    { id: 'seed-load-file', write: 'supabase/seed-load.sql', content: SEED_LOAD },
    { id: 'seed-load', run: 'psql -f supabase/seed-load.sql' },
    // из-за данных для замера жёсткий тест RLS («Марина видит двух подопечных») стал неверным — ослабляем до свойства, иначе npm run check упадёт
    { id: 'rls-fix', edit: 'test/rls.test.ts', find: RLS_FIND, replace: RLS_REPLACE },
    {
      id: 'ask-last',
      agent: {
        prompt: 'В списке подопечных у каждого — дата последней тренировки. И печатай в журнал сервера каждый запрос к базе — «[sql] …», чтобы видеть, сколько их',
        reply:
          'Сделал два дела. Первое: в режиме разработки lib/db.ts печатает в журнал сервера каждый запрос приложения — «[sql] …» ' +
          '(служебные команды транзакции и роли не считаю; в тестах и в production журнал молчит). ' +
          'Второе: в списке подопечных у каждого показываю дату последней тренировки — пока отдельным запросом на каждого подопечного.',
      },
      steps: [
        { id: 'sql-log', edit: 'lib/db.ts', find: SQLLOG_FIND, replace: SQLLOG_REPLACE },
        { id: 'last-n1', edit: 'app/clients/page.tsx', find: CLIENTS_S08, replace: CLIENTS_N1 },
      ],
    },
    // в журнале на список подопечных — 13 строк «[sql]» (1 + 12)
    { id: 'clients-n1', browser: { url: '/clients' } },
    {
      id: 'ask-n1-fix',
      agent: {
        prompt: 'В журнале на список подопечных — 13 запросов «[sql]» (один общий и по одному на каждого из 12). Один запрос вместо тринадцати',
        reply:
          'Собрал всё одним запросом: left join workouts и max(day) с group by — дата последней тренировки приходит вместе со списком. ' +
          'Теперь на страницу в журнале один «[sql]» вместо тринадцати.',
      },
      steps: [{ id: 'last-join', edit: 'app/clients/page.tsx', find: LASTJOIN_FIND, replace: LASTJOIN_REPLACE }],
    },
    // одна строка «[sql]» на весь список
    { id: 'clients-1', browser: { url: '/clients' } },
    { id: 'c-n1', commit: 'Список подопечных одним запросом' },
    { id: 'check-script', run: 'npm pkg set scripts.check="npm run lint && npx tsc --noEmit && npm test && npm run build"' },
    { id: 'check-run', run: 'npm run check' },
    { id: 'c-check', commit: 'npm run check: линтер, типы, тесты и сборка' },
  ],
}
