// Сессия 26: запуск (утро 23 ноября; база — из миграций и seed, db: true). Последняя сессия недели 3 и курса, ролик дня 21.
// Первый шаг typegen (npx next typegen): в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next (как в s13, s19–s25).
// Страница о продукте: на / до сих пор прототип s02 — «Тренировка / Вес, кг / Повторы / Сохранить подход», подходы в памяти сервера
// (app/api/sets, без входа). Агент (Accept edits) пишет главную — для кого, что умеет, как начать; «Войти» и «Политика
// конфиденциальности» — и удаляет app/api/sets/route.ts буквальным путём (rm — с вопросом [y / n]).
// Данные людей: агент в Plan перечисляет таблицы (psql -c '\dt public.*'), читает маршрут фото и миграцию заметки к подходу
// (d-note, сверх таблицы плана: в списке таблиц заметки не видно) — данные о здоровье: подходы с заметкой, комментарии, питание,
// замеры, фото (строка в photos, файл — storage/photos/). Человек пишет docs/privacy.md (текст авторский): что храним, зачем,
// кто видит — прямо сказано, что подопечный видит все шаблоны программ своего тренера, и что владельцы базы технически могут
// прочитать в ней всё, — где лежит (база, папка фото и очередь неотправленных подходов в localStorage телефона), как удалить
// аккаунт («Аккаунт» в меню, /account, вписать «удалить»); внизу — «Это не юридическая консультация: правила различаются по
// странам». Агент делает /privacy по документу (pv-read, сверх таблицы плана: агент читает документ, прежде чем писать страницу).
// Подводный камень — настоящий вывод (проверен черновым прогоном): политика обещает удаление, а удалить нечем. Человек пишет
// supabase/tests/test-account.sql — Вера, подопечная Марины, с тренировкой, подходом, комментарием и замером — и применяет его;
// delete from auth.users падает: ERROR: update or delete on table "profiles" violates foreign key constraint
// "clients_user_id_fkey" on table "clients" (каскад от auth.users доходит до profiles, а clients ссылается на профиль без каскада).
// Исправление, сначала тест (Accept edits; правки — без вопроса, vitest и psql — с вопросом [y / n]): test/delete-account.test.ts
// заводит двух подопечных Марины со всеми их строками (и программой, которую подопечный создал сам) и файлом снимка; без
// вписанного «удалить» не удаляется ничего; со словом первый удаляет аккаунт — ни строки, ни файла, у второго всё на месте; тренер
// так аккаунт не удалит. Красный — действия app/account/actions.ts нет. «Миграцию — с подтверждения» (CLAUDE.md приложения:
// схему — только с подтверждения): агент останавливается до миграции, второй ход — «Делай» (ask-delete-go, сверх таблицы плана).
// 0017_delete_account.sql — delete_account(): только вошедший подопечный, строки по порядку одной транзакцией (и его программы),
// в конце — пользователь (профиль — каскадом); возвращает номер подопечного. lib/photos.ts — photoDir: папка снимков только по
// номеру из цифр (del-photos, сверх таблицы плана). Действие сначала сверяет вписанное слово (иначе ошибка под формой), удаляет
// папку снимков в той же транзакции, до commit, стирает cookie и ведёт на главную; страница /account — поле «Впишите «удалить»»
// и «Удалить аккаунт» (del-page, сверх таблицы плана: один шаг — один файл). Удаление должно быть где найти: «Аккаунт» в меню
// подопечного и ожидаемое меню в e2e/first-run.spec.ts (ask-menu, сверх таблицы плана; тест меню — в общем прогоне). После
// коммита человек перезапускает dev со сбросом кэша (dev-restart, сверх таблицы плана, тот же запрос, что в s20 и s24): в записи
// без него страницы после входа Веры шли со старым меню — без «Аккаунт». Вера входит — «Аккаунт» в меню, — вписывает «удалить»,
// нажимает «Удалить аккаунт» — главная без меню; в auth.users её почты нет — 0.
// Чек-лист перед первым релизом (книга, s45) — агент в Plan читает 0002_rls.sql и проверяет RLS на каждой таблице public
// (cl-rls-all, сверх таблицы плана), читает .gitignore и страницу ошибки; вторым ходом («Делай», ask-checklist-go, сверх таблицы
// плана: одним ходом в окно агента не помещается) — ls e2e, docs/restore.md и страницу подопечных (cl-invite, сверх таблицы
// плана: адрес ссылки-приглашения — из заголовка Host). Ответ — по пунктам и только по прочитанному: сделано, не сделано, не знаю;
// копия базы — не сделано: копия в папке проекта — только для учений; откат релиза — не сделано: выкладки ещё нет; Host — не знаю,
// проверить на хостинге.
// Перед npm run check — снова npx next typegen (typegen-again, сверх таблицы плана): типы маршрутов от первого typegen ещё знали
// удалённый app/api/sets/route.ts, и в первой записи tsc падал — «Cannot find module '../../app/api/sets/route.js'» в
// .next/types/validator.ts; npm run dev эти типы не обновляет.
// Руками — npm run check и общий прогон всех сквозных тестов (npx playwright test, впервые все файлы e2e/ разом). Перед ним
// человек пишет и применяет supabase/tests/e2e-users.sql (e2e-seed, e2e-seed-apply; повторный запуск ничего не меняет — on conflict
// do nothing): Наташа — тренер без подопечных и Вера — подопечная без тренировок, их ждёт e2e/first-run.spec.ts (база
// сбрасывается на старте сессии, а Веру удалили).
// План на месяц — docs/roadmap.md (человек): «позже» из паритета, бета, после первой выкладки, раз в неделю журнал сбоев, раз
// в месяц учения с копией, одна область сопровождения — агенту на месяц (книга, s76).
// Домен, DNS и хостинг — доска в ролике, в сессии их нет.
// Строки для кадра сессия создаёт сама: Вера — psql -f, удаление — браузером; люди для сквозных тестов — psql -f.
// Запись с середины цепочки: node scripts/record-session.mjs --from s26-launch (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: ask-data, ask-checklist и ask-checklist-go — Plan; ask-home, ask-privacy-page, ask-delete, ask-delete-go и
// ask-menu — Accept edits.
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Главная — страница о продукте, пишет агент
const HOME_PAGE = `import Link from "next/link";

// Что умеет приложение — по разделам, которые есть у тренера и у подопечного
const FEATURES = [
  "Тренер ведёт программы и назначает по ним тренировки, подопечный вписывает вес и повторы — и без связи: подход отправится, когда появится сеть.",
  "Тренер видит последний подход каждого подопечного и растёт ли вес, а за месяц — отчёт по неделям.",
  "Комментарии под тренировкой, дневник питания, замеры и фото прогресса видят только подопечный и его тренер.",
];

// С чего начать: тренера заводит приглашение тренера, подопечного — ссылка от его тренера
const STEPS = [
  "Тренер получает от нас приглашение тренера и регистрируется по ссылке.",
  "На странице «Подопечные» тренер создаёт приглашение и отправляет ссылку подопечному.",
  "Подопечный регистрируется по ссылке и сразу попадает к своему тренеру: первую тренировку назначит тренер.",
];

// Главная — страница о продукте: для кого приложение, что умеет и как начать; дальше — вход и политика конфиденциальности.
// Её видят все, и без входа: данных людей страница не читает
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Тренировка</h1>
      <p className="mt-2 text-zinc-500">Приложение для персонального тренера и его подопечных.</p>

      <h2 className="mt-8 text-xl font-semibold">Для кого</h2>
      <p className="mt-2">
        Для тренера, который ведёт подопечных в зале и на расстоянии, и для самих подопечных: программа, подходы и прогресс — в
        одном месте, а не в переписке и таблицах.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Что умеет</h2>
      <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
        {FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Как начать</h2>
      <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link href="/login" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Войти
        </Link>
        <Link href="/privacy" className="underline">
          Политика конфиденциальности
        </Link>
      </div>
    </main>
  );
}
`

