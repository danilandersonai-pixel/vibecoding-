// Сессия 5: прототип за вечер. Анна заводит ветку proto/coach, записывает вопрос прототипа в docs/prototype.md и просит агента
// по шаблону запроса на старт прототипа сделать один экран «Подопечные» на выдуманных данных. Потом просит кнопку «Совет ИИ»:
// агент кладёт ключ в .env.local как NEXT_PUBLIC_AI_KEY и читает его в клиентском компоненте — сборка (npm run build) вшивает значение
// в кусок .next/static, а grep его там находит. Исправление: ключ AI_KEY без NEXT_PUBLIC_ только на сервере, кнопка ходит на /api/advice;
// вторая сборка и тот же grep ничего не находят. Кнопку в браузере не нажимают: запроса к сервису ИИ в записи нет.
// Дальше показ Марине, её отзыв («сверху те, кому пора написать»), новый виток, журнал решений и возврат на main:
// прототип остаётся только в ветке proto/coach, .env.local (под .gitignore) переживает переключение.
// Запись с середины цепочки: node scripts/record-session.mjs --from s05-proto (из course/). Id шагов постоянные: на них ссылаются уроки.

// Документ прототипа. Журнал решений пока пуст — его заполнит человек после показа (шаг journal).
const JOURNAL_EMPTY = 'Пока пусто: показ Марине ещё впереди.\n'
const PROTOTYPE_DOC = `# Прототип: экран «Подопечные»

Ветка \`proto/coach\`. Это прототип, а не продукт: его не жалко выбросить.

## Вопрос

Поймёт ли тренер с первого взгляда, кому пора написать?

## Таймбокс

Два часа. Когда время выйдет, остановиться и оценить результат, а не дорабатывать.

## Тонкий срез

Один экран «Подопечные» (\`/coach\`): имя подопечного и «последняя тренировка: N дн. назад». Больше ничего: ни входа, ни тренировок, ни графиков.

## Данные

Выдуманные: шесть подопечных Марины лежат в \`lib/fake-clients.ts\`, в памяти. Базы нет.

## Готова выбросить

Я готова выбросить этот код: ценен ответ на вопрос, а не код. Ветка \`proto/coach\` в \`main\` не вливается: если ответ «да», настоящий экран строится заново.

## Упрощения

- нет входа: тренер всегда Марина;
- нет базы: подопечные записаны прямо в код;
- «сегодня» зашито в данные, а не берётся из часов;
- нет тестов и обработки ошибок;
- дизайн простой, на телефоне не проверен.

## Журнал решений

${JOURNAL_EMPTY}`

const JOURNAL = `**30 октября, показ Марине.** Открыла ей \`/coach\`. Она сказала: «Кому писать, не видно — дни считаю сама». Список шёл по алфавиту, и те, кто не тренировался больше недели, затерялись в нём.

**Что изменили.** Сверху те, кто не тренировался больше 7 дней, с пометкой «Пора написать». Остальные идут в прежнем порядке.

**Вывод.** Ответ на вопрос прототипа: да, если выделить тех, кому пора написать. Решение — развивать: строить по-настоящему на базе в день 4. Ветку \`proto/coach\` в \`main\` не вливаем.
`

// Выдуманные подопечные Марины. «Сегодня» — выдуманная дата: кэшируемые страницы Next.js 16 (cacheComponents) не любят текущее время,
// а показу оно и не нужно. Ровно двое (Денис, Павел) не тренировались больше 7 дней; в списке они стоят в середине и в конце.
const FAKE_CLIENTS_LIB = `// Прототип: подопечные выдуманы и лежат в памяти. Ни базы, ни входа — так экран можно показать Марине за вечер.
// Когда прототип вырастет в настоящее приложение, подопечных заменит база.

export type FakeClient = {
  id: string;
  name: string;
  lastWorkout: string; // ГГГГ-ММ-ДД
};

// «Сегодня» в прототипе — выдуманная дата, чтобы показ не зависел от часов компьютера
export const TODAY = "2026-10-30";

// Шесть подопечных Марины
export const FAKE_CLIENTS: FakeClient[] = [
  { id: "anna", name: "Анна", lastWorkout: "2026-10-26" },
  { id: "denis", name: "Денис", lastWorkout: "2026-10-21" },
  { id: "ksenia", name: "Ксения", lastWorkout: "2026-10-29" },
  { id: "oleg", name: "Олег", lastWorkout: "2026-10-27" },
  { id: "pavel", name: "Павел", lastWorkout: "2026-10-18" },
  { id: "tatiana", name: "Татьяна", lastWorkout: "2026-10-28" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Сколько дней назад была тренировка. Даты читаются как UTC, поэтому часовой пояс счёт не сдвигает.
export function daysSince(date: string): number {
  return Math.round((Date.parse(TODAY) - Date.parse(date)) / DAY_MS);
}
`

