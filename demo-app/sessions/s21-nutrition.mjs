// Сессия 21: питание (утро 12 ноября; база — из миграций и seed, db: true). Вторая сессия недели 3, ролик дня 16.
// Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next (как в s13, s19 и s20).
// Человек пишет правила словами — docs/nutrition.md: значения на этикетке — на 100 г, порция = значение × граммы / 100, число без единицы
// не пишем, больше 900 ккал на 100 г — переспросить «это кДж?», итог дня у подопечного и сводка тренера — одна функция, округление
// один раз, при показе; цели тренера на день — ккал, белки, жиры, углеводы. Коммит — до схемы и кода.
// Схема (Accept edits): 0010_nutrition.sql — nutrition_goals (цели на день, строка на подопечного) и food_entries (день, продукт, граммы,
// ккал, белки, жиры, углеводы на 100 г); RLS сразу, в той же миграции (урок дня 11: таблица из SQL без RLS открыта любому вошедшему).
// psql -f — с подтверждения. Тест с базой test/nutrition.test.ts, как test/comments.test.ts: Анна пишет своё, Марина видит, Света не видит
// и записать не может — зелёный с первого раза. С s22 миграцию 0010 применяет рекордер.
// Расчёт: сначала тесты lib/nutrition.test.ts — красные (модуля нет), потом lib/nutrition.ts — зелёные: portion, checkPer100, parseAmount
// («52,5» с запятой; parseWeight из lib/weight.ts не годится — он не принимает 0, а жиров бывает 0 г), dayTotal — сумма порций без округления.
// Страницы: дневник /nutrition?day=2026-11-12 — день в адресе, настоящие часы в кадр не попадают; на карточке подопечного у тренера —
// цели на день и сводка недели /clients/1?week=2026-11-09 (дни недели считает база). Подводный камень «один день — два итога»: дневник
// округляет ккал каждой строки и складывает показанные строки, а сводка — dayTotal и одно округление. Продукты — настоящие, числа
// с этикеток на 100 г, порции — обычные: овсяные хлопья 45 г (352 ккал → 158,4), молоко 2,5 % 200 г (53 → 106), гречка ядрица 80 г
// (308 → 246,4). Строки 158 + 106 + 246 = 510 — «Итого: 510 ккал» у Анны; сумма порций 510,8 → «12 ноября: 511 ккал из 1800» у Марины.
// Исправление — сначала тест (итог дня на тех же трёх строках показывает одна функция — 511 ккал), красный: функции нет; потом
// shown в lib/nutrition.ts (до целых и с единицей — округление только здесь), «Итого» у Анны — shown(dayTotal(…)), сводка — тоже через
// shown; тест зелёный, у Анны «Итого: 511 ккал».
// Сверх таблицы плана (шаг — один файл): pages-actions (app/nutrition/actions.ts — его называет и план), pages-goals (действие целей
// в app/clients/[id]/actions.ts), pages-e2e (меню подопечного в e2e/first-run.spec.ts стало длиннее: без правки тест s20 упал бы
// в общем прогоне s26; запустить его здесь нельзя — Наташи и Веры в базе этой сессии нет), one-lib и one-coach (одна функция показа:
// тест в lib/nutrition.test.ts может покраснеть и позеленеть только от правки модуля, а «для обоих экранов» — правка и сводки тренера).
// Строки для кадра сессия создаёт сама: цели — Марина в браузере, записи дневника — Анна в браузере. Браузер один на сессию: вход меняет cookie.
// Запись с середины цепочки: node scripts/record-session.mjs --from s21-nutrition (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: все запросы — Accept edits (правки без вопроса, psql и vitest — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Правила словами — пишет человек, до схемы и кода. Числа примера посчитаны вручную: 350 × 60 / 100 = 210, 350 × 4,184 = 1464,4,
// 9 ккал в грамме жира × 100 = 900
const NUTRITION_DOC = `# Питание

Тренер ставит подопечному цели на день, подопечный записывает, что съел. Тренер видит сводку по дням недели.

## Этикетка и порция

- На этикетке значения — на 100 г: ккал, белки, жиры, углеводы.
- Порция = значение × граммы / 100. Овсяные хлопья, 350 ккал на 100 г, порция 60 г: 350 × 60 / 100 = 210 ккал.
- Числа вписывают как на этикетке: «52,5» с запятой — то же, что 52.5.
- Число без единицы не пишем: «210 ккал», «60 г», а не «210».

## Ккал, а не кДж

- На этикетке рядом два числа: ккал и кДж. 350 ккал — это 1464 кДж (350 × 4,184).
- Больше 900 ккал на 100 г не бывает: в грамме чистого жира 9 ккал, в 100 г — 900. Такое число не записываем, а переспрашиваем: «это кДж?»

## Итог дня

- Итог дня у подопечного и сводка тренера — одна функция: сумма порций за день.
- Округление один раз, при показе: до целых ккал и граммов. Порции и их сумму не округляем.

## Цели тренера

- Цели на день ставит тренер: ккал, белки, жиры, углеводы.
- В сводке тренера у каждого дня недели — итог дня и цель.

Это решения нашего приложения.
`

