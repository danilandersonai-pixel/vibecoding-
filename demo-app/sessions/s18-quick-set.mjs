// Сессия 18: своё отличие (утро 9 ноября; база — из миграций и seed, db: true). Шестая сессия недели 2, ролик дня 13.
// Человек раскладывает жалобы пользователей эталонов А, Б и В в стопки docs/complaints.md: текст авторский, по образцу публичных
// отзывов, без названий продуктов (как docs/etalons.md). Выше всех — «долго записывать подход» (А, Б) и «тренер не видит, что я сделал»
// (Б, В); вторая у нас уже закрыта строкой паритета «Тренер видит вес и повторы подопечного». Вывод — отличие: подход в одно касание,
// и тренер сразу видит вес, повторы и рост.
// Подводный камень — гонка за эталонами: в ветке copy/etalon-b (Б — главный образец) на «Сделай как у эталонов: чат и оплату как у Б,
// таймер отдыха как у А» агент пишет чат и подписку, как у Б (цена — за каждого подопечного: так копируется и жалоба на Б), таймер
// отдыха, как у А, и правит lib/payments.ts;
// git diff main copy/etalon-b --stat — пять файлов, и ни один не нужен главным сценариям. Ветка удаляется без слияния. Потом человек
// приводит docs/parity.md к четырём решениям шага 5 книги — готово, наше отличие, позже, не делаем: легенда и колонка «Наше»; чат —
// «не делаем» (его заменили комментарии к тренировке), таймер и оплата — «позже», у каждого причина; новая строка «Подход в одно
// касание» — «наше отличие». Колонки эталонов остаются «есть / нет»: они описывают разбор.
// Срез: сначала сквозной тест e2e/quick-set.spec.ts, потом на /workouts/[id] кнопка «Повторить подход (50 кг, 10 повторов)» — ещё один
// подход с весом и повторами прошлого подхода тренировки: на кнопке — его id, вес и повторы действие берёт из базы, а не из формы;
// подходов нет — нет и кнопки. В подписи нет «50 кг × 10»: так getByText("50 кг × 10") старого e2e/cycle.spec.ts находит только подход.
// На /clients у Марины — последний подход каждого (по порядку записи) с названием его тренировки и растёт ли вес: он тяжелее прошлого
// подхода той же тренировки или с тем же весом повторов больше — «Вес растёт», иначе «Вес не растёт»; подход в тренировке один — строки нет.
// Playwright идёт до npm run dev: playwright.config.ts (s07) сам поднимает npm run dev и сам его останавливает, поэтому шаг dev потом
// находит порт 3000 свободным. Запускается только e2e/quick-set.spec.ts: e2e/cycle.spec.ts с s09 падает на getByLabel("Дата") (её находит
// и подпись графика «Объём тренировок по датам») — точную подпись ставит s19.
// Строк для кадра сессия не создаёт: в seed у «Ног» (тренировка 1 Анны) уже три подхода 50 × 10. Сквозной тест оставляет в базе свой
// подход, quick-tap считает подходы до и после нажатия.
// Запись с середины цепочки: node scripts/record-session.mjs --from s18-quick-set (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: ask-copy и ask-quick — Accept edits (правки без вопроса, npx playwright test — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Жалобы на эталоны — пишет человек. Текст авторский, по образцу публичных отзывов (docs/etalons.md), без названий продуктов
const COMPLAINTS = `# Жалобы на эталоны

Жалобы пользователей эталонов А, Б и В. Текст мой: пересказ по образцу публичных отзывов с низкой оценкой, без названий приложений и без имён. Похожие жалобы лежат в одной стопке; стопки идут по размеру, сверху — на что жалуются чаще.

## Долго записывать подход — А, Б

- «Один подход — пять нажатий: упражнение, подход, вес, повторы, „Сохранить“. Отдых кончается раньше» — А.
- «Вес и повторы каждый раз ввожу заново, хотя они те же, что в прошлом подходе» — А.
- «Вписывать вес долго, поэтому подопечные просто ставят галочку „выполнено“» — Б.

## Тренер не видит, что я сделал — Б, В

- «Ставлю галочку, а сколько поднял, тренер не знает» — Б.
- «Вижу у подопечных только отметки: растёт ли вес, не понять» — Б.
- «Есть только отметка „был“. Что я делал на тренировке, никто не видит» — В.

Сюда же жалоба на А, где тренера нет вовсе: «Свои записи тренеру не показать».

## Пропадает история — А, В

- «Сменила телефон — история тренировок пропала» — А.
- «Кончился абонемент, и тренировки за год исчезли» — В.

## Мешает на тренировке — А, Б

- «Реклама на весь экран прямо между подходами» — А.
- «Уведомления по каждому поводу, пришлось отключить все» — Б.

## Не под меня — Б, В

- «Одно и то же упражнение вбиваю в программу каждому подопечному заново» — Б.
- «Программу клуба под себя не изменить» — В.
- «Работает только в одном клубе: перешла в другой — и приложение не нужно» — В.

## Дорого — Б

- «Цена растёт с каждым подопечным» — Б.

## Что из этого следует

- Вторая стопка у нас уже закрыта: строка паритета «Тренер видит вес и повторы подопечного» (\`docs/parity.md\`) — у всех эталонов «нет», у нас работает.
- Первая открыта: подход по-прежнему вписывается в поля — вес, повторы, «Сохранить подход».
- Отличие: подход в одно касание, и тренер сразу видит вес, повторы и рост.
`

