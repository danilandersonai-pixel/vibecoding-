# Ролики «Репозиторий»: неделя 2 (дни 8–14) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать 7 роликов дня недели 2 (`day-08` … `day-14`) в стиле «Репозиторий» на настоящих записях: приложение тренера растёт по своему плану недель 2–3 (`demo-app/app/docs/plan-weeks-2-3.md`).

**Architecture:** Основа недели 1 не меняется: рекордер, набор кадров, урок как данные, плеер с главами. Ролик дня — первый раз. У него свой каркас (спецификация §6.2), а план ролика перечисляет, что строим сегодня, а не главы. Сначала записываются сессии `s13`–`s19`: каждая продолжает предыдущую и даёт «Пример» и «Подводный камень» своего дня. Затем по ним собираются 7 уроков.

**Tech Stack:** то же, что в неделе 1: Remotion 4.0.537, React 19, TypeScript, Vitest, Playwright 1.56.1, Node 22, git, Next.js 16.4.3, PostgreSQL 16 (`psql`, `pg_dump`, `pg_restore`, `createdb` из `/usr/lib/postgresql/16/bin`), `pg`.

**Spec:** `docs/superpowers/specs/2026-10-28-video-lessons-v2-design.md`: §6.2 «Ролик дня», §2 (длина ролика дня 1–3 мин, не короче прежнего), §3, §4, §9. Образцы и правила:
- план недели 1 `docs/superpowers/plans/2026-10-29-video-lessons-v2-week1.md` — его разделы «Порядок задачи сессии» и «Порядок задачи урока» действуют и здесь, с правками ниже;
- уроки недели 1 в `course/video/lessons/`;
- `course/video/term/README.md` (ловушки 1–21).

Неделя 1 опубликована. Автор сказал «Да начинай».

## Global Constraints

- Всё из Global Constraints плана недели 1 действует: Remotion `4.0.537`; кадр 1920 × 1080; `PACE`; тёмная тема; вывод только из записей; интерфейс Claude Code — по `ch1_agent_session` и `dk_modes`; текст по-русски; `SAY`; секреты ненастоящие; `package.json` приложения — только командами npm; сообщения коммитов и строки атрибуции; проверки `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e`. Никогда не запускать `playwright install`.
- Каркас ролика дня (спецификация §6.2, `DAY_CHAPTERS`): «Что строим сегодня» (`agenda`) → «Пример» (все сцены `example`, хотя бы одна — кадр записи) → «Подводный камень» (все сцены `mistake`, вердикты «Неверно» → «Верно») → «Проверьте у себя» (`recap`). Пояснений по нажатию — не меньше 2. Минимум в коде — 1, неделя держит 2.
- Длина ролика дня — до 5400 кадров и не меньше прежнего ролика: `day-08` ≥ 4496, `day-09` ≥ 4399, `day-10` ≥ 4912, `day-11` ≥ 5102, `day-12` ≥ 4951, `day-13` ≥ 4535, `day-14` ≥ 4985.
- Действующие лица прежние. Марина (`marina@example.com`, id `11111111-1111-1111-1111-111111111111`) ведёт Анну и Олега. Игорь ведёт Свету (`sveta@example.com`, id `55555555-5555-5555-5555-555555555555`). Новые с s17:
  - Ольга (`olga@example.com`) и Кирилл (`kirill@example.com`) — по вечной ссылке;
  - Вера (`vera@example.com`) — по одноразовой.

  Пароль у всех — `demo-password`. Автор коммитов — «Анна». Разработчицу в репликах по имени не называть (подопечная тоже Анна): «мы», «просим».
- Accept edits (ловушка 8): команда агента идёт с вопросом `[y / n]`, правки — без вопроса. Plan — только чтение и ответ.
- Миграции недели — по порядку и с этими номерами: `0004_programs.sql`, `0005_programs_copy.sql` (s14), `0006_comments.sql`, `0007_comments_rls.sql` (s16), `0008_invites.sql` (s17), `0009_sets_workout_index.sql` (s19). Миграцию применяет шаг `psql -f` своей сессии. Со следующей сессии их применяет рекордер (ловушка 18). Строки, добавленные в базу шагами сессии, в следующую не переходят.
- В приложении не зависеть от настоящих часов там, где это видно в кадре. Месяц отчёта — параметр (`?month=2026-10`). Дата начала программы вводится в форме. Срок приглашения проверяется в базе относительно `now()`, а на экране нет настоящих дат и времени.
- Не меняются: книга; записи `s01`–`s12` (новые сессии пишутся `--from s13-feedback` и дальше); уроки недели 1, кроме совместимых правок набора; старые ролики дней 15–21 (1280 × 720, с MP4).
- Действия, которых нет локально (облачная сессия Claude, пул-реквест и CI, Vercel, настоящий Supabase, push и почта, Sentry), — схемой книги или доской. Подпись честная, без придуманного вывода.

## Review Focus

1. **Перезапись с середины после сессии с миграциями.** Цепочки `0004 → 0005` и `0006 → 0007`, которые со следующей сессии применяет рекордер, должны давать ту же схему, что в конце сессии. `seed.sql` применяется без ошибок. Тест — Задача 4: первый шаг s15 `schema` показывает копию упражнения в `workout_items`.
2. **Настоящие часы.** При перезаписи в другой день в кадре те же даты: тренировки программы «9 ноября» … «30 ноября», отчёт за октябрь по неделям, приглашение без настоящих дат. Тест — Задачи 3, 4, 6 (строки дат в `after`).
3. **Ролик дня на телефоне 390 px.** Пункты плана «Что строим сегодня» переносятся, горизонтальной прокрутки нет, пояснение под кадром. Тесты: Задача 1 (длинный пункт плана — перенос, а не выход за SAFE) и e2e Задачи 16.
4. **Старые ролики дней 15–21.** Остаются 1280 × 720 с MP4. Тесты, которые держались на `day08Script`, переходят на `day15Script` и проверяют то же самое, их число не меняется. Тест — Задача 9.
5. **Учения с копией не оставляют следов.** Базы `restore_check` и `restore_full` живут в кластере записи и уходят вместе с ним. Папка `backups/` в `.gitignore`, в коммит не попадает. Тест — Задача 8.