// Схема — пишет агент: цели тренера и дневник подопечного, RLS сразу, в той же миграции (урок 0006/0007). Значения с этикетки — numeric:
// 12,3 г белка не целое. Имена политик по-русски короче 63 байт, как в 0002
const NUTRITION_SQL = `-- Питание (docs/nutrition.md): цели тренера на день и дневник подопечного.
-- Дневник — данные о здоровье, поэтому RLS включается здесь же, сразу: таблица из SQL без RLS открыта любому вошедшему
-- (так было с comments: в 0006 Света видела комментарии Анны, закрыла их только 0007).

-- Цели на день — одна строка на подопечного, ставит тренер: ккал, белки, жиры и углеводы, г
create table nutrition_goals (
  client_id bigint primary key references clients (id),
  kcal int not null check (kcal > 0),
  protein int not null check (protein >= 0),
  fat int not null check (fat >= 0),
  carbs int not null check (carbs >= 0)
);

-- Запись дневника: день, продукт, граммы порции и значения с этикетки на 100 г — ккал, белки, жиры и углеводы, г.
-- Больше 900 ккал на 100 г не бывает. Порцию и итог дня считает приложение (lib/nutrition.ts), в базе — то, что вписано
create table food_entries (
  id bigint generated by default as identity primary key,
  client_id bigint not null references clients (id),
  day date not null,
  product text not null check (char_length(product) between 1 and 200),
  grams numeric not null check (grams > 0),
  kcal numeric not null check (kcal between 0 and 900),
  protein numeric not null check (protein >= 0),
  fat numeric not null check (fat >= 0),
  carbs numeric not null check (carbs >= 0)
);

alter table nutrition_goals enable row level security;
alter table food_entries enable row level security;

-- Цели: тренер ставит и меняет цели своим подопечным, подопечный видит свои
create policy "тренер ведёт цели своих" on nutrition_goals
  for all to authenticated
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));
create policy "подопечный видит свои цели" on nutrition_goals
  for select to authenticated using (client_id in (select id from clients where user_id = auth.uid()));

-- Дневник: подопечный ведёт свой — пишет, читает, правит и удаляет; тренер дневник своих подопечных только читает
create policy "подопечный ведёт свой дневник" on food_entries
  for all to authenticated
  using (client_id in (select id from clients where user_id = auth.uid()))
  with check (client_id in (select id from clients where user_id = auth.uid()));
create policy "тренер видит дневник своих" on food_entries
  for select to authenticated using (client_id in (select id from clients where coach_id = auth.uid()));
`

// Тест с базой — пишет агент, по образцу test/comments.test.ts: Анна пишет своё, Марина видит, Света не видит и записать не может
const NUTRITION_DB_TEST = `// @vitest-environment node
// Негативный тест: дневник питания Анны — данные о здоровье — видят она и её тренер Марина, а Света, подопечная Игоря, — нет;
// записать в дневник Анны Света тоже не может.
// Права проверяет база (RLS, supabase/migrations/0010_nutrition.sql): запросы идут от имени разных людей, как в asUser из lib/db.ts.
// Данные тест создаёт сам в одной транзакции и в конце откатывает (rollback): в базе после него ничего не остаётся.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import type { PoolClient } from "pg";
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: Марина — тренер Анны, Света — подопечная Игоря; Анна в clients — id 1
const MARINA = "11111111-1111-1111-1111-111111111111";
const ANNA = "33333333-3333-3333-3333-333333333333";
const SVETA = "55555555-5555-5555-5555-555555555555";
const ANNA_CLIENT = 1;
// овсяные хлопья, 45 г; с этикетки на 100 г — 352 ккал, белки 12,3 г, жиры 6,2 г, углеводы 61,8 г
const INSERT = \`insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs)
                values ($1, '2026-11-12', 'Овсяные хлопья', 45, 352, 12.3, 6.2, 61.8)\`;

afterAll(() => pool.end());

// Запросы fn в одной транзакции с откатом; as(uid) — дальше от имени uid: роль authenticated и sub в request.jwt.claims
async function rolledBack<T>(fn: (db: PoolClient, as: (uid: string) => Promise<void>) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  const as = async (uid: string) => {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
  };
  try {
    await db.query("begin");
    return await fn(db, as);
  } finally {
    await db.query("rollback");
    db.release();
  }
}

// Анна записывает овсяные хлопья в свой дневник, затем reader читает дневник Анны
const diarySeenBy = (reader: string) =>
  rolledBack(async (db, as) => {
    await as(ANNA);
    await db.query(INSERT, [ANNA_CLIENT]);
    await as(reader);
    const { rows } = await db.query<{ product: string }>("select product from food_entries where client_id = $1", [ANNA_CLIENT]);
    return rows.map((row) => row.product);
  });

// в дневнике Анны могут быть и её записи из приложения — проверяем запись теста, а не точный состав
test("Анна пишет в свой дневник и видит запись", async () => {
  expect(await diarySeenBy(ANNA)).toContain("Овсяные хлопья");
});

test("Марина, тренер Анны, видит её дневник", async () => {
  expect(await diarySeenBy(MARINA)).toContain("Овсяные хлопья");
});

test("Света, подопечная Игоря, не видит дневник Анны", async () => {
  expect(await diarySeenBy(SVETA)).toEqual([]);
});

test("Света не может записать в дневник Анны", async () => {
  const write = rolledBack(async (db, as) => {
    await as(SVETA);
    await db.query(INSERT, [ANNA_CLIENT]);
  });
  await expect(write).rejects.toThrow("row-level security");
});
`

// Тесты расчёта — пишет агент до кода, по docs/nutrition.md: 60 г × 350 = 210; 1464 — «это кДж?»; «52,5» с запятой; итог дня без округления.
// Три строки дня — те же продукты и граммы, что Анна вписывает в браузере (food-1 … food-3)
const CALC_TEST = `import { expect, test } from "vitest";
import { checkPer100, dayTotal, parseAmount, portion } from "./nutrition";

// Правила — docs/nutrition.md: значения с этикетки на 100 г, порция = значение × граммы / 100

test("порция: 60 г при 350 ккал на 100 г — 210 ккал", () => {
  expect(portion(350, 60)).toBe(210);
});

test("1464 на 100 г — это кДж: переспросить", () => {
  // 350 ккал × 4,184 = 1464 кДж — число из соседней строки этикетки
  expect(checkPer100(1464)).toBe("Больше 900 ккал на 100 г не бывает — это кДж?");
  expect(checkPer100(350)).toBeNull();
});

test("числа как на этикетке: «52,5» с запятой — 52,5", () => {
  expect(parseAmount("52,5")).toBe(52.5);
  // пустое поле и число с единицей — не число
  expect(parseAmount("")).toBeNull();
  expect(parseAmount("60 г")).toBeNull();
});

// День 12 ноября: граммы порции и значения с этикеток на 100 г
const DAY = [
  // овсяные хлопья: 352 × 45 / 100 = 158,4 ккал
  { grams: 45, kcal: 352, protein: 12.3, fat: 6.2, carbs: 61.8 },
  // молоко 2,5 %: 53 × 200 / 100 = 106 ккал
  { grams: 200, kcal: 53, protein: 2.8, fat: 2.5, carbs: 4.7 },
  // гречка ядрица: 308 × 80 / 100 = 246,4 ккал
  { grams: 80, kcal: 308, protein: 12.6, fat: 3.3, carbs: 57.1 },
];

test("итог дня — сумма порций без округления: 158,4 + 106 + 246,4 = 510,8 ккал", () => {
  expect(dayTotal(DAY)).toBeCloseTo(510.8);
  // белки так же: 5,535 + 5,6 + 10,08 = 21,215 г
  expect(dayTotal(DAY, "protein")).toBeCloseTo(21.215);
});
`