// Страница тренировки после s16 (её правят copy-timer-use в ветке копии и quick-page в main) — дословно, как в состоянии s17-invite
const WORKOUT_PAGE = `import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Comments, { type WorkoutComment } from "@/components/Comments";
import SetList from "@/components/SetList";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { volume } from "@/lib/volume";
import { saveSet } from "./actions";
import { addComment } from "./comments";

export const metadata: Metadata = { title: "Тренировка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренировка по id из адреса: упражнения по программе, подходы, объём, форма нового подхода и комментарии. Чужой тренировки база не отдаст (RLS) — будет 404
export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const workout = await asUser(uid, async (db) => {
    const found = await db.query<{ title: string }>("select title from workouts where id = $1", [id]);
    // упражнения по программе: копия строк шаблона в строках тренировки — «Присед — 3 × 10»
    const items = await db.query<{ id: string; exercise: string; sets: number; reps: number }>(
      "select id, exercise, sets, reps from workout_exercises where workout_id = $1 order by id",
      [id],
    );
    // вес в базе — numeric, pg отдаёт его строкой; float8 приходит числом
    const sets = await db.query<{ id: string; weight: number; reps: number }>(
      "select id, weight::float8 as weight, reps from sets where workout_id = $1 order by id",
      [id],
    );
    // комментарии к тренировке: автор — подопечный (его имя) или тренер
    const comments = await db.query<WorkoutComment>(
      \`select cm.id, cm.workout_id, cm.body, case when cm.author_id = c.user_id then c.name else 'Тренер' end as author
         from comments cm
         join workouts w on w.id = cm.workout_id
         join clients c on c.id = w.client_id
        where cm.workout_id = $1
        order by cm.id\`,
      [id],
    );
    return found.rows.length > 0
      ? { title: found.rows[0].title, items: items.rows, sets: sets.rows, comments: comments.rows }
      : null;
  });
  if (!workout) notFound();
  // поля приходят из формы, а id тренировки действие получает отсюда
  const save = saveSet.bind(null, id);
  // комментарий — к этой тренировке, после отправки — снова эта страница
  const comment = addComment.bind(null, id, \`/workouts/\${id}\`);

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">{workout.title}</h1>
      {workout.items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 font-medium">
          {workout.items.map((item) => (
            <li key={item.id}>
              {item.exercise} — {item.sets} × {item.reps}
            </li>
          ))}
        </ul>
      )}

      {workout.sets.length === 0 ? (
        <p className="mt-6 text-zinc-500">Подходов пока нет</p>
      ) : (
        <SetList sets={workout.sets} className="mt-6 flex flex-col gap-1" />
      )}
      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>

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
        <div className="flex flex-col gap-1">
          <label htmlFor="note">Заметка</label>
          <input
            id="note"
            name="note"
            maxLength={200}
            placeholder="Необязательно, до 200 знаков"
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Сохранить подход
        </button>
      </form>

      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Комментарии</h2>
      <Comments comments={workout.comments} action={comment} className="mt-2" />
    </main>
  );
}
`