---

## Сессии недели 2 — сводка

| Сессия | `from` | Дата (`date`) | `db` | Что делает | Ролик |
|---|---|---|---|---|---|
| `s13-feedback` | `s12-agent` | `2026-11-04T10:00:00+03:00` | да | отзывы в три стопки; расплывчатая задача трогает 4 файла; задача в четыре части; приёмка; заметка на карточке | `day-08` |
| `s14-programs` | `s13-feedback` | `2026-11-05T10:00:00+03:00` | да | три модели в Plan; ссылка с каскадом; тест из требования красный; копия при назначении; программа на 4 недели | `day-09` |
| `s15-report` | `s14-programs` | `2026-11-06T10:00:00+03:00` | да | определения словами; тесты до кода; отчёт за месяц по неделям; пустая неделя — «NaN кг»; правило и тест | `day-10` |
| `s16-comments` | `s15-report` | `2026-11-07T10:00:00+03:00` | да | комментарии; таблица из SQL без RLS; Света видит колено Анны; RLS и негативный тест; одно уведомление на тренировку | `day-11` |
| `s17-invite` | `s16-comments` | `2026-11-08T10:00:00+03:00` | да | вечная ссылка `/join/<тренер>`; Кирилл по пересланной ссылке; одноразовое приглашение; аудит «только отчёт» | `day-12` |
| `s18-quick-set` | `s17-invite` | `2026-11-09T10:00:00+03:00` | да | жалобы на эталоны; «как у эталона Б» — пять файлов; решения паритета; подход в одно касание; сквозной тест | `day-13` |
| `s19-reliability` | `s18-quick-set` | `2026-11-10T10:00:00+03:00` | да | `npm run check` и Playwright; `EXPLAIN ANALYZE` до и после индекса; копия без `auth` не восстанавливается; копия всей базы | `day-14` |

В таблицах сессий «агент» — шаг `agent`, «человек» — обычный шаг (как в неделе 1). Id шагов постоянные: на них ссылаются уроки.

---

### Task 1: Набор: план ролика дня

**Files:**
- Modify: `course/video/term/frames/agendaPlan.ts`, `course/video/term/problems.ts`, `course/video/term/README.md` (раздел «Ролик дня»)
- Test: `course/video/term/frames/agendaPlan.test.ts`, `course/video/term/problems.test.ts`

**Interfaces:**
- Consumes: `AgendaSpec`, `lessonProblems`, `DAY_CHAPTERS` (пилот).
- Produces: `AgendaSpec = { type: 'agenda'; at?: number[]; items?: string[] }`. Если `items` заданы, план перечисляет их (номера 01, 02 …) вместо глав. `at` — по одной реплике на пункт. Уроки дня (Задачи 9–15) задают `items`.

- [ ] **Step 1: Тесты:**
  - `test('agenda: пункты items вместо глав — по порядку, номера 01…')`: при `items: ['Отзывы — в три стопки', 'Задача агенту', 'Приёмка']` у `plan` три пункта с этими `name` и `num` `'01'`, `'02'`, `'03'`.
  - `test('agenda: длинный пункт переносится и не выходит за SAFE')`: пункт в 90 знаков даёт две строки, правый край `rect` ≤ `SAFE.x + SAFE.w`, `problems` пуст.
  - `test('agenda: at не по числу items — проблема')`.
  - `test('урок дня без items в плане — проблема «у ролика дня план перечисляет, что строим сегодня»')` в `problems.test.ts`: урок `kind: 'day'`, у сцены `agenda` нет `items` → проблема; у урока `kind: 'chapter'` без `items` — нет.
- [ ] **Step 2:** `npx vitest run video/term` — FAIL (`items` нет).
- [ ] **Step 3:** `agendaPlan.ts`: `items` вместо `chapters.slice(1, -1)`. Строка пункта переносится по ширине `SAFE.w − (NAME_X − SAFE.x)`, не больше двух строк, шаг строк растёт на перенос. `problems.ts`: у урока `kind: 'day'` сцена `agenda` с `items` длиной 2–4. Снимки уроков недели 1 не меняются.
- [ ] **Step 4:** `npx vitest run video/term video/lessons` — PASS, снимки прежние.
- [ ] **Step 5:** README: раздел «Ролик дня» — каркас, `items`, окна длины недели 2, правило «Пример — что построили, Подводный камень — как чуть не сломали». Commit `video: план ролика дня — что строим сегодня`.

---

## Порядок задачи сессии (Задачи 2–8)

Как в плане недели 1 (раздел «Порядок задачи сессии»), с тремя уточнениями:
- **Запись.** `node scripts/record-session.mjs --from <id>` из `course/`. Прежние записи и состояния байт в байт не меняются.
- **Данные шагов.** Строки, которые нужны кадру (подходы, комментарии, приглашения), сессия создаёт сама: шагами браузера или `psql -f` своего файла. Строки прошлых сессий в базе не остаются.
- **Код приложения.** Код, который пишут агент и человек, проверяется в черновом прогоне: `npm run lint`, `npx tsc --noEmit`, тесты приложения. Ответ агента — авторский, он не утверждает больше, чем сделали его шаги.

### Task 2: Сессия `s13-feedback` — отзывы и задача фоновому агенту

**Files:** по «Порядку задачи сессии» для `s13-feedback`. **Interfaces:** Consumes: состояние `s12-agent`. Produces: события ниже.

