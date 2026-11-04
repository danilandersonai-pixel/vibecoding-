// Сессия 8: отладка, деление пополам, рефакторинг, наставник. База — из миграций и seed (db: true), тренировок снова пять.
// Агент выводит на карточке подопечного у тренера подходы и объём каждой тренировки: подходы — одним запросом (left join и json_agg
// с filter), объём — volume(). Марина назначает Анне «Ноги» на 4 ноября — у новой тренировки подходов нет, json_agg без строк даёт null,
// и workout.sets.map роняет страницу: TypeError и стектрейс с app/clients/[id]/page.tsx в выводе сервера. Анна отдаёт агенту строку
// ошибки и первую строку стектрейса дословно — «найди причину, пока ничего не исправляй»; агент читает страницу и называет причину,
// затем исправляет её в запросе (coalesce(…, '[]')), а не проверкой в разметке: «Ноги» с объёмом 0. Дальше четыре маленьких коммита
// (целое число, «Упрости lib/volume.ts», подпись, подсказка «Подходов пока нет»); «упрости» убирает у reduce начальное значение,
// и пустая тренировка бросает TypeError. npm test красный, git bisect run по тесту объёма находит «Упростить подсчёт объёма»,
// git revert возвращает зелёные тесты. Рефакторинг: общий вывод подходов — components/SetList.tsx, тесты зелёные, git diff --stat.
// Режим наставника по политике тренера в 0002_rls.sql (только чтение и три вопроса), журнал запросов docs/prompts.md и миграция
// 0003_set_note.sql (заметка к подходу до 200 знаков) — применяется с подтверждения. Запись с середины цепочки:
// node scripts/record-session.mjs --from s08-debug (из course/). Id шагов постоянные: на них ссылаются уроки.

// Страницы с базой при cacheComponents (как в s06): страница ждёт данных целиком
const INSTANT = `// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;
`

// Карточка подопечного. После s07 — без подходов и объёма (вариант CLIENT_PAGE_S07 должен совпасть с файлом дословно, иначе
// рекордер скажет «find не найден»). С ask-volumes тренировки идут одним запросом с подходами: left join оставляет тренировку без
// подходов, json_agg собирает подходы в массив, а filter отбрасывает пустую строку left join — и у тренировки без подходов
// агрегат не получает ни одной строки: json_agg возвращает null, а не []. Тип sets этого не знает.
const CLIENT_QUERY_S07 = `    const workouts = await db.query<{ id: string; title: string; day: Date }>(
      "select id, title, day from workouts where client_id = $1 order by day",
      [id],
    );`

const AGG_NULL = 'json_agg(s order by s.id) filter (where s.id is not null)'
const AGG_EMPTY = `coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]')`
const clientQuery = (agg) => `    // тренировки с подходами одним запросом: left join берёт и тренировки без подходов, json_agg собирает подходы в массив
    const workouts = await db.query<Workout>(
      \`select w.id, w.title, w.day, ${agg} as sets
         from workouts w left join sets s on s.workout_id = w.id
        where w.client_id = $1
        group by w.id
        order by w.day\`,
      [id],
    );`

const WORKOUT_TYPE = `
// Тренировка подопечного с подходами: id подхода из json_agg — число
type Workout = { id: string; title: string; day: Date; sets: { id: number; weight: number; reps: number }[] };
`

// Подходы тренировки на карточке: строкой «50 кг × 10» — как на странице тренировки; потом их общий вывод — components/SetList.tsx
const CLIENT_SETS = `              <ul className="mt-1 text-sm">
                {workout.sets.map((set) => (
                  <li key={set.id}>
                    {set.weight} кг × {set.reps}
                  </li>
                ))}
              </ul>
`
const CLIENT_SETS_COMPONENT = `              <SetList sets={workout.sets} className="mt-1 text-sm" />
`
const VOLUME_TEXT = 'Объём: {volume(workout.sets)} кг'
const VOLUME_LABEL = 'Объём, кг: {volume(workout.sets)}'

const SETLIST_IMPORT = 'import SetList from "@/components/SetList";\n'
const VOLUME_IMPORT = 'import { volume } from "@/lib/volume";\n'