// --- Копия эталонов: чат и оплата — Б, таймер — А (ветка copy/etalon-b, удаляется без слияния). Пишет агент; код правдоподобный и короткий ---

// Чат — пишет агент. Таблицы messages в базе нет: миграцию агент не написал (так и говорит в ответе)
const COPY_CHAT = `import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Чат" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Сообщение чата: автор и текст
type Message = { id: string; author: string; body: string };

// Сообщение от имени вошедшего — тренера или подопечного, как в чате эталона Б
async function send(form: FormData) {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const body = String(form.get("body") ?? "").trim();
  if (body !== "") {
    await asUser(uid, (db) => db.query("insert into messages (author_id, body) values ($1, $2)", [uid, body]));
  }
  redirect("/chat");
}

// Чат тренера и подопечного: сообщения по порядку, под ними поле «Сообщение» и кнопка «Отправить»
export default async function ChatPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const messages = await asUser(uid, async (db) => {
    const { rows } = await db.query<Message>(
      "select m.id, p.name as author, m.body from messages m join profiles p on p.id = m.author_id order by m.id",
    );
    return rows;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Чат</h1>
      <ul className="mt-6 flex flex-col gap-2">
        {messages.map((message) => (
          <li key={message.id}>
            <span className="font-semibold">{message.author}:</span> {message.body}
          </li>
        ))}
      </ul>
      <form action={send} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Сообщение
          <textarea name="body" required rows={2} className="rounded border border-zinc-300 px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
        </button>
      </form>
    </main>
  );
}
`

// Таймер отдыха — пишет агент, как у эталона А: обратный отсчёт на 60, 90 или 120 секунд
const COPY_TIMER = `"use client";

import { useEffect, useState } from "react";

// Таймер отдыха между подходами, как у эталона А: кнопки 60, 90 и 120 секунд и обратный отсчёт
export default function RestTimer() {
  const [left, setLeft] = useState(0);

  // секунда за секундой, пока отдых не кончится
  useEffect(() => {
    if (left <= 0) return;
    const tick = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(tick);
  }, [left]);

  return (
    <div className="mt-6 flex items-center gap-2">
      <span className="w-16 font-mono text-xl">
        {left > 0 ? \`\${Math.floor(left / 60)}:\${String(left % 60).padStart(2, "0")}\` : "Отдых"}
      </span>
      {[60, 90, 120].map((seconds) => (
        <button
          key={seconds}
          type="button"
          onClick={() => setLeft(seconds)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm"
        >
          {seconds} с
        </button>
      ))}
    </div>
  );
}
`

// Таймер на странице тренировки — правка агента: под формой подхода
const WORKOUT_PAGE_TIMER = chain(WORKOUT_PAGE, [
  ['import SetList from "@/components/SetList";\n', 'import RestTimer from "@/components/RestTimer";\nimport SetList from "@/components/SetList";\n'],
  ['          Сохранить подход\n        </button>\n      </form>\n', '          Сохранить подход\n        </button>\n      </form>\n      <RestTimer />\n'],
])

// Подписка — пишет агент: цена за каждого подопечного, как у эталона Б (на это и жалуются его пользователи)
const COPY_BILLING = `import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { monthlyPrice, startPayment } from "@/lib/payments";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Подписка" };

// Страница ждёт ответа базы и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Тренер оплачивает месяц подписки
async function pay() {
  "use server";
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await startPayment({ coachId: uid, plan: "month" });
  redirect("/clients");
}

// Подписка тренера, как у эталона Б: цена за месяц — за каждого подопечного
export default async function BillingPage() {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const count = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ count: number }>("select count(*)::int as count from clients where coach_id = $1", [uid]);
    return rows[0].count;
  });

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Подписка</h1>
      <p className="mt-6">Подопечных: {count}</p>
      <p className="mt-2 font-medium">В месяц: {monthlyPrice(count)} ₽</p>
      <form action={pay} className="mt-6">
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Оплатить
        </button>
      </form>
    </main>
  );
}
`