| id | шаг |
|---|---|
| `feedback` | человек, write `docs/feedback.md`: цитаты Марины из `docs/plan-weeks-2-3.md` дословно (новых не придумывать) в три стопки — «Портит данные», «Мешает каждый день», «Подождёт». В «Мешает каждый день» — «заметку про колено нигде не увидела». Внизу строка: «В фон — то, где „готово“ и проверку можно написать заранее» |
| `c-feedback` | commit `Отзывы Марины в три стопки` |
| `vague-branch` | run `git switch -c agent/notes-vague` |
| `ask-vague` | агент: «Покажи заметки к подходам получше». Шаги (правки): `vague-list` (`components/SetList.tsx`: заметка под подходом), `vague-form` (`app/workouts/[id]/page.tsx`: поле «Заметка» многострочное), `vague-css` (`app/globals.css`: стиль заметки и общий размер подписей), `vague-clients` (`app/clients/page.tsx`: значок «есть заметки»). Ответ: «Сделал заметки заметнее в четырёх местах» |
| `c-vague` | commit `Заметки получше` |
| `vague-stat` | run `git diff main agent/notes-vague --stat` |
| `vague-drop` | run `git switch main && git branch -D agent/notes-vague` |
| `task-notes` | человек, write `docs/tasks/notes.md` в четыре части, как `docs/tasks/records.md`. **Задача:** тренер видит заметку подопечного под подходом на карточке. **Контекст:** `docs/feedback.md`, стопка «Мешает каждый день»; запрос карточки уже возвращает `note`; подходы выводит `components/SetList.tsx`. **Критерии готовности:** под подходом с заметкой видна заметка, без заметки ничего лишнего, `npm run check` проходит. **Ограничения:** менять только `components/SetList.tsx`; миграции, форму подопечного и тесты не трогать; работать в ветке `agent/notes` |
| `c-task` | commit `Задача агенту: заметка на карточке` |
| `agent-branch` | run `git switch -c agent/notes` |
| `ask-notes` | агент: «Выполни задачу из docs/tasks/notes.md». Шаги: `notes-read` (read `docs/tasks/notes.md`), `notes-list` (edit `components/SetList.tsx`), `notes-check` (run `npm run check`). Ответ: что изменил и что проверка прошла |
| `c-notes` | commit `Заметка подопечного видна тренеру` |
| `main-back` | run `git switch main` |
| `accept-log` | run `git log main..agent/notes --oneline` |
| `accept-stat` | run `git diff main agent/notes --stat` |
| `review-branch` | run `git switch agent/notes` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-anna` | browser `/login`: Анна |
| `set-note` | browser `/workouts/1`: подход 50 × 10, заметка «болит колено», «Сохранить» |
| `login-marina` | browser `/login`: Марина |
| `card-note` | browser `/clients/1`: под подходом «50 кг × 10» — «болит колено» |
| `merge-notes` | run `git switch main && git merge --no-ff agent/notes -m 'Слияние: заметка на карточке'` |

- [ ] **Step 1: Тест** `test('s13: расплывчатая задача трогает четыре файла, задача в четыре части — один; тренер видит заметку')`:
  - `vague-stat.out` называет `components/SetList.tsx`, `app/workouts/[id]/page.tsx`, `app/globals.css`, `app/clients/page.tsx`;
  - `vague-drop.out` содержит `Deleted branch agent/notes-vague`;
  - в `accept-log.out` одна строка;
  - в `accept-stat.out` — только `components/SetList.tsx` и итоговая строка `1 file changed`;
  - `ask-notes.steps` = `['notes-read', 'notes-list', 'notes-check']`, `notes-check.code` = 0;
  - `card-note.after` содержит `болит колено`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s13-feedback`). Commit `demo-app: сессия s13 — отзывы, задача в четыре части, заметка на карточке`.

### Task 3: Сессия `s14-programs` — программы и прошлое, которое не переписываем

**Files:** по «Порядку задачи сессии» для `s14-programs`. **Interfaces:** Consumes: `s13-feedback`. Produces: события ниже.

| id | шаг |
|---|---|
| `ask-model` | агент (Plan): «Нужны упражнения и программы: библиотека упражнений, шаблон программы (упражнение, подходы × повторы), назначение подопечному на 4 недели. Предложи два-три варианта модели данных и чем каждый рискует для прошлых тренировок. Код не меняй». Шаги: `m-init` (read `supabase/migrations/0001_init.sql`), `m-plan` (read `docs/plan-weeks-2-3.md`). Ответ — три варианта: тренировка ссылается на строку шаблона; при назначении делается копия; версии шаблона. Риск первого — правка или удаление шаблона меняет прошлое. В конце вопрос «Какой берём?» |
| `ask-ref` | агент: «Делаем вариант 1, он проще. Миграцию применяй с моего подтверждения». Шаги: `ref-sql` и `ref-apply` |
| `ref-sql` | write `supabase/migrations/0004_programs.sql`:<br>• `exercises` — библиотека; строки «Присед», «Жим лёжа», «Тяга», «Подтягивания» в той же миграции;<br>• `programs` — тренер, название;<br>• `program_items` — программа, упражнение, подходы, повторы;<br>• `workout_items` — тренировка, `program_item_id references program_items on delete cascade`;<br>• `sets.workout_item_id references workout_items on delete cascade`;<br>• RLS и политики на новых таблицах |
| `ref-apply` | run `psql -f supabase/migrations/0004_programs.sql` |
| `ask-test` | агент: «Сначала тест из требования: правка и удаление строки шаблона не меняют прошлые тренировки и их подходы. Тест — с базой, как test/rls.test.ts». Шаги: `prog-test` и `prog-red` |
| `prog-test` | write `test/programs.test.ts`. В транзакции: программа, назначение, три подхода. Затем удаление строки шаблона: подходов по-прежнему 3. Замена упражнения в строке: у прошлой тренировки упражнение прежнее |
| `prog-red` | run `npx vitest run test/programs.test.ts` — тест падает, подходов 0 |
| `ask-copy` | агент: «Тест прав, модель — нет. При назначении копируй упражнение, подходы и повторы в тренировку, связь со шаблоном — без каскада». Шаги: `copy-sql`, `copy-apply`, `prog-green` |
| `copy-sql` | write `supabase/migrations/0005_programs_copy.sql`: в `workout_items` — `exercise_id`, `sets`, `reps` копией; `program_item_id … on delete set null`; `sets.workout_item_id` без каскада |
| `copy-apply` | run `psql -f supabase/migrations/0005_programs_copy.sql` |
| `prog-green` | run `npx vitest run test/programs.test.ts` |
| `ask-ui` | агент: «Экран программ у тренера: создать программу из библиотеки и назначить подопечному на 4 недели с даты; у подопечного — упражнения в тренировке». Шаги: `programs-page`, `programs-action`, `workout-items` |
| `programs-page` | write `app/programs/page.tsx` |
| `programs-action` | write `app/programs/actions.ts` (назначение копирует строки шаблона) |
| `workout-items` | edit `app/workouts/[id]/page.tsx`: упражнения тренировки, например «Присед — 3 × 10» |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `program-new` | browser `/programs`: «Ноги, 4 недели», «Присед», 3 × 10, «Создать» |
| `program-assign` | browser `/programs`: «Назначить» — Анна, с `2026-11-09` |
| `login-anna` | browser `/login`: Анна |
| `anna-week` | browser `/workouts`: четыре тренировки «Ноги, 4 недели» — «9 ноября», «16 ноября», «23 ноября», «30 ноября» |
| `anna-items` | browser `/workouts/6` (первая назначенная): «Присед — 3 × 10» |
| `c-programs` | commit `Программы: библиотека, шаблон, назначение копией` |