// Карточка подопечного: варианты по ходу сессии. Без sets — как после s07 (только название и дата)
const clientPage = ({ setListImport = '', volumeImport = VOLUME_IMPORT, type = WORKOUT_TYPE, query, sets = '', volumeText }) => `import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
${setListImport}import { formatDay } from "@/lib/dates";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
${volumeImport}import { assignWorkout } from "./actions";

export const metadata: Metadata = { title: "Подопечный" };

${INSTANT}${type}
// Карточка подопечного по id из адреса: имя, форма «Назначить» и тренировки${volumeText ? ' с подходами и объёмом' : ''}
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const card = await asUser(uid, async (db) => {
    const client = await db.query<{ name: string }>("select name from clients where id = $1", [id]);
${query}
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
${sets}${volumeText ? `              <p className="text-sm font-medium">${volumeText}</p>\n` : ''}            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

const CLIENT_PAGE_S07 = clientPage({ volumeImport: '', type: '', query: CLIENT_QUERY_S07 })
const CLIENT_PAGE_VOLUMES = clientPage({ query: clientQuery(AGG_NULL), sets: CLIENT_SETS, volumeText: VOLUME_TEXT })
const CLIENT_PAGE_LABEL = clientPage({ query: clientQuery(AGG_EMPTY), sets: CLIENT_SETS, volumeText: VOLUME_LABEL })
const CLIENT_PAGE_SETLIST = clientPage({
  setListImport: SETLIST_IMPORT,
  query: clientQuery(AGG_EMPTY),
  sets: CLIENT_SETS_COMPONENT,
  volumeText: VOLUME_LABEL,
})

// Страница тренировки. После s07 — список подходов, объём и форма «Вес, кг», «Повторы»; дальше подсказка, SetList и поле «Заметка»
const WORKOUT_SETS = `      <ul className="mt-6 flex flex-col gap-1">
        {workout.sets.map((set) => (
          <li key={set.id}>
            {set.weight} кг × {set.reps}
          </li>
        ))}
      </ul>
`
const hintSets = (list) => `      {workout.sets.length === 0 ? (
        <p className="mt-6 text-zinc-500">Подходов пока нет</p>
      ) : (
${list}      )}
`
const WORKOUT_SETS_HINT = hintSets(WORKOUT_SETS.replace(/^/gm, '  '))
const WORKOUT_SETS_COMPONENT = hintSets('        <SetList sets={workout.sets} className="mt-6 flex flex-col gap-1" />\n')

// Поле заметки: необязательное, до 200 знаков (столько пропустит и база). Подпись — «Заметка»: по ней поле находят шаги браузера
const NOTE_FIELD = `        <div className="flex flex-col gap-1">
          <label htmlFor="note">Заметка</label>
          <input
            id="note"
            name="note"
            maxLength={200}
            placeholder="Необязательно, до 200 знаков"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
`

const workoutPage = ({ setListImport = '', sets, note = '' }) => `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
${setListImport}import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { saveSet } from "./actions";

export const metadata: Metadata = { title: "Тренировка" };

${INSTANT}
// Тренировка по id из адреса: подходы, объём и форма нового подхода. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    return found.rows.length > 0 ? { title: found.rows[0].title, sets: sets.rows } : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>

${sets}      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>

      <form action={save} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input
            id="weight"
            name="weight"
            inputMode="decimal"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input
            id="reps"
            name="reps"
            inputMode="numeric"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
${note}        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
`

const WORKOUT_PAGE_S07 = workoutPage({ sets: WORKOUT_SETS })
const WORKOUT_PAGE_HINT = workoutPage({ sets: WORKOUT_SETS_HINT })
const WORKOUT_PAGE_SETLIST = workoutPage({ setListImport: SETLIST_IMPORT, sets: WORKOUT_SETS_COMPONENT })
const WORKOUT_PAGE_NOTE = workoutPage({ setListImport: SETLIST_IMPORT, sets: WORKOUT_SETS_COMPONENT, note: NOTE_FIELD })

// Общий вывод подходов: разметка та же, что была на обеих страницах; отступы у страниц разные — их передаёт className
const SET_LIST = `// Подходы тренировки списком: «60 кг × 8» в строке. Один вывод для карточки подопечного у тренера (app/clients/[id])
// и страницы тренировки (app/workouts/[id]); отступы задаёт страница через className.
// id подхода из запроса к sets приходит строкой, из json_agg — числом.
type ListedSet = { id: string | number; weight: number; reps: number };

export default function SetList({ sets, className }: { sets: ListedSet[]; className?: string }) {
  return (
    <ul className={className}>
      {sets.map((set) => (
        <li key={set.id}>
          {set.weight} кг × {set.reps}
        </li>
      ))}
    </ul>
  );
}
`

// lib/volume.ts после s07 — дословно
const VOLUME_S07 = `// Объём тренировки, кг: сумма «вес × повторы» по подходам; у тренировки без подходов — 0.
// Три подхода по 10 раз с весом 50 кг — 1500 кг.
export type WorkoutSet = { weight: number; reps: number };