// Политика конфиденциальности — пишет человек, текст авторский
const PRIVACY_DOC = `# Политика конфиденциальности

«Тренировка» — приложение для тренера и его подопечных. Здесь сказано, какие данные о вас мы храним, зачем, кто их видит, где они лежат и как их удалить.

## Что храним

- **Аккаунт:** почта, имя и роль — тренер или подопечный. Пароль — только в виде хеша: сам пароль не видит никто, и мы тоже.
- **Данные о здоровье** — их больше всего, и они самые чувствительные:
  - тренировки и подходы: вес, повторы и заметка к подходу;
  - комментарии под тренировкой — в них пишут и о самочувствии;
  - питание: дневник и цели на день;
  - замеры тела: вес, талия и бёдра;
  - фото прогресса.
- **Программы тренера** — шаблоны тренировок: упражнения, подходы и повторы.
- **Приглашения:** чьё приглашение и кто по нему зарегистрировался.
- **Замечания** из «Сообщить о проблеме» и **журнал сбоев**: страница, где случился сбой, и текст ошибки.

## Зачем

Только чтобы приложение работало: тренер назначает тренировки и видит прогресс подопечного, подопечный видит свои тренировки и записывает подходы. Замечания и журнал сбоев — чтобы находить и исправлять ошибки. Рекламы нет, данные мы никому не продаём и не передаём.

## Кто видит

- Подопечный — свои тренировки, подходы, комментарии, питание, замеры и фото.
- Его тренер — всё это же. Дневник питания, замеры и фото тренер только видит, изменить их не может; цели питания на день ставит он.
- Другие тренеры и подопечные этого не видят: это проверяет сама база, а не только страница.
- **Программы тренера подопечный видит все** — не только назначенные ему, а все шаблоны своего тренера. Поэтому в названии программы не пишите имён и диагнозов.
- Замечания и журнал сбоев читаем только мы, в приложении их не видит никто.
- Мы — владельцы базы: технически можем прочитать в ней всё. Открываем данные, только чтобы разобрать сбой или замечание.

## Где лежит

- Всё, кроме фото и неотправленных подходов, — в базе данных приложения.
- Подход, записанный без связи, ждёт отправки в браузере телефона (\`localStorage\`) и лежит только там, пока не уйдёт на сервер.
- Фото — файлами в папке \`storage/photos/\` на сервере, у каждого подопечного своя папка. Открыть снимок можно только через приложение после входа — подопечному и его тренеру.
- Копия базы на случай сбоя — с теми же данными.

## Как удалить аккаунт

Подопечный удаляет свой аккаунт сам: войдите, откройте «Аккаунт» в меню (\`/account\`), впишите «удалить» и нажмите «Удалить аккаунт». Удалится всё, что о вас хранится: тренировки и подходы, комментарии под вашими тренировками, питание, замеры и фото — строки в базе и файлы снимков. Вернуть их после этого нельзя. В копии базы, сделанной до удаления, данные остаются, пока её не заменит новая. Подходы, которые ещё ждут отправки в браузере телефона, удаление не стирает: их сотрёт очистка данных сайта в браузере.

Аккаунт тренера удаляем вручную: у тренера подопечные. Напишите нам через «Сообщить о проблеме».

---

Это не юридическая консультация: правила различаются по странам.
`

