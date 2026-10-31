// Сессия 2: форма «Сохранить подход». Ветка, форма и API от агента, ошибка 400 в браузере и её исправление,
// дифф и коммит, непрошеная переделка стилей и её откат, слияние в main, выдуманная команда, ключ в .env.local,
// мини-набор задач. Запись: node scripts/record-session.mjs (из course/). Id шагов постоянные: на них ссылаются уроки.

const ROUTE = `// Подходы пока живут в памяти сервера: после перезапуска npm run dev список снова пустой.
type WorkoutSet = { weight: number; reps: number };

const sets: WorkoutSet[] = [];

// GET /api/sets — все сохранённые подходы
export async function GET() {
  return Response.json({ sets });
}

// Число из поля формы: «62,5» — тоже число (запятую меняем на точку),
// а пустое поле — нет, хотя Number("") === 0
function toNumber(value: unknown): number {
  const text = String(value ?? "").trim().replace(",", ".");
  return text === "" ? NaN : Number(text);
}

// POST /api/sets — сохранить подход { weight, reps }
export async function POST(request: Request) {
  // не JSON в теле — ответ 400, а не падение сервера с 500
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { weight, reps }" }, { status: 400 });
  }
  const { weight, reps } = body;

  const kg = toNumber(weight);
  if (!Number.isFinite(kg)) {
    return Response.json({ error: "Вес должен быть числом, например 60" }, { status: 400 });
  }

  const count = toNumber(reps);
  if (!Number.isInteger(count) || count <= 0) {
    return Response.json({ error: "Повторы — целое число больше нуля" }, { status: 400 });
  }

  const set = { weight: kg, reps: count };
  sets.push(set);
  return Response.json({ set, volume: kg * count }, { status: 201 });
}
`

// Страница тренировки. Первая версия (fixed = false) при ответе с ошибкой молчит — это баг урока;
// правка fix показывает текст ошибки сервера под формой.
const page = (fixed) => `"use client";

import { useEffect, useState, type FormEvent } from "react";

type WorkoutSet = { weight: number; reps: number };

export default function Home() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([]);
${fixed ? '  const [error, setError] = useState("");\n' : ''}
  // при открытии страницы показываем уже сохранённые подходы
  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => setSets(data.sets));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, reps }),
    });
${
  fixed
    ? `    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setError("");
`
    : `    if (!res.ok) return;
    const data = await res.json();
`
}    setSets([...sets, data.set]);
    setWeight("");
    setReps("");
  }

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Тренировка</h1>

      <form onSubmit={save} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weight">Вес, кг</label>
          <input
            id="weight"
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reps">Повторы</label>
          <input
            id="reps"
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>
${
  fixed
    ? `
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
`
    : ''
}
      <h2 className="mt-8 font-semibold">Сохранённые подходы</h2>
      {sets.length === 0 ? (
        <p className="mt-2 text-zinc-500">Подходов пока нет</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {sets.map((set, i) => (
            <li key={i}>
              {set.weight} кг × {set.reps}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`

const PAGE = page(false)
const PAGE_FIXED = page(true)

// Правка fix заменяет кусок страницы от списка подходов в состоянии до заголовка списка:
// в нём все три изменения (состояние ошибки, разбор ответа, строка под формой).
const fixRegion = (text) => text.slice(text.indexOf('  const [sets, setSets]'), text.indexOf('      <h2 '))
if (PAGE.replace(fixRegion(PAGE), fixRegion(PAGE_FIXED)) !== PAGE_FIXED) throw new Error('s02-sets: правка fix не даёт исправленную страницу')

// Правка layout: заголовок вкладки и язык страницы. Кусок app/layout.tsx заготовки create-next-app@16.4.3
// от заголовка до lang — дословно (если заготовка другая, рекордер скажет «find не найден»).
const LAYOUT_TAIL = `  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
`
const LAYOUT_EN = `  title: "Create Next App",\n${LAYOUT_TAIL}      lang="en"`
const LAYOUT_RU = `  title: "Тренировка",\n${LAYOUT_TAIL}      lang="ru"`

// Строка консоли из записи save-bad — дословно, как её показал Chromium
const CONSOLE_400 = 'Failed to load resource: the server responded with a status of 400 (Bad Request)'

// «Посимпатичнее»: агент без спроса переписывает все стили страницы
const RESTYLE = `@import "tailwindcss";

/* Новая тема: тёмный фон, яркий акцент, крупный шрифт */
:root {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --accent: #f97316;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --font-sans: "Trebuchet MS", "Segoe UI", sans-serif;
  --font-mono: "Courier New", monospace;
}

body {
  background: radial-gradient(circle at top, var(--card), var(--background) 60%);
  color: var(--foreground);
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  font-size: 18px;
}

h1 {
  font-size: 2.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent);
}

input {
  background: var(--card);
  color: var(--foreground);
  border-radius: 9999px;
}

button {
  background: linear-gradient(90deg, var(--accent), #ec4899);
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
}

li {
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  background: var(--card);
}
`