// Расчёт — пишет агент после красных тестов. parseAmount — запятая, как в lib/weight.ts; parseWeight не годится: 0 г жиров — тоже число
const CALC_LIB = `// Питание: порция, правдоподобие ккал, числа из формы и итог дня. Правила — docs/nutrition.md, тесты — lib/nutrition.test.ts.
// Значения с этикетки — на 100 г, граммы — вес порции. Расчёт ничего не округляет: округляют при показе.

// Запись дневника для расчёта: граммы порции и значения с этикетки на 100 г — ккал, белки, жиры и углеводы, г
export type FoodEntry = { grams: number; kcal: number; protein: number; fat: number; carbs: number };

// Какое значение с этикетки складывать в итог дня
export type Value = "kcal" | "protein" | "fat" | "carbs";

// Больше 900 ккал на 100 г не бывает: в грамме чистого жира 9 ккал
const KCAL_MAX = 900;

// Порция: значение на 100 г × граммы / 100
export function portion(per100: number, grams: number): number {
  return (per100 * grams) / 100;
}

// Ккал на 100 г: больше 900 — скорее всего, вписали килоджоули из соседней строки этикетки. Возвращает вопрос или null
export function checkPer100(kcal: number): string | null {
  return kcal > KCAL_MAX ? "Больше 900 ккал на 100 г не бывает — это кДж?" : null;
}

// Число из поля формы — как на этикетке: «52,5» с запятой тоже число (запятую меняем на точку, как lib/weight.ts).
// Ноль годится (жиров 0 г), поэтому не parseWeight: тот ждёт вес больше нуля. Пустое, не число или меньше нуля — null
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  // Number("") === 0, поэтому пустое поле отсекаем до Number
  const value = normalized === "" ? NaN : Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// Итог дня — сумма порций за день, без округления: ккал или другое значение с этикетки
export function dayTotal(entries: FoodEntry[], value: Value = "kcal"): number {
  return entries.reduce((sum, entry) => sum + portion(entry[value], entry.grams), 0);
}
`

// Дневник подопечного — пишет агент. Правдоподобная ошибка: ккал каждой строки округлены «как на экране», а «Итого» — сумма показанных
// строк, чтобы столбец сходился. Сводка тренера считает итог через dayTotal и округляет один раз — у одного дня два итога
const NUTRITION_PAGE = `import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { portion, type FoodEntry } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";
import { addEntry } from "./actions";

export const metadata: Metadata = { title: "Питание" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// День дневника — из адреса, ГГГГ-ММ-ДД: от сегодняшней даты страница не зависит
const DAY = /^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/;

// День «ГГГГ-ММ-ДД» по-русски: «12 ноября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(\`\${day}T00:00\`));

// Запись дневника: продукт, граммы порции и значения с этикетки на 100 г
type Entry = FoodEntry & { id: string; product: string };
// Цели тренера на день: ккал, белки, жиры и углеводы, г
type Goals = { kcal: number; protein: number; fat: number; carbs: number };

// Поля значений с этикетки: имя в форме и подпись
const PER_100: [name: string, label: string][] = [
  ["kcal", "Ккал"],
  ["protein", "Белки, г"],
  ["fat", "Жиры, г"],
  ["carbs", "Углеводы, г"],
];

// Дневник питания вошедшего подопечного за день из адреса: что съедено, ккал каждой порции и итог; ниже — новая запись.
// Без дня в адресе — дни, за которые есть записи, и выбор дня. Чужой дневник база не отдаст (RLS)
export default async function NutritionPage({ searchParams }: PageProps<"/nutrition">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { day, error } = await searchParams;

  if (typeof day !== "string" || !DAY.test(day)) {
    const days = await asUser(uid, async (db) => {
      const { rows } = await db.query<{ day: string }>(
        \`select distinct f.day::text as day
           from food_entries f join clients c on c.id = f.client_id
          where c.user_id = $1
          order by day desc\`,
        [uid],
      );
      return rows.map((row) => row.day);
    });
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Питание</h1>
        {days.length === 0 ? (
          <section className="mt-6 rounded border border-zinc-300 p-4">
            <h2 className="text-xl font-semibold">Записей пока нет</h2>
            <p className="mt-2 text-zinc-500">Здесь будет дневник питания: что вы съели за день и сколько это ккал.</p>
            <p className="mt-2">Выберите день и запишите первый продукт: граммы порции и числа с этикетки.</p>
          </section>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {days.map((d) => (
              <li key={d}>
                <Link href={\`/nutrition?day=\${d}\`} className="underline">
                  {dayOf(d)}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <form action="/nutrition" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="day">День</label>
            <input id="day" name="day" type="date" required className="rounded border border-zinc-300 px-3 py-2" />
          </div>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
            Открыть
          </button>
        </form>
      </main>
    );
  }

  const data = await asUser(uid, async (db) => {
    // записи подопечного за день — по его входу; значения из numeric — числами (float8)
    const entries = await db.query<Entry>(
      \`select f.id, f.product, f.grams::float8 as grams, f.kcal::float8 as kcal, f.protein::float8 as protein,
              f.fat::float8 as fat, f.carbs::float8 as carbs
         from food_entries f join clients c on c.id = f.client_id
        where c.user_id = $1 and f.day = $2
        order by f.id\`,
      [uid, day],
    );
    const goals = await db.query<Goals>(
      \`select g.kcal, g.protein, g.fat, g.carbs
         from nutrition_goals g join clients c on c.id = g.client_id
        where c.user_id = $1\`,
      [uid],
    );
    return { entries: entries.rows, goals: goals.rows[0] };
  });
  // ккал каждой порции — до целых, как на экране; «Итого» — сумма показанных строк
  const lines = data.entries.map((entry) => ({ ...entry, portionKcal: Math.round(portion(entry.kcal, entry.grams)) }));
  const total = lines.reduce((sum, line) => sum + line.portionKcal, 0);
  // день — в действии формы: запись попадёт в этот день
  const add = addEntry.bind(null, day);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Питание</h1>
      <p className="mt-2 text-xl">{dayOf(day)}</p>
      {data.goals ? (
        <p className="mt-2 text-zinc-500">
          Цель тренера на день: {data.goals.kcal} ккал, белки {data.goals.protein} г, жиры {data.goals.fat} г, углеводы{" "}
          {data.goals.carbs} г
        </p>
      ) : (
        <p className="mt-2 text-zinc-500">Цели на день поставит тренер</p>
      )}

      {lines.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Записей за день нет</h2>
          <p className="mt-2 text-zinc-500">Здесь будет всё, что вы съели за день: ккал каждой порции и итог.</p>
          <p className="mt-2">Запишите продукт ниже: граммы порции и числа с этикетки на 100 г.</p>
        </section>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-2">
            {lines.map((line) => (
              <li key={line.id}>
                {line.product}, {line.grams.toLocaleString("ru-RU")} г — {line.portionKcal} ккал
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xl font-semibold">Итого: {total} ккал</p>
        </>
      )}

      <form action={add} className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Записать продукт</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="product">Продукт</label>
          <input id="product" name="product" required maxLength={200} className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="grams">Порция, г</label>
          <input id="grams" name="grams" inputMode="decimal" required className="rounded border border-zinc-300 px-3 py-2" />
        </div>
        <p className="text-zinc-500">С этикетки, на 100 г:</p>
        {PER_100.map(([name, label]) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name}>{label}</label>
            <input id={name} name={name} inputMode="decimal" required className="rounded border border-zinc-300 px-3 py-2" />
          </div>
        ))}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Записать
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <Link href="/nutrition" className="mt-8 inline-block underline">
        Другие дни
      </Link>
    </main>
  );
}
`