// Страница /coach в трёх версиях: первая (proto-page), с кнопкой «Совет ИИ» (advice-use) и с пометкой «Пора написать» сверху (iter-page).
const PAGE_HEAD = `import type { Metadata } from "next";
import { FAKE_CLIENTS, daysSince } from "@/lib/fake-clients";

export const metadata: Metadata = { title: "Подопечные" };
`
const PAGE_TAIL = `
      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id} className="rounded border border-zinc-300 p-4">
`
const PAGE_END = `          </li>
        ))}
      </ul>
    </main>
  );
}
`
const PAGE_TITLE = `    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подопечные</h1>
      <p className="mt-1 text-zinc-500">Тренер: Марина. Прототип, данные выдуманные</p>
`
const DAYS_LINE = '            <p className="text-zinc-500">последняя тренировка: {client.days} дн. назад</p>\n'

const PAGE = `${PAGE_HEAD}
export default function CoachPage() {
  // Сколько дней назад была последняя тренировка у каждого
  const clients = FAKE_CLIENTS.map((client) => ({ ...client, days: daysSince(client.lastWorkout) }));

  return (
${PAGE_TITLE}${PAGE_TAIL}            <h2 className="text-xl font-semibold">{client.name}</h2>
${DAYS_LINE}${PAGE_END}`

const PAGE_ADVICE = `${PAGE_HEAD.replace('import { FAKE', 'import { AdviceButton } from "./advice-button";\nimport { FAKE')}
export default function CoachPage() {
  // Сколько дней назад была последняя тренировка у каждого
  const clients = FAKE_CLIENTS.map((client) => ({ ...client, days: daysSince(client.lastWorkout) }));

  return (
${PAGE_TITLE}${PAGE_TAIL}            <h2 className="text-xl font-semibold">{client.name}</h2>
${DAYS_LINE}            <AdviceButton name={client.name} days={client.days} />
${PAGE_END}`

const PAGE_ITER = `${PAGE_HEAD.replace('import { FAKE', 'import { AdviceButton } from "./advice-button";\nimport { FAKE')}
// Больше стольких дней без тренировки — пора написать
const OVERDUE_DAYS = 7;

export default function CoachPage() {
  // Сколько дней назад была последняя тренировка у каждого. Сверху те, кому пора написать, остальные в прежнем порядке.
  const clients = FAKE_CLIENTS.map((client) => {
    const days = daysSince(client.lastWorkout);
    return { ...client, days, overdue: days > OVERDUE_DAYS };
  }).sort((a, b) => Number(b.overdue) - Number(a.overdue));

  return (
${PAGE_TITLE}${PAGE_TAIL}            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{client.name}</h2>
              {client.overdue && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900">Пора написать</span>
              )}
            </div>
${DAYS_LINE}            <AdviceButton name={client.name} days={client.days} />
${PAGE_END}`