// Страница /privacy по документу — пишет агент
const PRIVACY_PAGE = `import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Политика конфиденциальности" };

// Разделы страницы: заголовок и пункты
type Section = { title: string; items: string[] };

// Данные о здоровье — отдельным списком: их больше всего, и они самые чувствительные
const HEALTH = [
  "тренировки и подходы: вес, повторы и заметка к подходу;",
  "комментарии под тренировкой — в них пишут и о самочувствии;",
  "питание: дневник и цели на день;",
  "замеры тела: вес, талия и бёдра;",
  "фото прогресса.",
];

const SECTIONS: Section[] = [
  {
    title: "Кто видит",
    items: [
      "Подопечный — свои тренировки, подходы, комментарии, питание, замеры и фото.",
      "Его тренер — всё это же. Дневник питания, замеры и фото тренер только видит, изменить их не может; цели питания на день ставит он.",
      "Другие тренеры и подопечные этого не видят: это проверяет сама база, а не только страница.",
      "Программы тренера подопечный видит все — не только назначенные ему, а все шаблоны своего тренера. Поэтому в названии программы не пишите имён и диагнозов.",
      "Замечания и журнал сбоев читаем только мы, в приложении их не видит никто.",
      "Мы — владельцы базы: технически можем прочитать в ней всё. Открываем данные, только чтобы разобрать сбой или замечание.",
    ],
  },
  {
    title: "Где лежит",
    items: [
      "Всё, кроме фото и неотправленных подходов, — в базе данных приложения.",
      "Подход, записанный без связи, ждёт отправки в браузере телефона (localStorage) и лежит только там, пока не уйдёт на сервер.",
      "Фото — файлами в папке storage/photos/ на сервере, у каждого подопечного своя папка. Открыть снимок можно только через приложение после входа — подопечному и его тренеру.",
      "Копия базы на случай сбоя — с теми же данными.",
    ],
  },
];

// Политика конфиденциальности для всех, и без входа: текст — из docs/privacy.md, правят его там и здесь вместе.
// Ссылка на неё — на главной
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Политика конфиденциальности</h1>
      <p className="mt-2 text-zinc-500">
        «Тренировка» — приложение для тренера и его подопечных. Здесь сказано, какие данные о вас мы храним, зачем, кто их видит,
        где они лежат и как их удалить.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Что храним</h2>
      <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
        <li>
          <strong>Аккаунт:</strong> почта, имя и роль — тренер или подопечный. Пароль — только в виде хеша: сам пароль не видит
          никто, и мы тоже.
        </li>
        <li>
          <strong>Данные о здоровье</strong> — их больше всего, и они самые чувствительные:
          <ul className="mt-1 flex list-[circle] flex-col gap-1 pl-5">
            {HEALTH.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </li>
        <li>
          <strong>Программы тренера</strong> — шаблоны тренировок: упражнения, подходы и повторы.
        </li>
        <li>
          <strong>Приглашения:</strong> чьё приглашение и кто по нему зарегистрировался.
        </li>
        <li>
          <strong>Замечания</strong> из «Сообщить о проблеме» и <strong>журнал сбоев</strong>: страница, где случился сбой, и
          текст ошибки.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Зачем</h2>
      <p className="mt-2">
        Только чтобы приложение работало: тренер назначает тренировки и видит прогресс подопечного, подопечный видит свои тренировки
        и записывает подходы. Замечания и журнал сбоев — чтобы находить и исправлять ошибки. Рекламы нет, данные мы никому не
        продаём и не передаём.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="mt-8 text-xl font-semibold">{section.title}</h2>
          <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2 className="mt-8 text-xl font-semibold">Как удалить аккаунт</h2>
      <p className="mt-2">
        Подопечный удаляет свой аккаунт сам: войдите, откройте{" "}
        <Link href="/account" className="underline">
          «Аккаунт»
        </Link>{" "}
        в меню, впишите «удалить» и нажмите «Удалить аккаунт». Удалится всё, что о вас хранится: тренировки и подходы, комментарии
        под вашими тренировками, питание, замеры и фото — строки в базе и файлы снимков. Вернуть их после этого нельзя. В копии базы,
        сделанной до удаления, данные остаются, пока её не заменит новая. Подходы, которые ещё ждут отправки в браузере телефона,
        удаление не стирает: их сотрёт очистка данных сайта в браузере.
      </p>
      <p className="mt-2">Аккаунт тренера удаляем вручную: у тренера подопечные. Напишите нам через «Сообщить о проблеме».</p>

      <p className="mt-8 border-t border-zinc-300 pt-4 text-zinc-500">
        Это не юридическая консультация: правила различаются по странам.
      </p>
    </main>
  );
}
`

// Тестовый аккаунт — пишет человек: Вера со строками в четырёх таблицах
const TEST_ACCOUNT = `-- Тестовый аккаунт: Вера — подопечная Марины (supabase/seed.sql) с тренировкой, подходом, комментарием и замером,
-- как у подопечного после первой тренировки. На нём проверяем обещание политики (docs/privacy.md): аккаунт можно удалить.
-- Это не демо-данные и не миграция: запускается вручную (psql -f). Пароль demo-password, в auth.users — только его хеш (bcrypt).
insert into auth.users (id, email, encrypted_password) values
  ('77777777-7777-7777-7777-777777777777', 'vera@example.com', crypt('demo-password', gen_salt('bf')));

insert into profiles (id, role, name) values
  ('77777777-7777-7777-7777-777777777777', 'client', 'Вера');

insert into clients (coach_id, user_id, name) values
  ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Вера');

-- номер Веры в clients ставит база — тренировку и замер вешаем на него через user_id
insert into workouts (client_id, title, day)
  select id, 'Ноги', '2026-11-16' from clients where user_id = '77777777-7777-7777-7777-777777777777';

insert into measurements (client_id, day, weight, waist, hips)
  select id, '2026-11-16', 61.5, 70, 96 from clients where user_id = '77777777-7777-7777-7777-777777777777';

-- подход и комментарий — к её тренировке; комментарий пишет сама Вера
insert into sets (workout_id, weight, reps, note)
  select w.id, 20, 12, 'колено уходит внутрь' from workouts w join clients c on c.id = w.client_id
   where c.user_id = '77777777-7777-7777-7777-777777777777';

insert into comments (workout_id, author_id, body)
  select w.id, c.user_id, 'После приседа тянет поясницу' from workouts w join clients c on c.id = w.client_id
   where c.user_id = '77777777-7777-7777-7777-777777777777';
`