// Запись в дневник — пишет агент: числа с этикетки разбирает parseAmount, больше 900 ккал на 100 г — вопрос «это кДж?» под формой
const NUTRITION_ACTIONS = `"use server";

import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { checkPer100, parseAmount } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";

// Запись в дневник за день day: продукт, граммы порции и значения с этикетки на 100 г (docs/nutrition.md).
// Запрос идёт от имени вошедшего: в чужой дневник записать не даст RLS (политика «подопечный ведёт свой дневник»)
export async function addEntry(day: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  // день — ГГГГ-ММ-ДД, как в адресе страницы
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) redirect("/nutrition");
  const page = \`/nutrition?day=\${day}\`;
  // ошибку страница покажет под формой: её текст — в адресе
  const fail = (error: string) => \`\${page}&error=\${encodeURIComponent(error)}\`;

  const product = String(form.get("product") ?? "").trim();
  if (product === "" || product.length > 200) redirect(fail("Продукт — название, до 200 знаков"));
  // числа — как на этикетке, «52,5» с запятой тоже число
  const number = (name: string) => parseAmount(String(form.get(name) ?? ""));
  const grams = number("grams");
  if (grams === null || grams === 0) redirect(fail("Порция — граммы больше нуля, например 60"));
  const [kcal, protein, fat, carbs] = ["kcal", "protein", "fat", "carbs"].map(number);
  if (kcal === null || protein === null || fat === null || carbs === null) {
    redirect(fail("Значения с этикетки — числа на 100 г, например 352"));
  }
  // больше 900 ккал на 100 г не бывает: переспрашиваем, а не записываем
  const question = checkPer100(kcal);
  if (question) redirect(fail(question));

  await asUser(uid, (db) =>
    db.query(
      \`insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs)
       select id, $2::date, $3, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric from clients where user_id = $1\`,
      [uid, day, product, grams, kcal, protein, fat, carbs],
    ),
  );
  // тот же день заново — с новой записью и без прежней ошибки в адресе
  redirect(page);
}
`

// Карточка подопечного после s16 — дословно, как в состоянии s20-first-run
const CLIENT_PAGE = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addComment } from "@/app/workouts/[id]/comments";
import Comments, { type WorkoutComment } from "@/components/Comments";
import ProgressChart from "@/components/ProgressChart";
import SetList from "@/components/SetList";
import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { progress } from "@/lib/progress";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };

// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки с подходами, объёмом и комментариями
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
    // комментарии к тренировкам подопечного одним запросом: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment & { workout_id: string }>(
      \`select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where w.client_id = $1
        order by cm.id\`,
      [id],
    );
    return client.rows.length > 0
      ? { name: client.rows[0].name, workouts: workouts.rows, comments: comments.rows }
      : null;
  });
  if (!card) notFound();
  // поля приходят из формы, а id подопечного действие получает отсюда
  const assign = assignWorkout.bind(null, id);
  // комментарии одной тренировки
  const commentsOf = (workoutId: string) => card.comments.filter((comment) => comment.workout_id === workoutId);

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
              {/* под тренировкой, где подопечный написал, — его комментарии и ответ тренера; после отправки — снова эта карточка */}
              {commentsOf(workout.id).length > 0 && (
                <Comments
                  comments={commentsOf(workout.id)}
                  action={addComment.bind(null, workout.id, \`/clients/\${id}\`)}
                  className="mt-2 text-sm"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ProgressChart data={progress(card.workouts)} />
    </main>
  );
}
`