// Заготовка оплаты (s09) — дословно, как в состоянии s17-invite
const PAYMENTS = `// Заготовка оплаты подписки тренера. Секрет платёжной системы берём из окружения (.env.local), в коде его нет:
// сканер секретов не пустит ключ в коммит, а на сервере его читает process.env.
const PAY_SECRET = process.env.PAY_SECRET ?? "";

export type Subscription = { coachId: string; plan: "month" | "year" };

// Пока заглушка: позже здесь будет вызов платёжной системы с PAY_SECRET.
export async function startPayment(sub: Subscription): Promise<{ ok: boolean; plan: Subscription["plan"] }> {
  if (!PAY_SECRET) throw new Error("Не задан PAY_SECRET");
  return { ok: true, plan: sub.plan };
}
`

// Цена подписки — правка агента: за каждого подопечного
const PAYMENTS_PRICE = chain(PAYMENTS, [
  [
    'export type Subscription = { coachId: string; plan: "month" | "year" };\n',
    `export type Subscription = { coachId: string; plan: "month" | "year" };

// Цена, как у эталона Б: рублей в месяц за каждого подопечного
export const PRICE_PER_CLIENT = 290;

export function monthlyPrice(clients: number): number {
  return PRICE_PER_CLIENT * clients;
}
`,
  ],
])

// --- Паритет: четыре решения шага 5 ---

// Таблица паритета после s11 — дословно, как в состоянии s17-invite
const PARITY = `# Паритет с эталонами

Шаг 5 чистой комнаты: первая версия собрана и запускается как рабочая сборка (\`npm start\`), теперь сверяю её с эталонами. Сравниваю поведение по сценариям, а не внешний вид. Про эталоны беру только свой разбор (\`docs/etalons.md\`): «нет» в их колонках значит «в разборе этого нет», а не «точно нет».

В колонке «Наше» — то, что приложение делает сегодня, 3 ноября:

- **есть** — работает, я это нажимала или это проверяет тест;
- **позже** — отложено в спецификации (\`docs/spec.md\`, «Откладываем») или попало в план недель 2–3;
- **нет** — осознанно не делаем.

| Сценарий | Эталон А | Эталон Б | Эталон В | Наше |
|---|---|---|---|---|
| Записать подход: вес и повторы | есть | нет | нет | есть |
| Таймер отдыха | есть | нет | нет | позже |
| История тренировок | есть | есть | есть | есть |
| График роста | есть | нет | нет | есть |
| Тренер назначает тренировку | нет | есть | нет | есть |
| Упражнения в тренировке | есть | есть | есть | позже |
| Готовая программа, не нужно собирать | нет | нет | есть | позже |
| Менять программу под себя | нет | есть | нет | позже |
| Список подопечных у тренера | нет | есть | нет | есть |
| Тренер видит вес и повторы подопечного | нет | нет | нет | есть |
| Отметка «выполнено» | нет | есть | есть | нет |
| Чат тренера и подопечного | нет | есть | нет | позже |
| Напоминания и уведомления | нет | есть | нет | позже |
| Видео упражнения | нет | нет | есть | позже |
| Расписание клуба и запись на занятие | нет | нет | есть | позже |
| Оплата и тарифы | нет | есть | нет | позже |

## Что видно в таблице

- Три главных сценария из спецификации — записать подход, назначить тренировку, увидеть прогресс — в приложении есть, но в урезанном виде: у тренировки нет упражнений, а записи подопечных тренер смотрит по одному (подробнее ниже). Для первой версии этого достаточно.
- Строка «Тренер видит вес и повторы подопечного» — единственная, где у всех трёх эталонов «нет», а у нас «есть». Это вторая половина моего отличия из спецификации («тренер сразу видит вес и повторы и то, растут ли они»), на неё и делаю ставку. Первая половина — подход за пару секунд — пока не выполнена: см. пункт 2 ниже.
- «Отметка „выполнено“» у нас «нет» не случайно: подопечный пишет настоящий вес и повторы, а не ставит галочку.
- Из В я беру идею готовой тренировки, которую можно менять. В моём разборе у В программа готовая, но под себя её не изменить: поэтому «Готовая программа, не нужно собирать» и «Менять программу под себя» — две строки, и нужны обе. У Б в моём разборе наоборот: программу можно собрать, но шаблонов не видно, и одно и то же приходится повторять руками.
- «Позже» собирается в две группы. Первая делает тренировку полноценной: упражнения и программы. Вторая оживляет общение: чат, напоминания, уведомления. Таймер, видео, расписание клуба и оплата к главным сценариям не относятся.

## Где приложение делает меньше, чем я записала

Это места, где поведение расходится со спецификацией, а не только с эталонами. Решения по ним в спецификации нет, их надо принять:

1. Сценарий 1 обещает «добавляет упражнения: сколько подходов, повторов и какой вес». В приложении у тренировки есть название и дата, упражнений нет, а подход — просто вес и повторы.
2. «Подход в два касания». Сейчас подопечный открывает тренировку, вписывает вес, повторы и, если нужно, заметку, потом нажимает «Сохранить подход». Это больше двух касаний, и в зале это заметно.
3. «Тренер видит записи всех подопечных в одном месте». Список подопечных показывает только дату последней тренировки; вес и повторы — на карточке каждого.
4. Заметка к подходу («болит колено») сохраняется, но нигде не показывается: ни подопечному, ни тренеру.
5. Подопечного, которого тренер добавил на \`/clients\` по имени, пустить в приложение нечем: у него нет входа. Входят только подопечные из демо-данных.

## Чего в моём разборе эталонов не было, а у нас есть

- Тренер видит только своих подопечных: за это отвечают политики доступа к строкам в базе, а не страница.
- Манифест и иконка есть; установку на телефон не проверяла: сайт пока не в интернете. В спецификации был «только сайт»; когда он появится в интернете, попробую поставить его на экран как приложение, без магазина.

## Чего не делаю

Не гонюсь за полным повторением: у эталонов сотни возможностей за годы. Пока не закрыты упражнения с программами и общение (чат, напоминания, уведомления), к видео, расписанию клуба и оплате не прикасаюсь.
`