- [ ] **Step 1: Тест** `test('s14: ссылка с каскадом стирает подходы — тест красный; копия — зелёный; программа на 4 недели')`:
  - `ask-model.steps` = `['m-init', 'm-plan']`;
  - `ref-apply.code` и `copy-apply.code` = 0;
  - `prog-red.code` ≠ 0, `prog-green.code` = 0;
  - `anna-week.after` содержит четыре даты;
  - `anna-items.after` содержит `Присед — 3 × 10`.
- [ ] **Steps 2–6:** `--from s14-programs`. Commit `demo-app: сессия s14 — программы, копия вместо ссылки`.

### Task 4: Сессия `s15-report` — рекорды и отчёт тренера

**Files:** по «Порядку задачи сессии» для `s15-report`. **Interfaces:** Consumes: `s14-programs` (миграции 0004 и 0005 применяет рекордер). Produces: события ниже.

| id | шаг |
|---|---|
| `schema` | run `psql -c "\d workout_items"` — есть `exercise_id`, `sets`, `reps`; у `program_item_id` — `ON DELETE SET NULL` |
| `report-def` | человек, write `docs/report.md`. Отчёт тренера за месяц по неделям (пн–вс): у каждого подопечного по неделе — тренировок, объём (сумма вес × повторы), средний объём на тренировку. Рекорд — самый большой вес подхода по названию тренировки за всё время до конца недели, как `lib/records.ts`. Пример — октябрь 2026, Анна, неделя 19–25 октября. Про недели без тренировок ничего не сказано |
| `c-report-def` | commit `Отчёт тренера словами` |
| `ask-report-tests` | агент: «Сначала тесты из docs/report.md, код потом». Шаги: `report-test` (write `lib/report.test.ts`: неделя Анны 19–25 октября по данным `seed.sql` — тренировок, объём, средний, рекорд), `report-red` (run `npx vitest run lib/report.test.ts`, падает — модуля нет) |
| `ask-report-code` | агент: «Теперь код: lib/report.ts и страница /report?month=2026-10 у тренера». Шаги: `report-lib` (write `lib/report.ts`), `report-page` (write `app/report/page.tsx`), `report-green` (run `npx vitest run lib/report.test.ts`) |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `report-view` | browser `/report?month=2026-10`. Недели 19–25 октября и 26 октября — 1 ноября с числами. У недель без тренировок — «Средний объём: NaN кг» |
| `report-rule` | человек, edit `docs/report.md`: неделя без тренировок — «тренировок не было», без среднего |
| `ask-empty` | агент: «В docs/report.md новое правило про пустую неделю. Сначала тест, потом код». Шаги: `empty-test` (edit `lib/report.test.ts`: неделя 5–11 октября), `empty-red` (run vitest, падает), `empty-fix` (edit `lib/report.ts`), `empty-page` (edit `app/report/page.tsx`), `empty-green` (run vitest) |
| `report-view2` | browser `/report?month=2026-10`: «тренировок не было», `NaN` нет |
| `c-report` | commit `Отчёт тренера за месяц по неделям` |

- [ ] **Step 1: Тест** `test('s15: схема после 0004–0005 — копия; тесты до кода; пустая неделя NaN, затем «тренировок не было»')`:
  - `schema.out` содержит `exercise_id` и `ON DELETE SET NULL`;
  - `report-red.code` и `empty-red.code` ≠ 0, `report-green.code` и `empty-green.code` = 0;
  - `report-view.after` содержит `NaN`;
  - `report-view2.after` содержит `тренировок не было` и не содержит `NaN`.
- [ ] **Steps 2–6:** `--from s15-report`. Commit `demo-app: сессия s15 — отчёт по неделям, пустая неделя`.

### Task 5: Сессия `s16-comments` — комментарии и права на новой таблице

**Files:** по «Порядку задачи сессии» для `s16-comments`. **Interfaces:** Consumes: `s15-report`. Produces: события ниже.