// Карточка подопечного — правка агента (pages-coach): цели на день и сводка недели из адреса (?week=2026-11-09). Итог дня — dayTotal
// и одно округление, Math.round при показе; дни недели считает база (дата + 0 … 6), без часов сервера
const CLIENT_PAGE_NUTRITION = chain(CLIENT_PAGE, [
  [
    `import { asUser } from "@/lib/db";
import { progress } from "@/lib/progress";
`,
    `import { asUser } from "@/lib/db";
import { dayTotal, type FoodEntry } from "@/lib/nutrition";
import { progress } from "@/lib/progress";
`,
  ],
  [
    `import { volume } from "@/lib/volume";
import { assignWorkout } from "./actions";

`,
    `import { volume } from "@/lib/volume";
import { assignWorkout, saveGoals } from "./actions";

`,
  ],
  [
    `type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };

`,
    `type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };
// Цели на день: ккал, белки, жиры и углеводы, г
type Goals = { kcal: number; protein: number; fat: number; carbs: number };
// День недели в сводке питания: ГГГГ-ММ-ДД и записи дневника за этот день (значения из json — числа)
type NutritionDay = { day: string; entries: FoodEntry[] };

`,
  ],
  [
    `
// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки с подходами, объёмом и комментариями
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
`,
    `
// Неделя сводки — из адреса, ?week=ГГГГ-ММ-ДД, первый день недели: от сегодняшней даты сводка не зависит
const DAY = /^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/;

// День «ГГГГ-ММ-ДД» по-русски: «12 ноября» (полночь по времени сервера — formatDay покажет тот же день)
const dayOf = (day: string) => formatDay(new Date(\`\${day}T00:00\`));

// Поля целей: имя в форме и подпись
const GOALS: [name: keyof Goals, label: string][] = [
  ["kcal", "Ккал"],
  ["protein", "Белки, г"],
  ["fat", "Жиры, г"],
  ["carbs", "Углеводы, г"],
];

// Карточка подопечного по id из адреса: имя; питание — цели на день и сводка недели из адреса; форма «Назначить»
// и тренировки с подходами, объёмом и комментариями
export default async function ClientPage({ params, searchParams }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
`,
  ],
  [
    `  const { id } = await params;
  const card = await asUser(uid, async (db) => {
`,
    `  const { id } = await params;
  const { week } = await searchParams;
  const weekStart = typeof week === "string" && DAY.test(week) ? week : null;
  const card = await asUser(uid, async (db) => {
`,
  ],
  [
    `    );
    return client.rows.length > 0
`,
    `    );
    // цели на день — одна строка на подопечного (0010_nutrition.sql)
    const goals = await db.query<Goals>("select kcal, protein, fat, carbs from nutrition_goals where client_id = $1", [id]);
    // неделя из адреса: семь дней от weekStart, у каждого — записи дневника. Дни считает база (дата + число дней)
    const days = weekStart
      ? await db.query<NutritionDay>(
          \`select d.day::text as day,
                  coalesce(json_agg(json_build_object('grams', f.grams, 'kcal', f.kcal, 'protein', f.protein, 'fat', f.fat,
                                                      'carbs', f.carbs) order by f.id) filter (where f.id is not null), '[]') as entries
             from (select $2::date + n as day from generate_series(0, 6) as n) d
             left join food_entries f on f.client_id = $1 and f.day = d.day
            group by d.day
            order by d.day\`,
          [id, weekStart],
        )
      : null;
    // без недели в адресе — недели, за которые есть записи: понедельник каждой (день минус номер дня недели и ещё 1)
    const weeks = await db.query<{ week: string }>(
      \`select distinct (day - (extract(isodow from day)::int - 1))::text as week
         from food_entries where client_id = $1
        order by week desc\`,
      [id],
    );
    return client.rows.length > 0
`,
  ],
  [
    `    return client.rows.length > 0
      ? { name: client.rows[0].name, workouts: workouts.rows, comments: comments.rows }
      : null;
`,
    `    return client.rows.length > 0
      ? {
          name: client.rows[0].name,
          workouts: workouts.rows,
          comments: comments.rows,
          goals: goals.rows[0],
          days: days?.rows,
          weeks: weeks.rows.map((row) => row.week),
        }
      : null;
`,
  ],
  [
    `  const assign = assignWorkout.bind(null, id);
  // комментарии одной тренировки
`,
    `  const assign = assignWorkout.bind(null, id);
  const setGoals = saveGoals.bind(null, id);
  const goals = card.goals;
  // комментарии одной тренировки
`,
  ],
  [
    `      <h1 className="text-3xl font-semibold">{card.name}</h1>

`,
    `      <h1 className="text-3xl font-semibold">{card.name}</h1>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Питание</h2>
        <p className="mt-2 text-zinc-500">
          {goals
            ? \`Цель на день: \${goals.kcal} ккал, белки \${goals.protein} г, жиры \${goals.fat} г, углеводы \${goals.carbs} г\`
            : "Целей на день пока нет"}
        </p>
        <form action={setGoals} className="mt-4 flex flex-col gap-4">
          {GOALS.map(([name, label]) => (
            <div key={name} className="flex flex-col gap-1">
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type="number"
                min={0}
                required
                defaultValue={goals?.[name]}
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </div>
          ))}
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
            Сохранить
          </button>
        </form>

        {card.days ? (
          <>
            <h3 className="mt-6 font-semibold">Неделя с {dayOf(card.days[0].day)}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {card.days.map(({ day, entries }) =>
                entries.length === 0 ? (
                  <li key={day} className="text-zinc-500">
                    {dayOf(day)}: нет записей
                  </li>
                ) : (
                  // итог дня — dayTotal, сумма порций; округление одно, при показе
                  <li key={day}>
                    {dayOf(day)}: {Math.round(dayTotal(entries))} ккал{goals && \` из \${goals.kcal}\`}
                    <span className="block text-sm text-zinc-500">
                      белки {Math.round(dayTotal(entries, "protein"))} г{goals && \` из \${goals.protein}\`}, жиры{" "}
                      {Math.round(dayTotal(entries, "fat"))} г{goals && \` из \${goals.fat}\`}, углеводы{" "}
                      {Math.round(dayTotal(entries, "carbs"))} г{goals && \` из \${goals.carbs}\`}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </>
        ) : card.weeks.length === 0 ? (
          <p className="mt-6 text-zinc-500">Записей в дневнике пока нет: подопечный ведёт его сам, в разделе «Питание».</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {card.weeks.map((start) => (
              <li key={start}>
                <Link href={\`/clients/\${id}?week=\${start}\`} className="underline">
                  Неделя с {dayOf(start)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

`,
  ],
])