const MINI_SET = `# Мини-набор задач для выбора модели

Пять задач этого проекта. Каждую даём разным моделям одними и теми же словами и сравниваем: дошла ли модель до «готово» и сколько правок понадобилось.

## 1. Подходы в базе

Подходы хранятся в Supabase, а не в памяти сервера.
Готово: после перезапуска npm run dev сохранённые подходы на месте.

## 2. Вход тренера

Тренер входит по почте и паролю (Supabase Auth).
Готово: без входа страница /clients открывает форму входа, после входа видно имя тренера.

## 3. Список подопечных

Страница /clients: подопечные тренера и кнопка «Добавить подопечного».
Готово: новый подопечный виден в списке и после перезагрузки страницы.

## 4. Прогресс подопечного

На странице подопечного — лучший вес за каждую неделю.
Готово: для трёх недель с подходами 50, 55 и 60 кг видно три строки по порядку.

## 5. Тест проверки веса

Тест на Vitest для app/api/sets/route.ts.
Готово: вес «60 кг» даёт ответ 400, а вес «60» и повторы 8 сохраняются — ответ 201; если убрать проверку веса, тест падает.
`

export default {
  id: 's02-sets',
  from: 's01-start',
  date: '2026-10-28T14:00:00+03:00',
  steps: [
    { id: 'branch', run: 'git switch -c sets-form' },
    {
      id: 'ask-form',
      agent: {
        prompt:
          'Сделай на главной странице форму «Сохранить подход»: вес и повторы. ' +
          'Пусть API app/api/sets/route.ts проверяет, что вес — число, а повторы — целое больше нуля. ' +
          'Сохранённые подходы покажи списком под формой.',
        reply:
          'Сделал форму на главной и API app/api/sets/route.ts с проверкой веса и повторов. ' +
          'Подходы пока хранятся в памяти сервера, а вкладка теперь называется «Тренировка». ' +
          'Запусти npm run dev и открой localhost:3000.',
      },
      steps: [
        { id: 'read-page', read: 'app/page.tsx' },
        { id: 'route', write: 'app/api/sets/route.ts', content: ROUTE },
        { id: 'page', write: 'app/page.tsx', content: PAGE },
        { id: 'layout', edit: 'app/layout.tsx', find: LAYOUT_EN, replace: LAYOUT_RU },
      ],
    },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'save-bad', browser: { url: '/', fill: { 'Вес, кг': '60 кг', Повторы: '8' }, click: 'Сохранить подход' } },
    {
      id: 'ask-fix',
      agent: {
        prompt:
          'Форма не сохраняет подход. Что делала: ввела вес «60 кг», повторы 8 и нажала «Сохранить подход». ' +
          'Что ждала: подход в списке или подсказку, что не так. ' +
          `Что вышло: на странице ничего не изменилось, а в Console красная строка «${CONSOLE_400}».`,
        reply: 'Сервер отвечает 400 и объясняет причину: «60 кг» — не число. Страница эту причину не показывала, теперь текст ошибки виден под формой.',
      },
      steps: [
        { id: 'read-route', read: 'app/api/sets/route.ts' },
        { id: 'fix', edit: 'app/page.tsx', find: fixRegion(PAGE), replace: fixRegion(PAGE_FIXED) },
      ],
    },
    { id: 'save-hint', browser: { url: '/', fill: { 'Вес, кг': '60 кг', Повторы: '8' }, click: 'Сохранить подход' } },
    { id: 'save-ok', browser: { url: '/', fill: { 'Вес, кг': '60', Повторы: '8' }, click: 'Сохранить подход' } },
    { id: 'diff', run: 'git diff --stat' },
    { id: 'c-form', commit: 'Форма «Сохранить подход» с проверкой веса' },
    {
      id: 'restyle',
      agent: {
        prompt: 'Сделай страницу посимпатичнее.',
        reply: 'Переделал оформление: тёмный фон, оранжевый акцент, другие шрифты, круглые поля и кнопка.',
      },
      steps: [{ id: 'css', write: 'app/globals.css', content: RESTYLE }],
    },
    { id: 'diff-css', run: 'git diff --stat' },
    { id: 'restore', run: 'git restore app/globals.css' },
    { id: 'clean', run: 'git status --short' },
    { id: 'main', run: 'git switch main' },
    { id: 'merge', run: 'git merge sets-form' },
    { id: 'start-dev', run: 'npm run start-dev' },
    { id: 'scripts', run: 'npm run' },
    { id: 'env', write: '.env.local', content: 'TRAINER_API_KEY=demo-key-not-real\n' },
    { id: 'ignored', run: 'git check-ignore -v .env.local' },
    { id: 'status-env', run: 'git status --short' },
    {
      id: 'mini',
      agent: {
        prompt: 'Составь мини-набор из пяти задач этого проекта для проверки моделей, у каждой — критерий «готово».',
        reply: 'Записал пять задач в docs/mini-set.md, у каждой — критерий «готово». Дай их разным моделям одними словами и сравни результат.',
      },
      steps: [
        { id: 'mini-file', write: 'docs/mini-set.md', content: MINI_SET },
        { id: 'c-mini', commit: 'Мини-набор задач для выбора модели' },
      ],
    },
    { id: 'log2', run: 'git log --oneline' },
  ],
}