export function volume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0);
}
`
const VOLUME_ROUND = `// Объём тренировки, кг: сумма «вес × повторы» по подходам; у тренировки без подходов — 0.
// Три подхода по 10 раз с весом 50 кг — 1500 кг. Целым числом: 62,5 кг × 5 — 313 кг.
export type WorkoutSet = { weight: number; reps: number };

export function volume(sets: WorkoutSet[]): number {
  return Math.round(sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0));
}
`
// «Упрости»: агент переписывает сумму через map и reduce — и теряет начальное значение. У пустого массива reduce без него
// бросает TypeError («Reduce of empty array with no initial value»): тест «пустая тренировка — 0» падает
const ROUND_LINE = '  return Math.round(sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0));\n'
const SIMPLE_LINE = '  return Math.round(sets.map((set) => set.weight * set.reps).reduce((sum, value) => sum + value));\n'

// Заметка к подходу — новый столбец. Та же проверка длины, что в форме: база не примет больше 200 знаков
const NOTE_SQL = `-- Заметка к подходу: необязательная, не длиннее 200 знаков (например, «узкий хват» или «последний повтор с помощью»).
alter table sets add column note text check (char_length(note) <= 200);
`

// Действие подопечного после s07: вставка подхода. С заметкой — четвёртый столбец, пустое поле — null
const SAVE_S07 = `  await asUser(uid, (db) =>
    db.query("insert into sets (workout_id, weight, reps) values ($1, $2, $3)", [workoutId, weight, reps]),
  );
`
const SAVE_NOTE = `  // заметка необязательна: пустое поле — без заметки (null); длиннее 200 знаков не примет и база
  const note = String(form.get("note") ?? "").trim() || null;
  if (note && note.length > 200) redirect(fail("Заметка — не длиннее 200 знаков"));

  await asUser(uid, (db) =>
    db.query("insert into sets (workout_id, weight, reps, note) values ($1, $2, $3, $4)", [workoutId, weight, reps, note]),
  );
`

// Журнал запросов Анны: четыре запроса недели (записи s02, s03, s04 и этой сессии) и строка еженедельного разбора
const PROMPTS = `# Журнал запросов

Запросы, которые сработали особенно хорошо или плохо, и почему. Раз в неделю перечитываю: удачные запросы — в шаблоны, повторяющиеся ошибки — в правила CLAUDE.md.

## 28.10

- Задача: форма не сохраняет подход.
- Запрос: что делала, что ждала, что вышло — и красная строка из Console целиком: «Failed to load resource: the server responded with a status of 400 (Bad Request)».
- Сработало: агент сразу нашёл причину («60 кг» — не число), и подсказка теперь видна под формой.
- Не сработало: —

## 29.10

- Задача: экран «Мои тренировки».
- Запрос: по ЦКОКФ — цель, контекст, ограничения, критерий готовности («Анна видит свои три тренировки, тренировок Олега нет») и формат ответа.
- Сработало: только тренировки Анны, проверила одним взглядом.
- Не сработало: до этого «Сделай экран тренировок» — таблица выдуманных людей и кнопки, о которых я не просила.

## 30.10

- Задача: отрицательный вес сохраняется.
- Запрос: «Отрицательный вес сохраняется: ввела -5… Нужно: вес больше нуля».
- Сработало: -5 больше не сохраняется.
- Не сработало: агент переписал разбор веса, и «62,5» перестало быть числом. Откатила git revert, дальше — сначала тест, потом код.

## 01.11

- Задача: карточка подопечного падает после «Назначить».
- Запрос: строка ошибки и первая строка стектрейса целиком и «Найди причину, пока ничего не исправляй».
- Сработало: агент назвал причину в запросе (json_agg без подходов даёт null), и исправили её, а не симптом в разметке.
- Не сработало: —