// Конец действий карточки (s07) — дословно; правка агента (pages-goals) дописывает за ним цели на день
const ASSIGN_END = `  // карточка подопечного покажет новую тренировку сразу после нажатия
  revalidatePath(\`/clients/\${clientId}\`);
}
`

const GOALS_ACTION = `
// Тренер ставит подопечному clientId цели на день из формы: ккал, белки, жиры и углеводы, г (docs/nutrition.md) — целые числа.
// Целей у подопечного одна строка: новые заменяют прежние. Цели чужому подопечному не даст поставить RLS
// (политика «тренер ведёт цели своих»)
export async function saveGoals(clientId: string, form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const goals = ["kcal", "protein", "fat", "carbs"].map((name) => Number(form.get(name)));
  // целые, не меньше нуля, ккал — больше нуля; иначе ничего не сохраняем (пустое поле Number превращает в 0)
  if (!goals.every((n) => Number.isInteger(n) && n >= 0) || goals[0] === 0) return;
  await asUser(uid, (db) =>
    db.query(
      \`insert into nutrition_goals (client_id, kcal, protein, fat, carbs) values ($1, $2, $3, $4, $5)
       on conflict (client_id) do update
         set kcal = excluded.kcal, protein = excluded.protein, fat = excluded.fat, carbs = excluded.carbs\`,
      [clientId, ...goals],
    ),
  );
  // карточка покажет новые цели сразу после нажатия
  revalidatePath(\`/clients/\${clientId}\`);
}
`

// Разделы меню (s20) — дословно; правка агента (pages-nav): у подопечного — «Питание»
const NAV_LINKS = `// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [["/workouts", "Мои тренировки"]],
};
`

const NAV_LINKS_NUTRITION = `// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки и дневник питания
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
  ],
};
`

// Меню подопечного в сквозном тесте s20 — дословно; правка агента (pages-e2e): меню стало длиннее — тест знает о «Питании».
// Запустить его здесь нельзя: Наташи и Веры в базе этой сессии нет (база сбрасывается), общий прогон — в s26
const VERA_MENU = `  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки"]);
`

const VERA_MENU_NUTRITION = `  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание"]);
`

// Тест на правило «одна функция, одно округление» — агент дописывает его в lib/nutrition.test.ts: итог дня на тех же трёх строках
// показывает shown(dayTotal(…)) — 511 ккал. До правки красный: одной функции показа нет
const ONE_TEST = chain(CALC_TEST, [
  [
    `import { expect, test } from "vitest";
import { checkPer100, dayTotal, parseAmount, portion } from "./nutrition";

`,
    `import { expect, test } from "vitest";
import { checkPer100, dayTotal, parseAmount, portion, shown } from "./nutrition";

`,
  ],
  [
    `  expect(dayTotal(DAY, "protein")).toBeCloseTo(21.215);
});
`,
    `  expect(dayTotal(DAY, "protein")).toBeCloseTo(21.215);
});

// Один итог на двоих (docs/nutrition.md): экран подопечного и сводка тренера показывают итог дня одинаково — shown(dayTotal(…)),
// одно округление при показе. Сумма уже округлённых строк — 158 + 106 + 246 = 510 — другой итог того же дня
test("итог дня у подопечного и в сводке тренера — одно число: 511 ккал", () => {
  expect(shown(dayTotal(DAY), "ккал")).toBe("511 ккал");
  // строка порции — тем же показом: 158,4 → 158 ккал
  expect(shown(portion(352, 45), "ккал")).toBe("158 ккал");
});
`,
  ],
])

// Одна функция показа — правка агента (one-lib): до целых и с единицей, округление только здесь
const ONE_LIB = chain(CALC_LIB, [
  [
    `// Питание: порция, правдоподобие ккал, числа из формы и итог дня. Правила — docs/nutrition.md, тесты — lib/nutrition.test.ts.
// Значения с этикетки — на 100 г, граммы — вес порции. Расчёт ничего не округляет: округляют при показе.

`,
    `// Питание: порция, правдоподобие ккал, числа из формы и итог дня. Правила — docs/nutrition.md, тесты — lib/nutrition.test.ts.
// Значения с этикетки — на 100 г, граммы — вес порции. Расчёт ничего не округляет: округляет shown, при показе.

`,
  ],
  [
    `  return entries.reduce((sum, entry) => sum + portion(entry[value], entry.grams), 0);
}
`,
    `  return entries.reduce((sum, entry) => sum + portion(entry[value], entry.grams), 0);
}

// Число для показа — одна функция для экрана подопечного и сводки тренера: до целых и с единицей, «511 ккал».
// Округление только здесь, один раз: порции и итог дня приходят сюда как есть
export function shown(value: number, unit: string): string {
  return \`\${Math.round(value)} \${unit}\`;
}
`,
  ],
])