// Решения паритета — правка человека (parity-edit). Колонки эталонов не меняются: «есть / нет» — это разбор.
// «Готово» — только то, что неделя 2 действительно сделала: упражнения и шаблоны программ (s14); правки назначенной копии нет,
// у уведомлений есть правила (s16), а отправки нет — они остаются «позже»
const PARITY_DECIDED = chain(PARITY, [
  [
    `В колонке «Наше» — то, что приложение делает сегодня, 3 ноября:

- **есть** — работает, я это нажимала или это проверяет тест;
- **позже** — отложено в спецификации (\`docs/spec.md\`, «Откладываем») или попало в план недель 2–3;
- **нет** — осознанно не делаем.
`,
    `В колонке «Наше» — моё решение по каждой строке на сегодня, 9 ноября:

- **готово** — работает, я это нажимала или это проверяет тест;
- **наше отличие** — ради этого к нам перейдут: в моём разборе такого нет ни у одного эталона;
- **позже** — отложено в спецификации (\`docs/spec.md\`, «Откладываем») или попало в план недель 2–3;
- **не делаем** — осознанно не делаем.
`,
  ],
  [
    `| Записать подход: вес и повторы | есть | нет | нет | есть |
| Таймер отдыха | есть | нет | нет | позже |
| История тренировок | есть | есть | есть | есть |
| График роста | есть | нет | нет | есть |
| Тренер назначает тренировку | нет | есть | нет | есть |
| Упражнения в тренировке | есть | есть | есть | позже |
| Готовая программа, не нужно собирать | нет | нет | есть | позже |
| Менять программу под себя | нет | есть | нет | позже |
| Список подопечных у тренера | нет | есть | нет | есть |
| Тренер видит вес и повторы подопечного | нет | нет | нет | есть |
| Отметка «выполнено» | нет | есть | есть | нет |
| Чат тренера и подопечного | нет | есть | нет | позже |
| Напоминания и уведомления | нет | есть | нет | позже |
| Видео упражнения | нет | нет | есть | позже |
| Расписание клуба и запись на занятие | нет | нет | есть | позже |
| Оплата и тарифы | нет | есть | нет | позже |
`,
    `| Записать подход: вес и повторы | есть | нет | нет | готово |
| Подход в одно касание | нет | нет | нет | наше отличие |
| Таймер отдыха | есть | нет | нет | позже — к главным сценариям не относится, вернусь после запуска |
| История тренировок | есть | есть | есть | готово |
| График роста | есть | нет | нет | готово |
| Тренер назначает тренировку | нет | есть | нет | готово |
| Упражнения в тренировке | есть | есть | есть | готово |
| Готовая программа, не нужно собирать | нет | нет | есть | готово |
| Менять программу под себя | нет | есть | нет | позже — назначенное уже копия шаблона, но править её пока нечем |
| Список подопечных у тренера | нет | есть | нет | готово |
| Тренер видит вес и повторы подопечного | нет | нет | нет | наше отличие |
| Отметка «выполнено» | нет | есть | есть | не делаем — подопечный пишет настоящий вес и повторы |
| Чат тренера и подопечного | нет | есть | нет | не делаем — вместо чата комментарии к тренировке |
| Напоминания и уведомления | нет | есть | нет | позже — правила уведомлений есть, отправки нет |
| Видео упражнения | нет | нет | есть | позже |
| Расписание клуба и запись на занятие | нет | нет | есть | позже |
| Оплата и тарифы | нет | есть | нет | позже — после запуска, и не за каждого подопечного: на это жалуются у Б |

Разбор ниже — от 3 ноября, по первой версии. Решения 9 ноября — в таблице и в разделе «Чего не делаю».
`,
  ],
  [
    'Не гонюсь за полным повторением: у эталонов сотни возможностей за годы. Пока не закрыты упражнения с программами и общение (чат, напоминания, уведомления), к видео, расписанию клуба и оплате не прикасаюсь.\n',
    'Не гонюсь за полным повторением: у эталонов сотни возможностей за годы. 9 ноября попросила агента сделать «как у эталонов» — чат и оплату подписки как у Б, таймер отдыха как у А — в отдельной ветке: пять файлов, ни один не нужен главным сценариям, а цена за каждого подопечного повторила жалобу на Б. Ветку удалила. Делаю одно отличие: подход в одно касание, и тренер сразу видит вес, повторы и рост.\n',
  ],
])