// Удаление аккаунта: тест, миграция, действие и страница — пишет агент
const DELETE_TEST = `// @vitest-environment node
// Удаление аккаунта (docs/privacy.md, «Как удалить аккаунт»): подопечный удаляет свой аккаунт — все свои строки и файлы фото.
// Тест заводит двух подопечных Марины (supabase/seed.sql) со всем, что бывает у подопечного: тренировка со строкой и подходом,
// комментарии его и тренера, цели и дневник питания, замер, снимок (строка и файл), принятое приглашение, замечание и программа,
// которую он создал сам (политика программ сверяет хозяина, но не роль). Без вписанного «удалить» не удаляется ничего.
// Со словом первый удаляет аккаунт: от него не остаётся ни строки, ни файла, а у второго всё на месте. Подопечные — новые
// при каждом запуске, второго тест в конце удаляет тем же действием.
// Вход подменён (currentUser из lib/session), cookie тоже: действие стирает её, а запроса в тесте нет.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { deleteAccount } from "../app/account/actions";
import { pool } from "../lib/db";
import { photoFile, photoPath } from "../lib/photos";

// Кто вошёл: действие спросит currentUser, а тест отвечает за него
const login = vi.hoisted(() => ({ uid: null as string | null }));
vi.mock("@/lib/session", () => ({ currentUser: async () => login.uid }));
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: () => undefined }) }));

const MARINA = "11111111-1111-1111-1111-111111111111";
const DAY = "2026-11-13";

// Форма «Удалить аккаунт»: что вписано в поле подтверждения
function formWith(word: string): FormData {
  const form = new FormData();
  form.append("confirm", word);
  return form;
}

// Куда ведёт действие: redirect бросает ошибку NEXT_REDIRECT, адрес — в её digest («NEXT_REDIRECT;replace;/;307;»)
async function redirectOf(action: Promise<unknown>): Promise<string> {
  const err = await action.then(
    () => null,
    (error: unknown) => error,
  );
  const digest = String((err as { digest?: unknown } | null)?.digest ?? "");
  expect(digest).toMatch(/^NEXT_REDIRECT;/);
  return digest.split(";")[2];
}

// Строки подопечного: таблица, столбец и значение, по которым строку найти
type Row = [table: string, column: string, value: string];
type Client = { user: string; rows: Row[]; photo: string };

// Первая строка ответа — её id
async function id(sql: string, params: unknown[]): Promise<string> {
  return (await pool.query<{ id: string }>(sql, params)).rows[0].id;
}

// Новый подопечный Марины со всеми своими строками и файлом снимка — от владельца базы, как регистрация
async function newClient(): Promise<Client> {
  const user = randomUUID();
  await pool.query("insert into auth.users (id, email, encrypted_password) values ($1, $2, crypt('demo-password', gen_salt('bf')))", [
    user,
    \`\${user}@example.com\`,
  ]);
  await pool.query("insert into profiles (id, role, name) values ($1, 'client', 'Тест')", [user]);
  const client = await id("insert into clients (coach_id, user_id, name) values ($1, $2, 'Тест') returning id", [MARINA, user]);
  const workout = await id("insert into workouts (client_id, title, day) values ($1, 'Ноги', $2) returning id", [client, DAY]);
  const item = await id(
    "insert into workout_items (workout_id, exercise_id, sets, reps) select $1, id, 3, 10 from exercises where name = 'Присед' returning id",
    [workout],
  );
  const set = await id("insert into sets (workout_id, workout_item_id, weight, reps, note) values ($1, $2, 40, 10, 'ноет колено') returning id", [
    workout,
    item,
  ]);
  const own = await id("insert into comments (workout_id, author_id, body) values ($1, $2, 'Тянет поясницу') returning id", [workout, user]);
  const coach = await id("insert into comments (workout_id, author_id, body) values ($1, $2, 'Снизим вес') returning id", [workout, MARINA]);
  await pool.query("insert into nutrition_goals (client_id, kcal, protein, fat, carbs) values ($1, 1800, 100, 60, 200)", [client]);
  const food = await id(
    "insert into food_entries (client_id, day, product, grams, kcal, protein, fat, carbs) values ($1, $2, 'Творог', 200, 120, 17, 5, 3) returning id",
    [client, DAY],
  );
  const measurement = await id("insert into measurements (client_id, day, weight, waist, hips) values ($1, $2, 61.5, 70, 96) returning id", [
    client,
    DAY,
  ]);
  const photo = await id("insert into photos (client_id, day, path) values ($1, $2, $3) returning id", [client, DAY, photoPath(client, DAY)]);
  await mkdir(dirname(photoFile(client, DAY)), { recursive: true });
  await writeFile(photoFile(client, DAY), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  const invite = await id("insert into invites (coach_id, accepted_by) values ($1, $2) returning id", [MARINA, user]);
  const feedback = await id(
    "insert into feedback (author_id, page, did, expected, got) values ($1, '/workouts', 'Открыла', 'Тренировку', 'Пусто') returning id",
    [user],
  );
  const program = await id("insert into programs (coach_id, title) values ($1, 'Своя программа') returning id", [user]);
  const programItem = await id(
    "insert into program_items (program_id, exercise_id, sets, reps) select $1, id, 3, 8 from exercises where name = 'Тяга' returning id",
    [program],
  );
  const rows: Row[] = [
    ["auth.users", "id", user],
    ["profiles", "id", user],
    ["clients", "id", client],
    ["workouts", "id", workout],
    ["workout_items", "id", item],
    ["sets", "id", set],
    ["comments", "id", own],
    ["comments", "id", coach],
    ["nutrition_goals", "client_id", client],
    ["food_entries", "id", food],
    ["measurements", "id", measurement],
    ["photos", "id", photo],
    ["invites", "id", invite],
    ["feedback", "id", feedback],
    ["programs", "id", program],
    ["program_items", "id", programItem],
  ];
  return { user, rows, photo: photoFile(client, DAY) };
}

// Какие из строк ещё есть в базе: «таблица.столбец» по строке
async function left(rows: Row[]): Promise<string[]> {
  const found: string[] = [];
  for (const [table, column, value] of rows) {
    const { rowCount } = await pool.query(\`select 1 from \${table} where \${column} = $1\`, [value]);
    if (rowCount) found.push(\`\${table}.\${column}\`);
  }
  return found;
}

let gone: Client;
let stays: Client;

beforeAll(async () => {
  gone = await newClient();
  stays = await newClient();
});

// второго подопечного — тем же действием; первого — тоже, если тест упал раньше удаления
afterAll(async () => {
  for (const client of [gone, stays]) {
    login.uid = client.user;
    await deleteAccount(formWith("удалить")).catch(() => undefined);
  }
  await pool.end();
});

// Все строки подопечного — «таблица.столбец» по строке, как их вернёт left
const all = (client: Client) => client.rows.map(([table, column]) => \`\${table}.\${column}\`);

test("без вписанного «удалить» ничего не удаляется: ошибка под формой", async () => {
  login.uid = gone.user;
  for (const word of ["", "удали", "не удалять"]) {
    expect(await redirectOf(deleteAccount(formWith(word))), word).toMatch(/^\\/account\\?error=/);
  }
  expect(await left(gone.rows)).toEqual(all(gone));
  expect(existsSync(gone.photo)).toBe(true);
});

test("подопечный удаляет аккаунт: ни строки, ни файла снимка; у другого подопечного всё на месте", async () => {
  login.uid = gone.user;
  // после удаления — на главную
  expect(await redirectOf(deleteAccount(formWith("удалить")))).toBe("/");
  expect(await left(gone.rows)).toEqual([]);
  expect(existsSync(dirname(gone.photo))).toBe(false);
  expect(await left(stays.rows)).toEqual(all(stays));
  expect(existsSync(stays.photo)).toBe(true);
});

test("тренер так аккаунт не удалит: у него подопечные", async () => {
  login.uid = MARINA;
  await expect(deleteAccount(formWith("удалить"))).rejects.toThrow("Удалить можно только свой аккаунт подопечного");
  expect((await pool.query("select 1 from profiles where id = $1", [MARINA])).rowCount).toBe(1);
});
`
const DELETE_SQL = `-- Удаление аккаунта (docs/privacy.md, «Как удалить аккаунт»): подопечный удаляет свой аккаунт — все свои строки.
-- Удалить пользователя из auth.users напрямую нельзя: каскад доходит до profiles, а на профиль без каскада ссылаются clients,
-- comments, invites, feedback и programs — база отказывает (clients_user_id_fkey). Поэтому строки удаляются по порядку: сначала те,
-- что ссылаются на другие, в конце — сам пользователь. Функция — одна транзакция: не удалилось что-то одно, не удалится ничего.
-- Удаляет только вошедшего (auth.uid()): чужой аккаунт так не удалить. Тренер так аккаунт не удалит — у него подопечные.
-- Файлы фото удаляет приложение (app/account/actions.ts): функция возвращает номер подопечного, по нему — папка снимков.
-- security definer: функция работает с правами владельца базы — пользователю auth.users закрыта, а удалять нужно и там.
create function delete_account() returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_client bigint;
begin
  select id into my_client from clients where user_id = me;
  if my_client is null then
    raise exception 'Удалить можно только свой аккаунт подопечного';
  end if;
  -- тренировки: подходы, строки тренировок, комментарии под ними (и тренера тоже), потом сами тренировки
  delete from sets where workout_id in (select id from workouts where client_id = my_client);
  delete from workout_items where workout_id in (select id from workouts where client_id = my_client);
  delete from comments where workout_id in (select id from workouts where client_id = my_client) or author_id = me;
  delete from workouts where client_id = my_client;
  -- питание, замеры и строки фото
  delete from food_entries where client_id = my_client;
  delete from nutrition_goals where client_id = my_client;
  delete from measurements where client_id = my_client;
  delete from photos where client_id = my_client;
  -- приглашение, по которому пришёл, и замечания
  delete from invites where accepted_by = me;
  delete from feedback where author_id = me;
  -- программы, если он их создал: политика программ (0004) сверяет хозяина, но не роль («Подождёт» беты).
  -- Строки программ уйдут каскадом, у строк чужих тренировок пропадёт только ссылка на шаблон (0005)
  delete from programs where coach_id = me;
  delete from clients where id = my_client;
  -- профиль удалит каскад от auth.users (0001_init.sql)
  delete from auth.users where id = me;
  return my_client;
end;
$$;

-- Вызывает вошедший из приложения (роль authenticated); без входа — нельзя
revoke execute on function delete_account() from public, anon;
grant execute on function delete_account() to authenticated;
`
const ACCOUNT_ACTIONS = `"use server";

import { rm } from "node:fs/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { photoDir } from "@/lib/photos";
import { currentUser } from "@/lib/session";

// Слово, которое человек вписывает, чтобы удалить аккаунт: одно нажатие по ошибке ничего не удалит
const CONFIRM = "удалить";

// «Удалить аккаунт» (docs/privacy.md): подопечный удаляет свой аккаунт — все свои строки и файлы фото.
// Сначала подтверждение: в поле формы вписано «удалить» — проверяет сервер, а не только браузер; иначе ошибка под формой
// и ничего не удаляется. Строки удаляет функция базы delete_account() (0017_delete_account.sql): только вошедшего и по порядку.
// Файлы снимков — папка storage/photos/<номер подопечного> (photoDir в lib/photos.ts); её удаляем в той же транзакции,
// до commit: не удалились файлы — строки вернутся, и удаление можно повторить. Потом выход — cookie сессии стирается — и главная
export async function deleteAccount(form: FormData) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== CONFIRM) {
    redirect(\`/account?error=\${encodeURIComponent(\`Чтобы удалить аккаунт, впишите «\${CONFIRM}»\`)}\`);
  }
  await asUser(uid, async (db) => {
    const { rows } = await db.query<{ client: string }>("select delete_account() as client");
    await rm(photoDir(rows[0].client), { recursive: true, force: true });
  });
  // имя cookie — как в lib/session.ts
  (await cookies()).delete("session");
  redirect("/");
}
`
const ACCOUNT_PAGE = `import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asUser } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Аккаунт" };

// Страница читает cookie входа и отдаётся целиком, без заглушки загрузки
export const instant = false;

// Аккаунт вошедшего. Подопечный удаляет его сам вместе со всеми данными (docs/privacy.md, «Как удалить аккаунт»): вписывает
// «удалить» и нажимает кнопку — слово проверяет сервер (app/account/actions.ts), ошибка — под формой. Аккаунт тренера так
// не удалить — у него подопечные. Роль и имя — из своего профиля: чужие база не отдаст (RLS)
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const uid = await currentUser();
  if (!uid) redirect("/login");
  const { error } = await searchParams;
  const profile = await asUser(uid, async (db) => {
    const { rows } = await db.query<{ name: string; role: string }>("select name, role from profiles where id = $1", [uid]);
    return rows[0];
  });
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="text-3xl font-semibold">Аккаунт</h1>
      <p className="mt-2 text-zinc-500">{profile.name}</p>
      {profile.role === "client" ? (
        <section className="mt-6 rounded border border-zinc-300 p-4">
          <h2 className="text-xl font-semibold">Удаление аккаунта</h2>
          <p className="mt-2">
            Удалится всё, что о вас хранится: тренировки и подходы, комментарии, питание, замеры и фото. Вернуть их будет нельзя.
          </p>
          <form action={deleteAccount} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="confirm">Впишите «удалить»</label>
              <input
                id="confirm"
                name="confirm"
                required
                autoComplete="off"
                aria-invalid={typeof error === "string" ? true : undefined}
                aria-describedby={typeof error === "string" ? "confirm-error" : undefined}
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </div>
            {typeof error === "string" && (
              <p id="confirm-error" role="alert" className="text-red-600">
                {error}
              </p>
            )}
            <button type="submit" className="rounded bg-red-700 px-4 py-2 text-white">
              Удалить аккаунт
            </button>
          </form>
        </section>
      ) : (
        <p className="mt-6">Аккаунт тренера удаляем вручную: у тренера подопечные. Напишите нам через «Сообщить о проблеме» в меню.</p>
      )}
    </main>
  );
}
`
// Папка снимков подопечного — через проверенный номер, как пути файлов (lib/photos.ts): правка агента
const PHOTOS_FIND = `export function photoFile(clientId: string, day: string): string {
  return join(/*turbopackIgnore: true*/ process.cwd(), photoPath(clientId, day));
}
`
const PHOTOS_DIR = `export function photoFile(clientId: string, day: string): string {
  return join(/*turbopackIgnore: true*/ process.cwd(), photoPath(clientId, day));
}

// Папка снимков подопечного на диске: её целиком удаляет «Удалить аккаунт» (app/account/actions.ts). Только номер —
// рекурсивное удаление не получит ни «../», ни пустой путь, который значил бы всю папку storage/photos
export function photoDir(clientId: string): string {
  if (!/^\\d+$/.test(clientId)) throw new Error(\`Нет папки снимков для «\${clientId}»\`);
  return join(/*turbopackIgnore: true*/ process.cwd(), "storage/photos", clientId);
}
`