// Дневник — правка агента (one-code): «Итого» — dayTotal, как в сводке тренера; порция и итог показываются через shown
const NUTRITION_PAGE_ONE = chain(NUTRITION_PAGE, [
  [
    `import { asUser } from "@/lib/db";
import { portion, type FoodEntry } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";
`,
    `import { asUser } from "@/lib/db";
import { dayTotal, portion, shown, type FoodEntry } from "@/lib/nutrition";
import { currentUser } from "@/lib/session";
`,
  ],
  [
    `  });
  // ккал каждой порции — до целых, как на экране; «Итого» — сумма показанных строк
  const lines = data.entries.map((entry) => ({ ...entry, portionKcal: Math.round(portion(entry.kcal, entry.grams)) }));
  const total = lines.reduce((sum, line) => sum + line.portionKcal, 0);
  // день — в действии формы: запись попадёт в этот день
`,
    `  });
  // ккал порции и итог дня — без округления, их показывает shown: один раз, при показе. Итог — dayTotal, как в сводке тренера
  // день — в действии формы: запись попадёт в этот день
`,
  ],
  [
    `
      {lines.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
`,
    `
      {data.entries.length === 0 ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
`,
  ],
  [
    `          <ul className="mt-6 flex flex-col gap-2">
            {lines.map((line) => (
              <li key={line.id}>
                {line.product}, {line.grams.toLocaleString("ru-RU")} г — {line.portionKcal} ккал
              </li>
`,
    `          <ul className="mt-6 flex flex-col gap-2">
            {data.entries.map((entry) => (
              <li key={entry.id}>
                {entry.product}, {entry.grams.toLocaleString("ru-RU")} г — {shown(portion(entry.kcal, entry.grams), "ккал")}
              </li>
`,
  ],
  [
    `          </ul>
          <p className="mt-4 text-xl font-semibold">Итого: {total} ккал</p>
        </>
`,
    `          </ul>
          <p className="mt-4 text-xl font-semibold">Итого: {shown(dayTotal(data.entries), "ккал")}</p>
        </>
`,
  ],
])

// Сводка тренера — правка агента (one-coach): Math.round при показе — та же функция shown, что на экране подопечного
const CLIENT_PAGE_ONE = chain(CLIENT_PAGE_NUTRITION, [
  [
    `import { asUser } from "@/lib/db";
import { dayTotal, type FoodEntry } from "@/lib/nutrition";
import { progress } from "@/lib/progress";
`,
    `import { asUser } from "@/lib/db";
import { dayTotal, shown, type FoodEntry } from "@/lib/nutrition";
import { progress } from "@/lib/progress";
`,
  ],
  [
    `                ) : (
                  // итог дня — dayTotal, сумма порций; округление одно, при показе
                  <li key={day}>
`,
    `                ) : (
                  // итог дня — dayTotal, показывает shown: как на экране подопечного
                  <li key={day}>
`,
  ],
  [
    `                  <li key={day}>
                    {dayOf(day)}: {Math.round(dayTotal(entries))} ккал{goals && \` из \${goals.kcal}\`}
                    <span className="block text-sm text-zinc-500">
`,
    `                  <li key={day}>
                    {dayOf(day)}: {shown(dayTotal(entries), "ккал")}{goals && \` из \${goals.kcal}\`}
                    <span className="block text-sm text-zinc-500">
`,
  ],
  [
    `                    <span className="block text-sm text-zinc-500">
                      белки {Math.round(dayTotal(entries, "protein"))} г{goals && \` из \${goals.protein}\`}, жиры{" "}
                      {Math.round(dayTotal(entries, "fat"))} г{goals && \` из \${goals.fat}\`}, углеводы{" "}
                      {Math.round(dayTotal(entries, "carbs"))} г{goals && \` из \${goals.carbs}\`}
                    </span>
`,
    `                    <span className="block text-sm text-zinc-500">
                      белки {shown(dayTotal(entries, "protein"), "г")}{goals && \` из \${goals.protein}\`}, жиры{" "}
                      {shown(dayTotal(entries, "fat"), "г")}{goals && \` из \${goals.fat}\`}, углеводы{" "}
                      {shown(dayTotal(entries, "carbs"), "г")}{goals && \` из \${goals.carbs}\`}
                    </span>
`,
  ],
])

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s21-nutrition: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

// Несколько замен подряд, каждая — ровно одного вхождения
function chain(text, pairs) {
  return pairs.reduce((acc, [find, replace]) => replaceOnce(acc, find, replace), text)
}

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })

// Дневник Анны за 12 ноября — день в адресе; продукт, порция и числа с этикетки на 100 г, как на упаковке — с запятой
const DIARY = '/nutrition?day=2026-11-12'
const food = (product, grams, kcal, protein, fat, carbs) => ({
  url: DIARY,
  fill: { Продукт: product, 'Порция, г': grams, Ккал: kcal, 'Белки, г': protein, 'Жиры, г': fat, 'Углеводы, г': carbs },
  click: 'Записать',
})

// Ответы агента — авторские, по выводу его шагов; что видно в строках Write / Edit / Run, ответ не повторяет
const ASK_SCHEMA_REPLY =
  'Цели на день — nutrition_goals, дневник — food_entries: продукт, граммы и значения с этикетки на 100 г. ' +
  'RLS сразу: подопечный ведёт свой дневник, тренер читает дневник своих; Света дневник Анны не видит.'
const ASK_CALC_REPLY =
  'portion — значение × граммы / 100, checkPer100 выше 900 ккал на 100 г спрашивает «это кДж?», ' +
  'parseAmount понимает запятую, dayTotal складывает порции без округления.'
const ASK_PAGES_REPLY =
  'Дневник — /nutrition?day=…: ккал каждой порции до целых и «Итого» — сумма этих строк; запись — граммы и числа с этикетки. ' +
  'На карточке подопечного — цели на день и сводка недели по ?week=…: итог дня через dayTotal. ' +
  'В меню подопечного — «Питание», в e2e/first-run.spec.ts тоже.'
const ASK_ONE_REPLY =
  'Одна функция показа — shown: округляет один раз, при показе. «Итого» у подопечной теперь shown(dayTotal(…)), ' +
  'как и в сводке тренера.'