// --- Срез: подход в одно касание ---

// Сквозной тест — пишет агент первым. Тренировка 1 — «Ноги» Анны из seed.sql; подходы тест считает до и после нажатия
const QUICK_E2E = `import { expect, test, type Page } from "@playwright/test";

// Подход в одно касание: Анна на тренировке «Ноги» (id 1 в supabase/seed.sql, там подходы 50 × 10) нажимает «Повторить подход» —
// подходов «50 кг × 10» становится на один больше; Марина в списке подопечных видит у Анны последний подход «50 кг × 10».
// Подходы тест считает до и после нажатия: от того, сколько их уже в базе, он не зависит.

async function login(page: Page, email: string, home: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("demo-password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(home);
}

test("Анна повторяет подход одним касанием, Марина видит его в списке подопечных", async ({ browser }) => {
  // у Анны и Марины — свои браузеры, у каждой своя cookie входа
  const anna = await browser.newPage();
  await login(anna, "anna@example.com", /\\/workouts$/);
  await anna.goto("/workouts/1");
  const sets = anna.getByText("50 кг × 10", { exact: true });
  const before = await sets.count();
  await anna.getByRole("button", { name: "Повторить подход" }).click();
  await expect(sets).toHaveCount(before + 1);

  const marina = await browser.newPage();
  await login(marina, "marina@example.com", /\\/clients$/);
  await expect(marina.getByRole("link", { name: /^Анна/ })).toContainText("Последний подход: 50 кг × 10");
});
`

