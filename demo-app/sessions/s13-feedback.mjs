// Сессия 13: отзывы и задача фоновому агенту (утро 4 ноября; база — из миграций и seed, db: true). Первая сессия недели 2.
// Человек раскладывает слова Марины с пробы 3 ноября — дословно из docs/plan-weeks-2-3.md, без новых — в три стопки docs/feedback.md:
// «Портит данные», «Мешает каждый день» (там и заметка про колено), «Подождёт»; внизу — что отдаём в фон. Подводный камень —
// расплывчатая задача: в ветке agent/notes-vague на «Покажи заметки к подходам получше» агент правит четыре файла (список подходов,
// форму подопечного, общие стили и список подопечных), git diff --stat это показывает, ветку удаляем. Затем задача в четыре части
// docs/tasks/notes.md (как docs/tasks/records.md): заметка под подходом на карточке, менять только components/SetList.tsx, работать
// в ветке agent/notes. Агент читает задачу, правит один файл и запускает npm run check (в ролике — с вопросом [y / n], Accept edits).
// Приёмка из main: один коммит, один файл; затем в ветке агента руками — Анна вписывает подход 50 × 10 с заметкой «болит колено»
// (база сброшена на старте сессии, подход создаёт сама сессия), Марина видит заметку на карточке. Слияние без перемотки.
// Запись с середины цепочки: node scripts/record-session.mjs --from s13-feedback (из course/). Id шагов постоянные: на них ссылаются уроки.
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Отзывы в три стопки — пишет человек. Слова Марины (и вопрос Анны о работе без интернета) — дословно из docs/plan-weeks-2-3.md
const FEEDBACK = `# Отзывы после пробы 3 ноября

Что сказала Марина, когда прошла три сценария, и один вопрос Анны — слово в слово из \`docs/plan-weeks-2-3.md\`. Новых отзывов здесь нет: те же слова, разложенные в три стопки.

## Портит данные

- Анна спросила, что будет с подходом, если в зале пропадёт интернет. Сейчас подход не сохранится: работы без интернета нет.

## Мешает каждый день

- «Я назначила „Ноги“, а сколько подходов и какой вес — всё равно пишу в сообщении. Приложение этого не знает».
- «Анна записала подход, а я узнала об этом, только когда сама открыла карточку. Хочу, чтобы приложение сказало, и чтобы я могла ответить под подходом».
- «Анна написала в заметке про колено, а я эту заметку нигде не увидела».
- «Подопечного я добавила, а войти он не может. Пароли ему слать не хочу, пусть заходит по ссылке».
- «В зале пальцами по трём полям вписывать долго. Подход надо записывать быстрее».

## Подождёт

- «Хочу рекорды: когда Анна первый раз подняла 60. И отчёт за месяц, чтобы я не считала сама».
- «Подопечные спрашивают про питание и про замеры: вес тела, объёмы, фото раз в месяц».

В фон — то, где „готово“ и проверку можно написать заранее
`

// Задача фоновому агенту в четыре части — пишет человек, как docs/tasks/records.md (s12): задача, контекст, критерии готовности, ограничения
const TASK = `# Задача: заметка подопечного на карточке

## Задача

Тренер видит заметку подопечного под подходом на карточке подопечного (\`/clients/[id]\`). Подопечный пишет заметку к подходу на странице тренировки, она сохраняется в базе, но тренеру нигде не видна.

## Контекст

- Откуда задача: \`docs/feedback.md\`, стопка «Мешает каждый день» — заметка про колено.
- Заметка — столбец \`note\` таблицы \`sets\` (\`supabase/migrations/0003_set_note.sql\`). Запрос карточки (\`app/clients/[id]/page.tsx\`) уже возвращает \`note\`: \`json_agg\` берёт всю строку подхода.
- Подходы выводит \`components/SetList.tsx\`: на карточке и на странице тренировки.
- Правила проекта — \`CLAUDE.md\`.

## Критерии готовности

- Под подходом с заметкой видна заметка: подход 50 × 10 с заметкой «болит колено» — на карточке под «50 кг × 10» строка «болит колено».
- Под подходом без заметки ничего лишнего: ни пустой строки, ни подписи.
- \`npm run check\` проходит.

## Ограничения

- Менять только \`components/SetList.tsx\`.
- Миграции (\`supabase/\`), форму подопечного (\`app/workouts/[id]\`) и тесты не трогать.
- Работать только в ветке \`agent/notes\`.
`