| id | шаг |
|---|---|
| `ask-comments` | агент: «Комментарии к тренировке: подопечный пишет под тренировкой, тренер отвечает. Миграцию применяй с моего подтверждения». Шаги: `comments-sql` (write `supabase/migrations/0006_comments.sql`: таблица `comments` — `workout_id`, `author_id`, `body` до 1000 знаков, `created_at`; без RLS), `comments-apply` (run `psql -f …0006_comments.sql`), `comments-action` (write `app/workouts/[id]/comments.ts`), `comments-ui` (write `components/Comments.tsx`), `comments-anna` (edit `app/workouts/[id]/page.tsx`), `comments-coach` (edit `app/clients/[id]/page.tsx`) |
| `dev` | run `npm run dev`, until `Ready` |
| `login-anna` | browser `/login`: Анна |
| `anna-comment` | browser `/workouts/1`: «Последний подход тяжело, ноет колено», «Отправить» |
| `login-marina` | browser `/login`: Марина |
| `marina-reply` | browser `/clients/1`: под «Ноги» — комментарий Анны; ответ «Тогда в четверг присед полегче», «Отправить» |
| `as-sveta-file` | человек, write `supabase/tests/as-sveta.sql` по образцу `supabase/tests/as-marina.sql` (s06): роль `authenticated`, `sub` Светы, `select body from comments` |
| `as-sveta` | run `psql -f supabase/tests/as-sveta.sql` — Света видит оба комментария |
| `ask-comments-rls` | агент: «Света, подопечная Игоря, видит комментарии чужой подопечной. Включи RLS на comments: читают и пишут подопечный тренировки и его тренер, от своего имени. И негативный тест». Шаги: `rls-sql` (write `0007_comments_rls.sql`), `rls-apply` (run `psql -f`), `comments-test` (write `test/comments.test.ts`: Света не видит, Марина и Анна видят), `comments-run` (run `npx vitest run test/comments.test.ts`) |
| `as-sveta2` | run `psql -f supabase/tests/as-sveta.sql` — `(0 rows)` |
| `ask-notify` | агент: «Уведомление тренеру — одно на тренировку, а не на каждый подход. Ночью с 22 до 8 по часовому поясу получателя — утром. Сначала тест». Шаги: `notify-test` (write `lib/notify.test.ts`: 15 подходов одной тренировки — одно уведомление; 23:40 по Москве — в 8:00), `notify-lib` (write `lib/notify.ts`), `notify-run` (run `npx vitest run lib/notify.test.ts`) |
| `c-comments` | commit `Комментарии к тренировке с RLS; правила уведомлений` |

- [ ] **Step 1: Тест** `test('s16: таблица из SQL без RLS — Света видит колено Анны; с RLS — 0 строк; одно уведомление на тренировку')`:
  - `as-sveta.out` содержит `ноет колено`;
  - `as-sveta2.out` содержит `(0 rows)` и не содержит `колено`;
  - `comments-run.code` и `notify-run.code` = 0;
  - `marina-reply.after` содержит обе реплики.
- [ ] **Steps 2–6:** `--from s16-comments`. Commit `demo-app: сессия s16 — комментарии, RLS, уведомления`.

### Task 6: Сессия `s17-invite` — приглашение по ссылке и повторный аудит

**Files:** по «Порядку задачи сессии» для `s17-invite`. **Interfaces:** Consumes: `s16-comments`. Produces: события ниже.

| id | шаг |
|---|---|
| `ask-join` | агент: «Приглашение по ссылке: тренер даёт ссылку /join/…, человек вводит имя, почту и пароль и становится его подопечным». Шаги: `join-page` (write `app/join/[coach]/page.tsx`: тренер — из адреса), `join-action` (write `app/join/[coach]/actions.ts`: пользователь в `auth.users` с `crypt()`, профиль, подопечный этого тренера, вход), `invite-link` (edit `app/clients/page.tsx`: «Ссылка-приглашение» с адресом `/join/<id тренера>`) |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `marina-link` | browser `/clients`: ссылка `/join/11111111-1111-1111-1111-111111111111` |
| `olga-join` | browser по этой ссылке: Ольга, `olga@example.com`, «Присоединиться» → `/workouts` |
| `kirill-join` | browser по той же ссылке: Кирилл, `kirill@example.com` → тоже подопечный Марины |
| `clients-db` | run `psql -c "select name from clients where coach_id = '11111111-1111-1111-1111-111111111111' order by id"` |
| `ask-invite` | агент: «Ссылка вечная и многоразовая: её переслали — и Кирилл стал подопечным Марины. Сделай приглашение одноразовым: длинный случайный код, срок 48 часов, тренер — из записи приглашения, отзыв. Сначала тесты». Шаги: `inv-test`, `inv-sql`, `inv-apply`, `inv-old` (run `rm -r 'app/join/[coach]'` — наивный код не коммитился), `inv-page` (write `app/join/[code]/page.tsx`), `inv-action` (write `app/join/[code]/actions.ts`), `inv-link` (edit `app/clients/page.tsx`: «Создать приглашение»), `inv-run` (run `npx vitest run test/invites.test.ts`) |
| `inv-test` | write `test/invites.test.ts`, с базой. Принятое приглашение — подопечный тренера из записи. Второй раз — «уже использовано». Отозванное — отказ. Созданное 49 часов назад — «срок истёк» |
| `inv-sql` | write `0008_invites.sql`: `invites` — `code` (`encode(gen_random_bytes(16), 'hex')`), `coach_id`, `expires_at` (`now() + interval '48 hours'`), `accepted_by`, `revoked_at`; RLS |
| `inv-apply` | run `psql -f` |
| `login-marina2` | browser `/login`: Марина |
| `invite-new` | browser `/clients`: «Создать приглашение» → `/join/<32 шестнадцатеричных знака>` |
| `vera-join` | browser по ссылке: Вера, `vera@example.com`, «Присоединиться» |
| `invite-reuse` | browser по той же ссылке ещё раз: «Приглашение уже использовано» |
| `ask-audit` | агент (Plan): «Проверь приглашения по шести вопросам главы 8: откуда данные, кто может вызвать, что сделает злоумышленник, что в журналах, какие права у процесса, что изменилось вне задачи. Код не меняй — только отчёт и места, где не уверен». Шаги: `a-action` (read `app/join/[code]/actions.ts`), `a-sql` (read `supabase/migrations/0008_invites.sql`). Ответ — отчёт по шести вопросам, сверенный с кодом |
| `c-invite` | commit `Приглашение по одноразовой ссылке` |

