// Сессия 15: рекорды и отчёт тренера (утро 6 ноября; база — из миграций и seed, db: true). Третья сессия недели 2, ролик дня 10.
// Первым шагом — схема строки тренировки: миграции 0001–0005 и seed.sql рекордер применил подряд на чистой базе, и \d workout_items
// показывает копию из s14 (exercise_id, sets, reps) и связь со шаблоном on delete set null.
// Человек пишет определения словами — docs/report.md: отчёт тренера за месяц по неделям с понедельника по воскресенье (неделя на стыке
// месяцев входит целиком), у каждого подопечного по неделе — тренировок, объём (сумма вес × повторы), средний объём на тренировку
// и рекорды по названию тренировки до конца недели, как lib/records.ts; пример — Анна, неделя 19–25 октября, по seed.sql.
// Про неделю без тренировок там ничего нет. Агент сначала пишет тесты (lib/report.test.ts) — красные, модуля ещё нет, потом код
// (lib/report.ts) и страницу /report?month=2026-10 — месяц в адресе, настоящие часы в кадр не попадают; тесты зелёные.
// Подводный камень: у Марины в октябре три пустые недели (28 сентября — 4 октября, 5–11 и 12–18 октября), средний объём 0 / 0 —
// на странице «Средний объём: NaN кг». Человек дописывает правило: неделя без тренировок — «тренировок не было», без среднего.
// Агент — сначала тест (неделя 5–11 октября, красный: NaN вместо «нет среднего»), потом код и страница; тест зелёный, NaN на странице нет.
// Запись с середины цепочки: node scripts/record-session.mjs --from s15-report (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: все запросы — Accept edits (правки без вопроса, запуск vitest — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Определения словами — пишет человек. Числа примера посчитаны вручную по supabase/seed.sql
const REPORT_DEF = `# Отчёт тренера за месяц

Тренер открывает отчёт по адресу \`/report?month=2026-10\`: месяц — в адресе, от сегодняшней даты отчёт не зависит. В отчёте — все подопечные тренера, у каждого — по неделям месяца.

## Недели

- Неделя — с понедельника по воскресенье.
- В отчёт месяца входят все недели, где есть хотя бы один день этого месяца. Неделя на стыке месяцев входит целиком, все семь дней, — и в отчёт обоих месяцев.
- У октября 2026 пять недель: 28 сентября — 4 октября, 5–11, 12–18, 19–25 октября и 26 октября — 1 ноября.

## Что в неделе

- **Тренировок** — сколько тренировок пришлось на эту неделю.
- **Объём** — сумма «вес × повторы» по всем подходам этих тренировок, кг, до целых.
- **Средний объём** — на тренировку: объём недели, делённый на число тренировок, кг, до целых.
- **Рекорды** — как \`lib/records.ts\`: у каждого названия тренировки самый большой вес подхода за всё время до конца недели.

## Пример: октябрь 2026, Анна, неделя 19–25 октября

Из \`supabase/seed.sql\`:

- «Ноги», 19 октября: 50 × 10 три раза — 1500 кг;
- «Спина и бицепс», 21 октября: 40 × 12, 40 × 10, 45 × 8 — 480 + 400 + 360 = 1240 кг;
- «Грудь и плечи», 26 октября, — уже следующая неделя.

Тренировок — 2, объём — 2740 кг, средний объём — 1370 кг. Рекорды на конец недели: «Ноги» — 50 кг, «Спина и бицепс» — 45 кг.
`

// Правило про пустую неделю — человек дописывает его в конец docs/report.md после «NaN кг» на странице
const REPORT_DEF_END = 'Рекорды на конец недели: «Ноги» — 50 кг, «Спина и бицепс» — 45 кг.\n'
const REPORT_RULE = `${REPORT_DEF_END}
## Неделя без тренировок

Вместо числа тренировок, объёма и среднего — «тренировок не было». Среднего у такой недели нет: делить не на что, а 0 кг выглядел бы как тренировки с нулевым объёмом. Рекорды — как у любой недели.
`