// Список подходов после s08 — дословно (если файл другой, рекордер скажет «find не найден»)
const SETLIST_S12 = `// Подходы тренировки списком: «60 кг × 8» в строке. Один вывод для карточки подопечного у тренера (app/clients/[id])
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
const SET_TYPE = 'type ListedSet = { id: string | number; weight: number; reps: number };'
const SET_TYPE_NOTE = 'type ListedSet = { id: string | number; weight: number; reps: number; note?: string | null };'
const SET_ROW = '          {set.weight} кг × {set.reps}\n'

// Расплывчатая задача, правка 1 из 4: заметка под подходом — в своём классе из app/globals.css
const SETLIST_VAGUE = replaceOnce(
  replaceOnce(
    replaceOnce(
      SETLIST_S12,
      '// Подходы тренировки списком: «60 кг × 8» в строке. ',
      '// Подходы тренировки списком: «60 кг × 8» в строке, заметка подопечного — под подходом (стиль .set-note в app/globals.css).\n// ',
    ),
    SET_TYPE,
    SET_TYPE_NOTE,
  ),
  SET_ROW,
  SET_ROW + '          {set.note && <p className="set-note">{set.note}</p>}\n',
)

// Задача в четыре части: тот же список, правка только здесь — заметка под подходом, у подхода без заметки ничего
const SETLIST_NOTES = replaceOnce(
  replaceOnce(
    replaceOnce(
      SETLIST_S12,
      '// id подхода из запроса к sets приходит строкой, из json_agg — числом.\n',
      '// id подхода из запроса к sets приходит строкой, из json_agg — числом.\n' +
        '// Заметка подопечного (note) — строкой под подходом; нет заметки (null или поля нет) — под подходом ничего.\n',
    ),
    SET_TYPE,
    SET_TYPE_NOTE,
  ),
  SET_ROW,
  SET_ROW + '          {set.note && <p className="text-zinc-500">{set.note}</p>}\n',
)

// Расплывчатая задача, правка 2 из 4: поле «Заметка» на странице тренировки — многострочное (форма подопечного после s08 — дословно)
const NOTE_INPUT = `          <input
            id="note"
            name="note"
            maxLength={200}`
const NOTE_TEXTAREA = `          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={200}`

// Расплывчатая задача, правка 3 из 4: стиль заметки и общий размер подписей — у всех полей приложения (app/globals.css после s12)
const CSS_BUTTONS = `@layer base {
  button {
    min-height: var(--button-height);
  }
}
`
const CSS_VAGUE = `@layer base {
  button {
    min-height: var(--button-height);
  }

  /* подписи полей — крупнее и заметнее */
  label {
    font-size: 1.125rem;
    font-weight: 500;
  }
}

/* Заметка подопечного под подходом: полоса слева и светлый фон, чтобы её было видно */
.set-note {
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-left: 3px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.875rem;
}
`

// Список подопечных после s10 — дословно. Расплывчатая задача, правка 4 из 4: значок «есть заметки» у подопечного с заметками
const CLIENTS_S12 = `import type { Metadata } from "next";
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