- [ ] **Step 1: Тест** `test('s17: вечная ссылка пускает Кирилла; одноразовое приглашение — второй раз нельзя; аудит только читает')`:
  - `clients-db.out` содержит `Ольга` и `Кирилл`;
  - `inv-run.code` = 0;
  - `invite-new.after` совпадает с `/\/join\/[0-9a-f]{32}/`;
  - `invite-reuse.after` содержит `уже использовано`;
  - `ask-audit.steps` = `['a-action', 'a-sql']`;
  - в `invite-new.after` и `invite-reuse.after` нет настоящих дат.
- [ ] **Steps 2–6:** `--from s17-invite`. Commit `demo-app: сессия s17 — приглашение по ссылке, аудит`.

### Task 7: Сессия `s18-quick-set` — своё отличие

**Files:** по «Порядку задачи сессии» для `s18-quick-set`. **Interfaces:** Consumes: `s17-invite`. Produces: события ниже.

| id | шаг |
|---|---|
| `complaints` | человек, write `docs/complaints.md`: жалобы пользователей эталонов А, Б, В. Текст авторский, по образцу публичных отзывов, без названий продуктов; разложен в стопки по смыслу. Выше всех — «долго записывать подход» (А, Б) и «тренер не видит, что я сделал» (Б, В); вторая у нас уже закрыта строкой паритета «Тренер видит вес и повторы». Вывод — отличие: подход в одно касание, и тренер сразу видит вес, повторы и рост |
| `c-complaints` | commit `Жалобы на эталоны в стопки` |
| `copy-branch` | run `git switch -c copy/etalon-b` |
| `ask-copy` | агент: «Сделай как у эталона Б: чат, таймер отдыха, оплату подписки». Шаги: `copy-chat` (write `app/chat/page.tsx`), `copy-timer` (write `components/RestTimer.tsx`), `copy-timer-use` (edit `app/workouts/[id]/page.tsx`), `copy-pay` (write `app/billing/page.tsx`), `copy-pay-lib` (edit `lib/payments.ts`) |
| `c-copy` | commit `Как у эталона Б` |
| `copy-stat` | run `git diff main copy/etalon-b --stat` |
| `copy-drop` | run `git switch main && git branch -D copy/etalon-b` |
| `parity-edit` | человек, edit `docs/parity.md` по s89. Решения по строкам «Чат тренера и подопечного», «Таймер отдыха», «Оплата» — «позже» или «не делаем», с причиной. Строка «Подход в одно касание» — «наше отличие» |
| `ask-quick` | агент: «Подход в одно касание: на тренировке кнопка «Повторить подход» с весом и повторами прошлого подхода. У тренера в списке — последний подход каждого и «растёт / нет». Сначала сквозной тест». Шаги: `quick-e2e` (write `e2e/quick-set.spec.ts`: Анна нажимает «Повторить подход» — подход сохранён; Марина видит его в списке), `quick-page` (edit `app/workouts/[id]/page.tsx`), `quick-action` (edit `app/workouts/[id]/actions.ts`), `quick-clients` (edit `app/clients/page.tsx`), `quick-run` (run `npx playwright test e2e/quick-set.spec.ts`; до `dev`, сервер поднимает конфиг Playwright, как в s07) |
| `c-quick` | commit `Подход в одно касание; последний подход у тренера` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-anna` | browser `/login`: Анна |
| `quick-tap` | browser `/workouts/1`: «Повторить подход» → новый подход 50 × 10 |
| `login-marina` | browser `/login`: Марина |
| `clients-last` | browser `/clients`: у Анны последний подход «50 кг × 10» |

- [ ] **Step 1: Тест** `test('s18: копия эталона — пять файлов и удалённая ветка; подход в одно касание — сквозной тест и тренер видит')`:
  - `copy-stat.out` называет пять файлов шагов `ask-copy`;
  - `copy-drop.out` содержит `Deleted branch copy/etalon-b`;
  - `quick-run.code` = 0;
  - `quick-tap.after` содержит на один подход «50 кг × 10» больше, чем `quick-tap.before`;
  - `clients-last.after` содержит `50 кг × 10`.
- [ ] **Steps 2–6:** `--from s18-quick-set`. Commit `demo-app: сессия s18 — жалобы, паритет, подход в одно касание`.

### Task 8: Сессия `s19-reliability` — тесты, скорость, копии

**Files:** по «Порядку задачи сессии» для `s19-reliability`. **Interfaces:** Consumes: `s18-quick-set`. Produces: события ниже.

| id | шаг |
|---|---|
| `check-run` | run `npm run check` |
| `e2e-all` | run `npx playwright test` (`cycle` и `quick-set`) |
| `speed-file` | человек, write `supabase/seed-speed.sql`: Анне 2000 тренировок и по 20 подходов (`generate_series`) — данные для замера |
| `speed-load` | run `psql -f supabase/seed-speed.sql` |
| `explain` | run `psql -c "explain analyze select weight, reps from sets where workout_id = 1500"` — `Seq Scan on sets` |
| `ask-index` | агент: «Вот вывод EXPLAIN ANALYZE: Seq Scan on sets по workout_id. Добавь индекс миграцией, применяй с подтверждения». Шаги: `index-sql` (write `0009_sets_workout_index.sql`), `index-apply` (run `psql -f`) |
| `explain2` | run тот же запрос — `Index Scan` (или `Bitmap Index Scan`) по новому индексу |
| `backup-ignore` | человек, edit `.gitignore`: `/backups/` |
| `dump-public` | run `mkdir -p backups && pg_dump -n public -Fc -f backups/trainer.dump` |
| `restore-try` | run `createdb restore_check && pg_restore -d restore_check backups/trainer.dump`. Ошибки: в копии нет схемы `auth`, на неё ссылаются `profiles` и политики. Код ≠ 0 |
| `restore-users` | run `psql -d restore_check -c "select count(*) from auth.users"` — `relation "auth.users" does not exist` |
| `dump-all` | run `pg_dump -Fc -f backups/trainer-full.dump` |
| `restore-full` | run `createdb restore_full && pg_restore -d restore_full backups/trainer-full.dump` |
| `restore-count` | run `psql -At -c "select count(*) from sets" && psql -At -d restore_full -c "select count(*) from sets"` — два одинаковых числа |
| `restore-doc` | человек, write `docs/restore.md`: шаги учений, что сверять (подходы, пользователи, вход), где лежит копия |
| `c-reliability` | commit `Индекс подходов; учения по восстановлению` |

Ошибки `pg_restore` бывают другими (зависит от порядка объектов в копии). Тогда в черновом прогоне нужно подобрать честный камень на том же месте: восстановленная копия без `auth.users` не пускает войти. Вывод — только настоящий.

- [ ] **Step 1: Тест** `test('s19: проверки зелёные; индекс меняет план; копия без auth не восстанавливается, полная — да; backups не в git')`:
  - `check-run.code` и `e2e-all.code` = 0;
  - `explain.out` содержит `Seq Scan on sets`, `explain2.out` — `Index Scan`;
  - `restore-try.code` ≠ 0, а `restore-try.out` или `restore-users.out` содержит `auth`;
  - в `restore-count.out` два одинаковых числа;
  - ни в одном коммите сессии нет файлов `backups/`.
- [ ] **Steps 2–6:** `--from s19-reliability`. Commit `demo-app: сессия s19 — проверки, индекс, учения с копией`.

---

## Порядок задачи урока (Задачи 9–15)

Как в плане недели 1 (раздел «Порядок задачи урока»), с правками для ролика дня:
- **Файлы урока.** `course/video/lessons/day-NN/` (`lesson.ts`, `Video.tsx`, `script.ts`, `script.gen.json`, `lesson.test.ts`). Урок `kind: 'day'`, экспорт `dayNN` и `dayNNScript`. Удалить `course/video/day-NN/`, ссылки на неё найти через `grep -rn "video/day-NN\|day-NN/script\|dayNNScript"`.
- **Каркас.** `DAY_CHAPTERS` (Global Constraints).
  - Сцена `agenda` получает `items` — 3 пункта «что строим сегодня» (Задача 1).
  - «Пример» показывает, что построили: кадр записи обязателен.
  - «Подводный камень» показывает, как чуть не сломали: «Неверно» на ошибке, «Верно» на исправленном результате или на доске правила.
  - «Проверьте у себя» — `recap` с действиями для ученика.
- **Окно длины.** Прежняя длина … 5400.
- **Пояснения.** Не меньше 2 — на командах и строках, где новичку нужно «а это что?».
- **Разделы книги** — в таблице задачи.

### Task 9: Ролик `day-08` «Отзывы и фоновые агенты»

Урок `day08`, книга: s62, s64, s67, s68, s16. `minFrames: 4496`. Запись: `s13-feedback`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | `items`: «Отзывы — в три стопки», «Задача агенту в четыре части», «Приёмка без чтения кода» |
| Пример | `feedback` (Editor: стопки); `task-notes` (Editor: четыре части, s68); `ask-notes` (Agent, Accept edits); `accept-log`, `accept-stat` (Terminal: один коммит, один файл); `card-note` (Browser: «болит колено») |
| Подводный камень | `ask-vague` → `vague-stat` (четыре файла) — «Неверно»; доска «Задача в четыре части: критерии и ограничения заранее» — «Верно». Облачная сессия — схемой `dk_cloud` (рис. 10.4) или `ch10_sync` (10.3), подпись честная: в записи — ветка на ноутбуке |
| Проверьте у себя | три стопки, задача в четыре части, приёмка: коммиты, файлы, проверки, руками |

Кроме того: тесты на `day08Script` перевести на `day15Script`, поведение не менять:
- `e2e/video.spec.ts` (обложка, второе пояснение, ошибка загрузки, «старый ролик один на дне — во всю ширину», субтитры на обложке);
- `e2e/video-chapters.spec.ts` (`SCRIPTS`, `DAYS`);
- `src/video/VideoBlock.test.tsx`, `src/video/termScript.test.ts`, `src/course/summary.test.ts`.

**Review Focus 4.** Число тестов прежнее, второе пояснение — второе пояснение `day15Script`.

### Task 10: Ролик `day-09` «Программы тренировок»

Урок `day09`, книга: s43, s22, s34. `minFrames: 4399`. Запись: `s14-programs`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Библиотека упражнений», «Программа на 4 недели», «Прошлое не переписываем» |
| Пример | `ask-model` (Agent, Plan: три варианта, решаете вы — s22, правило 7); `program-new`, `program-assign` (Browser); `anna-week` (четыре даты), `anna-items` |
| Подводный камень | `ref-sql` (Diff: `on delete cascade`) → `prog-red` (подходов 0) — «Неверно»; `copy-sql` (Diff: копия, `set null`) → `prog-green` — «Верно» |
| Проверьте у себя | ссылка или копия — решаете вы; тест на прошлое с тестовой базой (s43); сломать нарочно (s34) |

Схема `ch7_tables` (рис. 7.5) — если влезает при ≥ 24 px. Схемы «ссылка или копия» в книге нет, поэтому доска.

### Task 11: Ролик `day-10` «Рекорды и отчёты»

Урок `day10`, книга: s22, s34, s45. `minFrames: 4912`. Запись: `s15-report`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Определения — словами», «Тесты до кода», «Отчёт за месяц по неделям» |
| Пример | `report-def` (Editor); `report-test`, `report-red` → `report-green` (Terminal); `report-view` (Browser: камера на неделе Анны 19–25 октября) |
| Подводный камень | `report-view` (камера на пустой неделе: «NaN кг») — «Неверно»; `report-rule` (Diff); `empty-red` → `empty-green`; `report-view2` («тренировок не было») — «Верно». Схема `ch5_failing_test` (рис. 5.6) — только доской с её текстом, у неё зашитые цвета |
| Проверьте у себя | обычный, пустой и странный ввод (s22, рис. 3.9); правило решает человек; тест красный — правим код, а не тест |

Кроме того: `src/day/day.test.tsx`, тест «черновой день 10» — длина нового ролика вместо «2:44».

### Task 12: Ролик `day-11` «Комментарии и уведомления»

Урок `day11`, книга: s43, s44, s48, s51. `minFrames: 5102` (окно 298 кадров). Запись: `s16-comments`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Комментарии под тренировкой», «Права на новой таблице», «Одно уведомление на тренировку» |
| Пример | `anna-comment`, `marina-reply` (Browser); `notify-run` (Terminal: правила уведомлений тестом) |
| Подводный камень | `comments-sql` (Diff: таблица без RLS); `as-sveta` (Terminal: Света видит «ноет колено») — «Неверно»; `rls-sql` (Diff); `as-sveta2` (`0 rows`), `comments-run` — «Верно». Подпись «локальная база вместо Supabase» |
| Проверьте у себя | RLS явно на каждой таблице из SQL; вход вторым пользователем (s43); негативный тест (s51) |

### Task 13: Ролик `day-12` «Приглашение по ссылке»

Урок `day12`, книга: s48, s49, s50, s51. `minFrames: 4951`. Запись: `s17-invite`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Ссылка-приглашение», «Новая дверь — новая проверка», «Аудит: только отчёт» |
| Пример | `marina-link`, `olga-join` (Browser); `ask-join` (Agent: шаги) |
| Подводный камень | `kirill-join`, `clients-db` (Кирилл у Марины) — «Неверно»; `inv-sql` (Diff: код, срок, отзыв); `inv-run`; `invite-new`, `invite-reuse` («уже использовано») — «Верно»; `ask-audit` (Agent, Plan: шесть вопросов, `ch8_review`) |
| Проверьте у себя | одноразовая ссылка и срок — решение примера; тест вместо ожидания срока; аудит — повод проверить, а не приговор (s49) |

### Task 14: Ролик `day-13` «Своё отличие»

Урок `day13`, книга: s87, s88, s89, s90, s36. `minFrames: 4535`. Запись: `s18-quick-set`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Жалобы на эталоны — в стопки», «Одно отличие», «Паритет: позже и не делаем» |
| Пример | `complaints` (Editor; сказать, что текст авторский по образцу отзывов); `quick-tap` (Browser); `clients-last` (Browser); `quick-run` (Terminal) |
| Подводный камень | `ask-copy` → `copy-stat` (пять файлов) — «Неверно»; `copy-drop`; `parity-edit` (Diff: «позже», «не делаем», «наше отличие») — «Верно» |
| Проверьте у себя | отзывы слово в слово (s87); одно отличие (s88); «зачем это здесь?» (s90); показ молча (s38) |

### Task 15: Ролик `day-14` «Надёжность»

Урок `day14`, книга: s34, s45, s52, s55, s82. `minFrames: 4985`. Запись: `s19-reliability`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Тесты всего главного», «Сначала замер», «Учения с копией» |
| Пример | `check-run`, `e2e-all` (Terminal); `explain` (`Seq Scan`) → `index-sql` (Diff) → `explain2` (`Index Scan`). Время выполнения не называть, оно меняется при перезаписи |
| Подводный камень | `dump-public` → `restore-try` и `restore-users` — «Неверно»: копия, из которой не восстанавливались (s55); `dump-all` → `restore-full`, `restore-count` (числа равны) — «Верно»; `restore-doc` (Editor) |
| Проверьте у себя | пирамида тестов (рис. 5.7); сначала измерить (s52); копия вне досягаемости агента (s82) — доской; отслеживание ошибок — доской по s45 (Sentry в записи нет) |

---

### Task 16: Проверка недели 2, правила, публикация

**Files:**
- Modify: `course/e2e/video-chapters.spec.ts`, `course/video/term/README.md`, `demo-app/README.md`

**Interfaces:** Consumes: всё выше.

- [ ] **Step 1: e2e:**
  - `test('день 8: ролик дня — четыре главы «Что строим сегодня» … «Проверьте у себя», план перечисляет, что строим')`;
  - тест «390 px» — на дни 2–14 (новые) и день 15 (старый 1280 × 720, без списка глав): нет прокрутки, первое пояснение под кадром. **Review Focus 3.**
- [ ] **Step 2:** `npm run e2e` — PASS.
- [ ] **Step 3:** README набора:
  - ловушки недели 2 — ролик дня, данные шагов сессии, `pg_dump`/`pg_restore`;
  - §7 — что осталось: неделя 3, дни 15–21.

  `demo-app/README.md` — сессии `s13`–`s19`.
- [ ] **Step 4:** Полная проверка из `course/`: `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e`.
- [ ] **Step 5:** Commit `video: неделя 2 в стиле «Репозиторий» — e2e и правила`.
- [ ] **Step 6:** `npm run build && node scripts/artifact-page.mjs dist out/artifact-video`. В `page.html` — `<title>Вайб-курс «Пилот роликов»</title>`. Публикация тем же путём, адрес прежний: `https://claude.ai/artifact/89U9omZ2QbodxrG8jdVU6E`. Затем `git push -u origin video/terminal`, описание PR #7.