// «Аккаунт» в меню подопечного и ожидаемый список ссылок меню в сквозном тесте s20 — правки агента
const NAV_FIND = `// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки, дневник питания и замеры
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
    ["/measurements", "Замеры"],
  ],
`
const NAV_ACCOUNT = `// Разделы по роли: тренеру — подопечные, программы и отчёт, подопечному — его тренировки, дневник питания, замеры и аккаунт
// (там удаление аккаунта, docs/privacy.md)
const LINKS: Record<string, [href: string, label: string][]> = {
  coach: [
    ["/clients", "Подопечные"],
    ["/programs", "Программы"],
    ["/report", "Отчёт"],
  ],
  client: [
    ["/workouts", "Мои тренировки"],
    ["/nutrition", "Питание"],
    ["/measurements", "Замеры"],
    ["/account", "Аккаунт"],
  ],
`
const MENU_E2E = `  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание", "Замеры", "Сообщить о проблеме"]);
`
const MENU_E2E_ACCOUNT = `  await expect(menu.getByRole("link")).toHaveText(["Мои тренировки", "Питание", "Замеры", "Аккаунт", "Сообщить о проблеме"]);
`

// Люди, которых ждут сквозные тесты, — пишет человек
const E2E_USERS = `-- Люди, которых ждут сквозные тесты e2e/first-run.spec.ts: Наташа — тренер без подопечных, Вера — подопечная Марины
-- (supabase/seed.sql) без тренировок. В seed.sql их нет: Наташу заводил supabase/tests/new-coach.sql, Веру — приглашение Марины,
-- а тестовый аккаунт Веры (supabase/tests/test-account.sql) удалён на странице «Аккаунт».
-- Это не демо-данные и не миграция: запускается вручную (psql -f) перед общим прогоном npx playwright test. Повторный запуск
-- ничего не меняет и не падает (on conflict do nothing) — и там, где Наташу уже завёл new-coach.sql.
-- Пароль у обеих demo-password, в auth.users — только его хеш (bcrypt).
insert into auth.users (id, email, encrypted_password) values
  ('66666666-6666-6666-6666-666666666666', 'natasha@example.com', crypt('demo-password', gen_salt('bf'))),
  ('77777777-7777-7777-7777-777777777777', 'vera@example.com', crypt('demo-password', gen_salt('bf')))
on conflict (id) do nothing;

insert into profiles (id, role, name) values
  ('66666666-6666-6666-6666-666666666666', 'coach', 'Наташа'),
  ('77777777-7777-7777-7777-777777777777', 'client', 'Вера')
on conflict (id) do nothing;

insert into clients (coach_id, user_id, name) values
  ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Вера')
on conflict (user_id) do nothing;
`