// Кнопка «Совет ИИ», первая версия агента: запрос к сервису ИИ идёт прямо из браузера, ключ — NEXT_PUBLIC_AI_KEY из .env.local.
// Всё, что начинается с NEXT_PUBLIC_, сборка вшивает в код для браузера — это и есть утечка. Адрес сервиса выдуманный (example.com).
const BUTTON_HEAD = `"use client";

import { useState } from "react";

`
const BUTTON_TAIL = `export function AdviceButton({ name, days }: { name: string; days: number }) {
  const [advice, setAdvice] = useState("");

  async function ask() {
`
const BUTTON_END = `    const data = await res.json();
    setAdvice(data.advice);
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={ask} className="rounded bg-zinc-900 px-3 py-1 text-white">
        Совет ИИ
      </button>
      {advice && <p className="mt-2">{advice}</p>}
    </div>
  );
}
`
const BUTTON = `${BUTTON_HEAD}// Сервис ИИ: адрес для примера (example.com), настоящего сервиса у прототипа нет
const AI_URL = "https://ai.example.com/v1/advice";

${BUTTON_TAIL}    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${process.env.NEXT_PUBLIC_AI_KEY}\`,
      },
      body: JSON.stringify({ client: name, daysSinceWorkout: days }),
    });
${BUTTON_END}`
// Исправление: кнопка ходит на свой маршрут /api/advice, ключа в ней больше нет
const BUTTON_FIXED = `${BUTTON_HEAD}${BUTTON_TAIL}    // запрос идёт на наш сервер, а он уже обращается к сервису ИИ с ключом
    const res = await fetch("/api/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client: name, daysSinceWorkout: days }),
    });
${BUTTON_END}`

// Маршрут /api/advice: ключ AI_KEY читается на сервере и в браузер не попадает
const ADVICE_ROUTE = `// Совет ИИ: запрос к сервису идёт отсюда, с сервера. Ключ AI_KEY (без NEXT_PUBLIC_) в браузер не попадает.
// Адрес сервиса для примера (example.com): настоящего сервиса у прототипа нет.
const AI_URL = "https://ai.example.com/v1/advice";

// POST /api/advice — { client, daysSinceWorkout } → { advice }
export async function POST(request: Request) {
  const key = process.env.AI_KEY;
  if (!key) {
    return Response.json({ error: "На сервере не задан AI_KEY" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { client, daysSinceWorkout }" }, { status: 400 });
  }

  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: \`Bearer \${key}\` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(\`сервис ИИ ответил \${res.status}\`);
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: "Сервис ИИ не ответил" }, { status: 502 });
  }
}
`

// .env.local из s02 (игнорируется git и переживает переключение веток): одна строка, дословно
const ENV_BEFORE = 'TRAINER_API_KEY=demo-key-not-real\n'
const ENV_PUBLIC = `${ENV_BEFORE}NEXT_PUBLIC_AI_KEY=demo-ai-key-not-real\n`
const ENV_SERVER = `${ENV_BEFORE}AI_KEY=demo-ai-key-not-real\n`

// Правка из двух версий файла: find и replace — участок от первой до последней отличающейся строки и по строке вокруг него.
// Так в записи правка — те же строки, что в диффе, а не файл целиком. Проверяется сразу: find один раз и даёт нужный файл.
function swap(before, after) {
  const a = before.split('\n')
  const b = after.split('\n')
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
  const start = Math.max(head - 1, 0)
  const find = a.slice(start, Math.min(a.length - tail + 1, a.length)).join('\n')
  const replace = b.slice(start, Math.min(b.length - tail + 1, b.length)).join('\n')
  if (before.indexOf(find) !== before.lastIndexOf(find) || before.replace(find, () => replace) !== after) {
    throw new Error('s05-proto: правка не даёт нужную версию файла')
  }
  return { find, replace }
}