// «Повторить подход» на странице тренировки — правка агента: кнопка с весом и повторами прошлого подхода, без подходов её нет.
// Подпись «Повторить подход (50 кг, 10 повторов)», без «50 кг × 10»: строку подхода и кнопку тесты различают по тексту
const WORKOUT_PAGE_QUICK = chain(WORKOUT_PAGE, [
  ['import { saveSet } from "./actions";\n', 'import { repeatSet, saveSet } from "./actions";\n'],
  [
    'export const instant = false;\n',
    `export const instant = false;

// Повторы словом по правилам русского языка: «1 повтор», «2 повтора», «10 повторов»
const REPS: Record<string, string> = { one: "повтор", few: "повтора", many: "повторов", other: "повтора" };
function repsText(reps: number): string {
  return \`\${reps} \${REPS[new Intl.PluralRules("ru").select(reps)]}\`;
}
`,
  ],
  [
    '// Тренировка по id из адреса: упражнения по программе, подходы, объём, форма нового подхода и комментарии.',
    '// Тренировка по id из адреса: упражнения по программе, подходы, объём, «Повторить подход», форма нового подхода и комментарии.',
  ],
  [
    '  const save = saveSet.bind(null, id);\n',
    `  const save = saveSet.bind(null, id);
  // одно касание: ещё раз прошлый подход этой тренировки — тот, что на кнопке; вес и повторы действие возьмёт из базы
  const last = workout.sets.at(-1);
`,
  ],
  [
    '      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>\n',
    `      <p className="mt-2 font-medium">Объём: {volume(workout.sets)} кг</p>
      {last && (
        <form action={repeatSet.bind(null, id, last.id)} className="mt-6">
          <button type="submit" className="w-full rounded bg-zinc-900 px-4 py-2 text-white">
            Повторить подход ({last.weight} кг, {repsText(last.reps)})
          </button>
        </form>
      )}
`,
  ],
])

// Конец действия saveSet (s08–s10) — сюда дописывается repeatSet
const SAVE_SET_END = `  // та же страница заново — с новым подходом и без прежней ошибки в адресе
  redirect(page);
}
`

// Действие «Повторить подход» — правка агента: подход с кнопки (его id), вес и повторы — из базы, а не из формы
const REPEAT_SET = `${SAVE_SET_END}
// Одно касание: ещё один подход в тренировку workoutId с весом и повторами подхода setId — того, что на кнопке. Вес и повторы
// берём из базы, а не из формы: подставить в запрос свой вес нельзя; подход другой тренировки не повторится (workout_id = $1).
// Запрос идёт от имени вошедшего: в чужую тренировку не даст вписать RLS.
export async function repeatSet(workoutId: string, setId: string) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  await asUser(uid, (db) =>
    db.query(
      \`insert into sets (workout_id, weight, reps)
       select workout_id, weight, reps from sets where id = $2 and workout_id = $1\`,
      [workoutId, setId],
    ),
  );
  redirect(\`/workouts/\${workoutId}\`);
}
`

// Страница подопечных после s17 (её правит quick-clients) — дословно, как в состоянии s17-invite
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

// Подопечные вошедшего тренера, у каждого — дата последней тренировки; под списком форма нового подопечного и приглашения
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
    return { clients: found.rows, invites: active.rows };
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

// Последний подход и рост веса в списке подопечных — правка агента (quick-clients): один запрос на всех, без N+1
const CLIENTS_LAST = chain(CLIENTS_PAGE, [
  [
    'type Client = { id: string; name: string; last: Date | null };\n',
    `type Client = { id: string; name: string; last: Date | null };
// Последний подход подопечного, его тренировка и растёт ли вес; growing — null, если подход в тренировке один: сравнивать не с чем
type Latest = { id: string; workout: string; weight: number; reps: number; growing: boolean | null };
`,
  ],
  [
    '// Подопечные вошедшего тренера, у каждого — дата последней тренировки; под списком',
    '// Подопечные вошедшего тренера, у каждого — дата последней тренировки, последний подход и растёт ли вес; под списком',
  ],
  [
    '    return { clients: found.rows, invites: active.rows };\n',
    `    // последний подход каждого — по порядку записи, с названием его тренировки. Вес растёт, если этот подход тяжелее прошлого
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
`,
  ],
  [
    `                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
              </span>
`,
    `                {client.last ? \`Последняя тренировка: \${formatDay(client.last)}\` : "Тренировок пока нет"}
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
`,
  ],
])

// Замена ровно одного вхождения: если его нет или их несколько, сессия не загрузится (лучше, чем тихо записать не то)
function replaceOnce(text, find, replace) {
  const at = text.indexOf(find)
  if (at < 0 || text.indexOf(find, at + 1) >= 0) throw new Error(`s18-quick-set: «${find.slice(0, 40)}…» должно встречаться ровно один раз`)
  return text.slice(0, at) + replace + text.slice(at + find.length)
}

// Несколько замен подряд, каждая — ровно одного вхождения
function chain(text, pairs) {
  return pairs.reduce((acc, [find, replace]) => replaceOnce(acc, find, replace), text)
}

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })

export default {
  id: 's18-quick-set',
  from: 's17-invite',
  date: '2026-11-09T10:00:00+03:00',
  db: true,
  steps: [
    // жалобы на эталоны — пишет человек: стопки по смыслу, сверху самые большие
    { id: 'complaints', write: 'docs/complaints.md', content: COMPLAINTS },
    { id: 'c-complaints', commit: 'Жалобы на эталоны в стопки' },
    // подводный камень: «как у эталонов» — в отдельной ветке (Б — главный образец: чат и оплата)
    { id: 'copy-branch', run: 'git switch -c copy/etalon-b' },
    {
      // Accept edits: файлы — без вопроса
      id: 'ask-copy',
      agent: {
        prompt: 'Сделай как у эталонов: чат и оплату как у Б, таймер отдыха как у А',
        reply:
          'Как у Б: чат на /chat и подписка на /billing — цена за каждого подопечного. Как у А: таймер отдыха на 60, 90 ' +
          'и 120 секунд под формой подхода. Чату нужна таблица messages: миграцию я не писал.',
      },
      steps: [
        { id: 'copy-chat', write: 'app/chat/page.tsx', content: COPY_CHAT },
        { id: 'copy-timer', write: 'components/RestTimer.tsx', content: COPY_TIMER },
        { id: 'copy-timer-use', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE, replace: WORKOUT_PAGE_TIMER },
        { id: 'copy-pay', write: 'app/billing/page.tsx', content: COPY_BILLING },
        { id: 'copy-pay-lib', edit: 'lib/payments.ts', find: PAYMENTS, replace: PAYMENTS_PRICE },
      ],
    },
    { id: 'c-copy', commit: 'Как у эталона Б' },
    // что принесла копия: пять файлов, ни одного для главных сценариев
    { id: 'copy-stat', run: 'git diff main copy/etalon-b --stat' },
    // «зачем это здесь?» — ветка удаляется без слияния
    { id: 'copy-drop', run: 'git switch main && git branch -D copy/etalon-b' },
    // решения паритета — пишет человек: четыре решения шага 5, причины у «позже» и «не делаем»
    { id: 'parity-edit', edit: 'docs/parity.md', find: PARITY, replace: PARITY_DECIDED },
    {
      // Accept edits: правки — без вопроса, npx playwright test — с вопросом [y / n]. Сначала сквозной тест
      id: 'ask-quick',
      agent: {
        prompt:
          'Подход в одно касание: на тренировке кнопка «Повторить подход» с весом и повторами прошлого подхода. ' +
          'У тренера в списке — последний подход каждого и «растёт / нет». Сначала сквозной тест',
        reply:
          '«Повторить подход» берёт вес и повторы из базы. Тренер видит последний подход каждого с тренировкой; ' +
          'вес растёт, если подход тяжелее прошлого в той же тренировке или вес тот же, а повторов больше.',
      },
      steps: [
        { id: 'quick-e2e', write: 'e2e/quick-set.spec.ts', content: QUICK_E2E },
        { id: 'quick-page', edit: 'app/workouts/[id]/page.tsx', find: WORKOUT_PAGE, replace: WORKOUT_PAGE_QUICK },
        { id: 'quick-action', edit: 'app/workouts/[id]/actions.ts', find: SAVE_SET_END, replace: REPEAT_SET },
        { id: 'quick-clients', edit: 'app/clients/page.tsx', find: CLIENTS_PAGE, replace: CLIENTS_LAST },
        // до npm run dev: сервер поднимает и останавливает playwright.config.ts; cycle.spec.ts падает с s09 на «Дата» — только свой тест
        { id: 'quick-run', run: 'npx playwright test e2e/quick-set.spec.ts' },
      ],
    },
    { id: 'c-quick', commit: 'Подход в одно касание; последний подход у тренера' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    { id: 'login-anna', browser: login('anna@example.com') },
    // «Ноги»: подходы 50 × 10 из seed и подход сквозного теста; одно касание — ещё один
    { id: 'quick-tap', browser: { url: '/workouts/1', click: 'Повторить подход' } },
    { id: 'login-marina', browser: login('marina@example.com') },
    // у Анны — последний подход «50 кг × 10, Ноги» и растёт ли вес
    { id: 'clients-last', browser: { url: '/clients' } },
  ],
}