// План на месяц — пишет человек, текст авторский
const ROADMAP = `# План на месяц после запуска

Первая версия вышла. Новое — не всё сразу: этот месяц уходит на то, чтобы приложение спокойно работало у людей, и на одно-два дела из «позже».

## Позже — из паритета

Из \`docs/parity.md\`, строки «позже»:

- Менять программу под себя: назначенное — уже копия шаблона, но править её пока нечем.
- Напоминания и уведомления: правила уведомлений есть, отправки нет.
- Таймер отдыха, видео упражнений, расписание клуба и запись на занятие — к главным сценариям не относятся.
- Оплата и тарифы — и не за каждого подопечного: на это жалуются у Б.

## Из беты

- «Подождёт» из \`docs/beta-findings.md\`: программу может создать подопечный — политика программ сверяет хозяина, но не роль. Закрыть, как у приглашений: создаёт только тренер.
- Вход: лимит попыток проверяется до запроса к базе, а неудача записывается после — одновременные попытки входа проходят проверку разом (\`lib/rate-limit.ts\`). Перевести вход на \`takeAttempt\`, как у \`/join\`.

## После первой выкладки

- Ссылка-приглашение берёт адрес сайта из заголовка \`Host\` (\`app/clients/page.tsx\`): создать приглашение на сайте и открыть ссылку с телефона.
- Откат релиза: один раз вернуть прошлую версию и записать, как это делается.

## Каждую неделю

- Журнал сбоев: \`psql -c "select path, message from errors"\` — новые строки разобрать; что повторяется, разложить по стопкам, как замечания беты.
- Замечания из «Сообщить о проблеме» — по тем же стопкам.

## Каждый месяц

- Учения с копией базы по \`docs/restore.md\`: копия, восстановление в учебную базу, сверка, запись в журнал учений.

## Агенту на месяц

Одна область сопровождения — агенту: обновление зависимостей. Раз в неделю он обновляет пакеты в отдельной ветке и прогоняет \`npm run check\` и \`npx playwright test\`; сливаю сама, после своей проверки. В конце месяца записываю здесь, что получилось и что я проверяла.
`