export default {
  id: 's05-proto',
  from: 's04-rules',
  date: '2026-10-30T15:00:00+03:00',
  steps: [
    { id: 'proto-branch', run: 'git switch -c proto/coach' },
    { id: 'proto-doc', write: 'docs/prototype.md', content: PROTOTYPE_DOC },
    {
      id: 'ask-proto',
      agent: {
        prompt:
          'Это прототип, не продукт. Вопрос: поймёт ли тренер с первого взгляда, кому пора написать. ' +
          'Один экран «Подопечные»: имя и «последняя тренировка: N дн. назад». ' +
          'Данные выдуманные, в памяти, без входа и базы. Стек — как в проекте. В конце список упрощений',
        reply:
          'Сделал прототип. lib/fake-clients.ts: шесть выдуманных подопечных Марины с датой последней тренировки, в памяти. ' +
          'app/coach/page.tsx: экран «Подопечные» — имя и «последняя тренировка: N дн. назад». Запусти npm run dev и открой localhost:3000/coach. ' +
          'Упрощения, которые придётся убрать перед продакшеном. ' +
          '1. Подопечные записаны в код, базы нет. ' +
          '2. Входа нет, тренер всегда Марина. ' +
          '3. «Сегодня» зашито в данные (30 октября), а не берётся из часов. ' +
          '4. Тестов и обработки ошибок нет. ' +
          '5. Дизайн простой, на телефоне не проверен.',
      },
      steps: [
        { id: 'fake-data', write: 'lib/fake-clients.ts', content: FAKE_CLIENTS_LIB },
        { id: 'proto-page', write: 'app/coach/page.tsx', content: PAGE },
      ],
    },
    { id: 'c-proto', commit: 'Прототип: список подопечных' },
    {
      id: 'ask-advice',
      agent: {
        prompt: 'Добавь на /coach кнопку «Совет ИИ» у подопечного: запрос к сервису ИИ, ключ — в .env.local',
        reply:
          'Добавил кнопку «Совет ИИ» у каждого подопечного: по нажатию страница отправляет запрос к сервису ИИ и показывает совет под кнопкой. ' +
          'Ключ положил в .env.local как NEXT_PUBLIC_AI_KEY, кнопка читает его оттуда. Новый файл: app/coach/advice-button.tsx, плюс правка app/coach/page.tsx.',
      },
      steps: [
        { id: 'key-env', edit: '.env.local', find: ENV_BEFORE, replace: ENV_PUBLIC },
        { id: 'advice-btn', write: 'app/coach/advice-button.tsx', content: BUTTON },
        { id: 'advice-use', edit: 'app/coach/page.tsx', ...swap(PAGE, PAGE_ADVICE) },
      ],
    },
    { id: 'build', run: 'npm run build' },
    // Сборка вшила значение NEXT_PUBLIC_AI_KEY в код для браузера: grep печатает путь к куску в .next/static
    { id: 'leak', run: 'grep -rl demo-ai-key-not-real .next/static || echo "не найдено"' },
    {
      id: 'ask-key-fix',
      agent: {
        prompt: 'Ключ попал в браузер: grep нашёл его в .next/static. Ключ — только на сервере: маршрут /api/advice, переменная без NEXT_PUBLIC_',
        reply:
          'Перенёс ключ на сервер. Новый маршрут app/api/advice/route.ts читает AI_KEY и сам обращается к сервису ИИ. ' +
          'В .env.local переменная теперь AI_KEY, без NEXT_PUBLIC_, а кнопка вызывает /api/advice. Пересобери проект и проверь тем же grep.',
      },
      steps: [
        { id: 'key-route', write: 'app/api/advice/route.ts', content: ADVICE_ROUTE },
        { id: 'key-env-fix', edit: '.env.local', find: ENV_PUBLIC, replace: ENV_SERVER },
        { id: 'key-btn-fix', edit: 'app/coach/advice-button.tsx', ...swap(BUTTON, BUTTON_FIXED) },
      ],
    },
    { id: 'build2', run: 'npm run build' },
    { id: 'leak2', run: 'grep -rl demo-ai-key-not-real .next/static || echo "не найдено"' },
    { id: 'c-advice', commit: 'Совет ИИ: ключ только на сервере' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'proto-view', browser: { url: '/coach' } },
    {
      id: 'ask-iter',
      agent: {
        prompt: 'Отзыв Марины после показа: сверху — те, кто не тренировался больше 7 дней, с пометкой «Пора написать»',
        reply:
          'Поправил app/coach/page.tsx: сверху теперь подопечные, у которых последняя тренировка была больше 7 дней назад, и у них пометка «Пора написать». ' +
          'Остальные идут в прежнем порядке.',
      },
      steps: [{ id: 'iter-page', edit: 'app/coach/page.tsx', ...swap(PAGE_ADVICE, PAGE_ITER) }],
    },
    { id: 'proto-view2', browser: { url: '/coach' } },
    { id: 'journal', edit: 'docs/prototype.md', find: JOURNAL_EMPTY, replace: JOURNAL },
    { id: 'c-proto2', commit: 'Прототип: сверху те, кому пора написать' },
    // Прототип остаётся только в ветке proto/coach. Флаг --decorate явный: в записи вывод идёт не в терминал, а без флага git
    // подписи веток не печатает (в терминале они есть сами)
    { id: 'main', run: 'git switch main' },
    { id: 'branches', run: 'git log --oneline --graph --all --decorate -8' },
  ],
}