export default {
  id: 's21-nutrition',
  from: 's20-first-run',
  date: '2026-11-12T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // правила словами — пишет человек, до схемы и кода
    { id: 'nutrition-doc', write: 'docs/nutrition.md', content: NUTRITION_DOC },
    { id: 'c-nutrition-doc', commit: 'Питание: правила словами' },
    {
      // Accept edits: файлы — без вопроса, psql и vitest — с вопросом [y / n]
      id: 'ask-schema',
      agent: {
        prompt:
          'Сделай схему питания по docs/nutrition.md: цели тренера и дневник подопечного, RLS сразу. Миграцию применяй с моего подтверждения',
        reply: ASK_SCHEMA_REPLY,
      },
      steps: [
        { id: 'n-sql', write: 'supabase/migrations/0010_nutrition.sql', content: NUTRITION_SQL },
        { id: 'n-apply', run: 'psql -f supabase/migrations/0010_nutrition.sql' },
        // негативный тест с базой: чужой не видит дневник и не пишет в него
        { id: 'n-test', write: 'test/nutrition.test.ts', content: NUTRITION_DB_TEST },
        { id: 'n-run', run: 'npx vitest run test/nutrition.test.ts' },
      ],
    },
    {
      // тесты из правил — до кода: красные, модуля нет; потом код — зелёные
      id: 'ask-calc',
      agent: { prompt: 'Расчёт по правилам: сначала тесты, потом код', reply: ASK_CALC_REPLY },
      steps: [
        { id: 'calc-test', write: 'lib/nutrition.test.ts', content: CALC_TEST },
        { id: 'calc-red', run: 'npx vitest run lib/nutrition.test.ts' },
        { id: 'calc-code', write: 'lib/nutrition.ts', content: CALC_LIB },
        { id: 'calc-green', run: 'npx vitest run lib/nutrition.test.ts' },
      ],
    },
    { id: 'c-calc', commit: 'Питание: схема, RLS, расчёт порции' },
    {
      // Accept edits: только правки; страницы проверяет браузер ниже
      id: 'ask-pages',
      agent: {
        prompt: 'Страницы: дневник подопечного за день и цели со сводкой у тренера на карточке. День и неделя — в адресе',
        reply: ASK_PAGES_REPLY,
      },
      steps: [
        // подводный камень: «Итого» — сумма уже округлённых строк
        { id: 'pages-anna', write: 'app/nutrition/page.tsx', content: NUTRITION_PAGE },
        // сверх таблицы плана: действие записи — свой файл (план называет его в pages-anna)
        { id: 'pages-actions', write: 'app/nutrition/actions.ts', content: NUTRITION_ACTIONS },
        // сводка тренера: dayTotal и одно округление
        { id: 'pages-coach', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE, replace: CLIENT_PAGE_NUTRITION },
        // сверх таблицы плана: действие формы целей — к действиям карточки
        { id: 'pages-goals', edit: 'app/clients/[id]/actions.ts', find: ASSIGN_END, replace: ASSIGN_END + GOALS_ACTION },
        { id: 'pages-nav', edit: 'components/Nav.tsx', find: NAV_LINKS, replace: NAV_LINKS_NUTRITION },
        // сверх таблицы плана: тест s20 знает меню подопечного дословно
        { id: 'pages-e2e', edit: 'e2e/first-run.spec.ts', find: VERA_MENU, replace: VERA_MENU_NUTRITION },
      ],
    },
    { id: 'c-pages', commit: 'Питание: дневник и сводка' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: login('marina@example.com') },
    // цели на день — Марина на карточке Анны (подопечная 1 в seed.sql)
    { id: 'goals-set', browser: { url: '/clients/1', fill: { Ккал: '1800', 'Белки, г': '120', 'Жиры, г': '60', 'Углеводы, г': '200' }, click: 'Сохранить' } },
    { id: 'login-anna', browser: login('anna@example.com') },
    // три продукта 12 ноября: числа с этикеток на 100 г, порции — граммы
    { id: 'food-1', browser: food('Овсяные хлопья', '45', '352', '12,3', '6,2', '61,8') },
    { id: 'food-2', browser: food('Молоко 2,5 %', '200', '53', '2,8', '2,5', '4,7') },
    { id: 'food-3', browser: food('Гречка ядрица', '80', '308', '12,6', '3,3', '57,1') },
    // строки 158 + 106 + 246 — «Итого: 510 ккал»
    { id: 'anna-day', browser: { url: DIARY } },
    { id: 'login-marina2', browser: login('marina@example.com') },
    // сводка недели с понедельника 9 ноября: 158,4 + 106 + 246,4 = 510,8 — «12 ноября: 511 ккал из 1800»
    { id: 'coach-day', browser: { url: '/clients/1?week=2026-11-09' } },
    {
      // Accept edits: сначала тест — красный, потом одна функция показа для обоих экранов — зелёный
      id: 'ask-one',
      agent: {
        prompt: 'У подопечной и у тренера за один день разные итоги. Одна функция и одно округление для обоих экранов, сначала тест',
        reply: ASK_ONE_REPLY,
      },
      steps: [
        { id: 'one-test', edit: 'lib/nutrition.test.ts', find: CALC_TEST, replace: ONE_TEST },
        { id: 'one-red', run: 'npx vitest run lib/nutrition.test.ts' },
        // сверх таблицы плана: функция показа — в модуле расчёта, тест красный от её отсутствия
        { id: 'one-lib', edit: 'lib/nutrition.ts', find: CALC_LIB, replace: ONE_LIB },
        { id: 'one-code', edit: 'app/nutrition/page.tsx', find: NUTRITION_PAGE, replace: NUTRITION_PAGE_ONE },
        // сверх таблицы плана: «для обоих экранов» — сводка тренера через ту же функцию
        { id: 'one-coach', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE_NUTRITION, replace: CLIENT_PAGE_ONE },
        { id: 'one-green', run: 'npx vitest run lib/nutrition.test.ts' },
      ],
    },
    { id: 'c-one', commit: 'Один итог дня на двоих' },
    { id: 'login-anna2', browser: login('anna@example.com') },
    // тот же день — «Итого: 511 ккал», как в сводке Марины
    { id: 'anna-day2', browser: { url: DIARY } },
  ],
}