const login = (email) => ({ url: '/login', fill: { Почта: email, Пароль: 'demo-password' }, click: 'Войти' })

// Перезапуск dev со сбросом кэша — как contrast-restart в s20 и dev-restart в s24 (тот же запрос шлёт кнопка Restart Dev Server
// в Next.js DevTools). -f: ответ не 2xx — код ошибки; сервер поднимается заново на том же порту — ждём, пока /login снова отвечает
const RESTART =
  "curl -fsS -X POST 'localhost:3000/__nextjs_restart_dev?invalidateFileSystemCache=1' && sleep 2 && " +
  'until curl -fs -o /dev/null localhost:3000/login; do sleep 1; done'

// Включена ли RLS на каждой таблице схемы public: rowsecurity — t или f
const RLS_ALL = `psql -c "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename"`

// Ответы агента — авторские, по выводу его шагов; что видно в строках Reading / Edited / Run, ответ не повторяет
const ASK_HOME_REPLY =
  'Главная — о продукте: для кого, что умеет, как начать; внизу «Войти» и «Политика конфиденциальности». Подходов в памяти ' +
  'больше нет: маршрут /api/sets удалён.'
const ASK_DATA_REPLY =
  'Данные о здоровье: подходы с заметкой (sets, 0003), комментарии (comments), питание (food_entries, nutrition_goals), ' +
  'замеры (measurements) и фото — строка в photos, снимок — файл в storage/photos/. Ещё — профили, приглашения, замечания ' +
  'и журнал сбоев.'
const ASK_PRIVACY_PAGE_REPLY = 'Страница /privacy — текст docs/privacy.md, открывается без входа; ссылка на неё — на главной.'
const ASK_DELETE_REPLY =
  'Тест красный: удалять нечем — app/account/actions.ts нет. Дальше — миграция 0017: функция удаляет строки подопечного ' +
  'по порядку, потом действие и страница /account. Делать миграцию?'
const ASK_DELETE_GO_REPLY =
  'delete_account() — только вошедший подопечный, строки по порядку, в конце пользователь. Удаляет, только если вписано ' +
  '«удалить»: слово проверяет сервер. Папка снимков — до commit: не удалились файлы — вернутся и строки.'
const ASK_MENU_REPLY = 'В меню подопечного — «Аккаунт», он ведёт на /account. Ожидаемый список ссылок меню в тесте — с ним же.'
const ASK_CHECKLIST_REPLY =
  'Проверка ввода на сервере — не знаю: в прочитанном её не видно. Владелец — сделано: RLS включена на всех 16 таблицах. ' +
  'Секреты — .env* в .gitignore, ключей в коде не искал — не знаю. Ошибки — сделано: app/error.tsx, сбои — в журнал errors. ' +
  'Дальше — тесты, копия и откат?'
const ASK_CHECKLIST_GO_REPLY =
  'Сквозные тесты — восемь файлов, проходят ли — не знаю. Копия базы — не сделано: копия в папке проекта — только для учений, ' +
  'рабочей копии вне досягаемости нет. Проверенный способ отката релиза — не сделано: выкладки ещё нет. ' +
  'Ссылка-приглашение — из заголовка Host: не знаю, проверить на хостинге.'