Разбор недели, 01.11: лучше всего работают запросы с критерием «готово» и с ошибкой целиком; «упрости» без проверки сломал объём пустой тренировки — после таких запросов сразу npm test.
`

export default {
  id: 's08-debug',
  from: 's07-cycle',
  date: '2026-11-01T15:00:00+03:00',
  db: true,
  steps: [
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    {
      id: 'ask-volumes',
      agent: {
        prompt: 'На странице подопечного у каждой тренировки — объём',
        reply:
          'На карточке подопечного у каждой тренировки теперь подходы и объём. Тренировки и их подходы берутся одним запросом: ' +
          'left join sets и json_agg собирает подходы тренировки в массив. Объём считает volume() из lib/volume.ts, как на странице тренировки.',
      },
      steps: [{ id: 'volumes-page', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE_S07, replace: CLIENT_PAGE_VOLUMES }],
    },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    // у новой тренировки подходов нет: json_agg даёт null, и страница падает при отрисовке после «Назначить»
    { id: 'assign2', browser: { url: '/clients/1', fill: { Название: 'Ноги', Дата: '2026-11-04' }, click: 'Назначить' } },
    {
      id: 'ask-cause',
      agent: {
        // строка ошибки и первая строка стектрейса — дословно из вывода сервера шага assign2 (node scripts/print-event.mjs s08-debug assign2)
        prompt:
          'После «Назначить» карточка подопечного падает. В выводе сервера: ' +
          "«⨯ TypeError: Cannot read properties of null (reading 'map')», первая строка стектрейса: " +
          '«at <unknown> (app/clients/[id]/page.tsx:82:31)». Найди причину, пока ничего не исправляй',
        reply:
          'Прочитал app/clients/[id]/page.tsx, ничего не менял. Падает workout.sets.map: у новой тренировки «Ноги» sets — null, а не пустой список. ' +
          'Причина в запросе: подходы собирает json_agg(…) filter (where s.id is not null). У тренировки без подходов фильтр не пропускает ни одной строки, ' +
          'а json_agg без строк возвращает null. Тип Workout обещает массив, поэтому TypeScript промолчал. ' +
          'Исправить можно проверкой в разметке, но null останется в данных; ' +
          "лучше в запросе: coalesce(…, '[]') — тогда у тренировки без подходов пустой список и объём 0.",
      },
      steps: [{ id: 'cause-read', read: 'app/clients/[id]/page.tsx' }],
    },
    {
      id: 'ask-fix-cause',
      agent: {
        prompt: 'Исправь причину в запросе, а не проверкой в разметке',
        reply:
          "Исправил запрос: coalesce(json_agg(…) filter (where s.id is not null), '[]'). Тренировка без подходов приходит с пустым списком, " +
          'объём у неё 0. Разметку не трогал.',
      },
      steps: [{ id: 'cause-fix', edit: 'app/clients/[id]/page.tsx', find: AGG_NULL + ' as sets', replace: AGG_EMPTY + ' as sets' }],
    },
    { id: 'crash-ok', browser: { url: '/clients/1' } },
    { id: 'c-fix', commit: 'Объём тренировок у тренера; тренировка без подходов не роняет страницу' },
    {
      id: 'ask-round',
      agent: {
        prompt: 'Объём показывай целым числом',
        reply: 'volume() теперь округляет сумму до целого (Math.round): 62,5 кг × 5 даст 313 кг. Поменял только lib/volume.ts — страницы берут объём оттуда.',
      },
      steps: [{ id: 'round-fix', edit: 'lib/volume.ts', find: VOLUME_S07, replace: VOLUME_ROUND }],
    },
    { id: 'c-round', commit: 'Объём — целым числом' },
    {
      id: 'ask-simplify',
      agent: {
        prompt: 'Упрости lib/volume.ts',
        reply: 'Упростил volume(): map считает вес × повторы каждого подхода, reduce складывает, Math.round округляет — сначала произведения, потом сумма. Поведение то же.',
      },
      steps: [{ id: 'simplify', edit: 'lib/volume.ts', find: ROUND_LINE, replace: SIMPLE_LINE }],
    },
    { id: 'c-simplify', commit: 'Упростить подсчёт объёма' },
    {
      id: 'ask-label',
      agent: {
        prompt: 'Подпись «Объём, кг»',
        reply: 'На карточке подопечного объём теперь подписан «Объём, кг: 1500» — единица в подписи, а не после числа.',
      },
      steps: [{ id: 'label', edit: 'app/clients/[id]/page.tsx', find: VOLUME_TEXT, replace: VOLUME_LABEL }],
    },
    { id: 'c-label', commit: 'Подпись «Объём, кг»' },
    {
      id: 'ask-hint',
      agent: {
        prompt: 'У тренировки без подходов — «Подходов пока нет»',
        reply: 'На странице тренировки без подходов вместо пустого списка теперь «Подходов пока нет».',
      },
      steps: [{ id: 'hint', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE_S07, replace: WORKOUT_PAGE_HINT }],
    },
    { id: 'c-hint', commit: 'Подсказка «Подходов пока нет»' },
    // четыре коммита после исправления — тесты никто не запускал
    { id: 'test-red', run: 'npm test' },
    // HEAD~4 — c-fix, последний коммит, где тест объёма зелёный; git bisect run сам отмечает коммиты по коду выхода теста
    { id: 'bisect-start', run: 'git bisect start HEAD HEAD~4' },
    { id: 'bisect-run', run: 'git bisect run npx vitest run lib/volume.test.ts' },
    { id: 'bisect-reset', run: 'git bisect reset' },
    // HEAD~2 — «Упростить подсчёт объёма»: откат только этого коммита, подпись и подсказка остаются
    { id: 'revert-simplify', run: 'git revert --no-edit HEAD~2' },
    { id: 'test-green', run: 'npm test' },
    {
      id: 'ask-refactor',
      agent: {
        prompt:
          'Сделай код своим: на страницах тренера и подопечного одинаковый вывод подходов — вынеси в components/SetList.tsx; ' +
          'поведение не меняй, тесты должны остаться зелёными',
        reply:
          'Вынес вывод подходов в components/SetList.tsx: тот же список «вес кг × повторы», отступы страница передаёт через className. ' +
          'Карточка подопечного и страница тренировки теперь берут список оттуда, разметка страниц прежняя. npm test — все тесты зелёные.',
      },
      steps: [
        { id: 'setlist', write: 'components/SetList.tsx', content: SET_LIST },
        { id: 'use-setlist-1', edit: 'app/clients/[id]/page.tsx', find: CLIENT_PAGE_LABEL, replace: CLIENT_PAGE_SETLIST },
        { id: 'use-setlist-2', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE_HINT, replace: WORKOUT_PAGE_SETLIST },
        { id: 'refactor-test', run: 'npm test' },
      ],
    },
    // новый components/SetList.tsx ещё не в git: git diff --stat показывает только две страницы
    { id: 'diff-refactor', run: 'git diff --stat' },
    { id: 'c-refactor', commit: 'SetList: один вывод подходов на двух страницах' },
    {
      id: 'ask-mentor',
      agent: {
        prompt:
          'Режим наставника: объясни, как работает политика для тренера в supabase/migrations/0002_rls.sql. Код не меняй. ' +
          'В конце задай три вопроса, чтобы проверить, поняла ли я',
        reply:
          'Прочитал supabase/migrations/0002_rls.sql, код не менял. RLS — это проверка в самой базе: прежде чем отдать строку, база спрашивает политику, ' +
          'можно ли. auth.uid() — id того, кто вошёл. Подопечные: строку clients тренер видит, если в ней coach_id — это он («тренер видит своих»). ' +
          'Тренировки: в workouts тренера нет, поэтому политика спрашивает, есть ли client_id тренировки среди его подопечных — подзапрос к clients. ' +
          'Подходы — на шаг дальше: через тренировку к подопечному. using решает, какие строки видно и можно менять, with check — какие можно добавить. ' +
          'Вопросы. 1. Игорь открывает /clients/1 — что вернёт база и почему? ' +
          '2. Зачем в политике на тренировки подзапрос к clients? ' +
          '3. Марина добавляет тренировку подопечной Игоря — какая часть политики её остановит?',
      },
      steps: [{ id: 'mentor-read', read: 'supabase/migrations/0002_rls.sql' }],
    },
    { id: 'prompts', write: 'docs/prompts.md', content: PROMPTS },
    {
      id: 'ask-migration',
      agent: {
        prompt: 'Добавь подходу заметку до 200 знаков; миграцию применяй с моего подтверждения',
        reply:
          'Написал миграцию supabase/migrations/0003_set_note.sql: у подхода столбец note — необязательный текст, длиннее 200 знаков база не примет. ' +
          'Применил её после твоего подтверждения: psql -f supabase/migrations/0003_set_note.sql. ' +
          'На странице тренировки в форме подхода — необязательное поле «Заметка»; действие сохраняет её вместе с подходом, пустое поле — без заметки.',
      },
      steps: [
        { id: 'note-sql', write: 'supabase/migrations/0003_set_note.sql', content: NOTE_SQL },
        { id: 'note-apply', run: 'psql -f supabase/migrations/0003_set_note.sql' },
        { id: 'note-form', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE_SETLIST, replace: WORKOUT_PAGE_NOTE },
        // одна правка — один файл: действие с заметкой — отдельным шагом сразу после формы
        { id: 'note-action', edit: 'app/workouts/[id]/actions.ts', find: SAVE_S07, replace: SAVE_NOTE },
      ],
    },
    { id: 'c-mentor', commit: 'Журнал запросов и заметка к подходу' },
  ],
}