// Подопечные вошедшего тренера, у каждого — дата последней тренировки; под списком форма нового подопечного
export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const clients = await asUser(uid, async (db) => {
    // подопечные и дата последней тренировки — одним запросом: left join и max(day)
    const { rows } = await db.query<Client>(
      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
        where c.coach_id = $1
        group by c.id
        order by c.id\`,
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
              <span className="block text-sm font-normal text-zinc-500">
                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
              </span>
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
    </main>
  );
}
`
const CLIENTS_VAGUE = replaceOnce(
  replaceOnce(
    replaceOnce(
      replaceOnce(
        CLIENTS_S12,
        '// Подопечный тренера с датой последней тренировки\ntype Client = { id: string; name: string; last: Date | null };',
        '// Подопечный тренера с датой последней тренировки; notes — есть ли заметки к его подходам\n' +
          'type Client = { id: string; name: string; last: Date | null; notes: boolean };',
      ),
      '    // подопечные и дата последней тренировки — одним запросом: left join и max(day)\n',
      '    // подопечные, дата последней тренировки и есть ли заметки — одним запросом: left join, max(day) и bool_or\n',
    ),
    `      \`select c.id, c.name, max(w.day) as last
         from clients c
         left join workouts w on w.client_id = c.id
`,
    `      \`select c.id, c.name, max(w.day) as last, coalesce(bool_or(s.note is not null), false) as notes
         from clients c
         left join workouts w on w.client_id = c.id
         left join sets s on s.workout_id = w.id
`,
  ),
  '              {client.name}\n',
  `              {client.name}
              {client.notes && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 align-middle text-sm font-normal text-amber-800">
                  есть заметки
                </span>
              )}
`,
)

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s13-feedback: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

export default {
  id: 's13-feedback',
  from: 's12-agent',
  date: '2026-11-04T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а npx tsc --noEmit в npm run check (шаг notes-check) ищет типы маршрутов Next
    // (PageProps, LayoutProps) — генерируем их заново, как это сделал бы npm run dev; файлов проекта шаг не меняет, уроки на него не ссылаются
    { id: 'typegen', run: 'npx next typegen' },
    // отзывы — пишет человек: слова Марины дословно из плана, по стопкам
    { id: 'feedback', write: 'docs/feedback.md', content: FEEDBACK },
    { id: 'c-feedback', commit: 'Отзывы Марины в три стопки' },
    // подводный камень: расплывчатая задача в отдельной ветке
    { id: 'vague-branch', run: 'git switch -c agent/notes-vague' },
    {
      id: 'ask-vague',
      agent: {
        prompt: 'Покажи заметки к подходам получше',
        reply:
          'Сделал заметки заметнее в четырёх местах. components/SetList.tsx: заметка подопечного — под подходом. ' +
          'app/workouts/[id]/page.tsx: поле «Заметка» стало многострочным. app/globals.css: стиль заметки — полоса слева и светлый фон, ' +
          'а подписи всех полей — крупнее. app/clients/page.tsx: у подопечного с заметками в списке значок «есть заметки».',
      },
      steps: [
        { id: 'vague-list', edit: 'components/SetList.tsx', find: SETLIST_S12, replace: SETLIST_VAGUE },
        { id: 'vague-form', edit: 'app/workouts/[id]/page.tsx', find: NOTE_INPUT, replace: NOTE_TEXTAREA },
        { id: 'vague-css', edit: 'app/globals.css', find: CSS_BUTTONS, replace: CSS_VAGUE },
        { id: 'vague-clients', edit: 'app/clients/page.tsx', find: CLIENTS_S12, replace: CLIENTS_VAGUE },
      ],
    },
    { id: 'c-vague', commit: 'Заметки получше' },
    // что задела расплывчатая задача: четыре файла вместо одного
    { id: 'vague-stat', run: 'git diff main agent/notes-vague --stat' },
    { id: 'vague-drop', run: 'git switch main && git branch -D agent/notes-vague' },
    // задача в четыре части — пишет человек и коммитит в main, до ветки агента
    { id: 'task-notes', write: 'docs/tasks/notes.md', content: TASK },
    { id: 'c-task', commit: 'Задача агенту: заметка на карточке' },
    { id: 'agent-branch', run: 'git switch -c agent/notes' },
    {
      // Accept edits: правка без вопроса, команда — с вопросом [y / n]
      id: 'ask-notes',
      agent: {
        prompt: 'Выполни задачу из docs/tasks/notes.md',
        reply:
          'Готово. Изменил один файл — components/SetList.tsx: под подходом с заметкой строка с заметкой, у подхода без заметки ' +
          'ничего лишнего. Запрос карточки уже возвращает note (json_agg берёт всю строку подхода), поэтому другие файлы не трогал. ' +
          'npm run check прошёл: линтер, типы, тесты и сборка.',
      },
      steps: [
        { id: 'notes-read', read: 'docs/tasks/notes.md' },
        { id: 'notes-list', edit: 'components/SetList.tsx', find: SETLIST_S12, replace: SETLIST_NOTES },
        { id: 'notes-check', run: 'npm run check' },
      ],
    },
    { id: 'c-notes', commit: 'Заметка подопечного видна тренеру' },
    // приёмка из main: какие коммиты и какие файлы в ветке агента
    { id: 'main-back', run: 'git switch main' },
    { id: 'accept-log', run: 'git log main..agent/notes --oneline' },
    { id: 'accept-stat', run: 'git diff main agent/notes --stat' },
    // руками — в ветке агента: подход с заметкой от Анны (тренировка 1 «Ноги», клиент 1), карточка у Марины
    { id: 'review-branch', run: 'git switch agent/notes' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-anna', browser: { url: '/login', fill: { Почта: 'anna@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    { id: 'set-note', browser: { url: '/workouts/1', fill: { 'Вес, кг': '50', Повторы: '10', Заметка: 'болит колено' }, click: 'Сохранить подход' } },
    { id: 'login-marina', browser: { url: '/login', fill: { Почта: 'marina@example.com', Пароль: 'demo-password' }, click: 'Войти' } },
    // под четвёртым подходом «50 кг × 10» — «болит колено»
    { id: 'card-note', browser: { url: '/clients/1' } },
    // слияние без перемотки: в истории main видно, что работа пришла из ветки агента
    { id: 'merge-notes', run: "git switch main && git merge --no-ff agent/notes -m 'Слияние: заметка на карточке'" },
  ],
}