// Тесты из docs/report.md — пишет агент до кода: недели октября и неделя Анны 19–25 октября, числа — по supabase/seed.sql.
// Тренировка 26 октября — в данных теста: она не должна попасть ни в неделю, ни в её рекорды
const REPORT_TEST = `import { expect, test } from "vitest";
import { monthReport } from "./report";

// подходы «вес × повторы»
const sets = (...pairs: [number, number][]) =>
  pairs.map(([weight, reps]) => ({ weight, reps }));

// Тренировки Анны из supabase/seed.sql
const ANNA = [
  // 50 × 10 три раза = 1500 кг
  { title: "Ноги", day: "2026-10-19", sets: sets([50, 10], [50, 10], [50, 10]) },
  // 40 × 12 + 40 × 10 + 45 × 8 = 480 + 400 + 360 = 1240 кг
  { title: "Спина и бицепс", day: "2026-10-21", sets: sets([40, 12], [40, 10], [45, 8]) },
  // 26 октября — уже следующая неделя
  { title: "Грудь и плечи", day: "2026-10-26", sets: sets([30, 10], [30, 10], [35, 8]) },
];

test("недели октября — с понедельника 28 сентября по воскресенье 1 ноября", () => {
  const weeks = monthReport("2026-10", ANNA).map((week) => \`\${week.start} — \${week.end}\`);
  expect(weeks).toEqual([
    "2026-09-28 — 2026-10-04",
    "2026-10-05 — 2026-10-11",
    "2026-10-12 — 2026-10-18",
    "2026-10-19 — 2026-10-25",
    "2026-10-26 — 2026-11-01",
  ]);
});

test("неделя Анны 19–25 октября: 2 тренировки, 2740 кг, средний 1370", () => {
  const week = monthReport("2026-10", ANNA).find((w) => w.start === "2026-10-19");
  expect(week).toEqual({
    start: "2026-10-19",
    end: "2026-10-25",
    workouts: 2,
    volume: 1500 + 1240,
    average: 2740 / 2,
    // самый большой вес по названию тренировки до конца недели
    records: new Map([
      ["Ноги", 50],
      ["Спина и бицепс", 45],
    ]),
  });
});
`

// Тест на правило — агент дописывает его в конец файла: неделя 5–11 октября без тренировок. До исправления красный: средний — NaN
const EMPTY_TEST = `${REPORT_TEST}
// Неделя без тренировок (docs/report.md): «тренировок не было», без среднего
test("неделя 5–11 октября без тренировок — среднего нет", () => {
  const week = monthReport("2026-10", ANNA).find((w) => w.start === "2026-10-05");
  expect(week?.workouts, "тренировок").toBe(0);
  expect(week?.volume, "объём").toBe(0);
  expect(week?.average, "средний").toBeNull();
});
`

// Отчёт — пишет агент. Ошибка правдоподобная: средний объём — объём, делённый на число тренировок, а у пустой недели это 0 / 0 = NaN.
// Дни — строки ГГГГ-ММ-ДД (в базе — day::text), поэтому недели не зависят от часового пояса сервера
const REPORT_LIB = `// Отчёт тренера за месяц по неделям — определения в docs/report.md, тесты — lib/report.test.ts.
// Дни — строки «ГГГГ-ММ-ДД», как в базе (day::text): недели считаются без часов и часового пояса.
import { records } from "./records";
import { volume, type WorkoutSet } from "./volume";

export type ReportWorkout = { title: string; day: string; sets: WorkoutSet[] };

// Неделя отчёта: понедельник и воскресенье; тренировок, объём и средний объём на тренировку, кг;
// рекорды по названию тренировки за всё время до конца недели
export type ReportWeek = {
  start: string;
  end: string;
  workouts: number;
  volume: number;
  average: number;
  records: Map<string, number>;
};

type Week = { start: string; end: string };

// День «ГГГГ-ММ-ДД» плюс n дней (счёт в UTC — сутки всегда 24 часа)
function addDays(day: string, n: number): string {
  const date = new Date(\`\${day}T00:00:00Z\`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

// Недели месяца «ГГГГ-ММ» с понедельника по воскресенье — все, где есть хотя бы один день месяца
function weeksOf(month: string): Week[] {
  const first = \`\${month}-01\`;
  // понедельник недели, где 1-е число: у getUTCDay() воскресенье — 0, понедельник — 1
  let start = addDays(first, -((new Date(\`\${first}T00:00:00Z\`).getUTCDay() + 6) % 7));
  const weeks: Week[] = [];
  while (start.slice(0, 7) <= month) {
    weeks.push({ start, end: addDays(start, 6) });
    start = addDays(start, 7);
  }
  return weeks;
}

// Отчёт подопечного за месяц: по неделям — его тренировки с днём в неделе, их объём и средний, рекорды до конца недели
export function monthReport(month: string, workouts: ReportWorkout[]): ReportWeek[] {
  return weeksOf(month).map(({ start, end }) => {
    const week = workouts.filter((w) => w.day >= start && w.day <= end);
    const total = volume(week.flatMap((w) => w.sets));
    return {
      start,
      end,
      workouts: week.length,
      volume: total,
      average: Math.round(total / week.length),
      records: records(workouts.filter((w) => w.day <= end)),
    };
  });
}
`

// Исправление по правилу — агент: у недели без тренировок среднего нет (null), а не 0 / 0
const REPORT_LIB_EMPTY = replaceOnce(
  replaceOnce(
    replaceOnce(
      REPORT_LIB,
      '// рекорды по названию тренировки за всё время до конца недели\n',
      '// у недели без тренировок среднего нет — null (docs/report.md); рекорды по названию тренировки за всё время до конца недели\n',
    ),
    '  average: number;\n',
    '  average: number | null;\n',
  ),
  '      average: Math.round(total / week.length),\n',
  '      average: week.length === 0 ? null : Math.round(total / week.length),\n',
)