export default {
  id: 's26-launch',
  from: 's25-beta-fixes',
  date: '2026-11-23T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а tsc ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    { id: 'dev', run: 'npm run dev', until: 'Ready' },
    // без входа: на главной всё ещё прототип s02
    { id: 'home-before', browser: { url: '/' } },
    {
      // Accept edits: правка — без вопроса, rm — с вопросом [y / n]
      id: 'ask-home',
      agent: {
        prompt:
          'Главная — страница о продукте: для кого, что умеет, как начать; «Войти» и «Политика конфиденциальности». ' +
          'Прототип подходов в памяти убери',
        reply: ASK_HOME_REPLY,
      },
      steps: [
        { id: 'home-page', write: 'app/page.tsx', content: HOME_PAGE },
        // буквальный путь, без переменных
        { id: 'home-api', run: 'rm app/api/sets/route.ts' },
      ],
    },
    { id: 'c-home', commit: 'Главная — о продукте' },
    { id: 'home-after', browser: { url: '/' } },
    {
      // Plan: только чтение и ответ, код агент не меняет
      id: 'ask-data',
      agent: { prompt: 'Перечисли таблицы и файлы, где лежат данные людей, и что в них. Код не меняй', reply: ASK_DATA_REPLY },
      steps: [
        { id: 'd-tables', run: "psql -c '\\dt public.*'" },
        { id: 'd-photos', read: 'app/api/photos/route.ts' },
        // сверх таблицы плана: заметки к подходу в списке таблиц не видно — она столбец sets
        { id: 'd-note', read: 'supabase/migrations/0003_set_note.sql' },
      ],
    },
    // политика по своим данным — пишет человек
    { id: 'privacy-doc', write: 'docs/privacy.md', content: PRIVACY_DOC },
    {
      // Accept edits: правка без вопроса
      id: 'ask-privacy-page',
      agent: { prompt: 'Страница /privacy по docs/privacy.md', reply: ASK_PRIVACY_PAGE_REPLY },
      steps: [
        // сверх таблицы плана: агент читает документ, прежде чем писать страницу
        { id: 'pv-read', read: 'docs/privacy.md' },
        { id: 'pv-page', write: 'app/privacy/page.tsx', content: PRIVACY_PAGE },
      ],
    },
    { id: 'c-privacy', commit: 'Политика конфиденциальности' },
    // подводный камень: политика обещает удаление — проверяем на тестовом аккаунте
    { id: 'vera-file', write: 'supabase/tests/test-account.sql', content: TEST_ACCOUNT },
    { id: 'vera-apply', run: 'psql -f supabase/tests/test-account.sql' },
    // удалить нечем: каскад от auth.users доходит до profiles, а clients ссылается на профиль без каскада (черновой прогон)
    { id: 'del-try', run: `psql -c "delete from auth.users where email = 'vera@example.com'"` },
    {
      // Accept edits: тест — без вопроса, vitest — с вопросом [y / n]. Сначала тест; миграция — с подтверждения
      id: 'ask-delete',
      agent: {
        prompt:
          'Политика обещает удаление, а удалить нечем. Подопечный удаляет свой аккаунт: все его строки и файлы фото. ' +
          'Сначала тест, миграцию — с подтверждения',
        reply: ASK_DELETE_REPLY,
      },
      steps: [
        { id: 'del-test', write: 'test/delete-account.test.ts', content: DELETE_TEST },
        // красный: действия удаления нет
        { id: 'del-red', run: 'npx vitest run test/delete-account.test.ts' },
      ],
    },
    {
      // сверх таблицы плана: тот же запрос, второй ход — подтверждение миграции; дальше действие, страница и зелёный тест
      id: 'ask-delete-go',
      agent: { prompt: 'Делай', reply: ASK_DELETE_GO_REPLY },
      steps: [
        { id: 'del-sql', write: 'supabase/migrations/0017_delete_account.sql', content: DELETE_SQL },
        { id: 'del-apply', run: 'psql -f supabase/migrations/0017_delete_account.sql' },
        // сверх таблицы плана: рекурсивное удаление — только по проверенному номеру
        { id: 'del-photos', edit: 'lib/photos.ts', find: PHOTOS_FIND, replace: PHOTOS_DIR },
        { id: 'del-action', write: 'app/account/actions.ts', content: ACCOUNT_ACTIONS },
        // сверх таблицы плана: один шаг — один файл
        { id: 'del-page', write: 'app/account/page.tsx', content: ACCOUNT_PAGE },
        { id: 'del-green', run: 'npx vitest run test/delete-account.test.ts' },
      ],
    },
    {
      // сверх таблицы плана, Accept edits: удаление должно быть где найти — пункт меню; тест меню (s20) идёт в общем прогоне
      id: 'ask-menu',
      agent: { prompt: '«Аккаунт» — в меню подопечного, и поправь ожидаемое меню в e2e/first-run.spec.ts', reply: ASK_MENU_REPLY },
      steps: [
        { id: 'menu-nav', edit: 'components/Nav.tsx', find: NAV_FIND, replace: NAV_ACCOUNT },
        { id: 'menu-e2e', edit: 'e2e/first-run.spec.ts', find: MENU_E2E, replace: MENU_E2E_ACCOUNT },
      ],
    },
    { id: 'c-delete', commit: 'Удаление аккаунта' },
    // сверх таблицы плана — человек: правку меню запущенный dev отдавал страницам со старым меню, без «Аккаунт» (первая запись
    // с меню: login-vera и vera-delete), как в s24 — перезапуск со сбросом кэша
    { id: 'dev-restart', run: RESTART },
    // Вера удаляет свой аккаунт сама: «Аккаунт» в меню, вписывает «удалить» — и попадает на главную
    { id: 'login-vera', browser: login('vera@example.com') },
    { id: 'vera-delete', browser: { url: '/account', fill: { 'Впишите «удалить»': 'удалить' }, click: 'Удалить аккаунт' } },
    { id: 'del-count', run: `psql -At -c "select count(*) from auth.users where email = 'vera@example.com'"` },
    {
      // Plan: только чтение и ответ, код агент не меняет
      id: 'ask-checklist',
      agent: {
        prompt:
          'Пройди чек-лист перед первым релизом: по каждому пункту — сделано, не сделано или не знаю, и где это видно. Код не меняй',
        reply: ASK_CHECKLIST_REPLY,
      },
      steps: [
        { id: 'cl-rls', read: 'supabase/migrations/0002_rls.sql' },
        // сверх таблицы плана: RLS — на каждой таблице public, а не только на четырёх из 0002
        { id: 'cl-rls-all', run: RLS_ALL },
        { id: 'cl-env', read: '.gitignore' },
        { id: 'cl-err', read: 'app/error.tsx' },
      ],
    },
    {
      // сверх таблицы плана, Plan: тот же запрос, второй ход — одним ходом шаги и ответ в окно агента не помещаются
      id: 'ask-checklist-go',
      agent: { prompt: 'Делай', reply: ASK_CHECKLIST_GO_REPLY },
      steps: [
        { id: 'cl-e2e', run: 'ls e2e' },
        { id: 'cl-restore', read: 'docs/restore.md' },
        // сверх таблицы плана: адрес ссылки-приглашения — из заголовка Host
        { id: 'cl-invite', read: 'app/clients/page.tsx' },
      ],
    },
    // сверх таблицы плана — человек: типы маршрутов от первого typegen ещё знают удалённый app/api/sets/route.ts, и tsc в npm run check
    // падал (первая запись: .next/types/validator.ts — Cannot find module '../../app/api/sets/route.js'); npm run dev их не обновляет
    { id: 'typegen-again', run: 'npx next typegen' },
    // руками: все проверки и все сквозные тесты разом
    { id: 'check-run', run: 'npm run check' },
    // сверх таблицы плана — человек: Наташу и Веру ждёт e2e/first-run.spec.ts, а база сброшена и Веру удалили
    { id: 'e2e-seed', write: 'supabase/tests/e2e-users.sql', content: E2E_USERS },
    { id: 'e2e-seed-apply', run: 'psql -f supabase/tests/e2e-users.sql' },
    // общий прогон — все файлы e2e/ по запущенному npm run dev (reuseExistingServer)
    { id: 'e2e-all', run: 'npx playwright test' },
    // план на месяц — пишет человек
    { id: 'roadmap-doc', write: 'docs/roadmap.md', content: ROADMAP },
    { id: 'c-launch', commit: 'План на месяц после запуска' },
  ],
}