// Страница отчёта у тренера — пишет агент. Числа недели выводит как есть: у пустой недели на экране «Средний объём: NaN кг»
const WEEK_NUMBERS = `                <p>Тренировок: {week.workouts}</p>
                <p>Объём: {week.volume} кг</p>
                <p>Средний объём: {week.average} кг</p>
`
const WEEK_NUMBERS_EMPTY = `                {week.workouts === 0 ? (
                  <p className="text-zinc-500">тренировок не было</p>
                ) : (
                  <>
                    <p>Тренировок: {week.workouts}</p>
                    <p>Объём: {week.volume} кг</p>
                    <p>Средний объём: {week.average} кг</p>
                  </>
                )}
`
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
${WEEK_NUMBERS}                {week.records.size > 0 && (
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
const REPORT_PAGE_EMPTY = replaceOnce(REPORT_PAGE, WEEK_NUMBERS, WEEK_NUMBERS_EMPTY)

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s15-report: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

export default {
  id: 's15-report',
  from: 's14-programs',
  date: '2026-11-06T10:00:00+03:00',
  db: true,
  steps: [
    // схема после 0004–0005 на чистой базе: копия упражнения в строке тренировки, связь со шаблоном — on delete set null
    { id: 'schema', run: 'psql -c "\\d workout_items"' },
    // определения словами — пишет человек, до тестов и кода; про неделю без тренировок здесь ничего нет
    { id: 'report-def', write: 'docs/report.md', content: REPORT_DEF },
    { id: 'c-report-def', commit: 'Отчёт тренера словами' },
    {
      // Accept edits: тест пишется без вопроса, запуск vitest — с вопросом [y / n]
      id: 'ask-report-tests',
      agent: {
        prompt: 'Сначала тесты из docs/report.md, код потом',
        reply:
          'Тесты — по docs/report.md: недели октября идут с понедельника 28 сентября по воскресенье 1 ноября; ' +
          'неделя Анны 19–25 октября по seed.sql — 2 тренировки, объём 1500 + 1240 = 2740 кг, средний 1370 кг, ' +
          'рекорды «Ноги» — 50 кг и «Спина и бицепс» — 45 кг. Красные — так и должно быть: lib/report.ts ещё нет.',
      },
      steps: [
        { id: 'report-test', write: 'lib/report.test.ts', content: REPORT_TEST },
        // красный: модуля lib/report.ts ещё нет
        { id: 'report-red', run: 'npx vitest run lib/report.test.ts' },
      ],
    },
    {
      id: 'ask-report-code',
      agent: {
        prompt: 'Теперь код: lib/report.ts и страница /report?month=2026-10 у тренера',
        reply:
          'monthReport() — недели месяца с понедельника по воскресенье; у каждой — тренировки этой недели, объём, ' +
          'средний объём на тренировку и рекорды через records() из lib/records.ts по тренировкам до конца недели. ' +
          'Страница — по подопечным тренера, месяц берёт из адреса. Тесты зелёные. Открой /report?month=2026-10.',
      },
      steps: [
        { id: 'report-lib', write: 'lib/report.ts', content: REPORT_LIB },
        { id: 'report-page', write: 'app/report/page.tsx', content: REPORT_PAGE },
        { id: 'report-green', run: 'npx vitest run lib/report.test.ts' },
      ],
    },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    // подводный камень: у пустых недель 28 сентября — 4 октября, 5–11 и 12–18 октября средний объём 0 / 0 — «NaN кг»
    { id: 'report-view', browser: { url: '/report?month=2026-10' } },
    // правило про пустую неделю решает человек
    { id: 'report-rule', edit: 'docs/report.md', find: REPORT_DEF_END, replace: REPORT_RULE },
    {
      id: 'ask-empty',
      agent: {
        prompt: 'В docs/report.md новое правило про пустую неделю. Сначала тест, потом код',
        reply:
          'Тест по правилу — неделя 5–11 октября: 0 тренировок, объём 0, среднего нет; до правки он красный — средний NaN. ' +
          'Теперь у пустой недели среднего нет (null), а страница пишет «тренировок не было».',
      },
      steps: [
        { id: 'empty-test', edit: 'lib/report.test.ts', find: REPORT_TEST, replace: EMPTY_TEST },
        // красный: у пустой недели средний — NaN, а по правилу среднего нет
        { id: 'empty-red', run: 'npx vitest run lib/report.test.ts' },
        { id: 'empty-fix', edit: 'lib/report.ts', find: REPORT_LIB, replace: REPORT_LIB_EMPTY },
        { id: 'empty-page', edit: 'app/report/page.tsx', find: REPORT_PAGE, replace: REPORT_PAGE_EMPTY },
        { id: 'empty-green', run: 'npx vitest run lib/report.test.ts' },
      ],
    },
    { id: 'report-view2', browser: { url: '/report?month=2026-10' } },
    { id: 'c-report', commit: 'Отчёт тренера за месяц по неделям' },
  ],
}
